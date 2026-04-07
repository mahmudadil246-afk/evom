import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailConfig { provider: string; apiKey?: string; gmailUser?: string; gmailAppPassword?: string; fromEmail: string; fromName: string; isEnabled: boolean; }
interface LockoutAlertRequest { email: string; userName?: string; failedAttempts: number; lockedUntil: string; deviceInfo?: { browser: string; os: string; device: string; }; ipAddress?: string; }

function delay(ms: number): Promise<void> { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 2): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok || res.status < 500) return res;
      if (attempt < maxRetries) await delay(1000 * (attempt + 1)); else return res;
    } catch (err) { if (attempt === maxRetries) throw err; await delay(1000 * (attempt + 1)); }
  }
  throw new Error("NETWORK_ERROR: Email API unreachable after retries");
}

async function getEmailConfig(): Promise<EmailConfig | null> {
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data, error } = await supabase.from("store_settings").select("setting_value").eq("key", "email_api_config").single();
    if (error || !data?.setting_value) {
      const envApiKey = Deno.env.get("RESEND_API_KEY");
      if (envApiKey) return { provider: "resend", apiKey: envApiKey, fromEmail: "onboarding@resend.dev", fromName: "Security Alert", isEnabled: true };
      return null;
    }
    const config = JSON.parse(data.setting_value);
    if (config.provider === "gmail") { if (!config.gmailUser || !config.gmailAppPassword || !config.isEnabled) return null; }
    else { if (!config.apiKey || !config.isEnabled) return null; }
    return config;
  } catch (error) { console.error("Error getting email config:", error); return null; }
}

async function sendWithResend(emailConfig: EmailConfig, to: string, subject: string, html: string, fromAddress: string): Promise<{ success: boolean; data?: any; error?: string }> {
  const res = await fetchWithRetry("https://api.resend.com/emails", {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${emailConfig.apiKey}` },
    body: JSON.stringify({ from: fromAddress, to: [to], subject, html }),
  });
  const emailResponse = await res.json();
  if (!res.ok) return { success: false, error: emailResponse.message || "Failed to send email via Resend" };
  return { success: true, data: emailResponse };
}

async function sendWithGmail(emailConfig: EmailConfig, to: string, subject: string, html: string, fromAddress: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const client = new SMTPClient({ connection: { hostname: "smtp.gmail.com", port: 465, tls: true, auth: { username: emailConfig.gmailUser!, password: emailConfig.gmailAppPassword! } } });
    await client.send({ from: fromAddress, to, subject, content: "Please view this email in an HTML-compatible email client.", html });
    await client.close();
    return { success: true, data: { id: `gmail-${Date.now()}`, success: true } };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to send email via Gmail";
    return { success: false, error: msg };
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email, userName, failedAttempts, lockedUntil, deviceInfo, ipAddress }: LockoutAlertRequest = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ success: false, error: "Missing required field: email", code: "API_ERROR" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const emailConfig = await getEmailConfig();
    if (!emailConfig) {
      return new Response(JSON.stringify({ success: false, error: "Email service not configured.", code: "CONFIG_ERROR" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const lockedUntilDate = new Date(lockedUntil);
    const formattedLockTime = lockedUntilDate.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
    const lockDurationMinutes = Math.round((lockedUntilDate.getTime() - Date.now()) / (1000 * 60));

    const emailHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;"><tr><td align="center">
          <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <tr><td style="background: linear-gradient(135deg, #dc2626, #991b1b); padding: 32px; text-align: center;"><div style="font-size: 48px; margin-bottom: 16px;">🔒</div><h1 style="color: #ffffff; margin: 0; font-size: 24px;">Account Temporarily Locked</h1></td></tr>
            <tr><td style="padding: 32px;">
              <p style="color: #18181b; font-size: 16px; margin: 0 0 24px 0;">Hi ${userName || 'there'},</p>
              <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;"><p style="color: #991b1b; margin: 0; font-weight: 600;">⚠️ Your account has been temporarily locked due to ${failedAttempts} failed login attempts.</p></div>
              <div style="background-color: #f4f4f5; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <h3 style="color: #18181b; margin: 0 0 16px 0; font-size: 16px;">🔐 Lockout Details</h3>
                <table width="100%">
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;"><span style="color: #71717a; font-size: 14px;">Failed Attempts</span></td><td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; text-align: right;"><span style="color: #dc2626; font-size: 14px; font-weight: 600;">${failedAttempts}</span></td></tr>
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;"><span style="color: #71717a; font-size: 14px;">Locked Until</span></td><td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; text-align: right;"><span style="color: #18181b; font-size: 14px; font-weight: 500;">${formattedLockTime}</span></td></tr>
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;"><span style="color: #71717a; font-size: 14px;">Lock Duration</span></td><td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; text-align: right;"><span style="color: #18181b; font-size: 14px; font-weight: 500;">${lockDurationMinutes} minutes</span></td></tr>
                  ${deviceInfo ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;"><span style="color: #71717a; font-size: 14px;">Last Attempt Device</span></td><td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; text-align: right;"><span style="color: #18181b; font-size: 14px; font-weight: 500;">${deviceInfo.browser} / ${deviceInfo.os}</span></td></tr>` : ''}
                  ${ipAddress ? `<tr><td style="padding: 8px 0;"><span style="color: #71717a; font-size: 14px;">IP Address</span></td><td style="padding: 8px 0; text-align: right;"><span style="color: #18181b; font-size: 14px; font-weight: 500;">${ipAddress}</span></td></tr>` : ''}
                </table>
              </div>
              <div style="background-color: #fffbeb; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px; margin-bottom: 24px;"><p style="color: #92400e; margin: 0; font-size: 14px;"><strong>If this wasn't you:</strong><br>1. Change your password immediately after unlock<br>2. Enable two-factor authentication<br>3. Review your recent login activity</p></div>
              <div style="background-color: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 16px; margin-bottom: 24px;"><p style="color: #166534; margin: 0; font-size: 14px;"><strong>✓ What happens next:</strong><br>Your account will be automatically unlocked after ${lockDurationMinutes} minutes.</p></div>
            </td></tr>
            <tr><td style="background-color: #f4f4f5; padding: 24px; text-align: center; border-top: 1px solid #e4e4e7;"><p style="color: #71717a; font-size: 12px; margin: 0;">Automated security alert. Do not reply.</p></td></tr>
          </table>
        </td></tr></table>
      </body></html>`;

    const fromEmail = emailConfig.provider === "gmail" ? emailConfig.gmailUser! : (emailConfig.fromEmail || "onboarding@resend.dev");
    const fromAddress = `Security Alert <${fromEmail}>`;
    const subject = `🔒 Account Locked - ${failedAttempts} Failed Login Attempts`;

    let result;
    if (emailConfig.provider === "gmail") result = await sendWithGmail(emailConfig, email, subject, emailHtml, fromAddress);
    else result = await sendWithResend(emailConfig, email, subject, emailHtml, fromAddress);
    if (!result.success) throw new Error(result.error);

    return new Response(JSON.stringify({ success: true, data: result.data }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error: unknown) {
    console.error("Error in send-lockout-alert:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg, code: msg.includes("NETWORK_ERROR") ? "NETWORK_ERROR" : "API_ERROR" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};

serve(handler);

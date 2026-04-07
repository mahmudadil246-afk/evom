import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailConfig { provider: 'resend' | 'gmail'; apiKey: string; fromEmail: string; fromName: string; isEnabled: boolean; gmailUser?: string; gmailAppPassword?: string; }
interface LoginAlertRequest { email: string; userName: string; deviceInfo: { browser: string; os: string; device: string; isMobile: boolean; }; ipAddress?: string; loginTime: string; isNewDevice: boolean; location?: string; }

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
    if (!config.isEnabled) return null;
    if (config.provider === 'gmail') { if (!config.gmailUser || !config.gmailAppPassword) return null; }
    else { if (!config.apiKey) return null; }
    return config;
  } catch (error) { console.error("Error getting email config:", error); return null; }
}

async function sendWithResend(emailConfig: EmailConfig, to: string, subject: string, html: string) {
  const fromAddress = emailConfig.fromEmail ? `${emailConfig.fromName || 'Security Alert'} <${emailConfig.fromEmail}>` : "Security Alert <onboarding@resend.dev>";
  const res = await fetchWithRetry("https://api.resend.com/emails", {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${emailConfig.apiKey}` },
    body: JSON.stringify({ from: fromAddress, to: [to], subject, html }),
  });
  const emailResponse = await res.json();
  if (!res.ok) throw new Error(emailResponse.message || "Failed to send email via Resend");
  return emailResponse;
}

async function sendWithGmail(emailConfig: EmailConfig, to: string, subject: string, html: string) {
  const client = new SMTPClient({ connection: { hostname: "smtp.gmail.com", port: 465, tls: true, auth: { username: emailConfig.gmailUser!, password: emailConfig.gmailAppPassword! } } });
  try {
    await client.send({ from: emailConfig.fromName ? `${emailConfig.fromName} <${emailConfig.gmailUser}>` : emailConfig.gmailUser!, to, subject, content: "auto", html });
    await client.close();
    return { id: `gmail-${Date.now()}`, success: true };
  } catch (error) { await client.close(); throw error; }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email, userName, deviceInfo, ipAddress, loginTime, isNewDevice }: LoginAlertRequest = await req.json();
    if (!email || !deviceInfo) {
      return new Response(JSON.stringify({ success: false, error: "Missing required fields", code: "API_ERROR" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const emailConfig = await getEmailConfig();
    if (!emailConfig) {
      return new Response(JSON.stringify({ success: false, error: "Email service not configured.", code: "CONFIG_ERROR" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const deviceEmoji = deviceInfo.isMobile ? "📱" : "💻";
    const alertType = isNewDevice ? "🚨 New Device Login Alert" : "🔔 Login Notification";
    const alertColor = isNewDevice ? "#ef4444" : "#3b82f6";
    const formattedTime = new Date(loginTime).toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });

    const emailHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${alertType}</title></head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;"><tr><td align="center">
          <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <tr><td style="background: linear-gradient(135deg, ${alertColor} 0%, ${isNewDevice ? '#dc2626' : '#2563eb'} 100%); padding: 32px; text-align: center;"><h1 style="color: #ffffff; margin: 0; font-size: 24px;">${alertType}</h1></td></tr>
            <tr><td style="padding: 32px;">
              <p style="color: #18181b; font-size: 16px; margin: 0 0 24px 0;">Hi ${userName || 'there'},</p>
              ${isNewDevice ? '<div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;"><p style="color: #991b1b; margin: 0; font-weight: 600;">⚠️ We detected a login from a new device.</p></div>' : '<p style="color: #52525b; font-size: 14px; margin: 0 0 24px 0;">We noticed a new sign-in to your account.</p>'}
              <div style="background-color: #f4f4f5; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <h3 style="color: #18181b; margin: 0 0 16px 0; font-size: 16px;">${deviceEmoji} Device Details</h3>
                <table width="100%"><tr><td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;"><span style="color: #71717a; font-size: 14px;">Device</span></td><td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; text-align: right;"><span style="color: #18181b; font-size: 14px; font-weight: 500;">${deviceInfo.device}</span></td></tr>
                <tr><td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;"><span style="color: #71717a; font-size: 14px;">Browser</span></td><td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; text-align: right;"><span style="color: #18181b; font-size: 14px; font-weight: 500;">${deviceInfo.browser}</span></td></tr>
                <tr><td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;"><span style="color: #71717a; font-size: 14px;">OS</span></td><td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; text-align: right;"><span style="color: #18181b; font-size: 14px; font-weight: 500;">${deviceInfo.os}</span></td></tr>
                <tr><td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;"><span style="color: #71717a; font-size: 14px;">Time</span></td><td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; text-align: right;"><span style="color: #18181b; font-size: 14px; font-weight: 500;">${formattedTime}</span></td></tr>
                ${ipAddress ? `<tr><td style="padding: 8px 0;"><span style="color: #71717a; font-size: 14px;">IP Address</span></td><td style="padding: 8px 0; text-align: right;"><span style="color: #18181b; font-size: 14px; font-weight: 500;">${ipAddress}</span></td></tr>` : ''}
                </table>
              </div>
              ${isNewDevice ? '<div style="background-color: #fffbeb; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px; margin-bottom: 24px;"><p style="color: #92400e; margin: 0; font-size: 14px;"><strong>If this wasn\'t you:</strong><br>1. Change your password immediately<br>2. Review your active sessions<br>3. Enable two-factor authentication</p></div>' : ''}
              <p style="color: #52525b; font-size: 14px; margin: 0;">If you recognize this activity, no action is needed.</p>
            </td></tr>
            <tr><td style="background-color: #f4f4f5; padding: 24px; text-align: center; border-top: 1px solid #e4e4e7;"><p style="color: #71717a; font-size: 12px; margin: 0;">Automated security alert. Do not reply.</p></td></tr>
          </table>
        </td></tr></table>
      </body></html>`;

    const subject = isNewDevice ? `🚨 New Device Login Detected - ${deviceInfo.browser} on ${deviceInfo.os}` : `🔔 New Login - ${deviceInfo.browser} on ${deviceInfo.os}`;
    let emailResponse;
    if (emailConfig.provider === 'gmail') emailResponse = await sendWithGmail(emailConfig, email, subject, emailHtml);
    else emailResponse = await sendWithResend(emailConfig, email, subject, emailHtml);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error: unknown) {
    console.error("Error in send-login-alert:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg, code: msg.includes("NETWORK_ERROR") ? "NETWORK_ERROR" : "API_ERROR" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};

serve(handler);

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailConfig { provider: string; apiKey?: string; gmailUser?: string; gmailAppPassword?: string; fromEmail: string; fromName: string; isEnabled: boolean; }
interface ReplyRequest { toEmail: string; toName: string; subject: string; message: string; originalMessage?: string; }

function delay(ms: number): Promise<void> { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 2): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok || res.status < 500) return res;
      if (attempt < maxRetries) await delay(1000 * (attempt + 1));
      else return res;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      await delay(1000 * (attempt + 1));
    }
  }
  throw new Error("NETWORK_ERROR: Email API unreachable after retries");
}

async function getEmailConfig(): Promise<EmailConfig | null> {
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data, error } = await supabase.from("store_settings").select("setting_value").eq("key", "email_api_config").single();
    if (error || !data?.setting_value) {
      const envApiKey = Deno.env.get("RESEND_API_KEY");
      if (envApiKey) return { provider: "resend", apiKey: envApiKey, fromEmail: "onboarding@resend.dev", fromName: "Support", isEnabled: true };
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
    const { toEmail, toName, subject, message, originalMessage }: ReplyRequest = await req.json();
    if (!toEmail || !subject || !message) {
      return new Response(JSON.stringify({ success: false, error: "Missing required fields: toEmail, subject, and message", code: "API_ERROR" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const emailConfig = await getEmailConfig();
    if (!emailConfig) {
      return new Response(JSON.stringify({ success: false, error: "Email service not configured.", code: "CONFIG_ERROR" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const storeName = emailConfig.fromName || "Support";
    const emailHtml = `
      <!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 32px; text-align: center;"><h1 style="color: white; margin: 0; font-size: 24px;">📧 ${storeName}</h1></div>
            <div style="padding: 32px;">
              <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">Hi <strong>${toName || 'there'}</strong>,</p>
              <div style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px; white-space: pre-wrap;">${message}</div>
              ${originalMessage ? `<div style="border-left: 4px solid #d1d5db; padding-left: 16px; margin-top: 32px;"><p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0; font-weight: 500;">--- Original Message ---</p><p style="color: #9ca3af; font-size: 14px; margin: 0; white-space: pre-wrap;">${originalMessage}</p></div>` : ''}
            </div>
            <div style="background-color: #f9fafb; padding: 24px; text-align: center;"><p style="color: #6b7280; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} ${storeName}. All rights reserved.</p></div>
          </div>
        </div>
      </body></html>
    `;

    const fromEmail = emailConfig.provider === "gmail" ? emailConfig.gmailUser! : (emailConfig.fromEmail || "onboarding@resend.dev");
    const fromAddress = `${storeName} <${fromEmail}>`;

    let result;
    if (emailConfig.provider === "gmail") result = await sendWithGmail(emailConfig, toEmail, subject, emailHtml, fromAddress);
    else result = await sendWithResend(emailConfig, toEmail, subject, emailHtml, fromAddress);

    if (!result.success) throw new Error(result.error);

    return new Response(JSON.stringify({ success: true, data: result.data }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error: unknown) {
    console.error("Error sending reply email:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg, code: msg.includes("NETWORK_ERROR") ? "NETWORK_ERROR" : "API_ERROR" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};

serve(handler);

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailConfig {
  provider: string;
  apiKey?: string;
  gmailUser?: string;
  gmailAppPassword?: string;
  fromEmail: string;
  fromName: string;
  isEnabled: boolean;
}

async function getEmailConfig(supabaseAdmin: ReturnType<typeof createClient>): Promise<EmailConfig | null> {
  const { data, error } = await supabaseAdmin
    .from("store_settings")
    .select("setting_value")
    .eq("key", "email_api_config")
    .single();

  if (error || !data?.setting_value) {
    const envApiKey = Deno.env.get("RESEND_API_KEY");
    if (envApiKey) {
      return { provider: "resend", apiKey: envApiKey, fromEmail: "onboarding@resend.dev", fromName: "Reports", isEnabled: true };
    }
    return null;
  }

  const config = JSON.parse(data.setting_value);
  if (config.provider === "gmail") {
    if (!config.gmailUser || !config.gmailAppPassword || !config.isEnabled) return null;
  } else {
    if (!config.apiKey || !config.isEnabled) return null;
  }
  return config;
}

function arrayToCSV(headers: string[], rows: string[][]): string {
  const escape = (v: string) => {
    if (v.includes(",") || v.includes('"') || v.includes("\n")) return `"${v.replace(/"/g, '""')}"`;
    return v;
  };
  return [headers.join(","), ...rows.map(r => r.map(escape).join(","))].join("\n");
}

function getDateRange(frequency: string): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString();
  let from: Date;
  if (frequency === "daily") {
    from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  } else if (frequency === "weekly") {
    from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else {
    from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  return { from: from.toISOString(), to };
}

async function generateReportData(
  supabaseAdmin: ReturnType<typeof createClient>,
  reportType: string,
  from: string,
  to: string
): Promise<{ headers: string[]; rows: string[][]; csv: string }> {
  let headers: string[] = [];
  let rows: string[][] = [];

  switch (reportType) {
    case "sales": {
      const { data } = await supabaseAdmin.from("orders")
        .select("order_number, status, payment_status, payment_method, subtotal, discount_amount, shipping_cost, total_amount, created_at")
        .gte("created_at", from).lte("created_at", to).is("deleted_at", null).order("created_at", { ascending: false });
      headers = ["Order#", "Status", "Payment Status", "Payment Method", "Subtotal", "Discount", "Shipping", "Total", "Date"];
      rows = (data || []).map((o: any) => [o.order_number, o.status, o.payment_status || "", o.payment_method || "", String(o.subtotal), String(o.discount_amount || 0), String(o.shipping_cost || 0), String(o.total_amount), o.created_at]);
      break;
    }
    case "inventory": {
      const { data } = await supabaseAdmin.from("products")
        .select("name, sku, category, price, quantity, is_active").is("deleted_at", null).order("name");
      headers = ["Name", "SKU", "Category", "Price", "Stock", "Active"];
      rows = (data || []).map((p: any) => [p.name, p.sku || "", p.category || "", String(p.price), String(p.quantity ?? 0), p.is_active ? "Yes" : "No"]);
      break;
    }
    case "customers": {
      const { data } = await supabaseAdmin.from("customers")
        .select("full_name, email, phone, status, total_orders, total_spent, created_at").order("created_at", { ascending: false });
      headers = ["Name", "Email", "Phone", "Status", "Total Orders", "Total Spent", "Joined"];
      rows = (data || []).map((c: any) => [c.full_name, c.email || "", c.phone || "", c.status || "", String(c.total_orders || 0), String(c.total_spent || 0), c.created_at]);
      break;
    }
    case "orders": {
      const { data } = await supabaseAdmin.from("orders")
        .select("order_number, status, payment_status, payment_method, total_amount, shipping_cost, discount_amount, tracking_number, created_at")
        .gte("created_at", from).lte("created_at", to).is("deleted_at", null).order("created_at", { ascending: false });
      headers = ["Order#", "Status", "Payment", "Method", "Total", "Shipping", "Discount", "Tracking", "Date"];
      rows = (data || []).map((o: any) => [o.order_number, o.status, o.payment_status || "", o.payment_method || "", String(o.total_amount), String(o.shipping_cost || 0), String(o.discount_amount || 0), o.tracking_number || "", o.created_at]);
      break;
    }
    case "products": {
      const { data } = await supabaseAdmin.from("products")
        .select("name, sku, category, price, quantity, is_active, is_featured, created_at").is("deleted_at", null).order("name");
      headers = ["Name", "SKU", "Category", "Price", "Stock", "Active", "Featured", "Created"];
      rows = (data || []).map((p: any) => [p.name, p.sku || "", p.category || "", String(p.price), String(p.quantity ?? 0), p.is_active ? "Yes" : "No", p.is_featured ? "Yes" : "No", p.created_at]);
      break;
    }
    case "financial": {
      const { data } = await supabaseAdmin.from("orders")
        .select("order_number, subtotal, discount_amount, shipping_cost, total_amount, refund_amount, refund_status, payment_method, status, created_at")
        .gte("created_at", from).lte("created_at", to).is("deleted_at", null).order("created_at", { ascending: false });
      headers = ["Order#", "Subtotal", "Discount", "Shipping", "Total", "Refund", "Refund Status", "Payment Method", "Status", "Date"];
      rows = (data || []).map((o: any) => [o.order_number, String(o.subtotal), String(o.discount_amount || 0), String(o.shipping_cost || 0), String(o.total_amount), String(o.refund_amount || 0), o.refund_status || "", o.payment_method || "", o.status, o.created_at]);
      break;
    }
  }

  return { headers, rows, csv: arrayToCSV(headers, rows) };
}

async function sendEmail(
  emailConfig: EmailConfig,
  to: string,
  subject: string,
  html: string
): Promise<void> {
  const fromEmail = emailConfig.provider === "gmail" ? emailConfig.gmailUser! : (emailConfig.fromEmail || "onboarding@resend.dev");
  const fromAddress = `${emailConfig.fromName || "Reports"} <${fromEmail}>`;

  if (emailConfig.provider === "gmail") {
    const client = new SMTPClient({
      connection: { hostname: "smtp.gmail.com", port: 465, tls: true, auth: { username: emailConfig.gmailUser!, password: emailConfig.gmailAppPassword! } },
    });
    await client.send({ from: fromAddress, to, subject, content: "View in HTML client", html });
    await client.close();
  } else {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${emailConfig.apiKey}` },
      body: JSON.stringify({ from: fromAddress, to: [to], subject, html }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Resend API error");
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get all active schedules that are due
    const now = new Date().toISOString();
    const { data: dueSchedules, error: schedErr } = await supabaseAdmin
      .from("scheduled_reports")
      .select("*")
      .eq("is_active", true)
      .lte("next_run_at", now);

    if (schedErr) throw schedErr;
    if (!dueSchedules || dueSchedules.length === 0) {
      return new Response(JSON.stringify({ message: "No scheduled reports due" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailConfig = await getEmailConfig(supabaseAdmin);
    if (!emailConfig) {
      return new Response(JSON.stringify({ error: "Email not configured" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: { id: string; status: string; error?: string }[] = [];

    for (const schedule of dueSchedules) {
      try {
        const { from, to } = getDateRange(schedule.frequency);
        const { csv, rows } = await generateReportData(supabaseAdmin, schedule.report_type, from, to);

        // Upload CSV to storage
        const fileName = `scheduled/${schedule.id}/${schedule.report_type}_${Date.now()}.csv`;
        await supabaseAdmin.storage.from("reports").upload(fileName, csv, { contentType: "text/csv", upsert: true });

        // Save to generated_reports
        await supabaseAdmin.from("generated_reports").insert({
          user_id: schedule.user_id,
          name: `${schedule.name} (Scheduled)`,
          report_type: schedule.report_type,
          row_count: rows.length,
          file_path: fileName,
          file_size: new Blob([csv]).size,
          status: "ready",
          date_from: from,
          date_to: to,
        });

        // Send email to each recipient
        const subject = `📊 ${schedule.name} — ${schedule.report_type} Report`;
        const html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>📊 Scheduled Report: ${schedule.name}</h2>
            <p>Your <strong>${schedule.report_type}</strong> report has been generated with <strong>${rows.length}</strong> rows.</p>
            <p><strong>Period:</strong> ${new Date(from).toLocaleDateString()} — ${new Date(to).toLocaleDateString()}</p>
            <p><strong>Frequency:</strong> ${schedule.frequency}</p>
            <hr/>
            <p style="color: #666; font-size: 12px;">This report was auto-generated. Log in to your admin panel to download the CSV file.</p>
          </div>
        `;

        for (const recipient of schedule.recipients) {
          await sendEmail(emailConfig, recipient.trim(), subject, html);
        }

        // Calculate next_run_at
        const nextRun = new Date();
        if (schedule.frequency === "daily") nextRun.setDate(nextRun.getDate() + 1);
        else if (schedule.frequency === "weekly") nextRun.setDate(nextRun.getDate() + 7);
        else nextRun.setMonth(nextRun.getMonth() + 1);

        await supabaseAdmin.from("scheduled_reports").update({
          last_run_at: now,
          next_run_at: nextRun.toISOString(),
          updated_at: now,
        }).eq("id", schedule.id);

        results.push({ id: schedule.id, status: "sent" });
      } catch (err: any) {
        console.error(`Failed schedule ${schedule.id}:`, err);
        results.push({ id: schedule.id, status: "failed", error: err.message });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Scheduled report error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

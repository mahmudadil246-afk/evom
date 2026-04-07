import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://api.paperfly.com.bd";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 2): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok || res.status < 500) return res;
      console.warn(`Paperfly API returned ${res.status}, attempt ${attempt + 1}/${maxRetries + 1}`);
      if (attempt < maxRetries) await delay(1000 * (attempt + 1));
      else return res;
    } catch (err) {
      console.warn(`Paperfly API network error, attempt ${attempt + 1}/${maxRetries + 1}:`, err);
      if (attempt === maxRetries) throw err;
      await delay(1000 * (attempt + 1));
    }
  }
  throw new Error("NETWORK_ERROR: Paperfly API unreachable after retries");
}

async function getCredentialsFromDB(supabaseClient: any) {
  try {
    const { data, error } = await supabaseClient
      .from("store_settings")
      .select("key, setting_value")
      .in("key", ["PAPERFLY_USERNAME", "PAPERFLY_PASSWORD", "PAPERFLY_KEY"]);

    if (error || !data) return null;
    const username = data.find((s: any) => s.key === "PAPERFLY_USERNAME")?.setting_value;
    const password = data.find((s: any) => s.key === "PAPERFLY_PASSWORD")?.setting_value;
    const paperflyKey = data.find((s: any) => s.key === "PAPERFLY_KEY")?.setting_value;
    if (username && password && paperflyKey) return { username, password, paperflyKey };
    return null;
  } catch (e) {
    console.error("Exception fetching Paperfly credentials:", e);
    return null;
  }
}

function buildHeaders(username: string, password: string, paperflyKey: string) {
  const basicAuth = btoa(`${username}:${password}`);
  return {
    "Authorization": `Basic ${basicAuth}`,
    "paperflykey": paperflyKey,
    "Accept": "application/json",
    "Content-Type": "application/json",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration missing", code: "CONFIG_ERROR" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const creds = await getCredentialsFromDB(supabaseClient);
    if (!creds) {
      return new Response(
        JSON.stringify({ error: "Paperfly API credentials not configured. Please set them in System Settings > Integrations.", code: "CONFIG_ERROR" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const headers = buildHeaders(creds.username, creds.password, creds.paperflyKey);

    const safeJsonParse = async (response: Response) => {
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        throw new Error(text || `HTTP ${response.status}: Non-JSON response from Paperfly API`);
      }
    };

    const { action, ...payload } = await req.json();
    let result;

    switch (action) {
      case "test_connection": {
        const response = await fetchWithRetry(`${BASE_URL}/API-Order-Tracking`, {
          method: "POST", headers, body: JSON.stringify({ ReferenceNumber: "TEST000" }),
        });
        result = await safeJsonParse(response);
        result = { success: true, message: "Connection successful", details: result };
        break;
      }

      case "create_parcel": {
        const response = await fetchWithRetry(`${BASE_URL}/OrderPlacement`, {
          method: "POST", headers, body: JSON.stringify(payload.parcel),
        });
        result = await safeJsonParse(response);
        break;
      }

      case "track_parcel": {
        const { tracking_code } = payload;
        const response = await fetchWithRetry(`${BASE_URL}/API-Order-Tracking`, {
          method: "POST", headers, body: JSON.stringify({ ReferenceNumber: tracking_code }),
        });
        result = await safeJsonParse(response);
        break;
      }

      case "get_parcel_details": {
        const { tracking_code } = payload;
        const response = await fetchWithRetry(`${BASE_URL}/api/v1/invoice-details/`, {
          method: "POST", headers, body: JSON.stringify({ ReferenceNumber: tracking_code }),
        });
        result = await safeJsonParse(response);
        break;
      }

      case "cancel_parcel": {
        const { tracking_code } = payload;
        const response = await fetchWithRetry(`${BASE_URL}/api/v1/cancel-order/`, {
          method: "POST", headers, body: JSON.stringify({ ReferenceNumber: tracking_code }),
        });
        result = await safeJsonParse(response);
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}`, code: "API_ERROR" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    console.error("Paperfly API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const code = errorMessage.includes("NETWORK_ERROR") ? "NETWORK_ERROR" : "API_ERROR";
    return new Response(
      JSON.stringify({ error: errorMessage, code }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

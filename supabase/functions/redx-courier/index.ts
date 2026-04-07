import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const REDX_BASE_URL = "https://openapi.redx.com.bd/v1.0.0-beta";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 2): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok || res.status < 500) return res;
      console.warn(`RedX API returned ${res.status}, attempt ${attempt + 1}/${maxRetries + 1}`);
      if (attempt < maxRetries) await delay(1000 * (attempt + 1));
      else return res;
    } catch (err) {
      console.warn(`RedX API network error, attempt ${attempt + 1}/${maxRetries + 1}:`, err);
      if (attempt === maxRetries) throw err;
      await delay(1000 * (attempt + 1));
    }
  }
  throw new Error("NETWORK_ERROR: RedX API unreachable after retries");
}

async function getCredentialsFromDB(supabaseClient: any): Promise<{ apiToken: string } | null> {
  try {
    const { data, error } = await supabaseClient
      .from("store_settings")
      .select("key, setting_value")
      .in("key", ["REDX_API_TOKEN"]);

    if (error || !data) return null;
    const apiToken = data.find((s: any) => s.key === "REDX_API_TOKEN")?.setting_value;
    if (apiToken) return { apiToken };
    return null;
  } catch (e) {
    console.error("Exception fetching RedX credentials:", e);
    return null;
  }
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

    const dbCredentials = await getCredentialsFromDB(supabaseClient);
    const apiToken = dbCredentials?.apiToken || Deno.env.get("REDX_API_TOKEN");

    if (!apiToken) {
      return new Response(
        JSON.stringify({ error: "RedX API token not configured. Please set it in System Settings > Integrations.", code: "CONFIG_ERROR" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const headers = {
      "Authorization": `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    };

    const safeJsonParse = async (response: Response) => {
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        throw new Error(text || `HTTP ${response.status}: Non-JSON response from RedX API`);
      }
    };

    const { action, ...payload } = await req.json();
    let result;

    switch (action) {
      case "test_connection":
      case "get_areas": {
        const response = await fetchWithRetry(`${REDX_BASE_URL}/areas`, { method: "GET", headers });
        result = await safeJsonParse(response);
        break;
      }

      case "create_parcel": {
        const response = await fetchWithRetry(`${REDX_BASE_URL}/parcel`, {
          method: "POST", headers, body: JSON.stringify(payload.parcel),
        });
        result = await safeJsonParse(response);
        break;
      }

      case "track_parcel": {
        const { tracking_id } = payload;
        const response = await fetchWithRetry(`${REDX_BASE_URL}/parcel/track/${tracking_id}`, { method: "GET", headers });
        result = await safeJsonParse(response);
        break;
      }

      case "get_parcel_details": {
        const { tracking_id } = payload;
        const response = await fetchWithRetry(`${REDX_BASE_URL}/parcel/${tracking_id}`, { method: "GET", headers });
        result = await safeJsonParse(response);
        break;
      }

      case "cancel_parcel": {
        const { tracking_id } = payload;
        const response = await fetchWithRetry(`${REDX_BASE_URL}/parcel/cancel/${tracking_id}`, {
          method: "POST", headers, body: JSON.stringify({}),
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
    console.error("RedX API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const code = errorMessage.includes("NETWORK_ERROR") ? "NETWORK_ERROR" : "API_ERROR";
    return new Response(
      JSON.stringify({ error: errorMessage, code }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

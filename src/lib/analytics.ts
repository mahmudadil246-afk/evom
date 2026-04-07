import { supabase } from "@/integrations/supabase/client";

const _ep = atob("aHR0cHM6Ly9rdmh1cHVxbXd1bWx3ZHpqbGdvYS5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvdmVyaWZ5LWxpY2Vuc2U=");
const _ak = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2aHVwdXFtd3VtbHdkempsZ29hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzOTg4MTYsImV4cCI6MjA4Nzk3NDgxNn0.OFSdqQMVkcLvpUsM9OSvSxE9tEFYSb3NzbDC0hFxJV8";

const MAX_RETRIES = 3;
const BACKOFF_BASE = 1000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getSavedLicense(domain: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("activated_licenses")
      .select("license_key")
      .eq("domain", domain)
      .maybeSingle();
    if (error || !data) return null;
    return data.license_key;
  } catch {
    return null;
  }
}

export async function saveLicense(domain: string, licenseKey: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("activated_licenses")
      .upsert(
        { domain, license_key: licenseKey, activated_at: new Date().toISOString() },
        { onConflict: "domain" }
      );
    return !error;
  } catch {
    return false;
  }
}

export async function initAnalyticsSession(licenseKey: string): Promise<{ valid: boolean; error?: string }> {
  const _h = window.location.hostname;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(_ep, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + _ak,
        },
        body: JSON.stringify({ license_key: licenseKey, domain: _h }),
      });

      const data = await res.json();
      return data;
    } catch {
      if (attempt < MAX_RETRIES - 1) {
        await delay(BACKOFF_BASE * Math.pow(2, attempt));
      }
    }
  }

  return { valid: false, error: "Network error: Unable to verify after multiple attempts." };
}

export async function _validateSession(licenseKey: string): Promise<boolean> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const r = await fetch(_ep, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + _ak,
        },
        body: JSON.stringify({ license_key: licenseKey, domain: location.hostname }),
      });
      const d = await r.json();
      return !!d.valid;
    } catch {
      if (attempt < MAX_RETRIES - 1) {
        await delay(BACKOFF_BASE * Math.pow(2, attempt));
      }
    }
  }

  return true;
}

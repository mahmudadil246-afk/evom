import { useEffect, useState, useCallback, ReactNode, useRef } from "react";
import { initAnalyticsSession, getSavedLicense, saveLicense } from "@/lib/analytics";
import { Loader2, ShieldAlert, RefreshCw, Globe, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const LK_STORAGE_KEY = "_lk";
const LK_CACHE_KEY = "_lk_verified";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface AppInitializerProps {
  children: ReactNode;
}

type AppState = "no_key" | "checking" | "valid" | "invalid";

function getCachedValidity(): boolean {
  try {
    const raw = localStorage.getItem(LK_CACHE_KEY);
    if (!raw) return false;
    const { ts } = JSON.parse(raw);
    return Date.now() - ts < CACHE_TTL;
  } catch {
    return false;
  }
}

function setCachedValidity() {
  localStorage.setItem(LK_CACHE_KEY, JSON.stringify({ ts: Date.now() }));
}

export const AppInitializer = ({ children }: AppInitializerProps) => {
  // If we have a cached valid result, skip blocking entirely
  const hasCachedValid = useRef(getCachedValidity() && !!localStorage.getItem(LK_STORAGE_KEY));
  const [state, setState] = useState<AppState>(hasCachedValid.current ? "valid" : "checking");
  const [errorMsg, setErrorMsg] = useState("");
  const [licenseInput, setLicenseInput] = useState("");
  const [activating, setActivating] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const domain = window.location.hostname;

  const verifyAndLoad = useCallback(async (key: string, saveToDb: boolean) => {
    const result = await initAnalyticsSession(key);
    if (result.valid) {
      localStorage.setItem(LK_STORAGE_KEY, key);
      setCachedValidity();
      if (saveToDb) {
        await saveLicense(domain, key);
      }
      setState("valid");
    } else {
      localStorage.removeItem(LK_STORAGE_KEY);
      localStorage.removeItem(LK_CACHE_KEY);
      setState("invalid");
      setErrorMsg(result.error || "License verification failed.");
    }
  }, [domain]);

  useEffect(() => {
    // If cached valid, do background re-verify without blocking
    if (hasCachedValid.current) {
      const key = localStorage.getItem(LK_STORAGE_KEY);
      if (key) {
        // Background verify - don't block render
        initAnalyticsSession(key).then(result => {
          if (result.valid) {
            setCachedValidity();
          } else {
            localStorage.removeItem(LK_STORAGE_KEY);
            localStorage.removeItem(LK_CACHE_KEY);
            setState("invalid");
            setErrorMsg(result.error || "License expired.");
          }
        }).catch(() => {
          // Network error during bg check — keep cached state
        });
      }
      return;
    }

    const init = async () => {
      setState("checking");
      // 1. Check DB first
      const dbKey = await getSavedLicense(domain);
      if (dbKey) {
        await verifyAndLoad(dbKey, false);
        return;
      }

      // 2. Fallback to localStorage
      const localKey = localStorage.getItem(LK_STORAGE_KEY);
      if (localKey) {
        await verifyAndLoad(localKey, true);
        return;
      }

      // 3. No key found
      setState("no_key");
    };
    init();
  }, [domain, verifyAndLoad]);

  const handleActivate = async () => {
    if (!licenseInput.trim()) return;
    setActivating(true);
    const key = licenseInput.trim();
    const result = await initAnalyticsSession(key);
    setActivating(false);
    if (result.valid) {
      localStorage.setItem(LK_STORAGE_KEY, key);
      setCachedValidity();
      await saveLicense(domain, key);
      setState("valid");
    } else {
      setErrorMsg(result.error || "Invalid license key.");
    }
  };

  const handleRetry = () => {
    setRetryCount((c) => c + 1);
    const init = async () => {
      setState("checking");
      const dbKey = await getSavedLicense(domain);
      if (dbKey) {
        await verifyAndLoad(dbKey, false);
        return;
      }
      const localKey = localStorage.getItem(LK_STORAGE_KEY);
      if (localKey) {
        await verifyAndLoad(localKey, true);
        return;
      }
      setState("no_key");
    };
    init();
  };

  const handleEnterNewKey = () => {
    localStorage.removeItem(LK_STORAGE_KEY);
    localStorage.removeItem(LK_CACHE_KEY);
    setErrorMsg("");
    setLicenseInput("");
    setState("no_key");
  };

  if (state === "checking") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        {retryCount > 0 && (
          <p className="text-sm text-muted-foreground">Retry attempt {retryCount}...</p>
        )}
      </div>
    );
  }

  if (state === "no_key") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <Key className="h-12 w-12 text-primary mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Activate License</h1>
            <p className="text-sm text-muted-foreground">Enter your license key to activate this application.</p>
          </div>

          <div className="rounded-lg border bg-card p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Domain:</span>
              <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{domain}</span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">License Key</label>
              <Input
                type="text"
                placeholder="Enter your license key"
                value={licenseInput}
                onChange={(e) => { setLicenseInput(e.target.value); setErrorMsg(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleActivate()}
              />
            </div>

            {errorMsg && (
              <p className="text-sm text-destructive">{errorMsg}</p>
            )}

            <Button
              onClick={handleActivate}
              disabled={!licenseInput.trim() || activating}
              className="w-full"
            >
              {activating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {activating ? "Verifying..." : "Activate"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (state === "invalid") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-md space-y-4">
          <ShieldAlert className="h-16 w-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">License Invalid</h1>
          <p className="text-muted-foreground">{errorMsg}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={handleRetry} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
            <Button onClick={handleEnterNewKey} className="gap-2">
              <Key className="h-4 w-4" />
              Enter New License Key
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

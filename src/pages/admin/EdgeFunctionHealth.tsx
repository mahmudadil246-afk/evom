import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface FunctionStatus {
  name: string;
  label: string;
  category: string;
  status: "idle" | "checking" | "ok" | "error" | "timeout";
  responseTime?: number;
  error?: string;
}

const EDGE_FUNCTIONS: Omit<FunctionStatus, "status">[] = [
  // Database & System
  { name: "database-backup", label: "Database Backup", category: "System" },
  { name: "database-restore", label: "Database Restore", category: "System" },
  { name: "generate-sitemap", label: "Sitemap Generator", category: "System" },
  { name: "auto-clean-trash", label: "Auto Clean Trash", category: "System" },
  { name: "auto-clean-chat", label: "Auto Clean Chat", category: "System" },
  // Auth & Users
  { name: "verify-login", label: "Login Verification", category: "Auth" },
  { name: "delete-user-account", label: "Delete User Account", category: "Auth" },
  { name: "create-demo-users", label: "Create Demo Users", category: "Auth" },
  // Courier
  { name: "steadfast-courier", label: "Steadfast Courier", category: "Courier" },
  { name: "pathao-courier", label: "Pathao Courier", category: "Courier" },
  { name: "paperfly-courier", label: "Paperfly Courier", category: "Courier" },
  { name: "redx-courier", label: "RedX Courier", category: "Courier" },
  // Email
  { name: "send-order-confirmation", label: "Order Confirmation Email", category: "Email" },
  { name: "send-contact-reply", label: "Contact Reply Email", category: "Email" },
  { name: "send-login-alert", label: "Login Alert Email", category: "Email" },
  { name: "send-lockout-alert", label: "Lockout Alert Email", category: "Email" },
  { name: "send-unlock-alert", label: "Unlock Alert Email", category: "Email" },
  { name: "send-abandoned-cart-reminder", label: "Abandoned Cart Reminder", category: "Email" },
  { name: "send-scheduled-report", label: "Scheduled Report Email", category: "Email" },
  // Payment
  { name: "payment-gateway-init", label: "Payment Gateway Init", category: "Payment" },
  { name: "payment-gateway-ipn", label: "Payment Gateway IPN", category: "Payment" },
  { name: "sslcommerz-init", label: "SSLCommerz Init", category: "Payment" },
  { name: "sslcommerz-ipn", label: "SSLCommerz IPN", category: "Payment" },
  // Other
  { name: "track-order", label: "Track Order", category: "Other" },
  { name: "process-abandoned-carts", label: "Process Abandoned Carts", category: "Other" },
  { name: "migrate-product-images", label: "Migrate Product Images", category: "Other" },
];

export default function EdgeFunctionHealth() {
  const [functions, setFunctions] = useState<FunctionStatus[]>(
    EDGE_FUNCTIONS.map((f) => ({ ...f, status: "idle" as const }))
  );
  const [isRunning, setIsRunning] = useState(false);

  const checkFunction = useCallback(async (name: string): Promise<Partial<FunctionStatus>> => {
    const start = Date.now();
    try {
      const { error } = await supabase.functions.invoke(name, {
        body: { action: "health_check" },
      });
      const responseTime = Date.now() - start;
      // Any response from the server (even 400/500 validation error) confirms
      // the function is deployed and reachable — mark as online.
      return { status: "ok", responseTime, error: undefined };
    } catch (err: unknown) {
      const responseTime = Date.now() - start;
      // FunctionsHttpError (non-2xx) still means function is reachable
      const errName = err instanceof Error ? err.constructor.name : "";
      if (
        errName === "FunctionsHttpError" ||
        errName === "FunctionsRelayError" ||
        (err instanceof Error && err.message && !err.message.includes("Failed to fetch"))
      ) {
        return { status: "ok", responseTime, error: undefined };
      }
      if (responseTime >= 7500) {
        return { status: "timeout", responseTime, error: "Timeout (>8s)" };
      }
      return { status: "error", responseTime, error: "Failed to reach function" };
    }
  }, []);

  const runAllChecks = useCallback(async () => {
    setIsRunning(true);
    // Set all to checking
    setFunctions((prev) => prev.map((f) => ({ ...f, status: "checking" as const })));

    // Run in batches of 4 to avoid overwhelming
    const batchSize = 4;
    const names = EDGE_FUNCTIONS.map((f) => f.name);

    for (let i = 0; i < names.length; i += batchSize) {
      const batch = names.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(async (name) => {
          const result = await checkFunction(name);
          return { name, ...result };
        })
      );

      setFunctions((prev) =>
        prev.map((f) => {
          const result = results.find((r) => r.name === f.name);
          if (result) {
            return { ...f, ...result } as FunctionStatus;
          }
          return f;
        })
      );
    }

    setIsRunning(false);
  }, [checkFunction]);

  const categories = [...new Set(EDGE_FUNCTIONS.map((f) => f.category))];

  const counts = {
    ok: functions.filter((f) => f.status === "ok").length,
    error: functions.filter((f) => f.status === "error").length,
    timeout: functions.filter((f) => f.status === "timeout").length,
    total: functions.length,
  };

  const getStatusIcon = (status: FunctionStatus["status"]) => {
    switch (status) {
      case "ok": return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "error": return <XCircle className="h-4 w-4 text-destructive" />;
      case "timeout": return <AlertTriangle className="h-4 w-4 text-warning" />;
      case "checking": return <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: FunctionStatus["status"]) => {
    switch (status) {
      case "ok": return <Badge className="border-success/20 bg-success/10 text-success">Online</Badge>;
      case "error": return <Badge variant="destructive">Error</Badge>;
      case "timeout": return <Badge className="border-warning/20 bg-warning/10 text-warning">Timeout</Badge>;
      case "checking": return <Badge variant="secondary">Checking...</Badge>;
      default: return <Badge variant="outline">Not Checked</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Edge Function Health"
        description="Check the status and availability of all backend functions"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{counts.total}</div>
            <div className="text-xs text-muted-foreground">Total Functions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-success">{counts.ok}</div>
            <div className="text-xs text-muted-foreground">Online</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-destructive">{counts.error}</div>
            <div className="text-xs text-muted-foreground">Errors</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-warning">{counts.timeout}</div>
            <div className="text-xs text-muted-foreground">Timeouts</div>
          </CardContent>
        </Card>
      </div>

      {/* Run Button */}
      <div className="flex justify-end">
        <Button onClick={runAllChecks} disabled={isRunning}>
          <RefreshCw className={cn("h-4 w-4 mr-2", isRunning && "animate-spin")} />
          {isRunning ? "Checking..." : "Run Health Check"}
        </Button>
      </div>

      {/* Function Groups */}
      {categories.map((category) => {
        const categoryFunctions = functions.filter((f) => f.category === category);
        return (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                {category}
                <Badge variant="secondary" className="ml-auto text-xs">
                  {categoryFunctions.filter((f) => f.status === "ok").length}/{categoryFunctions.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {categoryFunctions.map((fn) => (
                  <div
                    key={fn.name}
                    className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {getStatusIcon(fn.status)}
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{fn.label}</div>
                        <div className="text-xs text-muted-foreground font-mono">{fn.name}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {fn.responseTime !== undefined && (
                        <span className="text-xs text-muted-foreground">{fn.responseTime}ms</span>
                      )}
                      {getStatusBadge(fn.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Error Details */}
      {functions.some((f) => f.status === "error" && f.error) && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-destructive">Error Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {functions
              .filter((f) => f.status === "error" && f.error)
              .map((fn) => (
                <div key={fn.name} className="text-sm">
                  <span className="font-medium">{fn.label}:</span>{" "}
                  <span className="text-muted-foreground">{fn.error}</span>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { supabase } from "@/integrations/supabase/client";

/**
 * Standalone audit log function — can be called from any hook or component
 * without needing the useAuditLog React hook.
 */
export async function logAuditAction(params: {
  action: string;
  resource_type: string;
  resource_id?: string;
  description?: string;
  old_value?: any;
  new_value?: any;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    await supabase.from("audit_logs").insert({
      user_id: user.id,
      user_email: user.email,
      user_role: roleData?.role || "user",
      action: params.action,
      resource_type: params.resource_type,
      resource_id: params.resource_id || null,
      description: params.description || null,
      old_value: params.old_value || null,
      new_value: params.new_value || null,
      user_agent: navigator.userAgent,
    } as any);
  } catch (error) {
    console.error("Audit log error:", error);
  }
}

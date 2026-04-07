import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // --- Auth: token-based validation ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsError } = await authClient.auth.getUser(token);
    if (claimsError || !claimsData?.user?.id) {
      console.error("Auth validation failed:", claimsError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = claimsData.user.id;

    // Check admin role using service-role client
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .in("role", ["admin", "manager"])
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: Admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { request_id, admin_notes } = await req.json();
    if (!request_id) {
      return new Response(JSON.stringify({ error: "request_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the deletion request
    const { data: request, error: reqError } = await supabaseAdmin
      .from("account_deletion_requests")
      .select("*")
      .eq("id", request_id)
      .eq("status", "pending")
      .maybeSingle();

    if (reqError || !request) {
      return new Response(JSON.stringify({ error: "Request not found or already processed" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const targetUserId = request.user_id;

    // Delete user data from all related tables
    const tablesToClean = [
      { table: "wishlists", column: "user_id" },
      { table: "notifications", column: "user_id" },
      { table: "login_activity", column: "user_id" },
      { table: "two_factor_auth", column: "user_id" },
      { table: "security_settings", column: "user_id" },
      { table: "password_history", column: "user_id" },
      { table: "saved_payment_methods", column: "user_id" },
      { table: "admin_presence", column: "user_id" },
      { table: "profiles", column: "user_id" },
      { table: "return_requests", column: "user_id" },
      { table: "account_deletion_requests", column: "user_id" },
    ];

    for (const { table, column } of tablesToClean) {
      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .eq(column, targetUserId);
      if (error) {
        console.error(`Error cleaning ${table}:`, error.message);
      }
    }

    // Nullify user_id in tables where we want to keep the data (orders, etc.)
    const tablesToNullify = [
      { table: "orders", column: "user_id" },
      { table: "live_chat_conversations", column: "user_id" },
      { table: "abandoned_carts", column: "user_id" },
    ];

    for (const { table, column } of tablesToNullify) {
      const { error } = await supabaseAdmin
        .from(table)
        .update({ [column]: null })
        .eq(column, targetUserId);
      if (error) {
        console.error(`Error nullifying ${table}:`, error.message);
      }
    }

    // Delete the auth user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
    if (deleteError) {
      console.error("Error deleting auth user:", deleteError.message);
      await supabaseAdmin
        .from("account_deletion_requests")
        .update({
          status: "failed",
          admin_notes: admin_notes || `Deletion failed: ${deleteError.message}`,
          reviewed_by: callerId,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", request_id);

      return new Response(JSON.stringify({ error: "Failed to delete auth user", details: deleteError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, message: "Account permanently deleted" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

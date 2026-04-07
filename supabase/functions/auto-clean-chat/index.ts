import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

    // 1. Get IDs of expired conversations
    const { data: expiredConvos, error: fetchError } = await supabase
      .from("live_chat_conversations")
      .select("id")
      .lt("updated_at", sixHoursAgo);

    if (fetchError) throw fetchError;

    const expiredIds = (expiredConvos || []).map((c: { id: string }) => c.id);

    if (expiredIds.length === 0) {
      return new Response(
        JSON.stringify({ success: true, cleaned: 0, message: "No expired conversations" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Delete related records first (FK constraints)
    const { error: msgErr } = await supabase
      .from("live_chat_messages")
      .delete()
      .in("conversation_id", expiredIds);
    if (msgErr) console.error("Error deleting messages:", msgErr.message);

    const { error: csatErr } = await supabase
      .from("csat_ratings")
      .delete()
      .in("conversation_id", expiredIds);
    if (csatErr) console.error("Error deleting CSAT ratings:", csatErr.message);

    const { error: notesErr } = await supabase
      .from("customer_notes")
      .delete()
      .in("conversation_id", expiredIds);
    if (notesErr) console.error("Error deleting customer notes:", notesErr.message);

    // 3. Delete the expired conversations
    const { error: convErr } = await supabase
      .from("live_chat_conversations")
      .delete()
      .in("id", expiredIds);
    if (convErr) throw convErr;

    console.log(`Auto-cleaned ${expiredIds.length} chat conversations older than 6 hours`);

    return new Response(
      JSON.stringify({ success: true, cleaned: expiredIds.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Auto-clean chat error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

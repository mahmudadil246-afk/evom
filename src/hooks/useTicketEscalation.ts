import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useTicketEscalation() {
  const queryClient = useQueryClient();

  const escalateTicket = useMutation({
    mutationFn: async ({
      ticketId,
      escalatedTo,
      reason,
      newPriority,
    }: {
      ticketId: string;
      escalatedTo?: string;
      reason: string;
      newPriority?: string;
    }) => {
      const updates = {
        escalation_reason: reason,
        escalated_at: new Date().toISOString(),
        ...(escalatedTo ? { escalated_to: escalatedTo, assigned_to: escalatedTo } : {}),
        priority: newPriority || "urgent",
      };

      const { error } = await supabase
        .from("support_tickets")
        .update(updates)
        .eq("id", ticketId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      toast.success("Ticket escalated successfully");
    },
    onError: (error) => {
      console.error("Error escalating ticket:", error);
      toast.error("Failed to escalate ticket");
    },
  });

  return {
    escalateTicket: escalateTicket.mutate,
    isEscalating: escalateTicket.isPending,
  };
}

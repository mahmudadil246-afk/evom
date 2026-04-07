import { useState, useEffect, useRef } from "react";
import { CustomerSupportTickets } from "@/components/store/CustomerSupportTickets";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAccountHeaderActions } from "@/layouts/CustomerAccountLayout";
import { motion } from "framer-motion";

export default function AccountSupport() {
  const { setHeaderActions } = useAccountHeaderActions();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    setHeaderActions(
      <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
        <Plus className="h-4 w-4 mr-1" />
        New Ticket
      </Button>
    );
  }, []);

  return (
    <>
      <SEOHead title="Support" noIndex />
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }}>
        <CustomerSupportTickets />
      </motion.div>
    </>
  );
}

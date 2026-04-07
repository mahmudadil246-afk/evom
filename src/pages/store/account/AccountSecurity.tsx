import { SecurityTab } from "@/components/account/SecurityTab";
import { SEOHead } from "@/components/SEOHead";
import { motion } from "framer-motion";

export default function AccountSecurity() {
  return (
    <>
      <SEOHead title="Security" noIndex />
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }}>
        <SecurityTab />
      </motion.div>
    </>
  );
}

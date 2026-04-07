import { useLanguage } from "@/contexts/LanguageContext";
import { SEOHead } from "@/components/SEOHead";
import { CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export default function AccountPaymentMethods() {
  const { t } = useLanguage();

  return (
    <>
      <SEOHead title="Payment Methods" noIndex />
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants}>
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <CreditCard className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-1">{t('account.noSavedPayments')}</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Payment methods used during checkout will be managed at the time of purchase
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </>
  );
}

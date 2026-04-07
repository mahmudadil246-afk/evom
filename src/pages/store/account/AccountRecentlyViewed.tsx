import { useEffect } from "react";
import { RecentlyViewedTab } from "@/components/account/RecentlyViewedTab";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useAccountHeaderActions } from "@/layouts/CustomerAccountLayout";
import { motion } from "framer-motion";

export default function AccountRecentlyViewed() {
  const { items, clearAll } = useRecentlyViewed();
  const { setHeaderActions } = useAccountHeaderActions();

  useEffect(() => {
    if (items.length > 0) {
      setHeaderActions(
        <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground">
          <Trash2 className="h-4 w-4 mr-1" />
          Clear All
        </Button>
      );
    }
  }, [items.length]);

  return (
    <>
      <SEOHead title="Recently Viewed" noIndex />
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }}>
        <RecentlyViewedTab />
      </motion.div>
    </>
  );
}

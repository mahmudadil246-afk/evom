import { WishlistTab } from "@/components/account/WishlistTab";
import { SEOHead } from "@/components/SEOHead";
import { motion } from "framer-motion";

export default function AccountWishlist() {
  return (
    <>
      <SEOHead title="My Wishlist" noIndex />
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }}>
        <WishlistTab />
      </motion.div>
    </>
  );
}

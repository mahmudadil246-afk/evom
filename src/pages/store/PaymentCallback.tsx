import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { SEOHead } from "@/components/SEOHead";
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const status = searchParams.get("status");
  const [orderState, setOrderState] = useState<any>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("gateway_order_state") || sessionStorage.getItem("sslcommerz_order_state");
    if (stored) {
      try { setOrderState(JSON.parse(stored)); sessionStorage.removeItem("gateway_order_state"); sessionStorage.removeItem("sslcommerz_order_state"); } catch {}
    }
  }, []);

  useEffect(() => {
    if (status === "success" && orderState) {
      const timer = setTimeout(() => { navigate("/order-confirmation", { state: orderState, replace: true }); }, 2500);
      return () => clearTimeout(timer);
    }
  }, [status, orderState, navigate]);

  if (status === "success") {
    return (
      <>
        <SEOHead title="Payment Status" description="Payment result" noIndex={true} />
        <div className="container mx-auto px-4 py-16 max-w-lg text-center space-y-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
            <div className="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h1 className="font-display text-2xl font-bold text-foreground">Payment Successful!</h1>
            <p className="text-muted-foreground mt-2">Your payment has been processed successfully. Redirecting to order confirmation...</p>
          </motion.div>
          <Loader2 className="w-6 h-6 mx-auto animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  if (status === "fail") {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center space-y-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
          <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="w-10 h-10 text-destructive" />
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h1 className="font-display text-2xl font-bold text-foreground">Payment Failed</h1>
          <p className="text-muted-foreground mt-2">Your payment could not be processed. Please try again or use a different payment method.</p>
          <div className="flex gap-3 justify-center mt-6">
            <Button variant="outline" onClick={() => navigate("/")}>Go Home</Button>
            <Button onClick={() => navigate("/checkout")}>Try Again</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (status === "cancel") {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center space-y-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
          <div className="w-20 h-20 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-amber-600" />
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h1 className="font-display text-2xl font-bold text-foreground">Payment Cancelled</h1>
          <p className="text-muted-foreground mt-2">You have cancelled the payment. Your order has been saved — you can try paying again.</p>
          <div className="flex gap-3 justify-center mt-6">
            <Button variant="outline" onClick={() => navigate("/")}>Go Home</Button>
            <Button onClick={() => navigate("/checkout")}>Back to Checkout</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-lg text-center space-y-6">
      <Loader2 className="w-10 h-10 mx-auto animate-spin text-muted-foreground" />
      <p className="text-muted-foreground">Processing payment status...</p>
    </div>
  );
}
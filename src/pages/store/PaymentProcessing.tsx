import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2, ShieldCheck, CreditCard, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

import { SEOHead } from "@/components/SEOHead";
import { Progress } from "@/components/ui/progress";

interface PaymentProcessingState {
  gatewayName: string;
  gatewayLogo?: string | null;
  orderData: any;
}

const STEPS = [
  { label: "Connecting to payment gateway...", duration: 1500 },
  { label: "Verifying payment details...", duration: 1800 },
  { label: "Processing transaction...", duration: 2200 },
  { label: "Payment confirmed! Redirecting...", duration: 1000 },
];

export default function PaymentProcessing() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as PaymentProcessingState | undefined;
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const gatewayName = state?.gatewayName || "Payment Gateway";
  const gatewayLogo = state?.gatewayLogo;

  useEffect(() => {
    if (!state?.orderData) {
      navigate("/", { replace: true });
      return;
    }

    let stepTimeout: ReturnType<typeof setTimeout>;
    let progressInterval: ReturnType<typeof setInterval>;

    const totalDuration = STEPS.reduce((sum, s) => sum + s.duration, 0);
    let elapsed = 0;

    progressInterval = setInterval(() => {
      elapsed += 50;
      setProgress(Math.min((elapsed / totalDuration) * 100, 100));
    }, 50);

    const runSteps = (stepIndex: number) => {
      if (stepIndex >= STEPS.length) {
        clearInterval(progressInterval);
        navigate("/order-confirmation", {
          state: state.orderData,
          replace: true,
        });
        return;
      }
      setCurrentStep(stepIndex);
      stepTimeout = setTimeout(() => runSteps(stepIndex + 1), STEPS[stepIndex].duration);
    };

    runSteps(0);

    return () => {
      clearTimeout(stepTimeout);
      clearInterval(progressInterval);
    };
  }, []);

  if (!state?.orderData) return null;

  return (
    <>
      <SEOHead title="Processing Payment" description="Your payment is being processed." noIndex={true} />
      <div className="container mx-auto px-4 py-16 max-w-lg">
        <div className="text-center space-y-8">
          {/* Gateway Header */}
          <motion.div className="space-y-4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
            <div className="w-20 h-20 mx-auto rounded-2xl bg-muted/50 border border-border flex items-center justify-center">
              {gatewayLogo ? (
                <img src={gatewayLogo} alt={gatewayName} className="w-12 h-12 object-contain" />
              ) : (
                <CreditCard className="w-10 h-10 text-store-primary" />
              )}
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                {gatewayName}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Secure Payment Processing
              </p>
            </div>
          </motion.div>

          {/* Progress */}
          <motion.div className="space-y-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Progress value={progress} className="h-2" />
            
            {/* Steps */}
            <div className="space-y-3">
              {STEPS.map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: idx <= currentStep ? 1 : 0.3, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`flex items-center gap-3 text-sm transition-all duration-300 ${
                    idx < currentStep
                      ? "text-green-600 dark:text-green-400"
                      : idx === currentStep
                      ? "text-foreground font-medium"
                      : "text-muted-foreground/40"
                  }`}
                >
                  <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                    {idx < currentStep ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : idx === currentStep ? (
                      <Loader2 className="w-5 h-5 animate-spin text-store-primary" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                    )}
                  </div>
                  <span>{step.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4 border-t border-border">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            <span>256-bit SSL Encrypted • Secure Transaction</span>
          </div>

          <p className="text-xs text-muted-foreground">
            Demo Mode — No real payment is being processed
          </p>
        </div>
      </div>
    </>
  );
}
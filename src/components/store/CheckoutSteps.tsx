import { Check, User, Truck, CreditCard, ClipboardCheck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface CheckoutStepsProps {
  currentStep: number;
}

export function CheckoutSteps({ currentStep }: CheckoutStepsProps) {
  const { t } = useLanguage();

  const steps = [
    { label: t('store.stepContact'), icon: User },
    { label: t('store.stepShipping'), icon: Truck },
    { label: t('store.stepPayment'), icon: CreditCard },
    { label: t('store.stepReview'), icon: ClipboardCheck },
  ];

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          return (
            <div key={step.label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${isCompleted ? "bg-store-primary text-store-primary-foreground" : isCurrent ? "bg-store-primary text-store-primary-foreground ring-4 ring-store-primary/20" : "bg-muted text-muted-foreground"}`}>
                  {isCompleted ? <Check className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${isCompleted || isCurrent ? "text-store-primary" : "text-muted-foreground"}`}>{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mt-[-1rem] sm:mt-[-0.5rem] ${isCompleted ? "bg-store-primary" : "bg-muted"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

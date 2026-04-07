import { useState } from "react";
import { Copy, Check, Smartphone, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { EnabledPaymentMethod } from "@/hooks/useEnabledPaymentMethods";
import { useLanguage } from "@/contexts/LanguageContext";

interface ManualPaymentInstructionsProps {
  paymentMethod: EnabledPaymentMethod;
  transactionId: string;
  onTransactionIdChange: (value: string) => void;
}

const METHOD_COLORS: Record<string, string> = {
  bkash: "bg-pink-500",
  nagad: "bg-orange-500",
  rocket: "bg-purple-600",
  upay: "bg-green-600",
};

export function ManualPaymentInstructions({ 
  paymentMethod, 
  transactionId, 
  onTransactionIdChange 
}: ManualPaymentInstructionsProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  
  // Skip if no account number configured
  if (!paymentMethod.account_number) {
    return (
      <div className="mt-4 p-4 bg-warning/10 rounded-lg border border-warning/20">
        <p className="text-sm text-warning">
          ⚠️ {t('manualPayment.notConfigured')}
        </p>
      </div>
    );
  }

  const copyNumber = () => {
    navigator.clipboard.writeText(paymentMethod.account_number!);
    setCopied(true);
    toast.success(t('manualPayment.numberCopied'));
    setTimeout(() => setCopied(false), 2000);
  };

  const colorClass = METHOD_COLORS[paymentMethod.method_id] || "bg-primary";
  const accountTypeLabel = paymentMethod.account_type === "merchant" ? t('manualPayment.merchant') 
    : paymentMethod.account_type === "agent" ? t('manualPayment.agent') : t('manualPayment.personal');

  return (
    <div className="space-y-4 mt-4 p-4 bg-muted/50 rounded-lg border">
      <div className="flex items-center gap-2">
        {paymentMethod.logo_url ? (
          <img 
            src={paymentMethod.logo_url} 
            alt={paymentMethod.name} 
            className="h-8 w-8 object-contain rounded"
          />
        ) : (
          <div className={`w-8 h-8 rounded-full ${colorClass} flex items-center justify-center`}>
            <Smartphone className="h-4 w-4 text-white" />
          </div>
        )}
        <div>
          <p className="font-semibold">{paymentMethod.name} {t('manualPayment.payment')}</p>
          <p className="text-xs text-muted-foreground">{accountTypeLabel} {t('manualPayment.account')}</p>
        </div>
      </div>

      {/* QR Code Section */}
      {paymentMethod.qr_code_url && (
        <div className="flex flex-col sm:flex-row gap-4 items-center p-3 bg-background rounded-lg border">
          <div className="flex-shrink-0">
            <img 
              src={paymentMethod.qr_code_url} 
              alt={`${paymentMethod.name} QR Code`}
              className="w-24 h-24 object-contain rounded border bg-white p-1 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setShowQrModal(true)}
            />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-sm font-medium flex items-center gap-1 justify-center sm:justify-start">
              <QrCode className="h-4 w-4" />
              {t('manualPayment.scanQR')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('manualPayment.scanWith')} {paymentMethod.name} {t('manualPayment.appToPay')}
            </p>
            <Button 
              type="button"
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => setShowQrModal(true)}
            >
              {t('manualPayment.viewLarger')}
            </Button>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {paymentMethod.logo_url ? (
                <img 
                  src={paymentMethod.logo_url} 
                  alt={paymentMethod.name} 
                  className="h-6 w-6 object-contain"
                />
              ) : (
                <QrCode className="h-5 w-5" />
              )}
              {paymentMethod.name} {t('manualPayment.qrCode')}
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center p-4">
            <img 
              src={paymentMethod.qr_code_url!} 
              alt={`${paymentMethod.name} QR Code`}
              className="max-w-full max-h-[60vh] object-contain rounded-lg border bg-white p-2"
            />
          </div>
          <p className="text-center text-sm text-muted-foreground">
            {t('manualPayment.scanWithApp')} {paymentMethod.name}
          </p>
        </DialogContent>
      </Dialog>

      {/* Divider if QR exists */}
      {paymentMethod.qr_code_url && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-muted/50 px-2 text-muted-foreground">{t('manualPayment.or')}</span>
          </div>
        </div>
      )}

      <div className="bg-background p-3 rounded-lg border">
        <p className="text-sm text-muted-foreground mb-1">{t('manualPayment.accountNumber')}</p>
        <div className="flex items-center gap-2">
          <code className="text-xl font-bold tracking-wider flex-1">{paymentMethod.account_number}</code>
          <Button 
            type="button"
            variant="outline" 
            size="sm" 
            onClick={copyNumber}
            className="shrink-0"
          >
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground bg-warning/10 p-3 rounded-lg border border-warning/20">
        <p className="font-medium text-warning mb-1">📱 {t('manualPayment.howToPay')}</p>
        <p className="text-warning/80">
          {paymentMethod.name} → {t('manualPayment.scanQR')} / Send Money → {t('manualPayment.transactionId')}
        </p>
      </div>

      <div>
        <Label htmlFor="transactionId" className="text-sm font-medium">
          {t('manualPayment.transactionId')} *
        </Label>
        <Input
          id="transactionId"
          value={transactionId}
          onChange={(e) => onTransactionIdChange(e.target.value.toUpperCase())}
          placeholder="e.g. TXN123456789"
          className="mt-1 font-mono"
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          {t('manualPayment.enterTrxId')}
        </p>
      </div>
    </div>
  );
}

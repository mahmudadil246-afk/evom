import { Truck, RefreshCw, Lock, CreditCard, Shield } from 'lucide-react';

interface TrustBadge {
  icon: string;
  label: string;
  enabled: boolean;
}

interface ProductTrustBadgesProps {
  badges: TrustBadge[];
}

const IconMap: Record<string, any> = { truck: Truck, refresh: RefreshCw, lock: Lock, "credit-card": CreditCard, shield: Shield };

export function ProductTrustBadges({ badges }: ProductTrustBadgesProps) {
  const enabledBadges = badges.filter(b => b.enabled);
  if (enabledBadges.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-store-muted rounded-lg mb-6">
      {enabledBadges.map((badge, i) => {
        const Icon = IconMap[badge.icon] || Shield;
        return (
          <div key={i} className="text-center">
            <Icon className="h-5 w-5 mx-auto mb-1 text-store-primary" />
            <p className="text-[10px] font-medium">{badge.label}</p>
          </div>
        );
      })}
    </div>
  );
}

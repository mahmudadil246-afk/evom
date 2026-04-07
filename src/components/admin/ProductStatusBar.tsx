import { motion } from "framer-motion";
import { CheckCircle2, FileEdit, AlertTriangle, Package } from "lucide-react";

interface ProductStatusBarProps {
  products: Array<{
    status: "active" | "draft";
    stock: number;
    low_stock_threshold?: number;
  }>;
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

export function ProductStatusBar({ products }: ProductStatusBarProps) {
  const active = products.filter(p => p.status === "active").length;
  const draft = products.filter(p => p.status === "draft").length;
  const outOfStock = products.filter(p => p.stock === 0).length;
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= (p.low_stock_threshold ?? 10)).length;

  const items = [
    { label: "Active", count: active, icon: CheckCircle2, border: "border-l-emerald-500", iconClass: "text-emerald-500", bgClass: "bg-emerald-500/10", cardBg: "bg-emerald-500/5 dark:bg-emerald-500/10" },
    { label: "Draft", count: draft, icon: FileEdit, border: "border-l-slate-400", iconClass: "text-slate-400", bgClass: "bg-slate-400/10", cardBg: "bg-slate-400/5 dark:bg-slate-400/10" },
    { label: "Out of Stock", count: outOfStock, icon: AlertTriangle, border: "border-l-red-500", iconClass: "text-red-500", bgClass: "bg-red-500/10", cardBg: "bg-red-500/5 dark:bg-red-500/10" },
    { label: "Low Stock", count: lowStock, icon: Package, border: "border-l-amber-500", iconClass: "text-amber-500", bgClass: "bg-amber-500/10", cardBg: "bg-amber-500/5 dark:bg-amber-500/10" },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
    >
      {items.map(item => (
        <motion.div
          key={item.label}
          variants={cardVariants}
          whileHover={{ y: -2, boxShadow: "0 4px 20px -4px hsl(var(--primary) / 0.10)" }}
          className={`relative rounded-xl border border-border/50 p-4 border-l-[3px] ${item.border} ${item.cardBg} transition-colors`}
        >
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.bgClass}`}>
              <item.icon className={`h-4.5 w-4.5 ${item.iconClass}`} />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-foreground">{item.count}</p>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{item.label}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

import { Plus, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    { label: "Add Product", icon: Plus, variant: "default" as const, onClick: () => navigate('/admin/products?action=add') },
    { label: "Import", icon: Upload, variant: "outline" as const, onClick: () => navigate('/admin/products?action=import') },
    { label: "Export", icon: Download, variant: "outline" as const, onClick: () => navigate('/admin/products?action=export') },
  ];

  return (
    <div className="flex flex-wrap gap-2 sm:gap-3">
      {actions.map((action, index) => (
        <Button 
          key={action.label} 
          variant={action.variant} 
          size="sm" 
          onClick={action.onClick}
          className={`gap-1.5 sm:gap-2 text-xs sm:text-sm`}
        >
          <action.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">{action.label}</span>
          <span className="sm:hidden">{index === 0 ? 'Add' : action.label}</span>
        </Button>
      ))}
    </div>
  );
}
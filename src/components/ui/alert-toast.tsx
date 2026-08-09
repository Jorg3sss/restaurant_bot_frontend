import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { CheckCircle2, AlertTriangle, Info, XOctagon, X } from "lucide-react";

const alertToastVariants = cva(
  "relative w-full min-w-[300px] max-w-sm overflow-hidden rounded-lg shadow-lg flex items-start p-4 space-x-4 border",
  {
    variants: {
      variant: {
        success: "bg-green-100 text-green-800 border-green-200",
        warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
        info: "bg-blue-100 text-blue-800 border-blue-200",
        error: "bg-red-100 text-red-800 border-red-200",
      }
    },
    defaultVariants: {
      variant: "info",
    },
  }
);

const iconMap = {
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
  error: XOctagon,
};

const iconColorClasses = {
  success: "text-green-600",
  warning: "text-yellow-600",
  info: "text-blue-600",
  error: "text-red-600",
};

export interface AlertToastProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertToastVariants> {
  title: string;
  description: string;
  onClose: () => void;
}

const AlertToast = React.forwardRef<HTMLDivElement, AlertToastProps>(
  ({ className, variant = 'info', title, description, onClose, ...props }, ref) => {
    const Icon = iconMap[variant || 'info'];

    return (
      <motion.div
        ref={ref}
        role="alert"
        layout
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={cn(alertToastVariants({ variant }), className)}
        {...props}
      >
        <div className="flex-shrink-0">
          <Icon className={cn("h-6 w-6", iconColorClasses[variant || 'info'])} aria-hidden="true" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold">{title}</p>
          <p className="text-sm opacity-90">{description}</p>
        </div>
        <div className="flex-shrink-0">
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-full opacity-60 hover:opacity-100 hover:bg-black/10 focus:outline-none transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </motion.div>
    );
  }
);

AlertToast.displayName = "AlertToast";
export { AlertToast, alertToastVariants };

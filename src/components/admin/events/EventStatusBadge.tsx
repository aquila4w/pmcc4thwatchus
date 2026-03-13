import { CheckCircle, XCircle, AlertCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EventStatusBadgeProps {
  status: string;
  showIcon?: boolean;
  className?: string;
}

const statusConfig = {
  "draft": { label: "Draft", color: "bg-slate-100 text-slate-700", icon: AlertCircle },
  "registration-open": { label: "Registration Open", color: "bg-green-100 text-green-700", icon: CheckCircle },
  "registration-closed": { label: "Registration Closed", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  "in-progress": { label: "In Progress", color: "bg-blue-100 text-blue-700", icon: Clock },
  "completed": { label: "Completed", color: "bg-slate-100 text-slate-700", icon: CheckCircle },
  "cancelled": { label: "Cancelled", color: "bg-red-100 text-red-700", icon: XCircle },
};

export function EventStatusBadge({ status, showIcon = true, className }: EventStatusBadgeProps) {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
  const Icon = config.icon;

  return (
    <Badge className={`${config.color} ${className || ""}`}>
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {config.label}
    </Badge>
  );
}

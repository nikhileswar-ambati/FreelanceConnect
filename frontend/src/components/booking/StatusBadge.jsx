import { Badge } from "@/components/common/Badge";
import { CheckCircle2, Clock, XCircle, Sparkles, Ban } from "lucide-react";

const map = {
  pending: { label: "Pending", variant: "warning", Icon: Clock },
  accepted: { label: "Accepted", variant: "primary", Icon: CheckCircle2 },
  completed: { label: "Completed", variant: "success", Icon: Sparkles },
  rejected: { label: "Rejected", variant: "destructive", Icon: XCircle },
  cancelled: { label: "Cancelled", variant: "muted", Icon: Ban },
};

export const StatusBadge = ({ status }) => {
  const cfg = map[status] || { label: status || "", variant: "muted", Icon: Clock };
  const Icon = cfg.Icon;

  return (
    <Badge variant={cfg.variant}>
      <Icon className="h-3 w-3" /> {cfg.label}
    </Badge>
  );
};

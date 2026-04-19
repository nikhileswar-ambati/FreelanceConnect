import {
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  formatDisplayDate,
  formatDisplayDateTime,
  formatDisplayTime,
  formatRequestedSlots,
} from "@/lib/dateTime";

const TimelineItem = ({ icon: Icon, label, value }) => (
  <div className="rounded-lg border border-border bg-muted/30 p-3">
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
    <div className="mt-1 text-sm font-medium text-foreground break-words">
      {value || "-"}
    </div>
  </div>
);

export const BookingTimeline = ({ booking }) => (
  <div className="grid gap-3 sm:grid-cols-2">
    <TimelineItem
      icon={Calendar}
      label="Service date"
      value={formatDisplayDate(booking.booked_date || booking.requested_date)}
    />
    <TimelineItem
      icon={Clock}
      label="Booked slot(s)"
      value={formatRequestedSlots(booking.requested_times)}
    />
    <TimelineItem
      icon={Clock}
      label="Request sent"
      value={formatDisplayDateTime(booking.requested_at || booking.requested_on)}
    />
    <TimelineItem
      icon={CheckCircle2}
      label="Accepted"
      value={formatDisplayDateTime(booking.accepted_at || booking.accepted_on)}
    />
    <TimelineItem
      icon={Sparkles}
      label="Completed"
      value={formatDisplayDateTime(booking.completed_at)}
    />
    <TimelineItem
      icon={Clock}
      label="Primary slot"
      value={formatDisplayTime(booking.booked_time || booking.requested_time)}
    />
  </div>
);

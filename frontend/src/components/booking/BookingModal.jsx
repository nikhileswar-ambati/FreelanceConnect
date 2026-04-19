import { useEffect, useState } from "react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { Input, Textarea } from "@/components/common/Input";
import { freelancerApi, bookingApi } from "@/services/api";
import { toast } from "@/components/common/Toast";
import { Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const today = () => new Date().toISOString().slice(0, 10);

const formatHour = (hour) => {
  const start = String(hour).padStart(2, "0");
  const end = String((hour + 1) % 24).padStart(2, "0");
  return `${start}:00-${end}:00`;
};

const hourToTime = (hour) => `${String(hour).padStart(2, "0")}:00:00`;

export const BookingModal = ({ open, onClose, freelancer, onBooked }) => {
  const [date, setDate] = useState(today());
  const [selectedHours, setSelectedHours] = useState([]); // Changed to array
  const [maxPrice, setMaxPrice] = useState("");
  const [requirements, setRequirements] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !freelancer?.freelancer_id || !date) return;

    setSelectedHours([]); // Reset to empty array
    setLoadingSlots(true);
    freelancerApi
      .getAvailability(freelancer.freelancer_id, { date })
      .then((response) => setAvailableSlots(response.available_slots || []))
      .catch(() => setAvailableSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [open, date, freelancer?.freelancer_id]);

  useEffect(() => {
    if (open) {
      setDate(today());
      setSelectedHours([]); // Reset to empty array
      setMaxPrice("");
      setRequirements("");
      setAvailableSlots([]);
    }
  }, [open]);

  const toggleHour = (hour) => {
    setSelectedHours((current) =>
      current.includes(hour)
        ? current.filter((item) => item !== hour)
        : [...current, hour].sort((a, b) => a - b)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedHours.length === 0) return;

    setSubmitting(true);

    try {
      const payload = {
        freelancer_id: freelancer.freelancer_id,
        requested_date: date,
        requested_times: selectedHours.map(hour => hourToTime(Number(hour))), // Send array of times
      };

      if (maxPrice !== "") payload.max_price = Number(maxPrice);
      if (requirements !== "") payload.requirements = requirements;

      await bookingApi.requestBooking(payload);
      toast.success("Booking request sent");
      onBooked?.();
      onClose();
    } catch (e) {
      toast.error("Failed to send booking", e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Booking request"
      description={freelancer?.name || ""}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          type="date"
          label="Date"
          icon={<Calendar className="h-4 w-4" />}
          min={today()}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        <div>
          <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4" /> Available slots
            {selectedHours.length > 0 && (
              <span className="text-xs text-muted-foreground">
                ({selectedHours.length} selected)
              </span>
            )}
          </label>

          {loadingSlots ? (
            <p className="text-xs text-muted-foreground">Loading slots...</p>
          ) : availableSlots.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No available slots for this date.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableSlots.map((hour) => {
                const isSelected = selectedHours.includes(hour);
                return (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => toggleHour(hour)}
                    className={cn(
                      "h-10 rounded-md border text-sm font-medium transition-colors",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground hover:border-primary"
                    )}
                  >
                    {formatHour(Number(hour))}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <Input
          type="number"
          min={0}
          label="Max price"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />

        <Textarea
          label="Requirements"
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
          rows={4}
        />

        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting} disabled={selectedHours.length === 0}>
            Send Request {selectedHours.length > 0 && `(${selectedHours.length} slot${selectedHours.length > 1 ? 's' : ''})`}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

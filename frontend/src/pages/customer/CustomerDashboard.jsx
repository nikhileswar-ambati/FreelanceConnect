import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { bookingApi, reviewApi } from "@/services/api";
import { StatusBadge } from "@/components/booking/StatusBadge";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { Input, Textarea } from "@/components/common/Input";
import { ReviewStars } from "@/components/freelancer/ReviewStars";
import { BookingTimeline } from "@/components/booking/BookingTimeline";
import { toast } from "@/components/common/Toast";
import { Calendar, Clock, Inbox, Loader2, Star } from "lucide-react";
import {
  formatDisplayDate,
  formatDisplayDateTime,
  formatDisplayTime,
  formatRequestedSlots,
} from "@/lib/dateTime";

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewing, setReviewing] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");

  const load = async () => {
    if (!user?.customer_id) {
      setBookings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await bookingApi.getByCustomer(user.customer_id);
      setBookings(response.data || []);
    } catch (e) {
      setError(e.message);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const handleCancel = async (booking) => {
    try {
      await bookingApi.cancel(booking.request_id);
      toast.success("Booking cancelled");
      load();
    } catch (e) {
      toast.error("Could not cancel", e.message);
    }
  };

  const statuses = [...new Set(bookings.map((booking) => booking.status).filter(Boolean))];
  const filteredBookings = statusFilter
    ? bookings.filter((booking) => booking.status === statusFilter)
    : bookings;

  return (
    <div className="bg-muted/30 min-h-[calc(100vh-4rem)]">
      <div className="container py-8 md:py-12">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Bookings</h1>
            <p className="text-muted-foreground mt-1">
              Requests and booking statuses returned by the backend.
            </p>
          </div>

          <Link to="/search">
            <Button variant="outline">Browse freelancers</Button>
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive-soft px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {statuses.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter("")}
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                statusFilter === ""
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >
              All ({bookings.length})
            </button>
            {statuses.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-lg border px-3 py-1.5 ${
                  statusFilter === status
                    ? "border-primary bg-primary-soft"
                    : "border-border bg-card"
                }`}
              >
                <StatusBadge status={status} />
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center">
            <Inbox className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold text-foreground">No bookings</h3>
            <p className="text-sm text-muted-foreground mt-1">
              No bookings match this status.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((booking) => (
              <BookingRow
                key={booking.request_id}
                booking={booking}
                onCancel={() => handleCancel(booking)}
                onReview={() => setReviewing(booking)}
                onUpdated={load}
              />
            ))}
          </div>
        )}
      </div>

      <ReviewModal
        booking={reviewing}
        onClose={() => setReviewing(null)}
        onSubmitted={() => {
          setReviewing(null);
          load();
        }}
      />
    </div>
  );
};

const BookingRow = ({ booking, onCancel, onReview, onUpdated }) => {
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const sendPrice = async () => {
    setSaving(true);
    try {
      await bookingApi.updateCustomerPrice(booking.request_id, {
        max_price: Number(price),
      });
      toast.success("Price request sent");
      setPrice("");
      onUpdated();
    } catch (e) {
      toast.error("Could not send price", e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-card">
      <div className="flex flex-wrap justify-between gap-4">
        <div className="flex-1 min-w-[240px]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary-soft text-primary flex items-center justify-center font-semibold">
              {booking.freelancer_name?.charAt(0)}
            </div>

            <div>
              <div className="font-semibold text-foreground">
                {booking.freelancer_name}
              </div>
              <div className="text-xs text-muted-foreground">
                {booking.freelancer_skill}
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDisplayDate(booking.booked_date || booking.requested_date)}
            </span>

            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatRequestedSlots(booking.requested_times)}
            </span>
            <span>Requested: {formatDisplayDateTime(booking.requested_at || booking.requested_on)}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <StatusBadge status={booking.status} />

          <div className="flex flex-wrap justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setDetailsOpen(true)}>
              View details
            </Button>
            {booking.status === "pending" && (
              <>
                <Input
                  type="number"
                  min={0}
                  placeholder="new max_price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-36"
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={saving || price === ""}
                  onClick={sendPrice}
                >
                  Send price
                </Button>
                <Button size="sm" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              </>
            )}

            {booking.status === "completed" && (
              <Button size="sm" onClick={onReview} disabled={!!booking.review_id}>
                <Star className="h-4 w-4" /> Review
              </Button>
            )}
          </div>
        </div>
      </div>

      <Modal open={detailsOpen} onClose={() => setDetailsOpen(false)} title="Booking details">
        <div className="space-y-5">
          <BookingTimeline booking={booking} />
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <Detail label="freelancer" value={booking.freelancer_name} />
            <Detail label="skill" value={booking.freelancer_skill} />
            <Detail label="status" value={booking.status} />
            <Detail label="booking_id" value={booking.booking_id} />
            <Detail label="max_price" value={booking.max_price} />
            <Detail label="freelancer_proposed_price" value={booking.freelancer_proposed_price} />
            <Detail label="final_price" value={booking.final_price} />
            <Detail label="primary_slot" value={formatDisplayTime(booking.booked_time || booking.requested_time)} />
          </div>
          <Detail label="requirements" value={booking.requirements} />
        </div>
      </Modal>
    </div>
  );
};

const Detail = ({ label, value }) => (
  <div className="rounded-lg border border-border bg-muted/30 p-3">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="mt-1 text-sm font-medium text-foreground break-words">
      {value || "-"}
    </div>
  </div>
);

const ReviewModal = ({ booking, onClose, onSubmitted }) => {
  const [rating, setRating] = useState("");
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (booking) {
      setRating("");
      setComments("");
    }
  }, [booking]);

  if (!booking) return null;

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        booking_id: booking.request_id,
        rating: Number(rating),
      };

      if (comments !== "") payload.comments = comments;

      await reviewApi.create(payload);
      toast.success("Review submitted");
      onSubmitted();
    } catch (e) {
      toast.error("Failed to submit", e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={!!booking} onClose={onClose} title="Leave a review">
      <form onSubmit={submit} className="space-y-5">
        <ReviewStars
          rating={rating}
          size={26}
          interactive
          onChange={setRating}
        />

        <Textarea
          placeholder="comments"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
        />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting} disabled={!rating}>
            Submit
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CustomerDashboard;

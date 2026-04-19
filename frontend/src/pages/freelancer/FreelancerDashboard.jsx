import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { bookingApi, freelancerApi, reviewApi } from "@/services/api";
import { StatusBadge } from "@/components/booking/StatusBadge";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Modal } from "@/components/common/Modal";
import { ReviewStars } from "@/components/freelancer/ReviewStars";
import { toast } from "@/components/common/Toast";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Inbox,
  Loader2,
  Sparkles,
  XCircle,
} from "lucide-react";

const FreelancerDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [reviewSort, setReviewSort] = useState("desc");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    if (!user?.freelancer_id) {
      setBookings([]);
      setReviews([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [profileResponse, bookingsResponse, reviewsResponse] = await Promise.all([
        freelancerApi.getProfile(user.freelancer_id),
        bookingApi.getAll(),
        reviewApi.getByFreelancer(user.freelancer_id),
      ]);

      setProfile(profileResponse.data || null);
      setBookings(
        (bookingsResponse.data || []).filter(
          (booking) => booking.freelancer_id === user.freelancer_id
        )
      );
      setReviews(reviewsResponse.data || []);
    } catch (e) {
      setError(e.message);
      setBookings([]);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const statuses = useMemo(
    () => [...new Set(bookings.map((booking) => booking.status).filter(Boolean))],
    [bookings]
  );

  const filteredBookings = statusFilter
    ? bookings.filter((booking) => booking.status === statusFilter)
    : bookings;

  const sortedReviews = [...reviews].sort((a, b) =>
    reviewSort === "asc"
      ? Number(a.rating) - Number(b.rating)
      : Number(b.rating) - Number(a.rating)
  );

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-muted/30 min-h-[calc(100vh-4rem)]">
      <div className="container py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Freelancer Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage booking requests and reviews from backend data.
          </p>
        </div>

        {profile && (
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <StatCard label="avg_rating" value={profile.avg_rating} />
            <StatCard
              label="total_reviews"
              value={profile.total_reviews}
              onClick={() => setReviewsOpen(true)}
            />
            <StatCard label="starting_price" value={profile.starting_price} />
          </div>
        )}

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

        {filteredBookings.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center">
            <Inbox className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold text-foreground">No Bookings</h3>
            <p className="text-sm text-muted-foreground mt-1">
              No bookings match this status.
            </p>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in">
            {filteredBookings.map((booking) => (
              <JobRow key={booking.request_id} booking={booking} onUpdated={load} />
            ))}
          </div>
        )}
      </div>

      <ReviewsModal
        open={reviewsOpen}
        onClose={() => setReviewsOpen(false)}
        reviews={sortedReviews}
        sort={reviewSort}
        onSortChange={setReviewSort}
      />
    </div>
  );
};

const StatCard = ({ label, value, onClick }) => {
  const content = (
    <>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="bg-card border border-border rounded-xl p-5 shadow-card text-left hover:shadow-elevated transition-shadow"
      >
        {content}
      </button>
    );
  }

  return <div className="bg-card border border-border rounded-xl p-5 shadow-card">{content}</div>;
};

const JobRow = ({ booking, onUpdated }) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [servicePrice, setServicePrice] = useState("");
  const [busy, setBusy] = useState(false);

  const acceptPrice =
    servicePrice ||
    booking.freelancer_proposed_price ||
    booking.max_price ||
    "";

  const run = async (action) => {
    setBusy(true);

    try {
      if (action === "send-price") {
        await bookingApi.updateFreelancerPrice(booking.request_id, {
          freelancer_proposed_price: Number(servicePrice),
        });
      }

      if (action === "accept") {
        await bookingApi.accept(booking.request_id, {
          final_price: Number(acceptPrice),
        });
      }

      if (action === "reject") await bookingApi.reject(booking.request_id);
      if (action === "complete") await bookingApi.complete(booking.request_id);

      toast.success("Booking updated");
      setDetailsOpen(false);
      onUpdated();
    } catch (e) {
      toast.error("Action failed", e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-card hover:shadow-elevated transition-shadow">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 min-w-[240px]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary-soft text-primary flex items-center justify-center font-semibold">
              {booking.customer_name?.charAt(0)}
            </div>
            <div>
              <div className="font-semibold text-foreground">
                {booking.customer_name}
              </div>
              <div className="text-xs text-muted-foreground">
                {booking.freelancer_skill}
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {booking.requested_date}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {booking.requested_time}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <StatusBadge status={booking.status} />

          <Button size="sm" variant="outline" onClick={() => setDetailsOpen(true)}>
            View request
          </Button>

          {booking.status === "accepted" && (
            <Button size="sm" disabled={busy} onClick={() => run("complete")}>
              <Sparkles className="h-4 w-4" /> Mark complete
            </Button>
          )}
        </div>
      </div>

      <Modal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title="Booking request"
      >
        <div className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <Detail label="customer_name" value={booking.customer_name} />
            <Detail label="customer_id" value={booking.customer_id} />
            <Detail label="requested_date" value={booking.requested_date} />
            <Detail label="requested_time" value={booking.requested_time} />
            <Detail label="status" value={booking.status} />
            <Detail label="max_price" value={booking.max_price} />
            <Detail
              label="freelancer_proposed_price"
              value={booking.freelancer_proposed_price}
            />
          </div>

          <Detail label="requirements" value={booking.requirements} />

          {booking.status === "pending" && (
            <div className="space-y-3 border-t border-border pt-4">
              <Input
                type="number"
                min={1}
                label="Service price"
                value={servicePrice}
                onChange={(e) => setServicePrice(e.target.value)}
              />

              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => run("reject")}
                >
                  <XCircle className="h-4 w-4" /> Reject
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  disabled={busy || servicePrice === ""}
                  onClick={() => run("send-price")}
                >
                  Send price
                </Button>

                <Button
                  type="button"
                  variant="success"
                  disabled={busy || acceptPrice === ""}
                  onClick={() => run("accept")}
                >
                  <CheckCircle2 className="h-4 w-4" /> Accept
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

const Detail = ({ label, value }) => (
  <div className="rounded-lg border border-border bg-muted/30 p-3">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="mt-1 text-sm font-medium text-foreground break-words">
      {value}
    </div>
  </div>
);

const ReviewsModal = ({ open, onClose, reviews, sort, onSortChange }) => (
  <Modal open={open} onClose={onClose} title="Reviews">
    <div className="space-y-4">
      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value)}
        className="h-9 rounded-md border border-input bg-card px-3 text-sm"
      >
        <option value="desc">Rating high to low</option>
        <option value="asc">Rating low to high</option>
      </select>

      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No reviews returned by the backend.
        </p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.review_id} className="rounded-lg border border-border p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium text-foreground">
                  {review.reviewer_name}
                </div>
                <ReviewStars rating={review.rating} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{review.comments}</p>
              <p className="mt-2 text-xs text-muted-foreground">{review.review_date}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  </Modal>
);

export default FreelancerDashboard;

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Loader2,
  Mail,
  Phone,
} from "lucide-react";
import { freelancerApi, reviewApi } from "@/services/api";
import { ReviewStars } from "@/components/freelancer/ReviewStars";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { BookingModal } from "@/components/booking/BookingModal";
import { formatDisplayDateTime } from "@/lib/dateTime";

const FreelancerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [average, setAverage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewSort, setReviewSort] = useState("desc");
  const [bookOpen, setBookOpen] = useState(false);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError(null);

    Promise.all([
      freelancerApi.getProfile(id),
      reviewApi.getByFreelancer(id),
      reviewApi.getAverage(id),
    ])
      .then(([profileResponse, reviewsResponse, averageResponse]) => {
        setProfile(profileResponse.data || null);
        setReviews(reviewsResponse.data || []);
        setAverage(averageResponse);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="container py-20 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">{error}</p>
        <Button className="mt-4" onClick={() => navigate("/search")}>
          Back to search
        </Button>
      </div>
    );
  }

  const sortedReviews = [...reviews].sort((a, b) =>
    reviewSort === "asc"
      ? Number(a.rating) - Number(b.rating)
      : Number(b.rating) - Number(a.rating)
  );

  return (
    <div className="bg-muted/30 min-h-[calc(100vh-4rem)]">
      <div className="container py-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-card">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="h-24 w-24 rounded-2xl bg-primary-soft border border-border" />

                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    {profile.name}
                  </h1>
                  <p className="text-primary font-medium mt-1">
                    {profile.skill_name}
                  </p>

                  <div className="mt-2">
                    <ReviewStars
                      rating={average?.avg_rating ?? profile.avg_rating}
                      size={18}
                      showValue
                      count={average?.total_reviews ?? profile.total_reviews}
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge variant="primary">
                      <Briefcase className="h-3 w-3" /> {profile.experience_yrs} yrs experience
                    </Badge>
                    <Badge variant="success">INR {profile.starting_price}/hr</Badge>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h2 className="font-semibold text-foreground mb-2">About</h2>
                {profile.bio ? (
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {profile.bio}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">No bio available.</p>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-card">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-semibold text-foreground">
                  Reviews ({reviews.length})
                </h2>
                <select
                  value={reviewSort}
                  onChange={(e) => setReviewSort(e.target.value)}
                  className="h-9 rounded-md border border-input bg-card px-3 text-sm"
                >
                  <option value="desc">Rating high to low</option>
                  <option value="asc">Rating low to high</option>
                </select>
              </div>

              {reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No reviews returned by the backend.
                </p>
              ) : (
                <div className="space-y-5">
                  {sortedReviews.map((review) => (
                    <div
                      key={review.review_id}
                      className="border-b border-border last:border-0 pb-5 last:pb-0"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-foreground">
                          {review.reviewer_name}
                        </div>
                        <ReviewStars rating={review.rating} />
                      </div>

                      <p className="text-sm text-muted-foreground mt-1">
                        {review.comments}
                      </p>

                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDisplayDateTime(review.review_date)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-card sticky top-20">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold text-foreground">
                  INR {profile.starting_price}
                </span>
                <span className="text-sm text-muted-foreground">/hour</span>
              </div>

              <Button
                fullWidth
                size="lg"
                className="mt-5"
                onClick={() => setBookOpen(true)}
              >
                <Calendar className="h-4 w-4" /> Book Now
              </Button>

              <div className="mt-6 space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" /> {profile.email}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" /> {profile.phone}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <BookingModal
        open={bookOpen}
        onClose={() => setBookOpen(false)}
        freelancer={profile}
      />
    </div>
  );
};

export default FreelancerDetails;

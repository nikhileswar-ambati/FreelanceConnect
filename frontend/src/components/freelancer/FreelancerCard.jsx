import { Link } from "react-router-dom";
import { Briefcase, MapPin } from "lucide-react";
import { ReviewStars } from "./ReviewStars";
import { Button } from "@/components/common/Button";

export const FreelancerCard = ({ freelancer }) => (
  <article className="group bg-card border border-border rounded-xl p-5 shadow-card hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200">
    <div className="flex items-start gap-4">
      <div className="h-14 w-14 rounded-full bg-primary-soft border border-border" />

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground truncate">
          {freelancer.name}
        </h3>
        <p className="text-sm text-primary font-medium">
          {freelancer.skill_name}
        </p>
        <div className="mt-1.5">
          <ReviewStars
            rating={freelancer.avg_rating}
            showValue
            count={freelancer.total_reviews}
          />
        </div>
      </div>
    </div>

    <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1">
        <Briefcase className="h-3.5 w-3.5" /> {freelancer.experience_yrs} yrs exp
      </span>
      <span className="inline-flex items-center gap-1">
        <MapPin className="h-3.5 w-3.5" /> {freelancer.city}
        {freelancer.locality_name ? `, ${freelancer.locality_name}` : ""}
      </span>
    </div>

    <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
      <div>
        <span className="text-lg font-bold text-foreground">
          INR {freelancer.starting_price}
        </span>
        <span className="text-xs text-muted-foreground">/hr</span>
      </div>

      <Link to={`/freelancer/${freelancer.freelancer_id}`}>
        <Button size="sm">View Profile</Button>
      </Link>
    </div>
  </article>
);

export const FreelancerCardSkeleton = () => (
  <div className="bg-card border border-border rounded-xl p-5">
    <div className="flex gap-4">
      <div className="skeleton h-14 w-14 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-1/2" />
        <div className="skeleton h-3 w-1/3" />
        <div className="skeleton h-3 w-1/4" />
      </div>
    </div>
    <div className="skeleton h-3 w-full mt-4" />
    <div className="skeleton h-3 w-4/5 mt-2" />
    <div className="mt-5 flex justify-between">
      <div className="skeleton h-6 w-16" />
      <div className="skeleton h-9 w-28 rounded-lg" />
    </div>
  </div>
);

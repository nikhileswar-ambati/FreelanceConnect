import { Briefcase } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => (
  <footer className="border-t border-border bg-card mt-auto">
    <div className="container py-10 flex flex-col items-center text-center">
      <Link
        to="/"
        className="flex items-center gap-2 font-bold text-lg text-foreground"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-hero text-primary-foreground">
          <Briefcase className="h-5 w-5" />
        </span>
        Freelance<span className="text-primary">Connect</span>
      </Link>

      <p className="mt-3 text-sm text-muted-foreground max-w-md">
        Discover trusted local freelancers, book in seconds, and get the job done — all from one place.
      </p>
    </div>

    <div className="border-t border-border">
      <div className="container py-4 text-xs text-muted-foreground text-center">
        © {new Date().getFullYear()} Freelance Connect. All rights reserved.
      </div>
    </div>
  </footer>
);
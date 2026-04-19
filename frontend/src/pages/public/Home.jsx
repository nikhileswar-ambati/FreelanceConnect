import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
//import Image from "./image2.avif";
import {
  ArrowRight,
  Briefcase,
  Clock4,
  Search,
  ShieldCheck,
  Star,
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { optionsApi } from "@/services/api";

const features = [
  {
    Icon: ShieldCheck,
    title: "Verified profiles",
    desc: "Profiles, bookings, and reviews are loaded from the backend.",
  },
  {
    Icon: Clock4,
    title: "Booking requests",
    desc: "Customers send dates, times, requirements, and requested prices.",
  },
  {
    Icon: Star,
    title: "Backend ratings",
    desc: "Ratings and review counts come from stored review records.",
  },
];

const Home = () => {
  const [skills, setSkills] = useState([]);

  useEffect(() => {
    optionsApi
      .skills()
      .then((response) => setSkills(response.data || []))
      .catch(() => setSkills([]));
  }, []);

  return (
    <div>
      <section
  className="relative overflow-hidden bg-gradient-soft"
  // style={{
  //   backgroundImage: `url(${Image})`,
  //   backgroundSize: "cover",
  //   backgroundPosition: "center",
  // }}
>
        <div className="container py-20 md:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-primary shadow-sm">
              <span className="h-2 w-2 rounded-full bg-success" />
              Live marketplace data
            </span>

            <h1 className="mt-5 text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-tight">
              Find local <span className="text-primary">freelancers</span>
              <br />
              you can trust.
            </h1>

            <p className="mt-5 text-lg text-muted-foreground max-w-xl">
              Discover professionals, send booking requests, negotiate prices,
              and review completed work using live backend records.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/signup">
                <Button size="lg">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline">
                  I have an account
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative bg-card border border-border rounded-2xl shadow-elevated p-6 animate-scale-in">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
              <Search className="h-4 w-4" />
              Available skills
            </div>

            {skills.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No skills returned by the backend.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {skills.map((skill) => (
                  <div
                    key={skill.skill_id}
                    className="flex items-center gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="h-10 w-10 rounded-full bg-primary-soft text-primary flex items-center justify-center">
                      <Briefcase className="h-4 w-4" />
                    </div>
                    <div className="font-medium text-foreground text-sm">
                      {skill.skill_name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Why choose Freelance Connect
            </h2>
            <p className="mt-3 text-muted-foreground">
              A marketplace built around authenticated backend workflows.
            </p>
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {features.map(({ Icon, title, desc }) => (
              <div
                key={title}
                className="bg-card border border-border rounded-xl p-6 shadow-card hover:shadow-elevated transition-shadow"
              >
                <div className="h-11 w-11 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground text-lg">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <div className="bg-gradient-hero rounded-2xl px-8 md:px-12 py-12 md:py-16 text-center text-primary-foreground shadow-elevated">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to get started?
            </h2>
            <p className="mt-3 text-primary-foreground/90 max-w-xl mx-auto">
              Create an account, sign in, and use the marketplace with live API
              data.
            </p>

            <div className="mt-7 flex flex-wrap gap-3 justify-center">
              <Link to="/signup">
                <Button size="lg" variant="secondary">
                  Create account
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

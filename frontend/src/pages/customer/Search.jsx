import { useEffect, useState } from "react";
import { Search as SearchIcon, SlidersHorizontal } from "lucide-react";
import { freelancerApi, optionsApi } from "@/services/api";
import { Input } from "@/components/common/Input";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import { Button } from "@/components/common/Button";
import {
  FreelancerCard,
  FreelancerCardSkeleton,
} from "@/components/freelancer/FreelancerCard";

const Search = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locations, setLocations] = useState([]);
  const [skills, setSkills] = useState([]);
  const [filters, setFilters] = useState({
    location_id: "",
    skill_id: "",
    min_experience: "",
  });

  const fetchData = async (params = filters) => {
    setLoading(true);
    setError(null);

    try {
      const response = await freelancerApi.search(params);
      setResults(response.data || []);
    } catch (e) {
      setError(e.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData({});
    Promise.all([optionsApi.locations(), optionsApi.skills()])
      .then(([locationResponse, skillResponse]) => {
        setLocations(locationResponse.data || []);
        setSkills(skillResponse.data || []);
      })
      .catch((e) => setError(e.message));
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  return (
    <div className="bg-muted/30 min-h-[calc(100vh-4rem)]">
      <div className="container py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Find your freelancer
          </h1>
          <p className="text-muted-foreground mt-1">
            Browse backend results by location, skill, and experience.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-card border border-border rounded-xl p-4 md:p-5 shadow-card grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]"
        >
          <SearchableSelect
            placeholder="Type location"
            value={filters.location_id}
            onChange={(location_id) => setFilters({ ...filters, location_id })}
            options={locations}
            getValue={(location) => location.location_id}
            getLabel={(location) =>
              `${location.city}${location.locality_name ? `, ${location.locality_name}` : ""}`
            }
          />

          <SearchableSelect
            placeholder="Type skill"
            value={filters.skill_id}
            onChange={(skill_id) => setFilters({ ...filters, skill_id })}
            options={skills}
            getValue={(skill) => skill.skill_id}
            getLabel={(skill) => skill.skill_name}
          />

          <Input
            type="number"
            min={0}
            placeholder="min_experience"
            value={filters.min_experience}
            onChange={(e) =>
              setFilters({ ...filters, min_experience: e.target.value })
            }
          />

          <Button type="submit">
            <SlidersHorizontal className="h-4 w-4" /> Apply
          </Button>
        </form>

        <div className="mt-6 mb-3 text-sm text-muted-foreground">
          {loading
            ? "Searching..."
            : `${results.length} freelancer${results.length === 1 ? "" : "s"} found`}
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive-soft px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <FreelancerCardSkeleton key={i} />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center">
            <SearchIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold text-foreground">
              No freelancers found
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              The backend returned no rows for this request.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in">
            {results.map((freelancer) => (
              <FreelancerCard
                key={freelancer.freelancer_id}
                freelancer={freelancer}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;

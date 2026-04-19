import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { freelancerApi } from "@/services/api";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { toast } from "@/components/common/Toast";
import { Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";

const today = () => new Date().toISOString().slice(0, 10);

const formatHour = (hour) => {
  const start = String(hour).padStart(2, "0");
  const end = String((hour + 1) % 24).padStart(2, "0");
  return `${start}:00-${end}:00`;
};

const Availability = () => {
  const { user } = useAuth();
  const [date, setDate] = useState(today());
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Check if user has a freelancer profile
  if (!user?.freelancer_id) {
    return (
      <div className="bg-muted/30 min-h-[calc(100vh-4rem)]">
        <div className="container py-8 md:py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Availability</h1>
            <p className="text-muted-foreground mt-1">
              Select the hours customers can book for a date.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 shadow-card text-center">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Create Your Freelancer Profile First
            </h2>
            <p className="text-muted-foreground mb-6">
              You need to create a freelancer profile before you can set your availability.
            </p>
            <Button asChild>
              <Link to="/freelancer/profile">Create Profile</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (!user?.freelancer_id || !date) return;

    setLoading(true);
    setError(null);
    freelancerApi
      .getAvailability(user.freelancer_id, { date })
      .then((response) => setSelected(response.available_slots || []))
      .catch((e) => {
        setSelected([]);
        setError(e.message);
      })
      .finally(() => setLoading(false));
  }, [user?.freelancer_id, date]);

  const toggle = (hour) => {
    setSelected((current) =>
      current.includes(hour)
        ? current.filter((item) => item !== hour)
        : [...current, hour].sort((a, b) => a - b)
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // Double-check freelancer_id exists
    if (!user?.freelancer_id) {
      setError("Freelancer profile not found. Please create your profile first.");
      setSaving(false);
      return;
    }

    try {
      await freelancerApi.setAvailability({
        date,
        available_slots: selected,
      });
      toast.success("Availability saved");
    } catch (e) {
      setError(e.message);
      toast.error("Save failed", e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-muted/30 min-h-[calc(100vh-4rem)]">
      <div className="container py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Availability</h1>
          <p className="text-muted-foreground mt-1">
            Select the hours customers can book for a date.
          </p>
        </div>

        <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-6 shadow-card">
          <div className="max-w-xs">
            <Input
              type="date"
              label="Date"
              min={today()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive-soft px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {Array.from({ length: 24 }, (_, hour) => {
                const checked = selected.includes(hour);
                return (
                  <label
                    key={hour}
                    className={cn(
                      "flex h-12 cursor-pointer items-center justify-center rounded-lg border text-sm font-medium transition-colors",
                      checked
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(hour)}
                      className="sr-only"
                    />
                    {formatHour(hour)}
                  </label>
                );
              })}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <Button type="submit" loading={saving}>
              <Save className="h-4 w-4" /> Save availability
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Availability;

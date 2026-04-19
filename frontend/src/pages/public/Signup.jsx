import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Phone, UserPlus } from "lucide-react";
import { Input } from "@/components/common/Input";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import { Button } from "@/components/common/Button";
import { useAuth } from "@/context/AuthContext";
import { optionsApi } from "@/services/api";
import { toast } from "@/components/common/Toast";
import { cn } from "@/lib/utils";

const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState("customer");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    location_id: "",
  });

  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [locations, setLocations] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    optionsApi
      .locations()
      .then((response) => setLocations(response.data || []))
      .catch((err) => setError(err.message))
      .finally(() => setOptionsLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signup({
        ...form,
        role,
        location_id: Number(form.location_id),
      });

      toast.success("Account created", "Sign in with your new credentials.");
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gradient-soft">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl shadow-elevated p-8 animate-fade-in">
          <div className="text-center mb-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary mb-3">
              <UserPlus className="h-6 w-6" />
            </div>

            <h1 className="text-2xl font-bold text-foreground">
              Create your account
            </h1>

            <p className="text-sm text-muted-foreground mt-1">
              Join the Freelance Connect community
            </p>
          </div>

          {/* Role Switch */}
          <div className="grid grid-cols-2 gap-2 mb-5 p-1 bg-muted rounded-lg">
            {["customer", "freelancer"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={cn(
                  "py-2 text-sm font-medium rounded-md transition-all capitalize",
                  role === r
                    ? "bg-card text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                I'm a {r}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full name"
              required
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              icon={<User className="h-4 w-4" />}
            />

            <Input
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              icon={<Mail className="h-4 w-4" />}
              placeholder="you@example.com"
            />

            <Input
              label="Phone"
              required
              value={form.phone}
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value })
              }
              icon={<Phone className="h-4 w-4" />}
              placeholder="+91 90000 00000"
            />

            <SearchableSelect
              label="Location"
              required
              value={form.location_id}
              onChange={(location_id) =>
                setForm({
                  ...form,
                  location_id,
                })
              }
              disabled={optionsLoading}
              options={locations}
              getValue={(location) => location.location_id}
              getLabel={(location) =>
                `${location.city}${location.locality_name ? `, ${location.locality_name}` : ""}`
              }
            />

            <Input
              label="Password"
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              icon={<Lock className="h-4 w-4" />}
              placeholder="At least 6 characters"
              error={error || undefined}
            />

            <Button type="submit" fullWidth loading={loading}>
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;

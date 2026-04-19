import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn } from "lucide-react";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/common/Toast";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success("Signed in");
      navigate(
        user.role === "customer" ? "/search" : "/dashboard",
        { replace: true }
      );
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
              <LogIn className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in to continue to Freelance Connect
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="h-4 w-4" />}
              placeholder="you@example.com"
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="h-4 w-4" />}
              placeholder="••••••••"
              error={error || undefined}
            />

            <Button type="submit" fullWidth loading={loading}>
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link
              to="/signup"
              className="font-medium text-primary hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

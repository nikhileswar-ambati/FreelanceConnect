import { Link, NavLink, useNavigate } from "react-router-dom";
import { Briefcase, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/common/Button";
import { cn } from "@/lib/utils";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const linkClass = ({ isActive }) =>
    cn(
      "px-3 py-2 text-sm font-medium rounded-md transition-colors",
      isActive
        ? "text-primary bg-primary-soft"
        : "text-muted-foreground hover:text-foreground hover:bg-muted"
    );

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-foreground">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-hero text-primary-foreground">
            <Briefcase className="h-5 w-5" />
          </span>
          Freelance<span className="text-primary">Connect</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {!user && (
            <>
              <NavLink to="/" end className={linkClass}>Home</NavLink>
              <NavLink to="/login" className={linkClass}>Login</NavLink>
              <Button size="sm" onClick={() => navigate("/signup")}>
                Get Started
              </Button>
            </>
          )}

          {user?.role === "customer" && (
            <>
              <NavLink to="/search" className={linkClass}>Find Talent</NavLink>
              <NavLink to="/customer/dashboard" className={linkClass}>My Bookings</NavLink>
              <UserMenu name={user.name} onLogout={handleLogout} />
            </>
          )}

          {user?.role === "freelancer" && (
            <>
              <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
              <NavLink to="/freelancer/profile" className={linkClass}>My Profile</NavLink>
              <NavLink to="/freelancer/availability" className={linkClass}>Availability</NavLink>
              <UserMenu name={user.name} onLogout={handleLogout} />
            </>
          )}
        </nav>

        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-card animate-fade-in">
          <div className="container py-3 flex flex-col gap-1">
            {!user && (
              <>
                <MobileLink to="/" onClick={() => setOpen(false)}>Home</MobileLink>
                <MobileLink to="/login" onClick={() => setOpen(false)}>Login</MobileLink>
                <MobileLink to="/signup" onClick={() => setOpen(false)}>Sign up</MobileLink>
              </>
            )}

            {user?.role === "customer" && (
              <>
                <MobileLink to="/search" onClick={() => setOpen(false)}>Find Talent</MobileLink>
                <MobileLink to="/customer/dashboard" onClick={() => setOpen(false)}>My Bookings</MobileLink>
              </>
            )}

            {user?.role === "freelancer" && (
              <>
                <MobileLink to="/dashboard" onClick={() => setOpen(false)}>Dashboard</MobileLink>
                <MobileLink to="/freelancer/profile" onClick={() => setOpen(false)}>My Profile</MobileLink>
                <MobileLink to="/freelancer/availability" onClick={() => setOpen(false)}>Availability</MobileLink>
              </>
            )}

            {user && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-destructive rounded-md hover:bg-destructive-soft"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

const MobileLink = ({ to, children, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      cn(
        "px-3 py-2 text-sm font-medium rounded-md",
        isActive ? "bg-primary-soft text-primary" : "text-foreground hover:bg-muted"
      )
    }
  >
    {children}
  </NavLink>
);

const UserMenu = ({ name, onLogout }) => (
  <div className="flex items-center gap-3 ml-3 pl-3 border-l border-border">
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 rounded-full bg-primary-soft text-primary flex items-center justify-center text-sm font-semibold">
        {name?.charAt(0)}
      </div>
      <span className="text-sm font-medium text-foreground">
        {name}
      </span>
    </div>

    <button
      onClick={onLogout}
      className="p-2 text-muted-foreground hover:text-destructive transition-colors"
      aria-label="Logout"
    >
      <LogOut className="h-4 w-4" />
    </button>
  </div>
);

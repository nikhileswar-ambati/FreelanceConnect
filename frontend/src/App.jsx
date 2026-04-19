import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

import Home from "./pages/public/Home";
import Login from "./pages/public/Login";
import Signup from "./pages/public/Signup";

import Search from "./pages/customer/Search";
import FreelancerDetails from "./pages/customer/FreelancerDetails";
import CustomerDashboard from "./pages/customer/CustomerDashboard";

import FreelancerDashboard from "./pages/freelancer/FreelancerDashboard";
import ProfileEdit from "./pages/freelancer/ProfileEdit";
import Availability from "./pages/freelancer/Availability";

import NotFound from "./pages/NotFound.jsx";

const queryClient = new QueryClient();

// Redirect signed-in users away from public landing/login/signup
const PublicOnly = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={user.role === "customer" ? "/search" : "/dashboard"} replace />;
  return <>{children}</>;
};

const Shell = () => (
  <div className="flex min-h-screen flex-col">
    <Navbar />
    <main className="flex-1">
      <Routes>
        <Route path="/" element={<PublicOnly><Home /></PublicOnly>} />
        <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/signup" element={<PublicOnly><Signup /></PublicOnly>} />

        {/* Customer */}
        <Route path="/search" element={<ProtectedRoute role="customer"><Search /></ProtectedRoute>} />
        <Route path="/freelancer/:id" element={<ProtectedRoute role="customer"><FreelancerDetails /></ProtectedRoute>} />
        <Route path="/customer/dashboard" element={<ProtectedRoute role="customer"><CustomerDashboard /></ProtectedRoute>} />

        {/* Freelancer */}
        <Route path="/dashboard" element={<ProtectedRoute role="freelancer"><FreelancerDashboard /></ProtectedRoute>} />
        <Route path="/freelancer/profile" element={<ProtectedRoute role="freelancer"><ProfileEdit /></ProtectedRoute>} />
        <Route path="/freelancer/availability" element={<ProtectedRoute role="freelancer"><Availability /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
    <Footer />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner position="top-right" richColors />
      <AuthProvider>
        <BrowserRouter>
          <Shell />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

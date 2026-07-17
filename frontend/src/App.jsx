import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { GlassSidebar } from "./components/GlassSidebar";
import { GlassNavbar } from "./components/GlassNavbar";
import { Login } from "./views/Login";
import { Register } from "./views/Register";
import { Dashboard } from "./views/Dashboard";
import { AdminPortal } from "./views/AdminPortal";
import { SearchHub } from "./views/SearchHub";
import { Settings } from "./views/Settings";
import { Loader } from "lucide-react";

// Route protection wrapper for authenticated pages
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-[#F7F8FF]">
        <Loader className="h-8 w-8 text-purple-650 animate-spin" />
        <span className="text-sm font-semibold text-gray-500">Restoring auth session...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Route wrapper to redirect users who are already logged in
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen relative bg-[#F7F8FF] text-gray-800 select-none overflow-x-hidden pb-12">
      {/* Background Ambient Blurs */}
      <div className="ambient-bg">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-purple-200/40 to-pink-200/40 blur-[120px] opacity-70"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-indigo-200/30 to-yellow-100/40 blur-[130px] opacity-60"></div>
        <div className="absolute top-[30%] right-[20%] w-[35%] h-[35%] rounded-full bg-gradient-to-tr from-purple-100/30 to-pink-50/40 blur-[100px] opacity-40"></div>
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar (only shown when logged in) */}
        {user && <GlassSidebar />}

        {/* Content Panel */}
        <div className={`flex-1 flex flex-col min-w-0 ${user ? "lg:pl-72 pt-0" : ""}`}>
          {/* Topbar (only shown when logged in) */}
          {user && <GlassNavbar />}
          
          {/* Page Routing content */}
          <div className="flex-1">
            <Routes>
              {/* Public auth pages */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                }
              />

              {/* Protected Dashboard/Checklist */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* Protected Search Hub */}
              <Route
                path="/search"
                element={
                  <ProtectedRoute>
                    <SearchHub />
                  </ProtectedRoute>
                }
              />

              {/* Protected Admin Portal */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminPortal />
                  </ProtectedRoute>
                }
              />

              {/* Protected Settings page */}
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

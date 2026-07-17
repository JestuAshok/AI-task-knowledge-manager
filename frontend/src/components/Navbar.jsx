import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CheckSquare, Search, ShieldAlert, LogOut, LayoutDashboard } from "lucide-react";

export const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const linkClass = (path) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive(path)
        ? "bg-brand-500/20 text-brand-300 border border-brand-500/30"
        : "text-dark-300 hover:text-white hover:bg-dark-800/40"
    }`;

  return (
    <nav className="glass-panel sticky top-0 z-50 px-6 py-4 border-b border-white/5 mb-8">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <CheckSquare className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-white to-dark-300 bg-clip-text text-transparent">
            AetherFlow IQ
          </span>
        </Link>

        {/* Center Nav Navigation links */}
        <div className="flex gap-2">
          <Link to="/" className={linkClass("/")}>
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link to="/search" className={linkClass("/search")}>
            <Search className="h-4 w-4" />
            Search Hub
          </Link>
          {isAdmin && (
            <Link to="/admin" className={linkClass("/admin")}>
              <ShieldAlert className="h-4 w-4" />
              Admin Portal
            </Link>
          )}
        </div>

        {/* User profile actions */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col text-right">
            <span className="text-sm font-semibold text-white">{user.username}</span>
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full mt-0.5 border ${
              isAdmin 
                ? "bg-red-500/10 text-red-400 border-red-500/20" 
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            }`}>
              {user.role_name}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="p-2.5 rounded-lg text-dark-300 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </nav>
  );
};

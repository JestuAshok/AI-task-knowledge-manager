import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  LayoutDashboard, Search, FileText, CheckSquare, 
  BarChart3, History, Settings, LogOut, CheckSquare as LogoIcon 
} from "lucide-react";

export const GlassSidebar = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const isActive = (path) => {
    if (path === "/" && location.pathname !== "/") return false;
    const [pathName, pathSearch] = path.split("?");
    if (location.pathname !== pathName) return false;
    if (pathSearch) {
      const searchParams = new URLSearchParams(location.search);
      const targetParams = new URLSearchParams(pathSearch);
      for (const [key, value] of targetParams.entries()) {
        if (searchParams.get(key) !== value) return false;
      }
    }
    return true;
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "AI Search", path: "/search", icon: Search },
    // If admin, Documents and Tasks point to Admin Portal. For normal user, they point to Dashboard
    { name: "Documents", path: isAdmin ? "/admin?tab=documents" : "/?section=documents", icon: FileText },
    { name: "Tasks", path: isAdmin ? "/admin?tab=tasks" : "/?section=tasks", icon: CheckSquare },
  ];

  // Admin-only menu items
  const adminMenuItems = [
    { name: "Analytics", path: "/admin?tab=analytics", icon: BarChart3 },
    { name: "Activity Logs", path: "/admin?tab=logs", icon: History },
  ];

  const sidebarClass = "glass-panel fixed top-6 left-6 bottom-6 w-64 rounded-[32px] p-6 border border-white/45 flex flex-col justify-between z-40 hidden lg:flex";

  const linkStyle = (path) => {
    const active = isActive(path);
    return `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 ${
      active 
        ? "bg-gradient-to-r from-purple-500/15 to-indigo-500/10 text-purple-750 border-l-4 border-purple-600 shadow-sm pl-3.5"
        : "text-gray-650 hover:text-gray-900 hover:bg-white/50 hover:pl-5"
    }`;
  };

  return (
    <aside className={sidebarClass}>
      <div className="space-y-8 flex-1 flex flex-col min-h-0">
        {/* App Logo */}
        <Link to="/" className="flex items-center gap-3 px-2">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-md shadow-purple-500/20">
            <LogoIcon className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm text-gray-900 tracking-tight leading-none">AetherFlow IQ</span>
            <span className="text-[10px] text-gray-500 font-bold tracking-widest mt-1">SYSTEM MVP</span>
          </div>
        </Link>

        {/* Navigation Section */}
        <nav className="space-y-1.5 overflow-y-auto pr-1 flex-1 min-h-0">
          <div className="text-[10px] uppercase font-extrabold text-gray-500 tracking-widest px-4 mb-2">Main</div>
          {menuItems.map((item) => (
            <Link key={item.name} to={item.path} className={linkStyle(item.path)}>
              <item.icon className="h-4.5 w-4.5 shrink-0" />
              {item.name}
            </Link>
          ))}

          {/* Admin specific features */}
          {isAdmin && (
            <div className="pt-6 space-y-1.5">
              <div className="text-[10px] uppercase font-extrabold text-gray-500 tracking-widest px-4 mb-2">Management</div>
              {adminMenuItems.map((item) => (
                <Link key={item.name} to={item.path} className={linkStyle(item.path)}>
                  <item.icon className="h-4.5 w-4.5 shrink-0" />
                  {item.name}
                </Link>
              ))}
            </div>
          )}

          {/* Settings stub */}
          <div className="pt-6 space-y-1.5">
            <div className="text-[10px] uppercase font-extrabold text-gray-500 tracking-widest px-4 mb-2">Preferences</div>
            <Link to="/settings" className={linkStyle("/settings")}>
              <Settings className="h-4.5 w-4.5 shrink-0" />
              Settings
            </Link>
          </div>
        </nav>
      </div>

      {/* Footer / User Profile section */}
      <div className="pt-4 border-t border-white/30 flex flex-col gap-4">
        <div className="flex items-center gap-3 px-2">
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-purple-100 to-indigo-100 text-purple-650 flex items-center justify-center font-extrabold text-xs border border-white">
            {user.username.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-gray-800 truncate">{user.username}</span>
            <span className="text-[9px] uppercase font-extrabold tracking-wider text-purple-600 mt-0.5">
              {user.role_name}
            </span>
          </div>
        </div>


        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-red-500/5 hover:bg-red-500/10 text-red-650 text-xs font-bold border border-red-500/10 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import { Search, Bell, Menu, X, LogOut, ShieldAlert } from "lucide-react";

export const GlassNavbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [quickQuery, setQuickQuery] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      if (!user) return;
      const res = await API.get("/notifications");
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      const res = await API.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? res.data : n));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await API.patch("/notifications/read-all");
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll notifications every 10 seconds
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!user) return null;

  const handleQuickSearch = (e) => {
    e.preventDefault();
    if (quickQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(quickQuery.trim())}`);
      setQuickQuery("");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="glass-panel sticky top-6 z-30 px-6 py-3.5 rounded-3xl border border-white/45 flex justify-between items-center shadow-sm mx-6 mb-6">
      {/* Search Input bar */}
      <form onSubmit={handleQuickSearch} className="flex-1 max-w-sm relative">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
          <Search className="h-4 w-4" />
        </span>
        <input
          type="text"
          value={quickQuery}
          onChange={(e) => setQuickQuery(e.target.value)}
          className="glass-input w-full pl-10 pr-4 py-2 text-xs"
          placeholder="Ask AI (e.g. printer code, VPN address)..."
        />
      </form>

      {/* Profile & Notifications actions */}
      <div className="flex items-center gap-4">
        {/* Notifications Icon with active badge */}
        <div className="relative">
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
              fetchNotifications();
            }}
            className={`p-2 rounded-xl relative transition-all ${
              showNotifications 
                ? "bg-purple-500/10 text-purple-700" 
                : "text-gray-655 hover:text-gray-950 hover:bg-white/50"
            }`}
            title="Notifications"
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-purple-600 ring-2 ring-white"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowNotifications(false)}
              ></div>
              <div className="glass-panel absolute right-0 mt-3 w-80 rounded-2xl border border-white/50 shadow-lg p-3.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-2 py-1.5 border-b border-gray-100 mb-2 flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-800">Notifications</span>
                  <div className="flex gap-2 items-center">
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllAsRead}
                        className="text-[9px] font-extrabold text-purple-650 hover:text-purple-800 transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                    <span className="text-[9px] bg-purple-500/10 text-purple-650 px-2 py-0.5 rounded-full font-bold">
                      {unreadCount} Unread
                    </span>
                  </div>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-gray-555 font-semibold">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div 
                        key={notif.id} 
                        onClick={async () => {
                          if (!notif.is_read) {
                            await handleMarkAsRead(notif.id);
                          }
                          setShowNotifications(false);
                          if (notif.title.includes("Task")) {
                            navigate(isAdmin ? "/admin?tab=tasks" : "/?view=tasks");
                          } else if (notif.title.includes("Asset")) {
                            navigate(isAdmin ? "/admin?tab=documents" : "/?view=documents");
                          }
                        }}
                        className={`p-2.5 rounded-xl transition-all cursor-pointer text-left border relative ${
                          notif.is_read 
                            ? "bg-white/20 border-white/30 text-gray-500" 
                            : "bg-purple-500/5 border-purple-500/10 hover:bg-purple-500/10 text-gray-850"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-xs font-bold leading-snug">
                            {notif.title}
                          </p>
                          <span className="text-[8px] text-gray-500 font-bold shrink-0">
                            {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[10px] leading-relaxed mt-1 text-gray-700">
                          {notif.message}
                        </p>
                        {!notif.is_read && (
                          <span className="absolute top-3.5 right-2 h-1.5 w-1.5 rounded-full bg-purple-650"></span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User profile dropdown trigger */}
        <div className="relative">
          <button 
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 p-1 pr-3 rounded-full hover:bg-white/50 transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 text-white flex items-center justify-center font-extrabold text-xs shadow-sm">
              {user.username.substring(0, 2).toUpperCase()}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-gray-900 leading-none">{user.username}</span>
              <span className="text-[9px] font-bold text-gray-500 mt-1 uppercase tracking-wide">
                {user.role_name}
              </span>
            </div>
          </button>

          {showProfileMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowProfileMenu(false)}
              ></div>
              <div className="glass-panel absolute right-0 mt-3 w-52 rounded-2xl border border-white/50 shadow-lg p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-3 py-2 border-b border-gray-100 mb-1.5">
                  <p className="text-xs font-semibold text-gray-400">Signed in as</p>
                  <p className="text-xs font-bold text-gray-800 truncate mt-0.5">{user.username}</p>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate("/admin");
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-655 hover:text-purple-750 hover:bg-purple-50/50 rounded-xl transition-colors text-left"
                  >
                    <ShieldAlert className="h-4 w-4" />
                    Admin Operations
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50/50 rounded-xl transition-colors text-left"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

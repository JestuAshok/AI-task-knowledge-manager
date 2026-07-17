import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { GlassCard } from "../components/GlassCard";
import { GlassButton } from "../components/GlassButton";
import { GlassInput } from "../components/GlassInput";
import { 
  Settings as SettingsIcon, User, Cpu, Database, 
  Bell, Lock, Shield, Sparkles, CheckCircle2 
} from "lucide-react";
import { motion } from "framer-motion";

export const Settings = () => {
  const { user } = useAuth();
  
  // Local Settings States
  const [notifyOnTask, setNotifyOnTask] = useState(
    localStorage.getItem("pref_notify_task") !== "false"
  );
  const [notifyOnAsset, setNotifyOnAsset] = useState(
    localStorage.getItem("pref_notify_asset") !== "false"
  );
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSavePreferences = (e) => {
    e.preventDefault();
    localStorage.setItem("pref_notify_task", notifyOnTask.toString());
    localStorage.setItem("pref_notify_asset", notifyOnAsset.toString());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 pb-16 space-y-8 relative z-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">System & Account Settings</h1>
        <p className="text-gray-500 font-medium mt-1">Configure workspace parameters, verify backend engine, and view user metrics.</p>
      </div>

      {saveSuccess && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-650 text-xs p-4 rounded-2xl"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>Preferences saved successfully!</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* User Account Card */}
        <GlassCard hoverEffect={false} className="space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2 border-b border-white/20 pb-3">
            <User className="h-4.5 w-4.5 text-purple-650" />
            User Identity Profile
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Username</label>
              <GlassInput value={user?.username || ""} disabled={true} />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Email Address</label>
              <GlassInput value={user?.email || ""} disabled={true} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">User ID</label>
                <div className="glass-input px-4 py-2.5 text-xs text-gray-700 bg-white/25 rounded-2xl select-all font-mono">
                  #{user?.id}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Role Authority</label>
                <div className="glass-input px-4 py-2.5 text-xs text-gray-700 bg-white/25 rounded-2xl font-bold flex items-center gap-1.5 capitalize">
                  <Shield className="h-3.5 w-3.5 text-purple-500" />
                  {user?.role_name}
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Preferences / Toggles */}
        <GlassCard hoverEffect={false} className="space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2 border-b border-white/20 pb-3">
            <Bell className="h-4.5 w-4.5 text-purple-655" />
            Notification Preferences
          </h2>

          <form onSubmit={handleSavePreferences} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-white/35 rounded-2xl border border-white/50">
                <div>
                  <span className="text-xs font-bold text-gray-800 block">Task Assignment Alerts</span>
                  <span className="text-[10px] text-gray-500">Notify me when tasks are created or updated.</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifyOnTask} 
                  onChange={(e) => setNotifyOnTask(e.target.checked)}
                  className="w-4.5 h-4.5 cursor-pointer accent-purple-600"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-white/35 rounded-2xl border border-white/50">
                <div>
                  <span className="text-xs font-bold text-gray-800 block">Knowledge Asset Alerts</span>
                  <span className="text-[10px] text-gray-500">Notify me when a new document is vectorized.</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifyOnAsset} 
                  onChange={(e) => setNotifyOnAsset(e.target.checked)}
                  className="w-4.5 h-4.5 cursor-pointer accent-purple-600"
                />
              </div>
            </div>

            <GlassButton type="submit" className="w-full">
              Save Preferences
            </GlassButton>
          </form>
        </GlassCard>
      </div>

      {/* Systems Architecture Info */}
      <GlassCard hoverEffect={false} className="space-y-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2 border-b border-white/20 pb-3">
          <Cpu className="h-4.5 w-4.5 text-purple-650" />
          AetherFlow IQ Engine Diagnostics
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-4 bg-white/30 border border-white/50 rounded-2xl flex items-start gap-3">
            <Cpu className="h-8 w-8 text-purple-650 shrink-0 mt-1" />
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">AI Embeddings</span>
              <p className="text-xs font-bold text-gray-850 mt-0.5">sentence-transformers/all-MiniLM-L6-v2</p>
              <span className="text-[9px] bg-purple-500/10 text-purple-650 px-2 py-0.5 rounded-full font-bold inline-block mt-2">
                Local Execution (CPU)
              </span>
            </div>
          </div>

          <div className="p-4 bg-white/30 border border-white/50 rounded-2xl flex items-start gap-3">
            <Database className="h-8 w-8 text-indigo-650 shrink-0 mt-1" />
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Vector Storage</span>
              <p className="text-xs font-bold text-gray-850 mt-0.5">Custom In-Memory NumPy Database</p>
              <span className="text-[9px] bg-indigo-500/10 text-indigo-650 px-2 py-0.5 rounded-full font-bold inline-block mt-2">
                Persisted to disk
              </span>
            </div>
          </div>

          <div className="p-4 bg-white/30 border border-white/50 rounded-2xl flex items-start gap-3 col-span-1 sm:col-span-2 lg:col-span-1">
            <Sparkles className="h-8 w-8 text-amber-500 shrink-0 mt-1 animate-pulse" />
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">FastAPI Server URL</span>
              <p className="text-xs font-bold text-gray-855 mt-0.5">http://127.0.0.1:8000</p>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-bold inline-block mt-2">
                Connected & Online
              </span>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

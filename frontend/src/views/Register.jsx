import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import { CheckSquare, Lock, Mail, User as UserIcon, AlertCircle, ShieldAlert } from "lucide-react";
import { GlassCard } from "../components/GlassCard";
import { GlassInput } from "../components/GlassInput";
import { GlassButton } from "../components/GlassButton";

export const Register = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("2"); // Default standard User
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      await API.post("/auth/register", {
        username,
        email,
        password,
        role_id: parseInt(roleId, 10),
      });

      setSuccess("Account created successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || 
        "Failed to register. Please check input parameters."
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 relative z-10">
      <div className="w-full max-w-md">
        <GlassCard hoverEffect={false} className="p-8 border-white/50 bg-white/30 backdrop-blur-2xl">
          {/* Logo & Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-md shadow-purple-500/20 mb-4">
              <CheckSquare className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">
              Create Account
            </h1>
            <p className="text-xs text-gray-400 font-semibold tracking-wider uppercase mt-1.5">Get started with our system</p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-650 text-xs p-3.5 rounded-xl mb-6">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-650 text-xs p-3.5 rounded-xl mb-6">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Registration form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <UserIcon className="h-4 w-4" />
                </div>
                <GlassInput
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  placeholder="e.g. johndoe"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="h-4 w-4" />
                </div>
                <GlassInput
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  placeholder="e.g. john@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="h-4 w-4" />
                </div>
                <GlassInput
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  placeholder="At least 6 characters"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                System Role (Testing Helper)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 animate-pulse">
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <select
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="glass-input w-full pl-10 pr-4 py-3 text-sm appearance-none cursor-pointer"
                >
                  <option value="2" className="bg-white text-gray-800">Standard User (Perform Tasks, Search)</option>
                  <option value="1" className="bg-white text-gray-800">Administrator (Full Control)</option>
                </select>
              </div>
            </div>

            <GlassButton
              type="submit"
              disabled={submitting}
              className="w-full mt-6"
            >
              {submitting ? "Creating Account..." : "Create Account"}
            </GlassButton>
          </form>

          {/* Bottom link */}
          <div className="text-center mt-6 text-xs text-gray-500 font-semibold">
            Already have an account?{" "}
            <Link to="/login" className="text-purple-600 hover:text-purple-700 font-bold transition-colors">
              Sign in here
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

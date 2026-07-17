import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import { 
  CheckCircle2, Circle, AlertCircle, FileText, Loader, ArrowRight, 
  Sparkles, Search, History, HelpCircle, Layers 
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ResponsiveContainer, PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend 
} from "recharts";
import { GlassCard } from "../components/GlassCard";
import { GlassButton } from "../components/GlassButton";
import { GlassInput } from "../components/GlassInput";

export const Dashboard = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const section = searchParams.get("section");
  const view = searchParams.get("view");
  const [tasks, setTasks] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Search state
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      setError("");
      
      // Fetch user's assigned tasks
      const tasksRes = await API.get(`/tasks?assigned_to=${user.id}`);
      setTasks(tasksRes.data);

      // Fetch knowledge base files list
      const docsRes = await API.get("/documents");
      setDocuments(docsRes.data);

      // Fetch analytics
      const analyticsRes = await API.get("/analytics");
      setAnalytics(analyticsRes.data);

      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch dashboard data. Please try again later.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.id]);

  useEffect(() => {
    if (section) {
      setTimeout(() => {
        const element = document.getElementById(section);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.classList.add("ring-2", "ring-purple-500", "shadow-lg", "shadow-purple-500/10");
          setTimeout(() => {
            element.classList.remove("ring-2", "ring-purple-500", "shadow-lg", "shadow-purple-500/10");
          }, 2000);
        }
      }, 300);
    }
  }, [section]);

  const toggleTaskStatus = async (taskId, currentStatus) => {
    const nextStatus = currentStatus === "pending" ? "completed" : "pending";
    
    // Optimistic UI update
    setTasks(prevTasks =>
      prevTasks.map(t => (t.id === taskId ? { ...t, status: nextStatus } : t))
    );

    try {
      await API.patch(`/tasks/${taskId}/status`, { status: nextStatus });
      // Refresh analytics
      const analyticsRes = await API.get("/analytics");
      setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error("Failed to update status:", err);
      // Revert optimistic update
      setTasks(prevTasks =>
        prevTasks.map(t => (t.id === taskId ? { ...t, status: currentStatus } : t))
      );
      setError("Failed to update task status. Please retry.");
    }
  };

  const handleInlineSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearchLoading(true);
    setError("");
    setHasSearched(true);

    try {
      const response = await API.post("/search", {
        query: query,
        top_k: 3,
      });
      setSearchResults(response.data.results);
      
      // Refresh analytics for search counts/logs
      const analyticsRes = await API.get("/analytics");
      setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error(err);
      setError("An error occurred while communicating with the AI semantic search engine.");
    } finally {
      setSearchLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (statusFilter === "all") return true;
    return task.status === statusFilter;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader className="h-8 w-8 text-purple-600 animate-spin" />
        <span className="text-sm font-semibold text-gray-500">Loading your workspace...</span>
      </div>
    );
  }

  // Render ONLY documents when view is 'documents'
  if (view === "documents") {
    return (
      <div className="max-w-4xl mx-auto px-6 pb-16 space-y-6 relative z-10">
        {/* Back Link to Dashboard */}
        <div className="flex justify-between items-center">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs font-bold text-purple-750 hover:text-purple-900 transition-colors"
          >
            <ArrowRight className="h-3.5 w-3.5 rotate-180" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-full px-4 py-1.5 shadow-sm">
            <Sparkles className="h-4 w-4 text-purple-600 animate-pulse" />
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-purple-700">
              Knowledge Base
            </span>
          </div>
        </div>

        {/* Knowledge Assets Listing */}
        <GlassCard hoverEffect={false} className="space-y-6">
          <div className="border-b border-white/30 pb-4">
            <h2 className="text-xl font-extrabold text-gray-900">
              System Knowledge Assets
            </h2>
            <p className="text-xs text-gray-600 mt-1 font-semibold">
              Browse through the compiled documentation and operational guidelines.
            </p>
          </div>

          {documents.length === 0 ? (
            <div className="text-center py-20">
              <HelpCircle className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-650">No documents uploaded yet</p>
              <p className="text-xs text-gray-500 mt-1">Please ask an Administrator to upload text or PDF assets.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc) => (
                <div 
                  key={doc.id} 
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/40 border border-white/60 shadow-sm hover:bg-white/65 hover:scale-[1.01] transition-all duration-300"
                >
                  <div className="h-11 w-11 rounded-2xl bg-purple-500/10 text-purple-650 flex items-center justify-center border border-purple-500/20 shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-gray-805 truncate" title={doc.title}>
                      {doc.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-[9px] text-gray-505 font-bold uppercase tracking-wider">
                      <span className="bg-purple-500/5 text-purple-750 px-1.5 py-0.5 rounded-md">{doc.file_type}</span>
                      <span>•</span>
                      <span>By: {doc.uploader_name}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    );
  }

  // Render ONLY tasks when view is 'tasks'
  if (view === "tasks") {
    return (
      <div className="max-w-4xl mx-auto px-6 pb-16 space-y-6 relative z-10">
        {/* Back Link to Dashboard */}
        <div className="flex justify-between items-center">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs font-bold text-purple-750 hover:text-purple-900 transition-colors"
          >
            <ArrowRight className="h-3.5 w-3.5 rotate-180" />
            Back to Dashboard
          </Link>
          <div className="flex gap-1.5 bg-white/40 p-1 rounded-xl border border-white/60">
            {["all", "pending", "completed"].map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-lg capitalize transition-all duration-200 ${
                  statusFilter === filter
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-gray-655 hover:text-gray-900"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Tasks Card */}
        <GlassCard hoverEffect={false} className="space-y-6">
          <div className="border-b border-white/30 pb-4">
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              Your Tasks Checklist
            </h2>
            <p className="text-xs text-gray-650 mt-1 font-semibold">
              Track and toggle your assigned organizational responsibilities.
            </p>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-white/60 rounded-2xl">
              <p className="text-gray-650 text-xs font-semibold">No tasks matching the criteria found.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/20">
              {filteredTasks.map((task) => (
                <div key={task.id} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4">
                  <button
                    onClick={() => toggleTaskStatus(task.id, task.status)}
                    className={`mt-1 shrink-0 transition-colors ${
                      task.status === "completed" ? "text-purple-650" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {task.status === "completed" ? (
                      <CheckCircle2 className="h-5 w-5 fill-purple-500/10" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`text-sm font-bold transition-all duration-200 ${
                        task.status === "completed" ? "text-gray-500 line-through" : "text-gray-900"
                      }`}
                    >
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className={`text-xs mt-1.5 leading-relaxed font-medium ${
                        task.status === "completed" ? "text-gray-550 line-through" : "text-gray-700"
                      }`}>
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-3 text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                      <span>Assigned by: {task.creator_name}</span>
                      <span>•</span>
                      <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    );
  }

  // Pre-calculate metrics safely
  const docCount = documents.length;
  const pendingCount = analytics?.pending_tasks ?? tasks.filter(t => t.status === "pending").length;
  const completedCount = analytics?.completed_tasks ?? tasks.filter(t => t.status === "completed").length;
  const searchesToday = analytics?.activity_breakdown?.search ?? 0;

  // Chart data formatting
  const taskChartData = [
    { name: "Completed", value: completedCount, color: "#34D399" }, // soft emerald
    { name: "Pending", value: pendingCount, color: "#FBBF24" }      // soft amber
  ].filter(d => d.value > 0);

  // If no tasks exist, provide a fallback visualization data structure
  const displayTaskChartData = taskChartData.length > 0 ? taskChartData : [
    { name: "No tasks", value: 1, color: "#E5E7EB" }
  ];

  const searchTrendsData = analytics?.top_queries?.map(q => ({
    name: q.query.length > 15 ? q.query.substring(0, 15) + "..." : q.query,
    Count: q.count
  })) || [];

  return (
    <div className="max-w-7xl mx-auto px-6 pb-16 space-y-8 relative z-10">
      {/* Header welcome banner */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-start flex-wrap gap-4"
      >
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Welcome back, {user.username}!
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Track your tasks and query organizational assets using natural language AI.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-full px-4 py-1.5 shadow-sm">
          <Sparkles className="h-4 w-4 text-purple-600 animate-pulse" />
          <span className="text-[10px] uppercase font-extrabold tracking-widest text-purple-700">
            Local MiniLM Engine Online
          </span>
        </div>
      </motion.div>

      {error && (
        <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-650 text-xs p-4 rounded-2xl">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Row (Frosted Glass Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard hoverEffect={true} delay={0.05} className="flex items-center gap-5">
          <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-650 flex items-center justify-center border border-indigo-500/20">
            <FileText className="h-5.5 w-5.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Documents</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{docCount}</h3>
          </div>
        </GlassCard>

        <GlassCard hoverEffect={true} delay={0.1} className="flex items-center gap-5">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
            <Circle className="h-5.5 w-5.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Pending Tasks</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{pendingCount}</h3>
          </div>
        </GlassCard>

        <GlassCard hoverEffect={true} delay={0.15} className="flex items-center gap-5">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20">
            <CheckCircle2 className="h-5.5 w-5.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Completed Tasks</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{completedCount}</h3>
          </div>
        </GlassCard>

        <GlassCard hoverEffect={true} delay={0.2} className="flex items-center gap-5">
          <div className="h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center border border-purple-500/20">
            <Search className="h-5.5 w-5.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">AI Searches Today</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{searchesToday}</h3>
          </div>
        </GlassCard>
      </div>

      {/* Second Row: Large Semantic AI Search Panel + Recent Uploaded Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Large AI Search Card */}
        <GlassCard hoverEffect={false} delay={0.25} className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-650" />
              Semantic AI Search Hub
            </h2>
            <p className="text-xs text-gray-600 mt-1 font-semibold">
              Query policies and operations instructions using contextual sentence understanding.
            </p>
          </div>

          <form onSubmit={handleInlineSearch} className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                <Search className="h-4.5 w-4.5" />
              </span>
              <GlassInput
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask e.g. How do I print? or VPN server credentials..."
                className="pl-10 py-3"
              />
            </div>
            <GlassButton type="submit" disabled={searchLoading}>
              {searchLoading ? <Loader className="h-4 w-4 animate-spin" /> : "Query AI"}
            </GlassButton>
          </form>

          {/* Inline Search Results mapping */}
          <AnimatePresence>
            {hasSearched && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 pt-2 border-t border-white/30 overflow-hidden"
              >
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Search Results</div>
                {searchResults.length === 0 ? (
                  <div className="text-center py-6 text-xs font-semibold text-gray-600">
                    No relevant snippets found in the database. Ensure documents are uploaded.
                  </div>
                ) : (
                  searchResults.map((res, index) => (
                    <motion.div 
                      key={res.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 rounded-2xl bg-white/40 border border-white/60 shadow-sm space-y-2.5"
                    >
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-purple-750 uppercase flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {res.document_title}
                        </span>
                        <span className="font-extrabold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700">
                          {Math.round(res.score * 100)}% Match
                        </span>
                      </div>
                      <p className="text-xs text-gray-750 leading-relaxed italic">
                        "{res.content}"
                      </p>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>

        {/* Recent Uploaded Documents list */}
        <GlassCard id="documents" hoverEffect={true} delay={0.3} className="flex flex-col justify-between transition-all duration-500">
          <div className="space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
              Knowledge Assets
            </h2>
            {documents.length === 0 ? (
              <div className="text-center py-10">
                <HelpCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-gray-600">No documents found</p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-650 flex items-center justify-center shrink-0">
                      <FileText className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-gray-805 truncate" title={doc.title}>
                        {doc.title}
                      </h4>
                      <p className="text-[9px] font-extrabold text-gray-500 mt-0.5 uppercase tracking-wide">
                        {doc.file_type} File
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Link
            to="/search"
            className="flex items-center justify-center gap-2 text-xs font-bold text-purple-700 hover:text-purple-800 pt-4 border-t border-white/20 mt-4 transition-colors"
          >
            Open Full Search Hub
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </GlassCard>
      </div>

      {/* Third Row: Assigned Tasks checklist + Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tasks list */}
        <GlassCard id="tasks" hoverEffect={false} delay={0.35} className="lg:col-span-2 space-y-6 transition-all duration-500">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Layers className="h-5 w-5 text-purple-655" />
              Your Tasks Checklist
            </h2>
            
            {/* Task filters */}
            <div className="flex gap-1.5 bg-white/40 p-1 rounded-xl border border-white/60">
              {["all", "pending", "completed"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-lg capitalize transition-all duration-200 ${
                    statusFilter === filter
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-white/60 rounded-2xl">
              <p className="text-gray-650 text-xs font-semibold">No tasks matching the criteria found.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/20">
              {filteredTasks.map((task) => (
                <div key={task.id} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4">
                  <button
                    onClick={() => toggleTaskStatus(task.id, task.status)}
                    className={`mt-1 shrink-0 transition-colors ${
                      task.status === "completed" ? "text-purple-600" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {task.status === "completed" ? (
                      <CheckCircle2 className="h-5 w-5 fill-purple-500/10" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`text-sm font-bold transition-all duration-200 ${
                        task.status === "completed" ? "text-gray-500 line-through" : "text-gray-900"
                      }`}
                    >
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className={`text-xs mt-1.5 leading-relaxed font-medium ${
                        task.status === "completed" ? "text-gray-500/80" : "text-gray-700"
                      }`}>
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-3 text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                      <span>Assigned by: {task.creator_name}</span>
                      <span>•</span>
                      <span>
                        Created: {new Date(task.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Activity Timeline list */}
        <GlassCard hoverEffect={true} delay={0.4} className="space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
            <History className="h-4 w-4" />
            Activity Timeline
          </h2>
          {(!analytics?.recent_logs || analytics.recent_logs.length === 0) ? (
            <div className="text-center py-10 text-xs font-semibold text-gray-500">
              No activity logs recorded.
            </div>
          ) : (
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {analytics.recent_logs.slice(0, 5).map((log, idx) => (
                <div key={log.id} className="relative pl-6 pb-1 last:pb-0">
                  {/* Vertical line connector */}
                  {idx < 4 && (
                    <span className="absolute left-[7px] top-[14px] bottom-[-22px] w-[2px] bg-white/40"></span>
                  )}
                  {/* Point */}
                  <span className="absolute left-1 top-2.5 h-2 w-2 rounded-full bg-purple-500 border border-white"></span>
                  
                  <div className="flex justify-between items-baseline gap-2">
                    <p className="text-[10px] font-bold text-gray-900 truncate">
                      {log.username}
                    </p>
                    <span className="text-[8px] font-bold text-gray-500 shrink-0">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[10px] font-medium text-gray-700 mt-1 leading-relaxed">
                    {log.details}
                  </p>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Fourth Row: Recharts Analytics Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Task completion pie chart */}
        <GlassCard hoverEffect={true} delay={0.45} className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
            Task Completion Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayTaskChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {displayTaskChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "rgba(255, 255, 255, 0.8)", 
                    borderRadius: "16px",
                    border: "1px solid rgba(255, 255, 255, 0.4)",
                    fontSize: "12px"
                  }} 
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  wrapperStyle={{ fontSize: "11px", fontWeight: "600" }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Search Trends bar chart */}
        <GlassCard hoverEffect={true} delay={0.5} className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
            Popular AI Search Terms
          </h3>
          <div className="h-64">
            {searchTrendsData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs font-semibold text-gray-400">
                No search metrics available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={searchTrendsData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: "#6B7280", fontSize: 9, fontWeight: 600 }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    tick={{ fill: "#6B7280", fontSize: 9, fontWeight: 600 }} 
                    axisLine={false} 
                    tickLine={false} 
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "rgba(255, 255, 255, 0.8)", 
                      borderRadius: "16px", 
                      border: "1px solid rgba(255, 255, 255, 0.4)",
                      fontSize: "12px"
                    }} 
                  />
                  <Bar dataKey="Count" fill="#8B5CF6" radius={[8, 8, 0, 0]}>
                    {searchTrendsData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index % 2 === 0 ? "#8B5CF6" : "#60A5FA"} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

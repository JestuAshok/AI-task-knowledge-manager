import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import API from "../services/api";
import { 
  Users, CheckCircle2, Clock, Activity, FileText, 
  UploadCloud, Plus, AlertCircle, Loader, Search, History,
  Layers, BarChart3, Circle, Trash2, Calendar
} from "lucide-react";
import { 
  ResponsiveContainer, PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend 
} from "recharts";
import { GlassCard } from "../components/GlassCard";
import { GlassButton } from "../components/GlassButton";
import { GlassInput } from "../components/GlassInput";
import { motion, AnimatePresence } from "framer-motion";

export const AdminPortal = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "all";

  // Lists
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [allTasks, setAllTasks] = useState([]);
  const [allDocs, setAllDocs] = useState([]);
  
  // Filtering & Search
  const [logFilter, setLogFilter] = useState("");
  const [taskFilter, setTaskFilter] = useState("all");

  // Forms
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  
  const [docTitle, setDocTitle] = useState("");
  const [docFile, setDocFile] = useState(null);

  // Statuses
  const [loading, setLoading] = useState(true);
  const [submittingTask, setSubmittingTask] = useState(false);
  const [submittingDoc, setSubmittingDoc] = useState(false);
  
  const [taskMsg, setTaskMsg] = useState({ error: "", success: "" });
  const [docMsg, setDocMsg] = useState({ error: "", success: "" });
  const [generalError, setGeneralError] = useState("");

  const fetchAdminData = async () => {
    try {
      setGeneralError("");
      
      // Fetch users list for task dropdown
      const usersRes = await API.get("/auth/users");
      setUsers(usersRes.data);
      
      // Select the first user by default if not set
      if (usersRes.data.length > 0 && !assignedTo) {
        const standardUser = usersRes.data.find(u => u.role_name === "user");
        setAssignedTo(standardUser ? standardUser.id.toString() : usersRes.data[0].id.toString());
      }

      // Fetch analytics and audit logs
      const analyticsRes = await API.get("/analytics");
      setAnalytics(analyticsRes.data);

      // Fetch all tasks
      const tasksRes = await API.get("/tasks");
      setAllTasks(tasksRes.data);

      // Fetch all documents
      const docsRes = await API.get("/documents");
      setAllDocs(docsRes.data);
      
      setLoading(false);
    } catch (err) {
      console.error(err);
      setGeneralError("Failed to fetch administrative data.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setTaskMsg({ error: "", success: "" });
    
    if (!taskTitle.trim() || !assignedTo) {
      setTaskMsg({ error: "Title and Assignee are required", success: "" });
      return;
    }

    setSubmittingTask(true);
    try {
      await API.post("/tasks", {
        title: taskTitle,
        description: taskDesc,
        assigned_to: parseInt(assignedTo, 10),
      });

      setTaskMsg({ error: "", success: "Task created and assigned successfully!" });
      setTaskTitle("");
      setTaskDesc("");
      
      // Refresh metrics and task list
      fetchAdminData();
    } catch (err) {
      console.error(err);
      setTaskMsg({
        error: err.response?.data?.detail || "Failed to create task",
        success: ""
      });
    } finally {
      setSubmittingTask(false);
    }
  };

  const handleUploadDoc = async (e) => {
    e.preventDefault();
    setDocMsg({ error: "", success: "" });

    if (!docTitle.trim() || !docFile) {
      setDocMsg({ error: "Document title and file are required", success: "" });
      return;
    }

    // Check extension
    const ext = docFile.name.split(".").pop().toLowerCase() || "";
    if (ext !== "pdf" && ext !== "txt") {
      setDocMsg({ error: "Only PDF and TXT files are allowed", success: "" });
      return;
    }

    setSubmittingDoc(true);
    const formData = new FormData();
    formData.append("title", docTitle);
    formData.append("file", docFile);

    try {
      await API.post("/documents", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setDocMsg({ error: "", success: "Document uploaded and parsed successfully!" });
      setDocTitle("");
      setDocFile(null);
      
      // Reset input element
      const fileInput = document.getElementById("file-upload");
      if (fileInput) fileInput.value = "";

      // Refresh data
      fetchAdminData();
    } catch (err) {
      console.error(err);
      setDocMsg({
        error: err.response?.data?.detail || "Failed to upload document",
        success: ""
      });
    } finally {
      setSubmittingDoc(false);
    }
  };

  const toggleTaskStatus = async (taskId, currentStatus) => {
    const nextStatus = currentStatus === "pending" ? "completed" : "pending";
    
    // Optimistic UI update
    setAllTasks(prevTasks =>
      prevTasks.map(t => (t.id === taskId ? { ...t, status: nextStatus } : t))
    );

    try {
      await API.patch(`/tasks/${taskId}/status`, { status: nextStatus });
      // Refresh metrics and task list
      fetchAdminData();
    } catch (err) {
      console.error("Failed to update status:", err);
      // Revert optimistic update
      fetchAdminData();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader className="h-8 w-8 text-purple-650 animate-spin" />
        <span className="text-sm font-semibold text-gray-500">Loading admin console...</span>
      </div>
    );
  }

  const {
    total_tasks,
    completed_tasks,
    pending_tasks,
    total_users,
    top_queries,
    recent_logs,
    activity_breakdown
  } = analytics || {
    total_tasks: 0,
    completed_tasks: 0,
    pending_tasks: 0,
    total_users: 0,
    top_queries: [],
    recent_logs: [],
    activity_breakdown: {}
  };

  // Recharts Chart configurations
  const taskChartData = [
    { name: "Completed", value: completed_tasks, color: "#34D399" }, // soft emerald
    { name: "Pending", value: pending_tasks, color: "#FBBF24" }      // soft amber
  ].filter(d => d.value > 0);

  const displayTaskChartData = taskChartData.length > 0 ? taskChartData : [
    { name: "No tasks", value: 1, color: "#E5E7EB" }
  ];

  const searchTrendsData = top_queries.map(q => ({
    name: q.query.length > 15 ? q.query.substring(0, 15) + "..." : q.query,
    Count: q.count
  }));

  // Filtering System Logs
  const filteredLogs = recent_logs.filter(log => {
    const term = logFilter.toLowerCase();
    return (
      log.username.toLowerCase().includes(term) ||
      log.action.toLowerCase().includes(term) ||
      log.details.toLowerCase().includes(term)
    );
  });

  // Filtering Tasks
  const filteredTasks = allTasks.filter(task => {
    if (taskFilter === "all") return true;
    return task.status === taskFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 pb-16 space-y-8 relative z-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Operations Console</h1>
          <p className="text-gray-500 font-medium mt-1">Manage system databases, monitor activity feeds, and run analytics.</p>
        </div>
      </div>

      {generalError && (
        <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-650 text-xs p-4 rounded-2xl">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{generalError}</span>
        </div>
      )}

      {/* Metrics Row - Always show at top of Admin Portal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard hoverEffect={true} delay={0.05} className="flex items-center gap-5">
          <div className="h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-650 flex items-center justify-center border border-purple-500/20">
            <Plus className="h-5.5 w-5.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Tasks</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{total_tasks}</h3>
          </div>
        </GlassCard>

        <GlassCard hoverEffect={true} delay={0.1} className="flex items-center gap-5">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20">
            <CheckCircle2 className="h-5.5 w-5.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Completed Tasks</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{completed_tasks}</h3>
          </div>
        </GlassCard>

        <GlassCard hoverEffect={true} delay={0.15} className="flex items-center gap-5">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
            <Clock className="h-5.5 w-5.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Pending Tasks</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{pending_tasks}</h3>
          </div>
        </GlassCard>

        <GlassCard hoverEffect={true} delay={0.2} className="flex items-center gap-5">
          <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-655 flex items-center justify-center border border-indigo-500/20">
            <Users className="h-5.5 w-5.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Users</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{total_users}</h3>
          </div>
        </GlassCard>
      </div>

      {/* Horizontal Premium Tabs Selector */}
      <div className="flex flex-wrap gap-2.5 bg-white/40 p-1.5 rounded-2xl border border-white/60 w-fit">
        {[
          { id: "all", label: "Overview", icon: Layers },
          { id: "tasks", label: "Tasks", icon: Plus },
          { id: "documents", label: "Documents", icon: UploadCloud },
          { id: "analytics", label: "Analytics", icon: BarChart3 },
          { id: "logs", label: "Activity Logs", icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSearchParams({ tab: tab.id })}
              className={`flex items-center gap-2.5 text-xs font-bold px-4 py-2.5 rounded-xl transition-all duration-200 ${
                active
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/10 scale-[1.02]"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Panels with AnimatePresence */}
      <div className="min-h-[400px]">
        {currentTab === "all" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* System Users Overview */}
            <GlassCard hoverEffect={false} className="space-y-4 lg:col-span-1">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                <Users className="h-4 w-4" />
                System Users List
              </h2>
              <div className="space-y-3 overflow-y-auto max-h-[350px] pr-1">
                {users.map((u) => (
                  <div key={u.id} className="flex justify-between items-center p-3 bg-white/40 border border-white/60 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-purple-500/10 text-purple-650 flex items-center justify-center font-extrabold text-xs">
                        {u.username.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-gray-800 block">{u.username}</span>
                        <span className="text-[9px] text-gray-500 font-bold uppercase">{u.email}</span>
                      </div>
                    </div>
                    <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      u.role_name === "admin" ? "bg-red-500/10 text-red-600" : "bg-purple-500/10 text-purple-600"
                    }`}>
                      {u.role_name}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Quick Live Logs & Search overview */}
            <GlassCard hoverEffect={false} className="lg:col-span-2 space-y-6">
              <div className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Recent System Activity
                </h2>
                <div className="space-y-3">
                  {recent_logs.slice(0, 4).map((log) => (
                    <div key={log.id} className="p-3 bg-white/30 border border-white/50 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                          log.action === "login" 
                            ? "bg-blue-500/10 text-blue-600" 
                            : log.action === "search"
                              ? "bg-purple-500/10 text-purple-600"
                              : log.action === "task_update"
                                ? "bg-amber-500/10 text-amber-655"
                                : "bg-emerald-500/10 text-emerald-655"
                        }`}>
                          {log.action}
                        </span>
                        <span className="font-bold text-gray-700 truncate">{log.details}</span>
                      </div>
                      <span className="text-[9px] text-gray-500 shrink-0 font-bold">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-505 flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Popular Queries Overview
                </h2>
                <div className="flex flex-wrap gap-2.5">
                  {top_queries.slice(0, 5).map((q, idx) => (
                    <span key={idx} className="bg-purple-500/5 border border-purple-500/10 text-purple-750 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
                      <span className="font-extrabold text-purple-700">#{idx+1}</span>
                      {q.query}
                      <span className="bg-purple-500/10 text-purple-800 text-[9px] px-1.5 py-0.5 rounded-md font-bold">{q.count}</span>
                    </span>
                  ))}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {currentTab === "tasks" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Task assignment form */}
            <GlassCard hoverEffect={false} className="space-y-6 lg:col-span-1 h-fit">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Plus className="h-5 w-5 text-purple-500" />
                Create & Assign Task
              </h2>
              
              {taskMsg.error && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-650 text-xs p-3.5 rounded-xl">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                  <span>{taskMsg.error}</span>
                </div>
              )}

              {taskMsg.success && (
                <div className="flex items-start gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-650 text-xs p-3.5 rounded-xl">
                  <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
                  <span>{taskMsg.success}</span>
                </div>
              )}

              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Task Title</label>
                  <GlassInput
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="e.g. Verify printer setup configurations"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Description</label>
                  <GlassInput
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    isTextArea={true}
                    placeholder="Detail what needs to be verified..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Assign To User</label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="glass-input w-full px-4 py-3 text-sm cursor-pointer appearance-none bg-transparent"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id} className="bg-white text-gray-800">
                        {u.username} ({u.role_name})
                      </option>
                    ))}
                  </select>
                </div>

                <GlassButton
                  type="submit"
                  disabled={submittingTask}
                  className="w-full mt-2"
                >
                  {submittingTask ? <Loader className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Assign Task
                </GlassButton>
              </form>
            </GlassCard>

            {/* List of all tasks */}
            <GlassCard hoverEffect={false} className="lg:col-span-2 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">System Tasks</h2>
                <div className="flex gap-1.5 bg-white/40 p-1 rounded-xl border border-white/60">
                  {["all", "pending", "completed"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setTaskFilter(f)}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-lg capitalize transition-all duration-200 ${
                        taskFilter === f
                          ? "bg-purple-650 text-white shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {filteredTasks.length === 0 ? (
                <div className="text-center py-16 text-xs text-gray-500 font-semibold">
                  No tasks found in this category.
                </div>
              ) : (
                <div className="divide-y divide-white/20 max-h-[480px] overflow-y-auto pr-1">
                  {filteredTasks.map((t) => (
                    <div key={t.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <button
                          onClick={() => toggleTaskStatus(t.id, t.status)}
                          className={`mt-1 shrink-0 transition-colors ${
                            t.status === "completed" ? "text-purple-600" : "text-gray-400 hover:text-gray-600"
                          }`}
                        >
                          {t.status === "completed" ? (
                            <CheckCircle2 className="h-5 w-5 fill-purple-500/10" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <h3 className={`text-xs font-bold ${t.status === "completed" ? "text-gray-400 line-through" : "text-gray-800"}`}>
                            {t.title}
                          </h3>
                          <p className="text-[10px] text-gray-600 mt-1 leading-relaxed truncate-2-lines">{t.description}</p>
                          <div className="flex items-center gap-2 mt-2 text-[8px] text-gray-500 font-bold uppercase tracking-wider">
                            <span>Assignee: {t.assigned_user_name}</span>
                            <span>•</span>
                            <span>Creator: {t.creator_name}</span>
                          </div>
                        </div>
                      </div>
                      <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                        t.status === "completed" ? "bg-emerald-500/10 text-emerald-650" : "bg-amber-500/10 text-amber-600"
                      }`}>
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}

        {currentTab === "documents" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Document Uploader */}
            <GlassCard hoverEffect={false} className="space-y-6 lg:col-span-1 h-fit">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-purple-500" />
                Upload Knowledge Asset
              </h2>

              {docMsg.error && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-650 text-xs p-3.5 rounded-xl">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                  <span>{docMsg.error}</span>
                </div>
              )}

              {docMsg.success && (
                <div className="flex items-start gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-650 text-xs p-3.5 rounded-xl">
                  <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
                  <span>{docMsg.success}</span>
                </div>
              )}

              <form onSubmit={handleUploadDoc} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Asset Title</label>
                  <GlassInput
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder="e.g. Office Printing Guidelines"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Choose PDF or TXT Document</label>
                  <div className="border-2 border-dashed border-white/60 hover:border-purple-300 rounded-2xl p-8 flex flex-col items-center justify-center bg-white/20 hover:bg-white/40 cursor-pointer relative transition-all duration-200 shadow-inner">
                    <input
                      id="file-upload"
                      type="file"
                      accept=".pdf,.txt"
                      onChange={(e) => setDocFile(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <UploadCloud className="h-10 w-10 text-purple-500 mb-2.5 animate-pulse" />
                    <span className="text-xs text-gray-650 font-bold">
                      {docFile ? docFile.name : "Drag & drop or browse files"}
                    </span>
                    <span className="text-[10px] text-gray-555 mt-1 font-semibold">Accepts PDF or TXT up to 10MB</span>
                  </div>
                </div>

                <GlassButton
                  type="submit"
                  disabled={submittingDoc}
                  className="w-full mt-2"
                >
                  {submittingDoc ? <Loader className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                  Upload & Vectorize Asset
                </GlassButton>
              </form>
            </GlassCard>

            {/* List of all documents */}
            <GlassCard hoverEffect={false} className="lg:col-span-2 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">System Knowledge Assets</h2>
              
              {allDocs.length === 0 ? (
                <div className="text-center py-16 text-xs text-gray-500 font-semibold">
                  No documents vectorized yet. Use the upload card to add text/PDF assets.
                </div>
              ) : (
                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {allDocs.map((doc) => (
                    <div key={doc.id} className="flex justify-between items-center p-3 bg-white/40 border border-white/60 rounded-2xl shadow-sm hover:bg-white/60 transition-colors">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-650 flex items-center justify-center border border-purple-500/20 shrink-0">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-gray-800 truncate" title={doc.title}>{doc.title}</h4>
                          <div className="flex items-center gap-2 mt-1 text-[8px] text-gray-500 font-bold uppercase tracking-wider">
                            <span className="bg-purple-500/5 text-purple-700 px-1.5 py-0.5 rounded-md">{doc.file_type}</span>
                            <span>•</span>
                            <span>By: {doc.uploader_name}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-2.5 w-2.5" />
                              {new Date(doc.uploaded_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}

        {currentTab === "analytics" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Visual Analytics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Task completion pie chart */}
              <GlassCard hoverEffect={true} className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
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
              <GlassCard hoverEffect={true} className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
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

            {/* Semantic Queries Card */}
            <GlassCard hoverEffect={false} className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                <Search className="h-4 w-4" />
                Top AI Semantic Search Queries
              </h2>

              {top_queries.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs font-semibold text-gray-600">No searches recorded yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {top_queries.map((q, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white/40 border border-white/60 px-4 py-3.5 rounded-2xl shadow-sm hover:bg-white/60 transition-colors">
                      <span className="text-xs font-bold text-gray-700 truncate max-w-[170px]">{q.query}</span>
                      <span className="text-[9px] font-extrabold tracking-wider px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-700">
                        {q.count} queries
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}

        {currentTab === "logs" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* System Audit Logs */}
            <GlassCard hoverEffect={false} className="space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                  <History className="h-4 w-4" />
                  System Audit Log Feed
                </h2>
                
                {/* Dynamic Log Filter Search input */}
                <div className="relative w-full sm:w-64">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Search className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="text"
                    value={logFilter}
                    onChange={(e) => setLogFilter(e.target.value)}
                    placeholder="Search logs by action/user..."
                    className="glass-input w-full pl-9 pr-3 py-1.5 text-xs rounded-xl"
                  />
                </div>
              </div>

              {filteredLogs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-xs font-semibold text-gray-550">No matching logs found.</p>
                </div>
              ) : (
                <div className="space-y-3.5 overflow-y-auto max-h-[500px] pr-1.5">
                  {filteredLogs.map((log) => (
                    <div key={log.id} className="p-3.5 bg-white/30 border border-white/50 rounded-2xl shadow-sm hover:bg-white/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider ${
                            log.action === "login" 
                              ? "bg-blue-500/10 text-blue-600" 
                              : log.action === "search"
                                ? "bg-purple-500/10 text-purple-650"
                                : log.action === "task_update"
                                  ? "bg-amber-500/10 text-amber-655"
                                  : "bg-emerald-500/10 text-emerald-655"
                          }`}>
                            {log.action}
                          </span>
                          <span className="text-[10px] font-extrabold text-gray-500">
                            By <span className="text-gray-800">{log.username}</span>
                          </span>
                        </div>
                        <p className="text-xs font-medium text-gray-700 leading-relaxed truncate">{log.details}</p>
                      </div>
                      <span className="text-[9px] text-gray-500 font-bold shrink-0 self-end sm:self-center">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}
      </div>
    </div>
  );
};

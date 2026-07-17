import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import API from "../services/api";
import { Search, FileText, Sparkles, Loader, AlertTriangle, HelpCircle } from "lucide-react";
import { GlassCard } from "../components/GlassCard";
import { GlassInput } from "../components/GlassInput";
import { GlassButton } from "../components/GlassButton";
import { motion } from "framer-motion";

export const SearchHub = () => {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError("");
    setHasSearched(true);

    try {
      const response = await API.post("/search", {
        query: searchQuery,
        top_k: 5,
      });
      setResults(response.data.results);
    } catch (err) {
      console.error(err);
      setError("An error occurred while communicating with the AI semantic search engine.");
    } finally {
      setLoading(false);
    }
  };

  // Run search automatically if query param exists (e.g. from the quick search bar in navbar)
  useEffect(() => {
    const qParam = searchParams.get("q");
    if (qParam) {
      setQuery(qParam);
      performSearch(qParam);
    }
  }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    performSearch(query);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 pb-16 space-y-8 relative z-10">
      {/* Header section */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 text-purple-750 border border-purple-500/15 text-[10px] uppercase font-extrabold tracking-widest mx-auto">
          <Sparkles className="h-3 w-3 animate-pulse" />
          AI Embedding Engine Active
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          AI Operations Search Hub
        </h1>
        <p className="text-sm font-semibold text-gray-650 leading-relaxed">
          Query documentation and procedures semantically. The AI analyzes sentence structure instead of just keywords to return relevant snippets.
        </p>
      </div>

      {/* Query Search Input Card */}
      <GlassCard hoverEffect={false} delay={0.1}>
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
              <Search className="h-5 w-5" />
            </span>
            <GlassInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-11 py-3.5"
              placeholder="e.g. How do I clear the Redis cache? or VPN gateway setups..."
            />
          </div>
          <GlassButton type="submit" disabled={loading}>
            {loading ? <Loader className="h-4.5 w-4.5 animate-spin" /> : "Query Vector DB"}
          </GlassButton>
        </form>
      </GlassCard>

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-650 text-xs p-4 rounded-2xl">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Listing */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader className="h-8 w-8 text-purple-650 animate-spin" />
            <span className="text-xs font-bold text-gray-600">Calculating query vectors and matching indexes...</span>
          </div>
        ) : hasSearched && results.length === 0 ? (
          <GlassCard hoverEffect={false} className="text-center py-16 border-2 border-dashed border-white/50 bg-white/20">
            <HelpCircle className="h-10 w-10 text-gray-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-gray-700">No matches found</h3>
            <p className="text-xs font-semibold text-gray-600 mt-1 max-w-sm mx-auto leading-relaxed">
              We couldn't find any relevant snippets in the database. Ensure the Administrator has uploaded documents related to this query.
            </p>
          </GlassCard>
        ) : (
          results.map((result, idx) => (
            <GlassCard key={result.id} delay={idx * 0.05} className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-white/30">
                {/* Document Metadata Ref */}
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-650">
                    <FileText className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 truncate max-w-[280px]">
                      {result.document_title}
                    </h3>
                    <p className="text-[9px] font-extrabold text-gray-500 uppercase tracking-wide">
                      Source ID: {result.document_id}
                    </p>
                  </div>
                </div>

                {/* Score badge */}
                <div>
                  <span className={`text-[10px] font-extrabold tracking-wider px-3 py-1 rounded-full ${
                    result.score > 0.7 
                      ? "bg-emerald-500/10 text-emerald-650" 
                      : result.score > 0.4
                        ? "bg-amber-500/10 text-amber-650"
                        : "bg-gray-200 text-gray-650"
                  }`}>
                    {Math.round(result.score * 100)}% Semantic Match
                  </span>
                </div>
              </div>

              {/* Text Snippet Content */}
              <div className="text-xs font-medium text-gray-750 leading-relaxed bg-white/40 p-4 rounded-2xl border border-white/60 shadow-inner">
                "{result.content}"
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
};

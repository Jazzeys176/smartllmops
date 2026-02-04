import React, { useEffect, useState } from "react";
import {
  Plus,
  Activity,
  ChevronDown,
  X,
  ExternalLink,
  Loader2,
  Check
} from "lucide-react";
import { api, type Evaluator, type Template, type EvaluationLog, type Trace } from "../api/client";

const Evaluators: React.FC = () => {
  const [evaluators, setEvaluators] = useState<Evaluator[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [logs, setLogs] = useState<EvaluationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"evaluators" | "templates" | "logs">("evaluators");
  const [selectedTrace, setSelectedTrace] = useState<Trace | null>(null);
  const [loadingTrace, setLoadingTrace] = useState(false);

  // Filter States
  const [filterEvaluator, setFilterEvaluator] = useState<string>("All Evaluators");
  const [filterStatus, setFilterStatus] = useState<string>("All Status");
  const [showEvaluatorDropdown, setShowEvaluatorDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // --- FIXED: Added null-safety and optional chaining to prevent "toLowerCase" errors ---
  const filteredLogs = logs.filter(log => {
    const evalMatch = filterEvaluator === "All Evaluators" || log.evaluator_name === filterEvaluator;
    
    const logStatus = (log.status || "").toLowerCase();
    const targetStatus = filterStatus.toLowerCase();
    const statusMatch = filterStatus === "All Status" || logStatus === targetStatus;
    
    return evalMatch && statusMatch;
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [evalsRes, tempsRes, logsRes] = await Promise.all([
        api.get("/evaluators"),
        api.get("/templates"),
        api.get("/evaluations")
      ]);

      setEvaluators(evalsRes.data || []);

      const tData = tempsRes.data;
      if (tData?.templates) {
        setTemplates(tData.templates);
      } else if (Array.isArray(tData)) {
        setTemplates(tData);
      }

      setLogs(logsRes.data || []);
    } catch (err) {
      console.error("Failed to fetch evaluators data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTrace = async (traceId: string) => {
    if (!traceId) return;
    setLoadingTrace(true);
    try {
      const res = await api.get(`/traces/${traceId}`);
      setSelectedTrace(res.data);
    } catch (err) {
      console.error("Failed to fetch trace details", err);
    } finally {
      setLoadingTrace(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-[#13bba4]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-currentColor"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0e1117] text-white p-8">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Evaluators</h1>
          <p className="text-gray-400 text-sm font-medium opacity-80">Automated evaluation system</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-[#13bba4] text-black font-black rounded-lg hover:bg-[#11aa95] transition-all shadow-lg shadow-[#13bba4]/10 active:scale-95 text-sm uppercase tracking-tight">
          <Plus size={18} strokeWidth={3} />
          New Evaluator
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 bg-gray-900/50 rounded-xl w-fit border border-gray-800 shadow-inner mb-10">
        {(["evaluators", "templates", "logs"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-lg text-xs font-bold tracking-wider transition-all capitalize ${activeTab === tab
              ? "bg-[#1c212e] text-white shadow-xl shadow-black/20"
              : "text-gray-500 hover:text-gray-300"
              }`}
          >
            {tab === "logs" ? "Evaluation Log" : tab}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "evaluators" && (
          <div className="bg-[#161a23] border border-gray-800 rounded-2xl shadow-xl overflow-hidden flex flex-col h-full max-h-[calc(100vh-320px)]">
            <div className="p-6 border-b border-gray-800/60 bg-[#1c212e]/30">
              <h3 className="text-lg font-bold text-white tracking-tight">Active Evaluators</h3>
            </div>
            <div className="overflow-y-auto custom-scrollbar flex-1">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#161a23] z-10">
                  <tr className="border-b border-gray-800/80">
                    <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Name</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Template</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Score Name</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Target</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Sampling</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluators.map((ev, i) => (
                    <tr key={ev.evaluator_id} className={`group hover:bg-[#1c212e]/50 transition-colors ${i !== evaluators.length - 1 ? 'border-b border-gray-800/40' : ''}`}>
                      <td className="px-8 py-6 font-bold text-sm text-gray-200">{ev.name}</td>
                      <td className="px-8 py-6">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-500 rounded-full text-[10px] font-black tracking-wider uppercase">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                          Active
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="px-3 py-1 bg-gray-800/60 text-gray-400 text-[10px] font-bold rounded-lg border border-gray-700/50">
                          {templates.find(t => t.template_id === ev.template_id)?.name || ev.template_id?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || "Unknown"}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-sm text-gray-400 font-medium">{ev.score_name}</td>
                      <td className="px-8 py-6">
                        <span className="px-2 py-0.5 bg-gray-900 border border-gray-800 text-gray-500 text-[9px] font-black rounded uppercase tracking-widest leading-none">
                          {ev.target}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-sm text-gray-300 font-bold">{(ev.sampling * 100).toFixed(0)}%</td>
                      <td className="px-8 py-6 text-sm text-gray-500 font-medium">{ev.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "templates" && (
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-white tracking-tight">Evaluator Templates</h3>
              <button className="flex items-center gap-2 px-4 py-2 bg-black border border-gray-800 text-white font-bold rounded-lg hover:bg-gray-900 transition-all text-sm">
                <Plus size={16} />
                New Template
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pb-10">
              {templates.map((t) => (
                <div key={t.template_id} className="bg-[#161a23] border border-gray-800 rounded-2xl p-8 shadow-xl relative group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-white mb-1 group-hover:text-[#13bba4] transition-colors">
                        {t.name || t.template_id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </h4>
                      <p className="text-sm text-gray-500 font-medium opacity-80">{t.description || "Detects specific patterns and inconsistencies in model responses"}</p>
                    </div>
                    <span className="bg-gray-800/80 text-gray-400 text-[10px] font-black px-2.5 py-1 rounded-full border border-gray-700/50">v{t.version || 1}</span>
                  </div>
                  <div className="bg-[#0e1117] border border-gray-800 rounded-xl p-6 mt-6 mb-8 text-gray-400 text-sm font-medium leading-relaxed font-mono whitespace-pre-wrap">
                    {t.template || "No prompt string defined for this template."}
                  </div>
                  <div className="flex flex-wrap items-center gap-6 pt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Model:</span>
                      <span className="text-xs font-bold text-gray-300 group-hover:text-white transition-colors">{t.model || "gpt-4o-mini"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {(t.inputs || t.input_variables || []).map((v: string) => (
                        <span key={v} className="px-2.5 py-1 bg-gray-800/40 text-gray-500 text-[10px] font-bold rounded-lg border border-gray-700/30">
                          {`{{${v}}}`}
                        </span>
                      ))}
                    </div>
                    <div className="ml-auto flex items-center gap-2 text-[10px] text-gray-600 font-medium italic">
                      Last updated: {t.updated_at ? new Date(t.updated_at).toLocaleString() : "1/28/2026, 2:59:48 PM"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="bg-[#161a23] border border-gray-800 rounded-2xl shadow-xl overflow-hidden h-full max-h-[calc(100vh-320px)] flex flex-col">
            <div className="p-6 border-b border-gray-800/60 bg-[#1c212e]/30 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white tracking-tight">Evaluation Execution Log</h3>
              <div className="flex gap-3 relative">
                {/* Evaluator Filter */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowEvaluatorDropdown(!showEvaluatorDropdown);
                      setShowStatusDropdown(false);
                    }}
                    className="flex items-center gap-3 bg-[#0e1117] border border-gray-800 text-gray-400 text-xs font-bold rounded-lg px-4 py-2 hover:border-[#13bba4] transition-all min-w-[160px] justify-between"
                  >
                    <span>{filterEvaluator}</span>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${showEvaluatorDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showEvaluatorDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowEvaluatorDropdown(false)}></div>
                      <div className="absolute right-0 mt-2 w-56 bg-[#161a23] border border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="py-2">
                          {["All Evaluators", ...Array.from(new Set(logs.map(l => l.evaluator_name)))].map((opt) => (
                            <button
                              key={opt}
                              onClick={() => {
                                setFilterEvaluator(opt);
                                setShowEvaluatorDropdown(false);
                              }}
                              className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-[#1c212e] transition-colors flex items-center justify-between group"
                            >
                              <span className={filterEvaluator === opt ? "text-[#13bba4]" : "text-gray-400 group-hover:text-gray-200"}>{opt}</span>
                              {filterEvaluator === opt && <Check size={14} className="text-[#13bba4]" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Status Filter */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowStatusDropdown(!showStatusDropdown);
                      setShowEvaluatorDropdown(false);
                    }}
                    className="flex items-center gap-3 bg-[#0e1117] border border-gray-800 text-gray-400 text-xs font-bold rounded-lg px-4 py-2 hover:border-[#13bba4] transition-all min-w-[140px] justify-between"
                  >
                    <span>{filterStatus}</span>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${showStatusDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showStatusDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowStatusDropdown(false)}></div>
                      <div className="absolute right-0 mt-2 w-48 bg-[#161a23] border border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="py-2">
                          {["All Status", "Completed", "Error", "Timeout"].map((opt) => (
                            <button
                              key={opt}
                              onClick={() => {
                                setFilterStatus(opt);
                                setShowStatusDropdown(false);
                              }}
                              className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-[#1c212e] transition-colors flex items-center justify-between group"
                            >
                              <span className={filterStatus === opt ? "text-[#13bba4]" : "text-gray-400 group-hover:text-gray-200"}>{opt}</span>
                              {filterStatus === opt && <Check size={14} className="text-[#13bba4]" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="overflow-y-auto custom-scrollbar flex-1">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#161a23] z-10 shadow-sm shadow-black/20">
                  <tr className="border-b border-gray-800/80">
                    <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Timestamp</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Evaluator</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Trace ID</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Score</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Duration</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, i) => {
                    const statusStr = (log.status || "Unknown").toLowerCase();
                    return (
                      <tr key={i} className={`group hover:bg-[#1c212e]/50 transition-colors ${i !== filteredLogs.length - 1 ? 'border-b border-gray-800/40' : ''}`}>
                        <td className="px-8 py-6 text-xs text-gray-400 font-medium">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : "N/A"}
                        </td>
                        <td className="px-8 py-6 font-bold text-sm text-gray-200">{log.evaluator_name}</td>
                        <td className="px-8 py-6">
                          <span className="px-3 py-1 bg-black border border-gray-800 text-gray-400 text-xs font-mono rounded-lg shadow-inner">
                            {log.trace_id?.slice(0, 8) || "N/A"}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-black tracking-tighter ${
                            (log.score ?? 0) >= 0.8 ? 'bg-[#13bba4]/10 text-[#13bba4] border border-[#13bba4]/20' :
                            (log.score ?? 0) >= 0.5 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                            'bg-red-500/10 text-red-500 border border-red-500/20'
                          }`}>
                            {typeof log.score === 'number' ? log.score.toFixed(2) : "-"}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-xs text-gray-400 font-bold">{log.duration ? `${log.duration.toFixed(0)}ms` : "1250ms"}</td>
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1 text-[10px] font-black rounded-full border uppercase tracking-widest flex items-center gap-1.5 w-fit ${
                            statusStr === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                            statusStr === 'timeout' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                            'bg-red-500/10 text-red-500 border-red-500/20'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${
                               statusStr === 'completed' ? 'bg-green-500' :
                               statusStr === 'timeout' ? 'bg-orange-400' :
                               'bg-red-500'
                            }`}></div>
                            {log.status || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <button
                            onClick={() => handleViewTrace(log.trace_id)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-[#13bba4] text-black font-black rounded-lg hover:bg-[#11aa95] transition-all shadow-lg shadow-[#13bba4]/10 active:scale-95 text-xs group/btn"
                          >
                            <ExternalLink size={14} className="group-hover:scale-110 transition-transform" />
                            <span>View Trace</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-20 text-center opacity-40 italic text-sm text-gray-500 tracking-[0.2em]">No historical evaluations found in registry</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Trace Details Modal */}
      {(selectedTrace || loadingTrace) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#161a23] border border-gray-800 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col shadow-[#000]/50 animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-gray-800 bg-[#1c212e]/50 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                  <Activity className="text-[#13bba4]" size={24} />
                  Trace Details
                </h2>
                <p className="text-gray-500 text-xs font-mono mt-1 opacity-80 uppercase tracking-widest leading-none">ID: {selectedTrace?.trace_id || "LOADING..."}</p>
              </div>
              <button
                onClick={() => setSelectedTrace(null)}
                className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all flex items-center justify-center border border-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
              {loadingTrace ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="animate-spin text-[#13bba4]" size={40} />
                  <p className="text-gray-500 font-bold tracking-widest text-xs uppercase animate-pulse">Fetching Trace Data...</p>
                </div>
              ) : selectedTrace && (
                <>
                  <div className="flex gap-4">
                    <div className="bg-[#0e1117] border border-gray-800 rounded-2xl p-4 flex-1">
                      <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block mb-1">Latency</label>
                      <p className="text-lg font-bold text-white">{selectedTrace.latency_ms || selectedTrace.latency || 0}ms</p>
                    </div>
                    <div className="bg-[#0e1117] border border-gray-800 rounded-2xl p-4 flex-1">
                      <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block mb-1">Tokens</label>
                      <p className="text-lg font-bold text-white">{selectedTrace.tokens || 0}</p>
                    </div>
                    <div className="bg-[#0e1117] border border-gray-800 rounded-2xl p-4 flex-1">
                      <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block mb-1">Estimated Cost</label>
                      <p className="text-lg font-bold text-[#13bba4]">${(selectedTrace.cost || 0).toFixed(4)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] block pl-1">Input Prompt</label>
                      <div className="bg-[#0e1117] border border-gray-800 rounded-2xl p-6 text-gray-300 text-sm leading-relaxed font-medium min-h-[200px]">
                        {selectedTrace.question || selectedTrace.input || "No input data recorded"}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] block pl-1">Model Output</label>
                      <div className="bg-[#0e1117] border border-[#13bba4]/20 rounded-2xl p-6 text-gray-200 text-sm leading-relaxed font-semibold min-h-[200px] shadow-[inset_0_0_20px_rgba(19,187,164,0.05)]">
                        {selectedTrace.answer || selectedTrace.output || "No output data recorded"}
                      </div>
                    </div>
                  </div>
                  {(selectedTrace.context || selectedTrace.retrieval_context) && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] block pl-1">Retrieval Context</label>
                      <div className="bg-[#0e1117] border border-gray-800 rounded-2xl p-6 text-gray-400 text-xs leading-relaxed font-mono whitespace-pre-wrap">
                        {typeof selectedTrace.context === 'string' ? selectedTrace.context : JSON.stringify(selectedTrace.context || selectedTrace.retrieval_context, null, 2)}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="p-6 border-t border-gray-800 bg-[#1c212e]/30 flex justify-end">
              <button
                onClick={() => setSelectedTrace(null)}
                className="px-8 py-2.5 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-700 transition-all border border-gray-700 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Evaluators;
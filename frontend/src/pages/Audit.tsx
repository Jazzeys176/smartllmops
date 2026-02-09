import React, { useEffect, useMemo, useState } from "react";
import { Download, Search, ChevronDown } from "lucide-react";
import { api } from "../api/client";

type AuditLog = {
  id: string;
  timestamp: string;
  action: string;
  type: string;
  user: string;
  details: string;
};

const TYPE_COLORS: Record<string, string> = {
  evaluator: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  template: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

const Audit: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [loading, setLoading] = useState(true);

  // --------------------------------------------------
  // Fetch audit logs
  // --------------------------------------------------
  useEffect(() => {
    fetchAudit();
  }, []);

  const fetchAudit = async () => {
    setLoading(true);
    try {
      const res = await api.get("/audit");
      setLogs(Array.isArray(res.data) ? res.data : []);
    } catch {
      setLogs([]);
    }
    setLoading(false);
  };

  // --------------------------------------------------
  // Filtered logs
  // --------------------------------------------------
  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      const matchesType =
        typeFilter === "All Types" || l.type === typeFilter.toLowerCase();

      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        l.action.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        l.user.toLowerCase().includes(q);

      return matchesType && matchesSearch;
    });
  }, [logs, search, typeFilter]);

  // --------------------------------------------------
  // Export CSV
  // --------------------------------------------------
  const exportCsv = () => {
    const header = ["Timestamp", "Type", "Action", "User", "Details"];
    const rows = filteredLogs.map((l) => [
      l.timestamp,
      l.type,
      l.action,
      l.user,
      l.details,
    ]);

    const csv =
      [header, ...rows]
        .map((r) => r.map((v) => `"${v}"`).join(","))
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "audit_logs.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------
  return (
    <div className="flex flex-col h-full text-white">
      {/* HEADER */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-1">Audit Trail</h1>
          <p className="text-gray-400 text-sm">
            Track all changes and actions in your LLMOps platform
          </p>
        </div>

        <button
          onClick={exportCsv}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 bg-[#161a23] text-sm font-bold"
        >
          <Download size={16} />
          Export Logs
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search logs..."
            className="w-full bg-[#161a23] border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none"
          />
        </div>

                {/* TYPE FILTER */}
        <div className="relative">
        <button
            onClick={() => setShowTypeDropdown((v) => !v)}
            className="flex items-center gap-2 px-4 py-3 bg-[#161a23] border border-gray-800 rounded-xl text-sm font-bold"
        >
            {typeFilter}
            <ChevronDown size={14} />
        </button>

        {showTypeDropdown && (
        <div className="absolute right-0 mt-2 w-44 bg-[#0f1117] border border-gray-800 rounded-xl overflow-hidden z-20">
            {["All Types", "Evaluator", "Template"].map((t) => {
                const isSelected = typeFilter === t;

                return (
                <button
                    key={t}
                    onClick={() => {
                    setTypeFilter(t);
                    setShowTypeDropdown(false);
                    }}
                    className="
                    w-full text-left px-4 py-2 text-sm flex items-center gap-2 
                    text-gray-300 hover:bg-[#14b8a6] hover:text-white
                    "
                >
                    {/* Only show the ✓ when selected (white, like screenshot) */}
                    {isSelected && <span className="text-white text-xs">✔</span>}

                    {t}
                </button>
                );
            })}
            </div>
        )
        
        }
        </div>



      </div>

      {/* TABLE */}
      <div className="flex-1 bg-[#161a23] border border-gray-800 rounded-3xl overflow-hidden">
        <div className="px-8 py-5 border-b border-gray-800 font-bold">
          Audit Logs ({filteredLogs.length})
        </div>

        {loading ? (
          <div className="p-20 text-center text-gray-500">
            Loading audit logs…
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-20 text-center text-gray-500">
            No audit logs found
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 text-xs uppercase text-gray-500">
                <th className="px-8 py-4">Timestamp</th>
                <th className="px-4 py-4">Type</th>
                <th className="px-4 py-4">Action</th>
                <th className="px-4 py-4">User</th>
                <th className="px-4 py-4">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((l) => (
                <tr
                  key={l.id}
                  className="border-b border-gray-800/40 hover:bg-[#1c212e]/50"
                >
                  <td className="px-8 py-4 text-sm text-gray-400">
                    {new Date(l.timestamp).toLocaleString()}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`px-3 py-1 text-[10px] font-black uppercase rounded-full border ${
                        TYPE_COLORS[l.type] ??
                        "bg-gray-500/10 text-gray-400 border-gray-500/20"
                      }`}
                    >
                      {l.type}
                    </span>
                  </td>

                  <td className="px-4 py-4 font-bold text-sm">
                    {l.action}
                  </td>

                  <td className="px-4 py-4 text-sm text-gray-400">
                    {l.user}
                  </td>

                  <td className="px-4 py-4 text-sm text-gray-400">
                    {l.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Audit;

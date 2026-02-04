import { useEffect, useState } from "react";
import { api, type Trace } from "../api/client";

export default function Traces() {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/traces")
      .then((res) => {
        setTraces(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-gray-300">Loading...</div>;

  return (
    <div className="p-6">
      <h2 className="text-3xl font-semibold mb-2 text-gray-200">Traces</h2>
      <p className="text-gray-500 mb-4">{traces.length} traces</p>

      <div className="overflow-x-auto rounded-xl border border-[#1f242d] bg-[#0d1117] shadow-xl">
        <table className="min-w-full">
          <thead className="bg-[#161b22] border-b border-[#1f242d]">
            <tr>
              <th className="text-left p-3 font-medium text-gray-400">Timestamp</th>
              <th className="text-left p-3 font-medium text-gray-400">Name (ID)</th>
              <th className="text-left p-3 font-medium text-gray-400 w-1/3">Input</th>
              <th className="text-left p-3 font-medium text-gray-400">Latency</th>
              <th className="text-left p-3 font-medium text-gray-400">Tokens</th>
              <th className="text-left p-3 font-medium text-gray-400">Cost</th>
              <th className="text-left p-3 font-medium text-gray-400">Scores</th>
            </tr>
          </thead>

          <tbody>
            {traces.map((t) => (
              <tr
                key={t.trace_id}
                className="border-b border-[#1f242d] hover:bg-[#1a1f27] transition"
              >
                <td className="p-3 text-sm text-gray-300 whitespace-nowrap">
                  {t.timestamp ? new Date(t.timestamp).toLocaleString() : "-"}
                </td>

                <td
                  className="p-3 text-sm font-mono text-gray-300"
                  title={t.trace_id}
                >
                  {t.trace_id.slice(0, 8)}...
                </td>

                <td
                  className="p-3 text-sm text-gray-300 truncate max-w-xs"
                  title={t.input || t["question"]}
                >
                  {t.input || t["question"]}
                </td>

                <td className="p-3 text-sm text-gray-300">
                  {t.latency_ms || t.latency}ms
                </td>

                <td className="p-3 text-sm text-gray-300">{t.tokens}</td>

                <td className="p-3 text-sm text-gray-300">
                  ${t.cost?.toFixed(5)}
                </td>

                <td className="p-3 text-sm text-gray-300">
                  <div className="flex gap-2 flex-wrap">
                    {t.scores &&
                      Object.entries(t.scores).map(([k, v]) => (
                        <span
                          key={k}
                          className={`
                            px-3 py-1 rounded-full text-xs font-semibold
                            ${
                              v < 0.3
                                ? "bg-[#3a1d16] text-[#ffb29b]"
                                : v < 0.6
                                ? "bg-[#2f1e0a] text-[#fcd34d]"
                                : "bg-[#0d2a1f] text-[#6ee7b7]"
                            }
                          `}
                        >
                          {k}: {v.toFixed(2)}
                        </span>
                      ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

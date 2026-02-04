import React, { useState, useEffect } from "react";
import {
    Database,
    Play,
    Search,
    TrendingUp,
    Plus,
    CheckCircle2
} from "lucide-react";

interface Dataset {
    name: string;
    path: string;
    description?: string;
}

interface DatasetItem {
    id: string;
    dataset_name: string;
    category: string;
    input: {
        question: string;
        context: string;
    };
    expected_output: {
        answer: string;
        key_facts: string[];
    };
    metadata: {
        difficulty: string;
        risk_level: string;
        domain: string;
        verified_by?: string;
    };
}

const Datasets: React.FC = () => {
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
    const [datasetItems, setDatasetItems] = useState<DatasetItem[]>([]);
    const [activeTab, setActiveTab] = useState<"items" | "runs" | "trends">("items");
    const [searchTerm] = useState("");
    const [runningEval, setRunningEval] = useState<string | null>(null);

    const API_BASE = "http://localhost:8000";

    useEffect(() => {
        fetchDatasets();
    }, []);

    useEffect(() => {
        if (selectedDataset) {
            fetchDatasetContent(selectedDataset);
        }
    }, [selectedDataset]);

    const fetchDatasets = async () => {
        try {
            const resp = await fetch(`${API_BASE}/datasets`);
            const data = await resp.json();
            // Injecting descriptions for UI demo match as seen in screenshots
            const datasetsWithDesc = data.map((ds: Dataset) => {
                if (ds.name === "qa_golden_set") {
                    return { ...ds, description: "Curated set of 150 high-quality question-answer pairs for evaluation" };
                } else if (ds.name === "safety_critical_scenarios") {
                    return { ...ds, description: "Edge cases and safety-critical queries requiring accurate responses" };
                } else if (ds.name === "multi_hop_reasoning") {
                    return { ...ds, description: "Complex queries requiring multi-step reasoning and document synthesis" };
                }
                return { ...ds, description: "Custom dataset for localized model evaluation and testing" };
            });
            setDatasets(datasetsWithDesc);
            if (data.length > 0 && !selectedDataset) {
                setSelectedDataset(data[0].name);
            }
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch datasets", err);
            setLoading(false);
        }
    };

    const fetchDatasetContent = async (name: string) => {
        try {
            const resp = await fetch(`${API_BASE}/datasets/${name}`);
            const data = await resp.json();
            setDatasetItems(data);
        } catch (err) {
            console.error("Failed to fetch dataset content", err);
        }
    };

    const runEvaluation = async (name: string) => {
        setRunningEval(name);
        try {
            await fetch(`${API_BASE}/datasets/${name}/run`, {
                method: "POST",
            });
            // Evaluation triggered successfully
        } catch (err) {
            console.error("Failed to run evaluation", err);
        } finally {
            setRunningEval(null);
        }
    };

    const filteredItems = datasetItems.filter(item =>
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.input.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full text-[#13bba4]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-currentColor"></div>
            </div>
        );
    }

    const currentDataset = datasets.find(d => d.name === selectedDataset);

    return (
        <div className="flex flex-col h-full bg-[#0e1117] text-white">
            {/* Top Toolbar */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Datasets</h1>
                    <p className="text-gray-400 text-sm mt-1">Gold set evaluation and test datasets</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-[#13bba4] text-black font-bold rounded-lg hover:bg-[#11aa95] transition-colors text-sm shadow-lg shadow-[#13bba4]/10">
                    <Plus size={18} />
                    New Dataset
                </button>
            </div>

            <div className="flex gap-8 flex-1 overflow-hidden">
                {/* Sidebar */}
                <div className="w-96 flex flex-col gap-4">
                    <div className="bg-[#161a23] border border-gray-800 rounded-2xl overflow-hidden shadow-xl flex flex-col min-h-0">
                        <div className="p-4 border-b border-gray-800 bg-[#1c212e]">
                            <h3 className="font-bold text-gray-400 uppercase text-[10px] tracking-[0.15em]">Your Datasets</h3>
                        </div>
                        <div className="overflow-y-auto custom-scrollbar">
                            {datasets.map((ds) => (
                                <button
                                    key={ds.name}
                                    onClick={() => setSelectedDataset(ds.name)}
                                    className={`w-full text-left p-6 transition-all border-l-4 ${selectedDataset === ds.name
                                            ? "bg-[#1c212e] border-[#13bba4]"
                                            : "hover:bg-[#1c212e]/50 border-transparent text-gray-400"
                                        }`}
                                >
                                    <div className="flex flex-col gap-2">
                                        <span className={`font-bold text-base ${selectedDataset === ds.name ? "text-white" : "text-gray-400"}`}>
                                            {ds.name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                        </span>
                                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                                            {ds.description}
                                        </p>
                                        <div className="flex items-center gap-4 mt-2">
                                            <span className="px-2.5 py-1 bg-[#13bba4] text-black text-[9px] font-black rounded tracking-widest uppercase">
                                                EVALUATION
                                            </span>
                                            <span className="text-[10px] text-gray-500 font-bold opacity-80">
                                                {ds.name === "qa_golden_set" ? "150 items" : ds.name === "safety_critical_scenarios" ? "75 items" : "50 items"}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main View Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#0e1117]">
                    {selectedDataset && (
                        <div className="flex flex-col h-full">
                            {/* Content Header Card */}
                            <div className="bg-[#161a23] border border-gray-800 rounded-2xl p-6 mb-8 shadow-sm">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center border border-gray-700">
                                            <Database className="text-[#13bba4]" size={28} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-white tracking-tight">
                                                {selectedDataset.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                            </h2>
                                            <p className="text-sm text-gray-500 mt-1 font-medium italic opacity-80">
                                                {currentDataset?.description}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-10">
                                        <button
                                            onClick={() => runEvaluation(selectedDataset)}
                                            disabled={!!runningEval}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-[#13bba4] text-black font-black rounded-lg hover:bg-[#11aa95] transition-all shadow-lg shadow-[#13bba4]/10 active:scale-95 disabled:bg-gray-700 disabled:text-gray-400"
                                        >
                                            <Play size={16} fill="currentColor" />
                                            RUN EVALUATION
                                        </button>

                                        {/* Tabs Pill */}
                                        <div className="flex gap-1 p-1 bg-black/60 rounded-xl w-fit border border-gray-800 shadow-inner self-start">
                                            <button
                                                onClick={() => setActiveTab("items")}
                                                className={`px-10 py-2.5 rounded-lg text-[11px] font-black tracking-widest uppercase transition-all ${activeTab === "items"
                                                        ? "bg-gray-800 text-white shadow-xl shadow-black/20"
                                                        : "text-gray-500 hover:text-gray-300"
                                                    }`}
                                            >
                                                Items
                                            </button>
                                            <button
                                                onClick={() => setActiveTab("runs")}
                                                className={`px-10 py-2.5 rounded-lg text-[11px] font-black tracking-widest uppercase transition-all ${activeTab === "runs"
                                                        ? "bg-gray-800 text-white shadow-xl shadow-black/20"
                                                        : "text-gray-500 hover:text-gray-300"
                                                    }`}
                                            >
                                                Evaluation Runs
                                            </button>
                                            <button
                                                onClick={() => setActiveTab("trends")}
                                                className={`px-10 py-2.5 rounded-lg text-[11px] font-black tracking-widest uppercase transition-all ${activeTab === "trends"
                                                        ? "bg-gray-800 text-white shadow-xl shadow-black/20"
                                                        : "text-gray-500 hover:text-gray-300"
                                                    }`}
                                            >
                                                Trends
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Items Scroll Area */}
                            <div className="flex-1 overflow-y-auto pr-3 custom-scrollbar">
                                {activeTab === "items" ? (
                                    <div className="space-y-8 pb-10">
                                        {filteredItems.map((item, index) => (
                                            <div key={item.id} className="bg-[#161a23] border border-gray-800 rounded-3xl p-8 shadow-sm transition-all hover:bg-[#1c212e] border-t-2 border-t-transparent hover:border-t-[#13bba4]/40">
                                                <div className="flex justify-between items-center mb-8">
                                                    <h4 className="text-xs font-black text-gray-300 uppercase tracking-[0.2em] opacity-60">Item #{index + 1}</h4>
                                                    <span className="flex items-center gap-2 px-3.5 py-1 bg-green-500/10 border border-green-500/30 text-green-500 rounded-full text-[10px] font-black tracking-wider uppercase">
                                                        <CheckCircle2 size={13} />
                                                        Verified
                                                    </span>
                                                </div>

                                                <div className="space-y-8">
                                                    <div>
                                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.25em] block mb-3 pl-1 opacity-80">Input Query</label>
                                                        <div className="bg-[#0e1117] border border-gray-800 rounded-2xl p-6 text-gray-300 text-[14px] leading-relaxed font-semibold">
                                                            {item.input.question}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.25em] block mb-3 pl-1 opacity-80">Expected Output</label>
                                                        <div className="bg-[#0e1117] border border-gray-800 rounded-2xl p-6 text-gray-400 text-[13.5px] leading-relaxed whitespace-pre-wrap font-medium">
                                                            {item.expected_output.answer}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-8 mt-10 pt-8 border-t border-gray-800/60">
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest pl-1">Difficulty:</span>
                                                        <span className="text-[11px] text-gray-300 font-black uppercase tracking-tight bg-gray-800/50 px-3 py-1 rounded-lg border border-gray-700">
                                                            {item.metadata.difficulty}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Domain:</span>
                                                        <span className="text-[11px] text-teal-400 font-black uppercase tracking-tight bg-teal-500/5 px-3 py-1 rounded-lg border border-teal-500/10">
                                                            {item.metadata.domain || "knowledge base"}
                                                        </span>
                                                    </div>
                                                    <div className="ml-auto text-[10px] text-gray-600 font-bold tracking-tight italic opacity-60 flex items-center gap-2">
                                                        Verified by expert@factory.com
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {filteredItems.length === 0 && (
                                            <div className="flex flex-col items-center justify-center py-32 bg-[#161a23] border border-gray-800 rounded-3xl text-gray-500 opacity-60 italic tracking-widest">
                                                <Search size={40} className="mb-4 opacity-20" />
                                                No dataset items found for "{searchTerm}"
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-[#161a23] border border-gray-800 rounded-3xl p-20 text-center flex flex-col items-center justify-center">
                                        <TrendingUp size={64} className="mx-auto mb-6 text-[#13bba4] opacity-10" />
                                        <h3 className="text-xl font-bold text-gray-300 mb-2">Detailed Analytics Locked</h3>
                                        <p className="text-sm text-gray-500 max-w-sm font-medium">
                                            Run an evaluation for <strong>{selectedDataset?.replace(/_/g, ' ')}</strong> to generate historical runs and trend indicators.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Datasets;

import React from "react";
import { Activity } from "lucide-react";

const Alerts: React.FC = () => {
    return (
        <div className="flex flex-col h-full text-white">
            <h1 className="text-3xl font-bold tracking-tight mb-8">System Alerts</h1>
            <div className="flex-1 flex items-center justify-center bg-[#161a23] border border-gray-800 rounded-3xl p-20 text-center">
                <div className="max-w-md">
                    <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center border border-gray-700 mx-auto mb-6">
                        <Activity size={40} className="text-[#13bba4]" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-300 mb-2">No Active Incidents</h3>
                    <p className="text-sm text-gray-500 font-medium">
                        Real-time monitoring and threshold alerts are currently disabled. Backend functionality and data connections have been removed for a clean codebase.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Alerts;

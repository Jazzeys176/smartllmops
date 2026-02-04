import React from "react";

const Audit: React.FC = () => {
    return (
        <div className="flex flex-col h-full text-white">
            <h1 className="text-3xl font-bold tracking-tight mb-8">Audit Logs</h1>
            <div className="flex-1 flex items-center justify-center bg-[#161a23] border border-gray-800 rounded-3xl p-20 text-center">
                <div className="max-w-md">
                    <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center border border-gray-700 mx-auto mb-6">
                        <span className="text-4xl">📄</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-300 mb-2">Audit Trails Locked</h3>
                    <p className="text-sm text-gray-500 font-medium">
                        The system audit logs and compliance tracking module is currently empty and pending configuration.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Audit;

'use client';
import { Activity, Beaker, CheckCircle2, ChevronRight, Code2, RefreshCcw, Search, User, Zap } from 'lucide-react';
import React from 'react';

interface AgentTopologyMapProps {
    phase: string;
    isStreaming: boolean;
    isCompleted: boolean;
    jobType?: string;
    revisionNumber?: number;
}

export const AgentTopologyMap: React.FC<AgentTopologyMapProps> = ({
    phase,
    isStreaming,
    isCompleted,
    jobType = 'research',
    revisionNumber = 0
}) => {

    // Node highlighted definitions
    const clarifyActive = isStreaming && phase === 'clarify';
    const executeActive = isStreaming && phase === 'execute';
    const reviewActive = isStreaming && phase === 'review';

    return (
        <div className="w-full relative py-8 px-4 flex flex-col items-center justify-center min-h-[200px] bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)]" />

            {/* SVG Connecting Lines Layer */}
            <svg
                className="absolute inset-0 w-full h-full pointer-events-none z-0"
                style={{ filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.2))' }}
            >
                <defs>
                    <linearGradient id="flow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                        <stop offset="50%" stopColor="#10b981" stopOpacity="1" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
                    </linearGradient>
                    <linearGradient id="flow-gradient-rev" x1="100%" y1="0%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
                        <stop offset="50%" stopColor="#f59e0b" stopOpacity="1" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.2" />
                    </linearGradient>
                    <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
                        <polygon points="0 0, 6 2, 0 4" fill="rgba(255,255,255,0.3)" />
                    </marker>
                    <marker id="arrowhead-active" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
                        <polygon points="0 0, 6 2, 0 4" fill="#10b981" />
                    </marker>
                    <marker id="arrowhead-warn" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
                        <polygon points="0 0, 6 2, 0 4" fill="#f59e0b" />
                    </marker>
                </defs>

                {/* Clarify -> Execute Path */}
                <path
                    d="M 50%,20 C 50%,50 50%,50 50%,70"
                    fill="none"
                    stroke={clarifyActive || executeActive ? "url(#flow-gradient)" : "rgba(255,255,255,0.1)"}
                    strokeWidth={executeActive ? "2" : "1"}
                    strokeDasharray={executeActive ? "4,4" : "none"}
                    markerEnd={`url(#arrowhead${executeActive ? '-active' : ''})`}
                    className={executeActive ? "animate-[dash_1s_linear_infinite]" : ""}
                />

                {/* Execute -> Review Path */}
                <path
                    d="M 50%,110 C 50%,130 50%,130 50%,150"
                    fill="none"
                    stroke={executeActive || reviewActive ? "url(#flow-gradient)" : "rgba(255,255,255,0.1)"}
                    strokeWidth={reviewActive ? "2" : "1"}
                    strokeDasharray={reviewActive ? "4,4" : "none"}
                    markerEnd={`url(#arrowhead${reviewActive ? '-active' : ''})`}
                    className={reviewActive ? "animate-[dash_1s_linear_infinite]" : ""}
                />

                {/* Review -> Execute (Feedback Loop) Path */}
                <path
                    d="M 68%,145 C 95%,145 95%,85 68%,85"
                    fill="none"
                    stroke={revisionNumber > 0 ? "url(#flow-gradient-rev)" : "rgba(255,255,255,0.05)"}
                    strokeWidth={revisionNumber > 0 ? "2" : "1"}
                    strokeDasharray={revisionNumber > 0 ? "4,4" : "none"}
                    markerEnd={`url(#arrowhead${revisionNumber > 0 ? '-warn' : ''})`}
                    className={revisionNumber > 0 && isStreaming ? "animate-[dash_reverse_2s_linear_infinite]" : ""}
                />
            </svg>

            {/* Nodes */}
            <div className="z-10 flex flex-col items-center gap-6 w-full max-w-[200px]">

                {/* Clarify Node */}
                <div className={`relative flex items-center justify-center p-3 rounded-2xl w-full border backdrop-blur-md transition-all duration-500
                    ${clarifyActive
                        ? 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)] scale-105'
                        : isCompleted
                            ? 'bg-neutral-800/40 border-emerald-500/30 text-neutral-400'
                            : 'bg-neutral-900/40 border-white/5 text-neutral-500'}`}
                >
                    <Search className={`w-5 h-5 mr-3 ${clarifyActive ? 'text-emerald-400 animate-pulse' : ''}`} />
                    <span className="text-xs font-bold tracking-widest uppercase">需求解析</span>
                    {clarifyActive && (
                        <div className="absolute -inset-1 rounded-2xl border border-emerald-500/30 animate-ping opacity-20" />
                    )}
                </div>

                {/* Execute Node */}
                <div className={`relative flex flex-col items-center justify-center p-4 rounded-2xl w-full border backdrop-blur-md transition-all duration-500
                    ${executeActive
                        ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.3)] scale-110'
                        : isCompleted
                            ? 'bg-neutral-800/40 border-emerald-500/30 text-neutral-400'
                            : 'bg-neutral-900/40 border-white/5 text-neutral-500'}`}
                >
                    <div className="flex items-center">
                        {jobType === 'code' ? (
                            <Code2 className={`w-6 h-6 mr-3 ${executeActive ? 'text-cyan-400 animate-pulse' : ''}`} />
                        ) : (
                            <Beaker className={`w-6 h-6 mr-3 ${executeActive ? 'text-cyan-400 animate-pulse' : ''}`} />
                        )}
                        <span className="text-sm font-black tracking-widest uppercase">执行内核</span>
                    </div>
                    {revisionNumber > 0 && (
                        <span className="absolute -right-3 -top-3 flex items-center justify-center w-6 h-6 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 rounded-full text-[10px] font-bold z-20">
                            v{revisionNumber + 1}
                        </span>
                    )}
                    {executeActive && (
                        <div className="absolute -inset-1 rounded-2xl border border-cyan-500/30 animate-ping opacity-20" />
                    )}
                </div>

                {/* Review Node */}
                <div className={`relative flex items-center justify-center p-3 rounded-2xl w-full border backdrop-blur-md transition-all duration-500
                    ${reviewActive
                        ? 'bg-purple-500/20 border-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.3)] scale-105'
                        : isCompleted
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)] scale-100'
                            : 'bg-neutral-900/40 border-white/5 text-neutral-500'}`}
                >
                    {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 mr-3 text-emerald-400" />
                    ) : (
                        <CheckCircle2 className={`w-5 h-5 mr-3 ${reviewActive ? 'text-purple-400 animate-pulse' : ''}`} />
                    )}
                    <span className="text-xs font-bold tracking-widest uppercase">{isCompleted ? '评审通过' : '质量评审'}</span>
                    {reviewActive && (
                        <div className="absolute -inset-1 rounded-2xl border border-purple-500/30 animate-ping opacity-20" />
                    )}
                </div>

            </div>

            <style jsx>{`
                @keyframes dash {
                    to { stroke-dashoffset: -8; }
                }
                @keyframes dash_reverse {
                    to { stroke-dashoffset: 8; }
                }
            `}</style>
        </div>
    );
};

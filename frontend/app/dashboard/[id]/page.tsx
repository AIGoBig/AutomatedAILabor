'use client';

import { useEffect, useState, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Terminal, FileCode, Check, Copy, ArrowLeft, Download, AlertTriangle, Activity, XCircle, Bot, Eye, Cpu, ChevronDown, ChevronRight, Send } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import { useAgentStream } from '@/lib/useAgentStream';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Phase indicator icon mapping
const phaseIcons: Record<string, any> = {
    clarify: Eye,
    execute: Cpu,
    review: Bot,
};

const phaseColors: Record<string, string> = {
    clarify: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
    execute: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    review: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
};

const formatStructuralMarkers = (content: string): string => {
    return content
        .replace(/---TASK_SPEC---/g, '\n\n---\n\n**📋 任务规格说明**\n\n---\n\n')
        .replace(/---END_SPEC---/g, '\n\n---\n\n**✅ 规格说明结束**\n\n---\n\n')
        .replace(/---REVIEW---/g, '\n\n---\n\n**🔍 评审意见**\n\n---\n\n')
        .replace(/---END_REVIEW---/g, '\n\n---\n\n**✅ 评审结束**\n\n---\n\n');
};

// Extracted Markdown components wrapper for reuse in streaming and final views
const getMarkdownComponents = (jobType?: string) => ({
    code({ node, inline, className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || '');
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [copied, setCopied] = useState(false);

        const handleCopy = () => {
            navigator.clipboard.writeText(String(children));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        };

        return !inline && match ? (
            <div className="relative group my-8 rounded-xl overflow-hidden border border-white/5 bg-black/40">
                <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                    <div className="flex items-center gap-2 text-xs text-neutral-400">
                        <FileCode size={14} />
                        <span>{match[1].toUpperCase()}</span>
                    </div>
                    <button
                        onClick={handleCopy}
                        className="text-neutral-500 hover:text-white transition-colors p-1 hover:bg-white/5 rounded"
                    >
                        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                </div>
                <SyntaxHighlighter
                    style={vscDarkPlus as any}
                    language={match[1]}
                    PreTag="div"
                    className="!bg-transparent !m-0 !p-4 !text-sm leading-relaxed"
                    {...props}
                >
                    {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
            </div>
        ) : (
            <code className={`${className} bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono text-emerald-300`} {...props}>
                {children}
            </code>
        );
    },
    h1: ({ children }: any) => <h1 className="text-3xl font-black text-white mb-8 tracking-tighter">{children}</h1>,
    h2: ({ children }: any) => <h2 className={`text-xl font-bold text-white mt-12 mb-6 border-l-4 pl-4 ${jobType === 'code' ? 'border-purple-500' : 'border-emerald-500'}`}>{children}</h2>,
    p: ({ children }: any) => <p className="mb-6 text-neutral-400 text-base leading-relaxed">{children}</p>,
    ul: ({ children }: any) => <ul className="space-y-2 mb-6 list-disc list-outside ml-6">{children}</ul>,
    ol: ({ children }: any) => <ol className="space-y-2 mb-6 list-decimal list-outside ml-6">{children}</ol>,
    li: ({ children }: any) => <li className={`text-neutral-400 pl-1 ${jobType === 'code' ? 'marker:text-purple-500' : 'marker:text-emerald-500'}`}>{children}</li>
});

export default function DashboardPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params) as { id: string };
    const { state: stream, startStream, stopStream } = useAgentStream();
    const [job, setJob] = useState<any>(null);
    const [error, setError] = useState('');
    const [streamStarted, setStreamStarted] = useState(false);
    const tokenRef = useRef<HTMLDivElement>(null);
    const [userInput, setUserInput] = useState("");
    const [isSendingFeedback, setIsSendingFeedback] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);
    const [collapsedMessages, setCollapsedMessages] = useState<Set<string>>(new Set());

    const toggleCollapse = (msgId: string) => {
        setCollapsedMessages(prev => {
            const next = new Set(prev);
            if (next.has(msgId)) { next.delete(msgId); } else { next.add(msgId); }
            return next;
        });
    };

    // Auto-collapse previous message when new one arrives
    useEffect(() => {
        if (stream.messages.length > 1) {
            const prevMsg = stream.messages[stream.messages.length - 2];
            if (prevMsg.role !== 'user') {
                setCollapsedMessages(prev => {
                    const next = new Set(prev);
                    next.add(prevMsg.id);
                    return next;
                });
            }
        }
    }, [stream.messages.length]);

    // Smooth auto-scroll with rAF
    useEffect(() => {
        if (tokenRef.current) {
            requestAnimationFrame(() => {
                tokenRef.current?.scrollTo({ top: tokenRef.current.scrollHeight, behavior: 'smooth' });
            });
        }
    }, [stream.messages, stream.logs]);

    // Fetch initial job data, then start streaming if queued/processing
    useEffect(() => {
        if (!id) return;
        if (id === 'start') {
            window.location.href = '/start';
            return;
        }

        const fetchAndStream = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await apiGet(`/api/jobs/${id}`, token);
                if (!res.ok) throw new Error('Job not found');
                const data = await res.json();
                setJob(data);

                // If job is queued or processing, start the SSE stream
                if ((data.status === 'queued' || data.status === 'processing') && !streamStarted) {
                    setStreamStarted(true);
                    startStream(id, token);
                }
            } catch (err) {
                console.error(err);
                setError('无法加载任务详情');
            }
        };

        fetchAndStream();
        return () => stopStream();
    }, [id]);

    // When stream completes, update local job state
    useEffect(() => {
        if (stream.status === 'completed' && stream.finalResult) {
            setJob((prev: any) => ({
                ...prev,
                status: 'completed',
                result: stream.finalResult,
                input_tokens: stream.finalResult.input_tokens,
                output_tokens: stream.finalResult.output_tokens,
                cost: stream.finalResult.cost,
            }));
        } else if (stream.status === 'failed') {
            setJob((prev: any) => ({ ...prev, status: 'failed' }));
        }
    }, [stream.status, stream.finalResult]);

    // Sync stream status to job status for awaiting_input
    useEffect(() => {
        if (stream.status === 'awaiting_input') {
            setJob((prev: any) => prev ? { ...prev, status: 'awaiting_input' } : prev);
        }
    }, [stream.status]);

    // 倒计时启动/关闭
    useEffect(() => {
        if (stream.status === 'awaiting_input') {
            setCountdown(10);
            countdownRef.current = setInterval(() => {
                setCountdown(prev => (prev === null || prev <= 1) ? 0 : prev - 1);
            }, 1000);
        } else {
            setCountdown(null);
            if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
        }
        return () => { if (countdownRef.current) { clearInterval(countdownRef.current); } };
    }, [stream.status]);

    const handleAutoProceed = async () => {
        setIsSendingFeedback(true);
        setCountdown(null);
        if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
        const token = localStorage.getItem('token');
        try {
            const res = await apiPost(`/api/jobs/${id}/continue`, { feedback: '请继续执行' }, token);
            if (res.ok) {
                // Reconnect SSE stream after continue
                stopStream();
                startStream(id, token);
            }
        } catch (err) { console.error('Auto-proceed failed:', err); }
        finally { setIsSendingFeedback(false); }
    };

    // 倒计时归零时自动继续
    useEffect(() => {
        if (countdown === 0 && stream.status === 'awaiting_input' && !isSendingFeedback) {
            handleAutoProceed();
        }
    }, [countdown, stream.status, isSendingFeedback]);

    const handleRetry = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await apiPost(`/api/jobs/${id}/retry`, {}, token);
            if (res.ok) {
                setStreamStarted(false);
                window.location.reload();
            }
        } catch (err) {
            console.error('Retry failed:', err);
        }
    };

    const handleCancel = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await apiPost(`/api/jobs/${id}/cancel`, {}, token);
            if (res.ok) {
                stopStream();
                window.location.reload();
            }
        } catch (err) {
            console.error('Cancel failed:', err);
        }
    };

    const handleSendFeedback = async () => {
        if (!userInput.trim()) return;
        setIsSendingFeedback(true);
        const token = localStorage.getItem('token');
        try {
            const res = await apiPost(`/api/jobs/${id}/continue`, { feedback: userInput }, token);
            if (res.ok) {
                setUserInput("");
                // The stream is technically still open, but the backend changed status.
                // The backend graph resumes, and we'll receive new tokens/phases via the active SSE.
            } else {
                console.error("Failed to send feedback");
            }
        } catch (err) {
            console.error('Send feedback failed:', err);
        } finally {
            setIsSendingFeedback(false);
        }
    };

    if (error) return (
        <div className="min-h-screen bg-neutral-950 text-red-500 flex items-center justify-center">
            Error: {error}
        </div>
    );

    if (!job) return (
        <div className="min-h-screen bg-neutral-950 text-neutral-500 flex items-center justify-center">
            正在连接控制中心...
        </div>
    );

    const isStreaming = stream.status === 'processing' || stream.status === 'connecting';
    const isCompleted = job.status === 'completed' && job.result?.report;
    const isFailed = job.status === 'failed';

    return (
        <div className="h-screen text-neutral-100 font-sans selection:bg-emerald-500/30 flex flex-col overflow-hidden">
            <header className="shrink-0 py-6 px-8 max-w-7xl mx-auto w-full relative z-10">
                {/* Back Button */}
                <button
                    onClick={() => router.push('/dashboard')}
                    className="mb-4 flex items-center gap-2 text-neutral-500 hover:text-white transition-colors group px-4 py-2 rounded-xl hover:bg-white/5 w-fit"
                >
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    返回列表
                </button>

                {/* Status Header */}
                <div className="flex flex-col md:flex-row items-end justify-between gap-4 border-b border-white/5 pb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border ${job?.type === 'code' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                {job?.type === 'code' ? '工程开发' : '深度研究'}
                            </span>
                            <span className="text-neutral-600">/</span>
                            <span className="text-neutral-500 font-mono text-[10px] uppercase font-bold tracking-widest">{id.slice(0, 12)}</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white leading-tight tracking-tighter">
                            {job.goal || '正在加载任务目标...'}
                        </h1>
                    </div>

                    <div className={`px-5 py-2 rounded-2xl border flex items-center gap-3 font-bold transition-all shadow-xl text-sm ${isCompleted ? 'glass-emerald text-emerald-400 border-emerald-500/50' :
                        isFailed ? 'bg-red-500/10 border-red-500 text-red-400' :
                            'glass border-yellow-500/50 text-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.2)]'
                        }`}>
                        <div className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-emerald-400 shadow-[0_0_10px_#10b981]' : isFailed ? 'bg-red-400' : 'bg-yellow-400 animate-pulse shadow-[0_0_10px_#eab308]'}`} />
                        {isCompleted ? '任务已送达' : isFailed ? '任务中断' : '多智能体协作中'}
                    </div>
                </div>
            </header>

            {/* Main Content Layout — fills remaining viewport */}
            <main className="flex-1 min-h-0 px-8 max-w-7xl mx-auto w-full relative z-10 pb-4">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
                    {/* Left Column: Chat / Streaming View */}
                    <div className="lg:col-span-3 flex flex-col h-full min-h-0">

                        {/* ===== STREAMING VIEW & HISTORY ===== */}
                        {(!isFailed || stream.messages.length > 0 || stream.logs.length > 0) && (
                            <div className={`flex flex-col flex-1 min-h-0 ${isCompleted ? 'opacity-90' : ''}`}>
                                {/* Phase Indicator */}
                                {stream.phaseLabel && !isCompleted && (
                                    <div className={`flex items-center gap-4 px-4 py-3 rounded-2xl border transition-all duration-500 shrink-0 mb-3 ${phaseColors[stream.phase] || 'text-neutral-400 border-white/10 bg-white/5'}`}>
                                        {(() => {
                                            const Icon = phaseIcons[stream.phase] || Terminal;
                                            return <Icon size={18} className="animate-pulse" />;
                                        })()}
                                        <div>
                                            <div className="text-sm font-bold">{stream.phaseLabel}</div>
                                            <div className="text-[10px] opacity-60 uppercase tracking-widest font-bold">
                                                {stream.phase === 'clarify' ? '需求分析阶段' : stream.phase === 'execute' ? '生产执行阶段' : stream.phase === 'review' ? '质量评审阶段' : '初始化中'}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Live Streaming Content — chat container */}
                                <div className="p-6 glass rounded-[2rem] shadow-2xl relative flex flex-col flex-1 min-h-0">
                                    {!isCompleted && (
                                        <div className="absolute top-0 right-0 p-6">
                                            <button
                                                onClick={handleCancel}
                                                className="text-[10px] font-black text-red-400/50 hover:text-red-400 transition-colors uppercase tracking-widest flex items-center gap-2 px-3 py-1 rounded-lg border border-red-500/20 hover:bg-red-500/10"
                                            >
                                                <XCircle size={12} />
                                                终止
                                            </button>
                                        </div>
                                    )}

                                    {/* Streaming Title — compact */}
                                    <div className="flex items-center gap-4 mb-4 shrink-0">
                                        <div className={`w-10 h-10 border-[3px] rounded-full shrink-0 ${isCompleted ? 'border-emerald-500 bg-emerald-500/20 flex items-center justify-center' : 'border-emerald-500/20 border-t-emerald-500 animate-spin'}`}>
                                            {isCompleted && <Check className="text-emerald-400 w-5 h-5" />}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white tracking-tight">
                                                {isCompleted ? '多智能体协作完成' : '多智能体协同工作中'}
                                            </h3>
                                            <p className="text-neutral-500 text-xs font-medium">监督 → 执行 → 评审 → 交付</p>
                                        </div>
                                    </div>

                                    {/* Chat Messages — scrollable area */}
                                    <div
                                        ref={tokenRef}
                                        className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-3 border-t border-white/5 pt-4"
                                        style={{ willChange: 'scroll-position', contain: 'layout' }}
                                    >
                                        {stream.messages && stream.messages.length > 0 && stream.messages.map((msg, idx) => {
                                            const isUser = msg.role === 'user';
                                            const isLastMsg = idx === stream.messages.length - 1;
                                            const isCollapsed = collapsedMessages.has(msg.id);

                                            /* === User message bubble === */
                                            if (isUser) {
                                                return (
                                                    <div key={msg.id} className="flex gap-3 p-4 rounded-2xl border bg-white/5 border-white/10 justify-end ml-16 transition-all duration-300">
                                                        <div className="flex-1 overflow-hidden text-right">
                                                            <div className="flex items-center justify-end gap-2 mb-1">
                                                                <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-500">YOU</span>
                                                            </div>
                                                            <div className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                                                                {msg.content}
                                                            </div>
                                                        </div>
                                                        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-lg bg-white/10 text-white">
                                                            <Terminal size={12} />
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            /* === Agent message bubble (collapsible) === */
                                            const roleColor = msg.role === 'supervisor' ? 'amber' : 'emerald';
                                            return (
                                                <div key={msg.id} className={`rounded-2xl border mr-8 transition-all duration-300 ${isCollapsed ? 'p-3' : 'p-4'} bg-${roleColor}-500/10 border-${roleColor}-500/20`}
                                                    style={{ backgroundColor: msg.role === 'supervisor' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', borderColor: msg.role === 'supervisor' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)' }}
                                                >
                                                    {/* Header — always visible, clickable to toggle */}
                                                    <div
                                                        className="flex items-center gap-3 cursor-pointer select-none"
                                                        onClick={() => !isLastMsg && toggleCollapse(msg.id)}
                                                    >
                                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'supervisor' ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                                                            {msg.role === 'supervisor' ? <Bot size={14} /> : <Cpu size={14} />}
                                                        </div>
                                                        <span className={`text-sm font-bold tracking-tight ${msg.role === 'supervisor' ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                            {msg.role === 'supervisor' ? '监督智能体' : '执行智能体'}
                                                        </span>
                                                        <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-500 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                                                            {msg.phaseLabel}
                                                        </span>
                                                        {/* Collapse toggle (not on currently streaming msg) */}
                                                        {!isLastMsg && (
                                                            <button className="ml-auto text-neutral-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5">
                                                                {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                                                            </button>
                                                        )}
                                                        {isStreaming && isLastMsg && (
                                                            <span className={`ml-auto inline-block w-2 h-2 rounded-full animate-pulse ${msg.role === 'supervisor' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                                        )}
                                                    </div>

                                                    {/* Collapsed preview */}
                                                    {isCollapsed && (
                                                        <p className="text-xs text-neutral-500 mt-2 ml-10 line-clamp-1 italic">
                                                            {msg.content.replace(/[#*`>\-]/g, '').slice(0, 100)}...
                                                        </p>
                                                    )}

                                                    {/* Expanded content */}
                                                    {!isCollapsed && (
                                                        <div className="mt-3 ml-10 prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10">
                                                            <ReactMarkdown
                                                                remarkPlugins={[remarkGfm]}
                                                                components={getMarkdownComponents(job?.type)}
                                                            >
                                                                {formatStructuralMarkers(msg.content)}
                                                            </ReactMarkdown>
                                                            {isStreaming && isLastMsg && (
                                                                <span className={`inline-block w-2 h-4 animate-pulse ml-1 align-middle ${msg.role === 'supervisor' ? 'bg-amber-500/50' : 'bg-emerald-500/50'}`} />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {/* Log Timeline — inside scroll */}
                                        {stream.logs.length > 0 && (
                                            <div className="space-y-2 relative pl-7 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-white/10 border-t border-white/5 pt-4 mt-2">
                                                {stream.logs.map((log, idx) => (
                                                    <div key={idx} className="relative group">
                                                        <div className="absolute -left-[21px] top-1.5 w-1.5 h-1.5 rounded-full bg-neutral-700 group-last:bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-colors" />
                                                        <p className={`text-xs ${idx === stream.logs.length - 1 ? 'text-emerald-400 font-bold' : 'text-neutral-500'}`}>
                                                            {log}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Idle state */}
                                        {(!stream.messages || stream.messages.length === 0) && stream.logs.length === 0 && (
                                            <div className="text-sm text-neutral-600 italic py-8 text-center">正在建立与智能体集群的连接...</div>
                                        )}
                                    </div>

                                    {/* Countdown banner + input — sticky bottom of chat card */}
                                    {stream.status === 'awaiting_input' && countdown !== null && countdown > 0 && (
                                        <div className="mt-3 flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5 shrink-0">
                                            <span className="text-xs text-amber-400 font-bold">⏱ 等待您的干预指令，{countdown}秒后自动继续执行...</span>
                                            <button onClick={handleAutoProceed} className="text-xs text-amber-300 hover:text-white font-bold underline">
                                                立即继续
                                            </button>
                                        </div>
                                    )}
                                    {(!isCompleted && !isFailed) && (
                                        <div className="mt-3 pt-3 border-t border-white/5 flex gap-2 shrink-0">
                                            <input
                                                type="text"
                                                value={userInput}
                                                onChange={(e) => setUserInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) handleSendFeedback();
                                                }}
                                                disabled={isSendingFeedback || stream.status !== 'awaiting_input'}
                                                placeholder={stream.status === 'awaiting_input' ? "请输入您的干预意见或补充信息..." : "请等待智能体分析完毕以提供反馈..."}
                                                className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500/50 transition-colors disabled:opacity-40"
                                            />
                                            <button
                                                onClick={handleSendFeedback}
                                                disabled={isSendingFeedback || !userInput.trim() || stream.status !== 'awaiting_input'}
                                                className="px-4 py-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-emerald-500/30 transition-colors flex items-center justify-center shrink-0 gap-2"
                                            >
                                                {isSendingFeedback ? <div className="w-4 h-4 border-2 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin"></div> : <><Send size={14} /> 发送</>}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* FINAL COMPLETION REPORT VIEW */}
                        {isCompleted && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <article className="prose prose-invert max-w-none glass p-10 md:p-16 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={getMarkdownComponents(job?.type)}
                                    >
                                        {formatStructuralMarkers(job.result.report)}
                                    </ReactMarkdown>
                                </article>

                                {/* Bottom Action */}
                                <div className="flex justify-center pt-8">
                                    <button className="flex items-center gap-3 px-8 py-4 glass hover:bg-white/10 text-neutral-400 hover:text-white rounded-2xl transition-all text-sm font-bold shadow-xl">
                                        <Download size={20} />
                                        导出 PDF 报告 (即将推出)
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ERROR VIEW */}
                        {isFailed && (
                            <div className="flex flex-col items-center justify-center py-32 glass rounded-[2.5rem] border-red-500/20 text-center shadow-2xl">
                                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 text-red-400">
                                    <AlertTriangle size={40} />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2 underline decoration-red-500/50 underline-offset-8">部署失败</h3>
                                <p className="text-neutral-400 max-w-md mx-auto mb-8">
                                    {stream.error || '代理在执行过程中遇到了协议错误。'}
                                </p>
                                <div className="flex gap-4">
                                    <button
                                        onClick={handleRetry}
                                        className="px-8 py-3 bg-emerald-500 text-black rounded-xl transition-colors font-bold uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-400"
                                    >
                                        立即重试任务
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Metadata Cards — fixed, no scroll */}
                    <div className="space-y-4 h-full overflow-y-auto pr-1">
                        <section className="p-6 glass rounded-3xl shadow-xl">
                            <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-6 px-1">任务元数据</h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center bg-black/40 p-3 rounded-2xl border border-white/5">
                                    <span className="text-xs text-neutral-500">架构模式</span>
                                    <span className="text-xs font-bold text-white">Multi-Agent v2</span>
                                </div>
                                <div className="flex justify-between items-center bg-black/40 p-3 rounded-2xl border border-white/5">
                                    <span className="text-xs text-neutral-500 font-bold">模型驱动</span>
                                    <span className="text-xs font-bold text-emerald-400">{job.model || 'Gemini 3 Flash'}</span>
                                </div>
                                {(job.input_tokens || stream.finalResult?.input_tokens) && (
                                    <div className="flex justify-between items-center bg-black/40 p-3 rounded-2xl border border-white/5">
                                        <span className="text-xs text-neutral-500">输入能量</span>
                                        <span className="text-xs font-bold text-white font-mono">{(job.input_tokens || stream.finalResult?.input_tokens || 0).toLocaleString()}</span>
                                    </div>
                                )}
                                {(job.output_tokens || stream.finalResult?.output_tokens) && (
                                    <div className="flex justify-between items-center bg-black/40 p-3 rounded-2xl border border-white/5">
                                        <span className="text-xs text-neutral-500">输出能量</span>
                                        <span className="text-xs font-bold text-white font-mono">{(job.output_tokens || stream.finalResult?.output_tokens || 0).toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center bg-black/40 p-3 rounded-2xl border border-white/5">
                                    <span className="text-xs text-neutral-500 font-bold">能源消耗</span>
                                    <span className="text-xs font-bold text-white">
                                        {job.cost ? `${parseFloat(job.cost).toFixed(2)} CRD` : (job.amount || '5.00') + ' CRD'}
                                    </span>
                                </div>
                            </div>
                        </section>

                        {/* Agent Activity Panel */}
                        <section className="p-6 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 rounded-3xl border border-emerald-500/10 glass">
                            <div className="flex items-center gap-2 mb-4 text-emerald-400">
                                <Activity size={14} />
                                <h4 className="text-[10px] font-black uppercase tracking-widest">智能体状态</h4>
                            </div>
                            {isStreaming ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                        <span className="text-xs text-emerald-400 font-bold">在线运行中</span>
                                    </div>
                                    <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                                        {stream.phaseLabel || '正在初始化智能体集群...'}
                                    </p>
                                </div>
                            ) : isCompleted ? (
                                <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                                    任务已完成。监督智能体已验收通过。
                                </p>
                            ) : (
                                <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                                    等待连接...
                                </p>
                            )}
                            {isCompleted && (
                                <button className="mt-4 w-full py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest border border-emerald-500/20">
                                    启动后续任务
                                </button>
                            )}
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}

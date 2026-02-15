'use client';

import { useEffect, useState, use } from 'react';
import Navbar from '@/components/ui/Navbar';
import { useRouter } from 'next/navigation';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Terminal, Code, FileCode, Check, Copy, ArrowLeft, Download, AlertTriangle, Activity, XCircle } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
// We will import these dynamically or use simple rendering if install fails/is slow
// But assuming install works:
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Next.js 15 unwraps params
export default function DashboardPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params) as { id: string };

    const [job, setJob] = useState<any>(null);
    const [error, setError] = useState('');

    const handleRetry = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await apiPost(`/api/jobs/${id}/retry`, {}, token);
            if (res.ok) {
                const data = await res.json();
                console.log('Retry initiated:', data);
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
                const data = await res.json();
                console.log('Cancel initiated:', data);
            }
        } catch (err) {
            console.error('Cancel failed:', err);
        }
    };

    useEffect(() => {
        if (!id) return;
        if (id === 'start') {
            window.location.href = '/start';
            return;
        }

        const fetchJob = async (currentInterval?: NodeJS.Timeout) => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const res = await fetch(`${apiUrl}/api/jobs/${id}`);
                if (!res.ok) throw new Error('Job not found');
                const data = await res.json();
                setJob(data);

                // Smart Polling: Stop if job is finished
                if (data.status === 'completed' || data.status === 'failed') {
                    if (currentInterval) {
                        clearInterval(currentInterval);
                        console.log(`Polling stopped for job ${id} (status: ${data.status})`);
                    }
                }
            } catch (err) {
                console.error(err);
                setError('无法加载任务详情');
            }
        };

        const interval = setInterval(() => fetchJob(interval), 2000);
        fetchJob(interval); // Initial fetch with interval ref
        return () => clearInterval(interval);
    }, [id]);

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

    return (
        <div className="min-h-screen text-neutral-100 font-sans selection:bg-emerald-500/30">
            <main className="py-12 px-8 max-w-5xl mx-auto relative z-10">
                {/* Back Button */}
                <button
                    onClick={() => router.push('/dashboard')}
                    className="mb-8 flex items-center gap-2 text-neutral-500 hover:text-white transition-colors group px-4 py-2 rounded-xl hover:bg-white/5 w-fit"
                >
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    返回列表
                </button>

                {/* Status Header */}
                <div className="mb-12 flex flex-col md:flex-row items-end justify-between gap-6 border-b border-white/5 pb-8">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                            <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border ${job?.type === 'code' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                {job?.type === 'code' ? '工程开发' : '深度研究'}
                            </span>
                            <span className="text-neutral-600">/</span>
                            <span className="text-neutral-500 font-mono text-[10px] uppercase font-bold tracking-widest">{id.slice(0, 12)}</span>
                        </div>
                        <h1 className="text-4xl font-bold text-white mb-2 leading-tight tracking-tighter">
                            {job.goal || '正在加载任务目标...'}
                        </h1>
                    </div>

                    <div className={`px-6 py-3 rounded-2xl border flex items-center gap-3 font-bold transition-all shadow-xl ${job.status === 'completed' ? 'glass-emerald text-emerald-400 border-emerald-500/50' :
                        job.status === 'failed' ? 'bg-red-500/10 border-red-500 text-red-400' :
                            'glass border-yellow-500/50 text-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.2)]'
                        }`}>
                        <div className={`w-2 h-2 rounded-full ${job.status === 'completed' ? 'bg-emerald-400 shadow-[0_0_10px_#10b981]' : job.status === 'failed' ? 'bg-red-400' : 'bg-yellow-400 animate-pulse shadow-[0_0_10px_#eab308]'}`} />
                        {job.status === 'completed' ? '任务已送达' : job.status === 'failed' ? '任务中断' : '正在合成成果'}
                    </div>
                </div>

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Left Column: Result or Process */}
                    <div className="lg:col-span-3">
                        {job.status === 'completed' && job.result?.report ? (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <article className={`prose prose-invert max-w-none glass p-10 md:p-16 rounded-[2.5rem] relative overflow-hidden shadow-2xl`}>
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            code({ node, inline, className, children, ...props }: any) {
                                                const match = /language-(\w+)/.exec(className || '');
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
                                                            style={vscDarkPlus}
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
                                            h1: ({ children }) => <h1 className="text-3xl font-black text-white mb-8 tracking-tighter">{children}</h1>,
                                            h2: ({ children }) => <h2 className={`text-xl font-bold text-white mt-12 mb-6 border-l-4 pl-4 ${job?.type === 'code' ? 'border-purple-500' : 'border-emerald-500'}`}>{children}</h2>,
                                            p: ({ children }) => <p className="mb-6 text-neutral-400 text-base leading-relaxed">{children}</p>,
                                            ul: ({ children }) => <ul className="space-y-3 mb-8 list-none pr-4">{children}</ul>,
                                            li: ({ children }) => <li className={`flex gap-3 text-neutral-400 before:content-['•'] before:font-bold ${job?.type === 'code' ? 'before:text-purple-500' : 'before:text-emerald-500'}`}>{children}</li>
                                        }}
                                    >
                                        {job.result.report}
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
                        ) : job.status === 'failed' ? (
                            <div className="flex flex-col items-center justify-center py-32 glass rounded-[2.5rem] border-red-500/20 text-center shadow-2xl">
                                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 text-red-400">
                                    <AlertTriangle size={40} />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2 underline decoration-red-500/50 underline-offset-8">部署失败</h3>
                                <p className="text-neutral-400 max-w-md mx-auto mb-8">代理在执行过程中遇到了协议错误。这可能是由不稳定的外部 API 连接导致的。</p>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors font-bold uppercase tracking-widest text-xs border border-white/10"
                                    >
                                        查看日志
                                    </button>
                                    <button
                                        onClick={handleRetry}
                                        className="px-8 py-3 bg-emerald-500 text-black rounded-xl transition-colors font-bold uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-400"
                                    >
                                        立即重试任务
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Processing Timeline View */
                            <div className="space-y-6">
                                <div className="p-8 glass rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-6">
                                        <button
                                            onClick={handleCancel}
                                            className="text-[10px] font-black text-red-400/50 hover:text-red-400 transition-colors uppercase tracking-widest flex items-center gap-2 px-3 py-1 rounded-lg border border-red-500/20 hover:bg-red-500/10"
                                        >
                                            <XCircle size={12} />
                                            终止当前行动
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-6 mb-10">
                                        <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-white tracking-tight">代理正在渗透搜索网络...</h3>
                                            <p className="text-neutral-500 font-medium">正在利用 LLM 合成深度洞察，预计剩余时间 45s。</p>
                                        </div>
                                    </div>

                                    {/* Timeline Logs */}
                                    <div className="space-y-4 relative pl-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-white/10">
                                        {(job.result?.logs || []).length > 0 ? (
                                            job.result.logs.map((log: string, idx: number) => (
                                                <div key={idx} className="relative group">
                                                    <div className="absolute -left-[25px] top-1.5 w-2 h-2 rounded-full bg-neutral-700 group-last:bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-colors" />
                                                    <p className={`text-sm ${idx === job.result.logs.length - 1 ? 'text-emerald-400 font-bold' : 'text-neutral-500'}`}>
                                                        {log}
                                                    </p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-sm text-neutral-600 italic">正在等待上行链路响应...</div>
                                        )}
                                    </div>
                                </div>

                                {/* Simulated Preview Skeleton */}
                                <div className="p-8 border border-white/5 border-dashed rounded-[2.5rem] bg-black/40 opacity-40">
                                    <div className="h-4 bg-neutral-800 rounded w-1/3 mb-4"></div>
                                    <div className="h-3 bg-neutral-800 rounded w-full mb-2"></div>
                                    <div className="h-3 bg-neutral-800 rounded w-5/6 mb-2"></div>
                                    <div className="h-3 bg-neutral-800 rounded w-4/6"></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Metadata Cards */}
                    <div className="space-y-6">
                        <section className="p-6 glass rounded-3xl shadow-xl">
                            <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-6 px-1">任务元数据</h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center bg-black/40 p-3 rounded-2xl border border-white/5">
                                    <span className="text-xs text-neutral-500">深度等级</span>
                                    <span className="text-xs font-bold text-white">Ultra (Lv.4)</span>
                                </div>
                                <div className="flex justify-between items-center bg-black/40 p-3 rounded-2xl border border-white/5">
                                    <span className="text-xs text-neutral-500 font-bold">模型驱动</span>
                                    <span className="text-xs font-bold text-emerald-400">{job.model || 'Gemini 3 Flash'}</span>
                                </div>
                                {job.input_tokens && (
                                    <div className="flex justify-between items-center bg-black/40 p-3 rounded-2xl border border-white/5">
                                        <span className="text-xs text-neutral-500">输入能量</span>
                                        <span className="text-xs font-bold text-white font-mono">{job.input_tokens.toLocaleString()}</span>
                                    </div>
                                )}
                                {job.output_tokens && (
                                    <div className="flex justify-between items-center bg-black/40 p-3 rounded-2xl border border-white/5">
                                        <span className="text-xs text-neutral-500">输出能量</span>
                                        <span className="text-xs font-bold text-white font-mono">{job.output_tokens.toLocaleString()}</span>
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

                        <section className="p-6 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 rounded-3xl border border-emerald-500/10 glass">
                            <div className="flex items-center gap-2 mb-4 text-emerald-400">
                                <Activity size={14} />
                                <h4 className="text-[10px] font-black uppercase tracking-widest">代理建议</h4>
                            </div>
                            <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                                基于此研究，建议针对“AI编程助手在初级后端岗位的渗透率”进行进一步的垂直细分搜索。
                            </p>
                            <button className="mt-4 w-full py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest border border-emerald-500/20">
                                启动后续任务
                            </button>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}

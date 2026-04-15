"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { PlusCircle, LayoutDashboard, CheckCircle2, XCircle, Activity, ChevronRight } from 'lucide-react';
import { apiGet } from '@/lib/api';

interface Job {
    job_id: string;
    type: string;
    goal: string;
    status: string;
    created_at: string;
}

export default function DashboardIndex() {
    const router = useRouter();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<{ email: string } | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        fetchJobs(token);
    }, [router]);

    const fetchJobs = async (token: string) => {
        try {
            const res = await apiGet('/api/jobs', token);
            if (res.ok) {
                const data = await res.json();
                setJobs(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 text-white selection:bg-emerald-500/30">
            <main className="py-12 px-8 max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">我的行动</h1>
                        <p className="text-neutral-400">管理并追踪您的自主代理任务。</p>
                    </div>
                    <Link href="/start" className="px-6 py-3 bg-emerald-500 text-black font-bold rounded-lg hover:bg-emerald-400 transition-colors flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                        <PlusCircle size={20} />
                        新任务
                    </Link>
                </div>

                {loading ? (
                    <DashboardSkeleton />
                ) : jobs.length === 0 ? (
                    <div className="text-center py-32 border border-dashed border-white/10 rounded-[2rem] glass">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-500">
                            <LayoutDashboard size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">无活跃行动</h3>
                        <p className="text-neutral-500 max-w-md mx-auto mb-8">您尚未部署任何代理。初始化您的首个任务以在此查看结果。</p>
                        <Link href="/start" className="text-emerald-400 hover:text-emerald-300 font-medium">初始化代理 &rarr;</Link>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {jobs.map((job) => (
                            <Link key={job.job_id} href={`/dashboard/${job.job_id}`} className="block group">
                                <div className="glass rounded-2xl p-6 flex items-center justify-between hover:border-emerald-500/50 hover:bg-white/10 transition-all duration-300">
                                    <div className="flex items-center gap-6">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${job.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                                            job.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                                                'bg-yellow-500/10 text-yellow-400'
                                            }`}>
                                            {job.status === 'completed' ? <CheckCircle2 size={24} /> : job.status === 'failed' ? <XCircle size={24} /> : <Activity size={24} className="animate-pulse" />}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1 text-lg">{job.goal}</h3>
                                            <div className="flex items-center gap-4 mt-1">
                                                <span className="text-[10px] font-bold font-mono text-emerald-500/50 uppercase tracking-widest">{job.type}</span>
                                                <span className="text-xs text-neutral-600">•</span>
                                                <span className="text-xs text-neutral-500">{new Date(job.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${job.status === 'completed' ? 'bg-emerald-500 text-black' :
                                            job.status === 'failed' ? 'text-red-400 bg-red-500/10 border border-red-500/20' :
                                                'text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 animate-pulse'
                                            }`}>
                                            {job.status}
                                        </span>
                                        <ChevronRight size={20} className="text-neutral-600 group-hover:text-emerald-400 transition-colors transform group-hover:translate-x-1" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

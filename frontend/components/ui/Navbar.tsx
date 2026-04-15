"use client";

import Link from 'next/link';

export default function Navbar() {
    return (
        <nav className="fixed w-full z-50 transition-all duration-300 bg-neutral-950/50 backdrop-blur-xl border-b border-white/5">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:rotate-12 transition-transform">
                        <span className="text-white font-bold text-lg">A</span>
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">AutoLabor</span>
                </Link>

                <div className="hidden md:flex items-center gap-8">
                    <Link href="/#features" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">功能介绍</Link>
                    <Link href="/#pricing" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">价格方案</Link>
                    <Link href="/dashboard" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">我的行动</Link>
                    <Link href="/dashboard/settings" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">模型信息</Link>
                    <Link href="/start" className="px-5 py-2 rounded-full bg-emerald-500 text-black font-bold text-sm hover:bg-emerald-400 transition-colors">
                        新任务
                    </Link>
                </div>

                {/* Mobile */}
                <div className="md:hidden flex gap-3">
                    <Link href="/dashboard/settings" className="text-sm text-neutral-400">模型信息</Link>
                    <Link href="/start" className="px-4 py-2 rounded-full bg-emerald-500 text-black font-bold text-sm">
                        新任务
                    </Link>
                </div>
            </div>
        </nav>
    );
}

"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';

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
                </div>

                <AuthButtons />
            </div>
        </nav>
    );
}

function AuthButtons() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        setIsLoggedIn(!!localStorage.getItem('token'));
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        window.location.href = '/';
    };

    if (isLoggedIn) {
        return (
            <div className="flex gap-4 items-center">
                <Link href="/dashboard" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">控制面板</Link>
                <button onClick={handleLogout} className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors">退出登录</button>
                <Link href="/start" className="px-4 py-2 rounded-full bg-emerald-500 text-black font-bold text-sm hover:bg-emerald-400 transition-colors">
                    新任务
                </Link>
            </div>
        );
    }

    return (
        <div className="flex gap-4">
            <Link href="/login" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors flex items-center">登录</Link>
            <Link href="/start" className="group relative px-5 py-2 rounded-full bg-white text-black font-medium text-sm overflow-hidden transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                <span className="relative z-10">开始项目</span>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-100 to-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </Link>
        </div>
    );
}

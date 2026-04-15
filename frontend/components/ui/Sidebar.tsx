"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    PlusCircle,
    Settings,
    LogOut,
    Zap,
    ChevronRight,
    User,
    BarChart3,
    Activity,
    X,
    Key
} from "lucide-react";
import { apiGet } from "@/lib/api";

interface SidebarProps {
    onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [userEmail, setUserEmail] = React.useState<string | null>(null);

    React.useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                const res = await apiGet('/api/users/me', token);
                if (res.ok) {
                    const data = await res.json();
                    setUserEmail(data.email);
                }
            } catch (err) {
                console.error("Failed to fetch user:", err);
            }
        };
        fetchUser();
    }, [pathname]);

    const menuItems = [
        {
            title: "我的行动",
            icon: <LayoutDashboard size={20} />,
            href: "/dashboard",
        },
        {
            title: "发起任务",
            icon: <PlusCircle size={20} />,
            href: "/start",
        },
        {
            title: "调用统计",
            icon: <BarChart3 size={20} />,
            href: "/dashboard/analytics",
        },
        {
            title: "模型状态",
            icon: <Activity size={20} />,
            href: "/dashboard/models",
        },
        {
            title: "API 管理",
            icon: <Key size={20} />,
            href: "/dashboard/api-admin",
        },
        {
            title: "设置",
            icon: <Settings size={20} />,
            href: "/settings",
            disabled: true,
        },
    ];

    const handleLogout = () => {
        localStorage.removeItem("token");
        router.push("/login");
    };

    return (
        <aside className="h-screen w-64 bg-black border-r border-white/5 flex flex-col relative">
            {/* Mobile Close Button */}
            {onClose && (
                <button
                    onClick={onClose}
                    className="md:hidden absolute top-6 right-4 text-neutral-500 hover:text-white z-20"
                >
                    <X size={24} />
                </button>
            )}
            {/* Brand */}
            <div className="p-6 mb-8">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-black font-black text-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] group-hover:scale-110 transition-transform">
                        A
                    </div>
                    <span className="text-xl font-bold tracking-tighter text-white">
                        AutoLabor
                    </span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-2">
                <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-bold px-4 mb-4">
                    操作中心
                </div>
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <div key={item.href}>
                            {item.disabled ? (
                                <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-600 cursor-not-allowed opacity-50">
                                    {item.icon}
                                    <span className="font-medium text-sm">{item.title}</span>
                                </div>
                            ) : (
                                <Link
                                    href={item.href}
                                    onClick={onClose}
                                    className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${isActive
                                        ? "bg-emerald-500/10 text-emerald-400"
                                        : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {item.icon}
                                        <span className="font-medium text-sm">{item.title}</span>
                                    </div>
                                    {isActive && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                    )}
                                    {!isActive && (
                                        <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    )}
                                </Link>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Upgrade / Promotion Box */}
            <div className="px-4 mb-6">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-white/5 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-emerald-400 mb-2">
                            <Zap size={14} fill="currentColor" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">企业方案</span>
                        </div>
                        <p className="text-xs text-neutral-400 leading-relaxed mb-3">
                            部署定制化 AI 群落，加速您的业务交付。
                        </p>
                        <button className="text-[10px] font-bold text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors">
                            了解更多
                        </button>
                    </div>
                </div>
            </div>

            {/* User / Footer */}
            <div className="p-4 border-t border-white/5 bg-neutral-950/50">
                <div className="flex items-center gap-3 px-2 py-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center text-neutral-400">
                        <User size={16} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-bold text-white truncate">{userEmail || "Operator"}</p>
                        <p className="text-[10px] text-neutral-500 truncate">Standard Access</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium"
                >
                    <LogOut size={18} />
                    退出登录
                </button>
            </div>
        </aside>
    );
}

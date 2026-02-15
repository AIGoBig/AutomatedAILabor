"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/ui/Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Define routes that should NOT have a sidebar (e.g., landing page, login, signup)
    const noSidebarRoutes = ["/", "/login", "/signup"];
    const showSidebar = !noSidebarRoutes.includes(pathname);

    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    if (!showSidebar) {
        return <>{children}</>;
    }

    return (
        <div className="flex min-h-screen text-white relative">
            {/* Apple-style Mesh Background */}
            <div className="mesh-bg">
                <div className="mesh-blob blob-1" />
                <div className="mesh-blob blob-2" />
                <div className="mesh-blob blob-3" />
            </div>

            {/* Sidebar - Hidden on mobile by default */}
            <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
            </div>

            {/* Mobile Tool Bar (Only shows on small screens) */}
            <div className="md:hidden fixed top-4 left-4 z-40">
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-emerald-400 shadow-xl"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
                </button>
            </div>

            {/* Overlay for mobile */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col relative z-10">
                <main className="flex-1 bg-noise">
                    <div className="absolute inset-0 bg-grid-white opacity-[0.05] pointer-events-none sticky"></div>
                    {children}
                </main>
            </div>
        </div>
    );
}

"use client";

import React from "react";
import { Key, ExternalLink } from "lucide-react";

export default function ApiAdminPage() {
    return (
        <div className="h-[calc(100vh-0px)] flex flex-col">
            {/* Header */}
            <div className="px-8 py-6 border-b border-white/5 bg-black/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                            <Key size={20} className="text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">API 管理</h1>
                            <p className="text-sm text-neutral-400">管理大模型 API 密钥和渠道配置</p>
                        </div>
                    </div>
                    <a
                        href="http://api.ecodeai.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-neutral-300 transition-all"
                    >
                        <ExternalLink size={14} />
                        新窗口打开
                    </a>
                </div>
            </div>

            {/* Iframe Container */}
            <div className="flex-1 bg-neutral-950">
                <iframe
                    src="http://api.ecodeai.com"
                    className="w-full h-full border-0"
                    title="API Management"
                    allow="clipboard-read; clipboard-write"
                />
            </div>
        </div>
    );
}

"use client";

import { Code2, Puzzle, Workflow, Users, Sparkles, Lock } from 'lucide-react';

const communityFeatures = [
    {
        id: 'agent-market',
        title: 'Agent 市场',
        description: '分享和发现由社区构建的 AI Agent。贡献您的智能体，复用他人的优秀成果。',
        icon: Code2,
        tags: ['Agent 贡献', 'Agent 发现', '复用共享'],
        comingSoon: true,
        color: 'emerald',
    },
    {
        id: 'skills-hub',
        title: 'Skills 共享',
        description: '上传您的专业技能模块。让社区 Agent 获得新的能力，如数据处理、API 集成等。',
        icon: Puzzle,
        tags: ['Skill 开发', '能力扩展', '技能库'],
        comingSoon: true,
        color: 'purple',
    },
    {
        id: 'workflow-builder',
        title: 'Workflow 构建器',
        description: '基于代码 Agent 构建复杂工作流。串联多个 Agent 和 Skills，实现自动化流水线。',
        icon: Workflow,
        tags: ['流程编排', '多 Agent 协作', '自动化'],
        comingSoon: true,
        color: 'cyan',
    },
    {
        id: 'community',
        title: '开发者社区',
        description: '加入开发者社区，交流 AI Agent 构建经验，参与开源项目，共同推动技术发展。',
        icon: Users,
        tags: ['经验交流', '开源协作', '技术分享'],
        comingSoon: true,
        color: 'amber',
    },
];

const colorConfig: Record<string, {
    bg: string;
    border: string;
    iconBg: string;
    iconColor: string;
    tagBg: string;
    tagBorder: string;
    tagText: string;
    badgeBg: string;
    badgeBorder: string;
    badgeText: string;
    hoverBorder: string;
}> = {
    emerald: {
        bg: 'bg-neutral-900/50',
        border: 'border-white/5',
        iconBg: 'bg-emerald-500/10',
        iconColor: 'text-emerald-400',
        tagBg: 'bg-emerald-500/10',
        tagBorder: 'border-emerald-500/20',
        tagText: 'text-emerald-400',
        badgeBg: 'bg-emerald-500/10',
        badgeBorder: 'border-emerald-500/30',
        badgeText: 'text-emerald-400',
        hoverBorder: 'hover:border-emerald-500/30',
    },
    purple: {
        bg: 'bg-neutral-900/50',
        border: 'border-white/5',
        iconBg: 'bg-purple-500/10',
        iconColor: 'text-purple-400',
        tagBg: 'bg-purple-500/10',
        tagBorder: 'border-purple-500/20',
        tagText: 'text-purple-400',
        badgeBg: 'bg-purple-500/10',
        badgeBorder: 'border-purple-500/30',
        badgeText: 'text-purple-400',
        hoverBorder: 'hover:border-purple-500/30',
    },
    cyan: {
        bg: 'bg-neutral-900/50',
        border: 'border-white/5',
        iconBg: 'bg-cyan-500/10',
        iconColor: 'text-cyan-400',
        tagBg: 'bg-cyan-500/10',
        tagBorder: 'border-cyan-500/20',
        tagText: 'text-cyan-400',
        badgeBg: 'bg-cyan-500/10',
        badgeBorder: 'border-cyan-500/30',
        badgeText: 'text-cyan-400',
        hoverBorder: 'hover:border-cyan-500/30',
    },
    amber: {
        bg: 'bg-neutral-900/50',
        border: 'border-white/5',
        iconBg: 'bg-amber-500/10',
        iconColor: 'text-amber-400',
        tagBg: 'bg-amber-500/10',
        tagBorder: 'border-amber-500/20',
        tagText: 'text-amber-400',
        badgeBg: 'bg-amber-500/10',
        badgeBorder: 'border-amber-500/30',
        badgeText: 'text-amber-400',
        hoverBorder: 'hover:border-amber-500/30',
    },
};

export default function CommunitySection() {
    return (
        <section id="community" className="py-24 px-6 relative z-10 bg-neutral-950">
            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-purple-500/5 blur-[120px] -z-10 rounded-full"></div>

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium uppercase tracking-wider mb-6">
                        <Sparkles size={12} />
                        Community
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        社区力量
                    </h2>
                    <p className="text-neutral-500 max-w-2xl mx-auto text-lg">
                        贡献您的 Agent 和 Skills，发现他人的优秀成果。基于社区构建的能力，轻松编排复杂工作流。
                    </p>
                </div>

                {/* Feature Cards Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {communityFeatures.map((feature) => {
                        const colors = colorConfig[feature.color];
                        const Icon = feature.icon;

                        return (
                            <div
                                key={feature.id}
                                className={`relative p-6 rounded-3xl ${colors.bg} border ${colors.border} ${colors.hoverBorder} transition-all duration-300 group cursor-not-allowed opacity-75`}
                            >
                                {/* Coming Soon Badge */}
                                <div className="absolute top-4 right-4">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full ${colors.badgeBg} border ${colors.badgeBorder} ${colors.badgeText} text-[9px] font-bold uppercase tracking-wider`}>
                                        <Lock size={8} />
                                        待上线
                                    </span>
                                </div>

                                {/* Icon */}
                                <div className={`w-12 h-12 rounded-xl ${colors.iconBg} flex items-center justify-center mb-5 ${colors.iconColor} transition-transform group-hover:scale-110`}>
                                    <Icon size={24} />
                                </div>

                                {/* Content */}
                                <h3 className="text-lg font-bold text-white mb-3">{feature.title}</h3>
                                <p className="text-sm text-neutral-500 leading-relaxed mb-5">{feature.description}</p>

                                {/* Tags */}
                                <div className="flex flex-wrap gap-1.5">
                                    {feature.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className={`text-[9px] font-bold px-2 py-1 rounded-md border ${colors.tagBg} ${colors.tagBorder} ${colors.tagText}`}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* CTA Banner */}
                <div className="relative rounded-3xl bg-neutral-900/50 border border-white/5 p-8 md:p-12 text-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-cyan-500/5 to-emerald-500/5"></div>
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-800 border border-white/10 text-neutral-400 text-xs font-medium uppercase tracking-wider mb-6">
                            <Lock size={12} />
                            Coming Soon
                        </div>
                        <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                            共建 AI Agent 生态
                        </h3>
                        <p className="text-neutral-500 max-w-lg mx-auto mb-8">
                            我们正在构建一个开放的社区平台，让开发者可以分享 Agent、Skills 和 Workflow。
                            敬请期待， soon 您将能够贡献自己的成果，复用他人的优秀设计。
                        </p>
                        <div className="flex flex-wrap justify-center gap-4 text-sm text-neutral-600">
                            <span className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-neutral-700"></div>
                                Agent 贡献
                            </span>
                            <span className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-neutral-700"></div>
                                Skills 共享
                            </span>
                            <span className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-neutral-700"></div>
                                Workflow 编排
                            </span>
                            <span className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-neutral-700"></div>
                                开发者社区
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

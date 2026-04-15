'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Search, CheckCircle, Code2, Cpu, Zap, Activity, ArrowRight, Workflow, Box, PlusCircle,
    Navigation, Server, GitBranch, Lightbulb, Terminal, ClipboardList, Sparkles
} from 'lucide-react';
import { apiPost } from '@/lib/api';

// Workflow type definitions with default prompts
interface WorkflowType {
    id: string;
    title: string;
    description: string;
    icon: React.ElementType;
    color: string;
    tags: string[];
    defaultPrompt: string;
    category: 'general' | 'automotive' | 'specialized';
    isNew?: boolean;
    comingSoon?: boolean;
}

const workflowTypes: WorkflowType[] = [
    // General Scenarios
    {
        id: 'research',
        title: '深度研究',
        description: '全面的市场分析、竞争对手解析或特定主题探索。',
        icon: Search,
        color: 'emerald',
        tags: ['Web Search', 'Data Analysis', 'Doc Gen'],
        defaultPrompt: '全球 AI 行业 2026 年度预测报告',
        category: 'general'
    },
    {
        id: 'code',
        title: '编程任务',
        description: '自动化代码编写、架构设计、重构或算法开发。',
        icon: Code2,
        color: 'purple',
        tags: ['Python Sandbox', 'Code Review', 'React/Next.js'],
        defaultPrompt: '构建一个基于 FastAPI 的 JWT 权限认证系统',
        category: 'general'
    },
    {
        id: 'general-ai-research',
        title: '通用 AI 研究',
        description: 'AI 领域技术突破分析、趋势洞察与战略报告。',
        icon: Lightbulb,
        color: 'sky',
        tags: ['Literature Review', 'Trend Analysis', 'Doc Gen'],
        defaultPrompt: '综合分析 2025 年 AI 领域最重要的 10 项技术突破，评估其对产业的短期与长期影响，撰写面向高管层的战略洞察报告',
        category: 'general',
        isNew: true
    },
    {
        id: 'coding-assistant',
        title: '编程 AI 助手',
        description: '构建智能代码补全、调试与重构工具。',
        icon: Terminal,
        color: 'violet',
        tags: ['Code Gen', 'Debug', 'Refactor'],
        defaultPrompt: '构建一个带有流式输出的 Python 代码补全 CLI 工具，基于 OpenAI API，支持多文件上下文注入与交互式 REPL 模式',
        category: 'general',
        isNew: true
    },
    {
        id: 'llm-evaluation',
        title: 'LLM 评估报告',
        description: '为企业 RAG 系统设计完整的 LLM 评估框架。',
        icon: ClipboardList,
        color: 'teal',
        tags: ['Eval Design', 'RAGAS', 'Report'],
        defaultPrompt: '为企业私有化部署的 RAG 问答系统设计完整的 LLM 评估框架，覆盖忠实度、相关性、幻觉率等核心指标，生成可复现评测 Pipeline 设计文档',
        category: 'general',
        isNew: true
    },
    {
        id: 'workflow',
        title: '任务转 Workflow',
        description: '将单次对话任务沉淀为标准化的工作流引擎节点。',
        icon: Workflow,
        color: 'amber',
        tags: ['Node Extraction', 'Pipeline Builder'],
        defaultPrompt: '将用户需求收集到报告生成的完整流程，沉淀为可复用的 Dify 工作流节点',
        category: 'general',
        comingSoon: true
    },
    // Automotive & Specialized
    {
        id: 'auto-driving',
        title: '自动驾驶研究',
        description: '自动驾驶技术栈分析、感知算法与商业化进展研究。',
        icon: Navigation,
        color: 'cyan',
        tags: ['Perception Research', 'Dataset Analysis', 'Safety Report'],
        defaultPrompt: '深度分析 2025 年国内外自动驾驶 L3/L4 商业化落地进展，重点覆盖感知算法、监管政策与主要玩家技术路线对比',
        category: 'automotive',
        isNew: true
    },
    {
        id: 'compute-planning',
        title: '算力规划',
        description: 'GPU 集群规划、模型训练成本估算与基础设施方案。',
        icon: Server,
        color: 'orange',
        tags: ['GPU Benchmarking', 'Cost Modeling', 'Infra Report'],
        defaultPrompt: '为大规模 AI 训练集群（千卡规模）制定 GPU 选型、网络拓扑与 TCO 成本分析报告，对比 H100/H20/国产芯片方案',
        category: 'automotive',
        isNew: true
    },
    {
        id: 'agent-architecture',
        title: 'AI Agent 架构设计',
        description: '多智能体系统架构设计、LangGraph workflow 构建。',
        icon: GitBranch,
        color: 'indigo',
        tags: ['LangGraph', 'System Design', 'Doc Gen'],
        defaultPrompt: '设计一个面向企业的多 Agent 协作系统架构，覆盖任务分发、状态管理、工具调用与人工干预节点，输出完整架构设计文档',
        category: 'automotive',
        isNew: true
    },
    {
        id: 'perf-benchmark',
        title: '性能基准测试',
        description: '模型推理性能基准测试、芯片对比与优化方案。',
        icon: Activity,
        color: 'rose',
        tags: ['Benchmark Design', 'Data Analysis', 'Visualization'],
        defaultPrompt: '对主流大语言模型在代码生成任务上进行系统性基准测试，输出量化对比报告与可视化图表方案',
        category: 'automotive',
        isNew: true
    },
];

// Color configuration for Tailwind v4 (static class names)
const colorConfig: Record<string, {
    activeBorder: string;
    activeBg: string;
    activeIcon: string;
    idleIcon: string;
    tagBg: string;
    checkColor: string;
    shadow: string;
}> = {
    emerald: {
        activeBorder: 'border-emerald-500',
        activeBg: 'bg-emerald-500/10',
        activeIcon: 'bg-emerald-500 text-black',
        idleIcon: 'bg-white/5 text-emerald-400 group-hover:bg-emerald-500/20',
        tagBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        checkColor: 'text-emerald-500',
        shadow: 'shadow-[0_0_30px_rgba(16,185,129,0.3)]'
    },
    purple: {
        activeBorder: 'border-purple-500',
        activeBg: 'bg-purple-500/10',
        activeIcon: 'bg-purple-500 text-black',
        idleIcon: 'bg-white/5 text-purple-400 group-hover:bg-purple-500/20',
        tagBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        checkColor: 'text-purple-500',
        shadow: 'shadow-[0_0_30px_rgba(168,85,247,0.3)]'
    },
    amber: {
        activeBorder: 'border-amber-500',
        activeBg: 'bg-amber-500/10',
        activeIcon: 'bg-amber-500 text-black',
        idleIcon: 'bg-white/5 text-amber-400 group-hover:bg-amber-500/20',
        tagBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        checkColor: 'text-amber-500',
        shadow: 'shadow-[0_0_30px_rgba(245,158,11,0.3)]'
    },
    cyan: {
        activeBorder: 'border-cyan-500',
        activeBg: 'bg-cyan-500/10',
        activeIcon: 'bg-cyan-500 text-black',
        idleIcon: 'bg-white/5 text-cyan-400 group-hover:bg-cyan-500/20',
        tagBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        checkColor: 'text-cyan-500',
        shadow: 'shadow-[0_0_30px_rgba(6,182,212,0.3)]'
    },
    orange: {
        activeBorder: 'border-orange-500',
        activeBg: 'bg-orange-500/10',
        activeIcon: 'bg-orange-500 text-black',
        idleIcon: 'bg-white/5 text-orange-400 group-hover:bg-orange-500/20',
        tagBg: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        checkColor: 'text-orange-500',
        shadow: 'shadow-[0_0_30px_rgba(249,115,22,0.3)]'
    },
    indigo: {
        activeBorder: 'border-indigo-500',
        activeBg: 'bg-indigo-500/10',
        activeIcon: 'bg-indigo-500 text-black',
        idleIcon: 'bg-white/5 text-indigo-400 group-hover:bg-indigo-500/20',
        tagBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        checkColor: 'text-indigo-500',
        shadow: 'shadow-[0_0_30px_rgba(99,102,241,0.3)]'
    },
    rose: {
        activeBorder: 'border-rose-500',
        activeBg: 'bg-rose-500/10',
        activeIcon: 'bg-rose-500 text-black',
        idleIcon: 'bg-white/5 text-rose-400 group-hover:bg-rose-500/20',
        tagBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        checkColor: 'text-rose-500',
        shadow: 'shadow-[0_0_30px_rgba(244,63,94,0.3)]'
    },
    sky: {
        activeBorder: 'border-sky-500',
        activeBg: 'bg-sky-500/10',
        activeIcon: 'bg-sky-500 text-black',
        idleIcon: 'bg-white/5 text-sky-400 group-hover:bg-sky-500/20',
        tagBg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
        checkColor: 'text-sky-500',
        shadow: 'shadow-[0_0_30px_rgba(14,165,233,0.3)]'
    },
    violet: {
        activeBorder: 'border-violet-500',
        activeBg: 'bg-violet-500/10',
        activeIcon: 'bg-violet-500 text-black',
        idleIcon: 'bg-white/5 text-violet-400 group-hover:bg-violet-500/20',
        tagBg: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
        checkColor: 'text-violet-500',
        shadow: 'shadow-[0_0_30px_rgba(139,92,246,0.3)]'
    },
    teal: {
        activeBorder: 'border-teal-500',
        activeBg: 'bg-teal-500/10',
        activeIcon: 'bg-teal-500 text-black',
        idleIcon: 'bg-white/5 text-teal-400 group-hover:bg-teal-500/20',
        tagBg: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
        checkColor: 'text-teal-500',
        shadow: 'shadow-[0_0_30px_rgba(20,184,166,0.3)]'
    },
};

const promptExamples = [
    { type: 'research', goal: '全球 AI 行业 2026 年度预测报告' },
    { type: 'research', goal: '人形机器人 2026 商业化落地路线图' },
    { type: 'code', goal: '编写一个直接运行的 Python 脚本，计算并打印前20个斐波那契数列' },
    { type: 'code', goal: '用 Python 编写一个获取并验证当前网页连通性的脚本' },
    { type: 'code', goal: '用 React + Tailwind 编写一个精美的个人主页组件' },
    { type: 'code', goal: '构建一个基于 FastAPI 的 JWT 权限认证系统' },
    { type: 'auto-driving', goal: '深度分析 2025 年国内外自动驾驶 L3/L4 商业化落地进展' },
    { type: 'auto-driving', goal: '特斯拉 FSD v12 vs 华为 ADS 3.0 技术路线深度对比报告' },
    { type: 'compute-planning', goal: '为千卡 GPU 训练集群制定 H100/H20/国产芯片 TCO 成本对比方案' },
    { type: 'agent-architecture', goal: '设计企业级多 Agent 协作系统：任务分发、状态机与人工干预节点架构' },
    { type: 'perf-benchmark', goal: 'GPT-4o vs Claude 3.5 vs Gemini 1.5 代码生成任务基准测试报告' },
    { type: 'general-ai-research', goal: '2025 年 AI 领域十大技术突破及其产业影响力战略报告' },
    { type: 'coding-assistant', goal: '构建带流式输出的 Python 代码补全 CLI 工具，支持多文件上下文注入' },
    { type: 'llm-evaluation', goal: '为私有化 RAG 问答系统设计完整 LLM 评估框架，覆盖忠实度与幻觉率指标' },
];

// Backend type mapping
const mapToBackendType = (frontendType: string): string => {
    const researchTypes = ['research', 'auto-driving', 'compute-planning', 'general-ai-research', 'perf-benchmark', 'llm-evaluation', 'agent-architecture'];
    const codeTypes = ['code', 'coding-assistant'];
    if (researchTypes.includes(frontendType)) return 'research';
    if (codeTypes.includes(frontendType)) return 'code';
    return 'research';
};

// Get label based on type
const getGoalLabel = (type: string): string => {
    if (type === 'code' || type === 'coding-assistant') return '工程目标';
    if (type === 'llm-evaluation' || type === 'perf-benchmark') return '评估目标';
    if (type === 'auto-driving' || type === 'compute-planning') return '研究课题';
    if (type === 'agent-architecture') return '架构目标';
    return '研究主题';
};

// Get workflow title by id
const getWorkflowTitle = (id: string): string => {
    const wf = workflowTypes.find(w => w.id === id);
    return wf?.title || id;
};

export default function StartPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        type: 'research',
        goal: '',
        description: '',
        email: '',
        model: 'glm-5'
    });

    // Pick a random example on mount
    useEffect(() => {
        const randomExample = promptExamples[Math.floor(Math.random() * promptExamples.length)];
        const wf = workflowTypes.find(w => w.id === randomExample.type);
        setFormData(prev => ({
            ...prev,
            type: randomExample.type,
            goal: wf?.defaultPrompt || randomExample.goal
        }));
    }, []);

    const models = [
        { id: 'glm-5', name: 'GLM-5', desc: '默认模型 · 综合最优' },
        { id: 'gemini-3-flash', name: 'Gemini 3 Flash', desc: '极速预览' },
        { id: 'gemini-3-pro-high', name: 'Gemini 3 Pro High', desc: '最强推理' },
        { id: 'gemini-3-pro-low', name: 'Gemini 3 Pro Low', desc: '轻量极速' },
        { id: 'gemini-3-pro-image', name: 'Gemini 3 Pro (Image)', desc: '图片生成 (1:1)' },
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: '极速响应' },
        { id: 'gemini-2.5-flash-thinking', name: 'Gemini 2.5 Flash (Thinking)', desc: '思维链' },
        { id: 'claude-sonnet-4-5', name: 'Claude 4.5 Sonnet', desc: '代码推理' },
        { id: 'claude-sonnet-4-5-thinking', name: 'Claude 4.5 Sonnet (Thinking)', desc: '思维链' },
        { id: 'claude-opus-4-5-thinking', name: 'Claude 4.5 Opus (Thinking)', desc: '最强思维' },
    ];

    const handleNext = () => setStep(step + 1);
    const handleBack = () => setStep(step - 1);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token') || '';
            const backendType = mapToBackendType(formData.type);
            const res = await apiPost('/api/jobs', { ...formData, type: backendType }, token);

            if (!res.ok) {
                const errData = await res.json().catch(() => null);
                throw new Error(errData?.detail || `HTTP ${res.status}`);
            }

            const data = await res.json();
            router.push(`/dashboard/${data.job_id}`);
        } catch (error: any) {
            console.error(error);
            alert(`启动任务失败：${error?.message || '未知错误'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleTypeSelect = (wf: WorkflowType) => {
        if (wf.comingSoon) return;
        setFormData({
            ...formData,
            type: wf.id,
            goal: wf.defaultPrompt
        });
    };

    const generalTypes = workflowTypes.filter(w => w.category === 'general');
    const automotiveTypes = workflowTypes.filter(w => w.category === 'automotive' || w.category === 'specialized');

    const renderWorkflowCard = (wf: WorkflowType) => {
        const isSelected = formData.type === wf.id;
        const colors = colorConfig[wf.color];
        const Icon = wf.icon;
        const isDisabled = wf.comingSoon;

        return (
            <button
                key={wf.id}
                onClick={() => handleTypeSelect(wf)}
                disabled={isDisabled}
                className={`p-6 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden group ${
                    isSelected
                        ? `${colors.activeBg} ${colors.activeBorder} ${colors.shadow} scale-[1.02]`
                        : 'glass border-white/5 hover:border-white/20'
                } ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
                <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                        isSelected ? colors.activeIcon : colors.idleIcon
                    }`}>
                        <Icon size={24} />
                    </div>
                    {wf.isNew && !isSelected && (
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-md border border-emerald-500/30 flex items-center gap-1">
                            <Sparkles size={10} />
                            NEW
                        </span>
                    )}
                    {isSelected && (
                        <div className={colors.checkColor}>
                            <CheckCircle size={20} />
                        </div>
                    )}
                    {wf.comingSoon && (
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 bg-neutral-500/10 text-neutral-400 rounded-md border border-neutral-500/20">
                            即将上线
                        </span>
                    )}
                </div>

                <h3 className="text-lg font-black text-white mb-2">{wf.title}</h3>
                <p className={`text-sm leading-relaxed font-medium mb-4 ${wf.comingSoon ? 'text-amber-500/80' : 'text-neutral-400'}`}>
                    {wf.description}
                </p>

                <div className="flex flex-wrap gap-1.5 mt-auto">
                    {wf.tags.map(tag => (
                        <span key={tag} className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md border ${colors.tagBg}`}>
                            {tag}
                        </span>
                    ))}
                </div>
            </button>
        );
    };

    return (
        <div className="flex-1 flex text-neutral-100 font-sans selection:bg-emerald-500/30 overflow-hidden relative">
            {/* Skills Sidebar */}
            <aside className="w-64 border-r border-white/10 hidden lg:flex flex-col h-full bg-black/40 pt-12 pb-6 px-6 relative z-20 shadow-2xl">
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                        <Box size={16} className="text-emerald-400" />
                    </div>
                    <h2 className="text-sm font-black text-white tracking-widest uppercase">能力库 (Skills)</h2>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                    {[
                        { name: 'Web Search', active: true },
                        { name: 'Data Analysis', active: true },
                        { name: 'Doc Gen', active: true },
                        { name: 'Python Sandbox', active: true },
                        { name: 'Code Review', active: true },
                        { name: 'React/Next.js', active: true },
                        { name: 'LangGraph', active: true },
                        { name: 'GPU Benchmarking', active: true },
                        { name: 'Perception Research', active: true },
                        { name: 'Node Extraction', active: false },
                        { name: 'Pipeline Builder', active: false }
                    ].map((skill) => (
                        <div key={skill.name} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors cursor-default group border border-transparent hover:border-white/5">
                            <span className={`text-xs font-bold transition-colors ${skill.active ? 'text-neutral-400 group-hover:text-emerald-400' : 'text-neutral-600'}`}>{skill.name}</span>
                            {skill.active ? (
                                <CheckCircle size={14} className="text-emerald-500/30 group-hover:text-emerald-400 transition-colors" />
                            ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
                            )}
                        </div>
                    ))}
                </div>
                <div className="mt-4 pt-6 border-t border-white/5 flex items-center justify-center">
                    <button className="flex items-center gap-2 text-[10px] font-black text-neutral-500 hover:text-emerald-400 uppercase tracking-widest transition-colors">
                        <PlusCircle size={12} />
                        接入更多能力
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto py-12 px-8 relative z-10 w-full">
                <div className="max-w-5xl mx-auto">
                    <div className="mb-12 text-center">
                        <h1 className="text-5xl font-black text-white mb-4 tracking-tighter">定义您的目标</h1>
                        <p className="text-neutral-500 font-medium">告诉我们需要做什么。我们的代理将处理剩下的工作。</p>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex justify-between items-center mb-16 relative max-w-xl mx-auto">
                        <div className="absolute top-1/2 left-0 w-full h-px bg-white/10 -z-10"></div>
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm transition-all duration-500 ${step >= i ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-110' : 'glass text-neutral-500'}`}>
                                {i}
                            </div>
                        ))}
                    </div>

                    {/* Step 1: Select Type */}
                    {step === 1 && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-500">
                            <h2 className="text-2xl font-black text-white tracking-tight text-center">选择 AILabor 的核心领域</h2>

                            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                                {/* General Section */}
                                <div className="mb-4">
                                    <h3 className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-3 px-1">通用场景</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {generalTypes.map(renderWorkflowCard)}
                                    </div>
                                </div>

                                {/* Automotive Section */}
                                <div className="mb-4">
                                    <h3 className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-3 px-1">汽车科技 / 专业研究</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {automotiveTypes.map(renderWorkflowCard)}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-center pt-4">
                                <button
                                    onClick={handleNext}
                                    disabled={!formData.type}
                                    className="px-12 py-4 bg-emerald-500 text-black font-black rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-400 transition-all shadow-xl hover:scale-105 active:scale-95"
                                >
                                    下一步
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Select Model */}
                    {step === 2 && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-500">
                            <h2 className="text-2xl font-black text-white tracking-tight text-center">选择 AI 指挥官</h2>

                            {/* Default model hint */}
                            <div className="max-w-xl mx-auto px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                                <p className="text-sm text-emerald-400">
                                    默认使用 <span className="font-bold">GLM-5</span> 模型，后端已预置免费模型凭证
                                </p>
                                <p className="text-xs text-neutral-500 mt-1">
                                    如需更强推理能力，可前往 <a href="/dashboard/api-admin" className="text-cyan-400 underline">API 管理</a> 获取其他模型
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {models.map((model) => (
                                    <button
                                        key={model.id}
                                        onClick={() => setFormData({ ...formData, model: model.id })}
                                        className={`p-6 rounded-2xl border transition-all duration-300 text-left relative group ${formData.model === model.id ? 'glass-emerald border-emerald-500/50 shadow-lg scale-[1.02]' : 'glass border-white/5 hover:border-white/20'}`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="font-black text-white text-sm tracking-tight">{model.name}</h3>
                                            {formData.model === model.id ? <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" /> : <Cpu size={14} className="text-neutral-600" />}
                                        </div>
                                        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest leading-relaxed">{model.desc}</p>
                                    </button>
                                ))}
                            </div>
                            <div className="flex justify-between items-center pt-8 max-w-md mx-auto w-full">
                                <button onClick={handleBack} className="px-6 py-3 text-neutral-500 font-bold hover:text-white transition-colors">返回上一步</button>
                                <button
                                    onClick={handleNext}
                                    className="px-12 py-4 bg-emerald-500 text-black font-black rounded-2xl hover:bg-emerald-400 transition-all shadow-xl hover:scale-105"
                                >
                                    下一步
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Details */}
                    {step === 3 && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-500">
                            <h2 className="text-2xl font-black text-white tracking-tight text-center">您的具体目标是什么？</h2>
                            <div className="max-w-2xl mx-auto space-y-6">
                                <div className="glass p-8 rounded-3xl space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-3">
                                            {getGoalLabel(formData.type)}
                                        </label>
                                        <input
                                            type="text"
                                            placeholder={formData.type === 'code' || formData.type === 'coding-assistant' ? "例如：构建一个基于 FastAPI 的权限系统" : "例如：AI 编程助手的未来"}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-emerald-500 transition-all font-medium"
                                            value={formData.goal}
                                            onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-3">具体问题 / 要求</label>
                                        <textarea
                                            rows={4}
                                            placeholder="例如：重点关注生成式 AI 的商业化路径和底层架构演进。"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-emerald-500 transition-all font-medium resize-none"
                                            value={formData.description || ''}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-8 max-w-md mx-auto w-full">
                                <button onClick={handleBack} className="px-6 py-3 text-neutral-500 font-bold hover:text-white transition-colors">返回上一步</button>
                                <button
                                    onClick={handleNext}
                                    className="px-12 py-4 bg-emerald-500 text-black font-black rounded-2xl hover:bg-emerald-400 transition-all shadow-xl hover:scale-105"
                                >
                                    预览任务
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Payment & Review */}
                    {step === 4 && (
                        <div className="space-y-8 text-center animate-in zoom-in-95 fade-in duration-500">
                            <div className="w-24 h-24 bg-emerald-500/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                                <Zap size={48} className="text-emerald-500" />
                            </div>
                            <h2 className="text-4xl font-black text-white tracking-tighter">确认并启动</h2>
                            <p className="text-neutral-500 font-medium max-w-lg mx-auto">
                                Agent 准备就绪，即将基于所选模型开始执行任务。
                            </p>

                            <div className="glass rounded-[2.5rem] p-10 text-left max-w-md mx-auto shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500 opacity-50" />
                                <div className="space-y-4">
                                    <div className="flex justify-between items-baseline border-b border-white/5 pb-4">
                                        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">服务类别</span>
                                        <span className={`text-sm font-black ${colorConfig[workflowTypes.find(w => w.id === formData.type)?.color || 'emerald'].checkColor}`}>
                                            {getWorkflowTitle(formData.type)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-baseline border-b border-white/5 pb-4">
                                        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">模型驱动</span>
                                        <span className="text-sm font-black text-white">
                                            {models.find(m => m.id === formData.model)?.name || formData.model}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-2 border-b border-white/5 pb-4">
                                        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">核心目标</span>
                                        <span className="text-sm font-bold text-white leading-relaxed">{formData.goal}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-4">
                                        <span className="text-lg font-black text-white tracking-tight uppercase">计费模式</span>
                                        <span className="text-sm font-black text-emerald-400">按有效结果 Token 计费</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-center gap-6 pt-10">
                                <button onClick={handleBack} className="px-8 py-4 text-neutral-500 font-bold hover:text-white transition-colors">修改配置</button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="px-12 py-5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-black rounded-[1.25rem] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shadow-[0_10px_40px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95"
                                >
                                    {loading ? <Activity className="animate-spin" /> : (
                                        <>
                                            <span>立即启动 Agent</span>
                                            <ArrowRight size={20} />
                                        </>
                                    )}
                                </button>
                            </div>
                            <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">按实际消耗的 Token 计费</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

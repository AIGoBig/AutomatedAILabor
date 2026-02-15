'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, CheckCircle, Code2, Cpu, Zap, Activity, ArrowRight } from 'lucide-react';
import { apiPost } from '@/lib/api';

export default function StartPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        type: 'research',
        goal: '全球 AI 行业 2024 年度报告',
        description: '',
        email: '',
        model: 'gemini-3-flash'
    });

    const models = [
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
            const token = localStorage.getItem('token');
            const res = await apiPost('/api/jobs', formData, token);

            if (!res.ok) throw new Error('Submission failed');

            const data = await res.json();
            // Redirect to Dashboard
            router.push(`/dashboard/${data.job_id}`);
        } catch (error) {
            console.error(error);
            alert('启动任务失败。请重试。');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 text-neutral-100 font-sans selection:bg-emerald-500/30 overflow-hidden relative">
            <main className="py-12 px-8 max-w-4xl mx-auto relative z-10">
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
                        <h2 className="text-2xl font-black text-white tracking-tight text-center">选择一项核心技能</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <button
                                onClick={() => setFormData({ ...formData, type: 'research' })}
                                className={`p-8 rounded-[2rem] border transition-all duration-300 text-left relative overflow-hidden group ${formData.type === 'research' ? 'glass-emerald border-emerald-500/50 shadow-2xl scale-[1.02]' : 'glass border-white/5 hover:border-white/20'}`}
                            >
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors ${formData.type === 'research' ? 'bg-emerald-500 text-black' : 'bg-white/5 text-emerald-400 group-hover:bg-emerald-500/20'}`}>
                                    <Search size={28} />
                                </div>
                                <h3 className="text-xl font-black text-white mb-2">深度研究</h3>
                                <p className="text-sm text-neutral-400 leading-relaxed font-medium">全面的市场分析、竞争对手解析或特定主题探索。</p>
                                {formData.type === 'research' && <div className="absolute top-4 right-4 text-emerald-500"><CheckCircle size={20} /></div>}
                            </button>

                            <button
                                onClick={() => setFormData({ ...formData, type: 'code' })}
                                className={`p-8 rounded-[2rem] border transition-all duration-300 text-left relative overflow-hidden group ${formData.type === 'code' ? 'bg-purple-500/10 border-purple-500 shadow-2xl scale-[1.02]' : 'glass border-white/5 hover:border-white/20'}`}
                            >
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors ${formData.type === 'code' ? 'bg-purple-500 text-black' : 'bg-white/5 text-purple-400 group-hover:bg-purple-500/20'}`}>
                                    <Code2 size={28} />
                                </div>
                                <h3 className="text-xl font-black text-white mb-2">编程任务</h3>
                                <p className="text-sm text-neutral-400 leading-relaxed font-medium">自动化代码编写、架构设计、重构或算法开发。</p>
                                {formData.type === 'code' && <div className="absolute top-4 right-4 text-purple-500"><CheckCircle size={20} /></div>}
                            </button>
                        </div>
                        <div className="flex justify-center pt-8">
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
                                        {formData.type === 'code' ? '工程目标' : '研究主题'}
                                    </label>
                                    <input
                                        type="text"
                                        placeholder={formData.type === 'code' ? "例如：构建一个基于 FastAPI 的权限系统" : "例如：AI 编程助手的未来"}
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
                                    <span className={`text-sm font-black ${formData.type === 'code' ? "text-purple-400" : "text-emerald-400"}`}>
                                        {formData.type === 'code' ? 'AI 代码工程' : '深度研究代理'}
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
                                    <span className="text-lg font-black text-white tracking-tight uppercase">总计费用</span>
                                    <span className="text-3xl font-black text-emerald-400 tracking-tighter shadow-emerald-500/20 shadow-sm">$5.00</span>
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
                        <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">由 Stripe 处理的安全支付 (MVP 模拟)</p>
                    </div>
                )}
            </main>
        </div>
    );
}

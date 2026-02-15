"use client";

export default function HowItWorks() {
    const steps = [
        {
            number: "01",
            title: "定义目标",
            description: "输入您的项目需求、研究主题或任务目标。我们的系统将自动识别所需技能并配置专属代理。",
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            )
        },
        {
            number: "02",
            title: "代理执行",
            description: "AI 代理开始通过互联网搜寻、分析并整合信息。您可以实时在控制中心追踪每一个思考步骤。",
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            )
        },
        {
            number: "03",
            title: "质量验证与交付",
            description: "在交付给您之前，成果会经过“审核代理”的二次校验，确保准确无误。只有符合标准的成果才会被交付。",
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        }
    ];

    return (
        <section id="how-it-works" className="py-24 px-6 relative overflow-hidden bg-neutral-950">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-emerald-500/5 blur-[120px] -z-10 rounded-full"></div>

            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-20">
                    <h2 className="text-sm font-bold text-emerald-500 uppercase tracking-[0.3em] mb-4">Workflow</h2>
                    <h3 className="text-4xl md:text-5xl font-bold text-white mb-6">运作原理</h3>
                    <p className="text-neutral-500 max-w-xl mx-auto text-lg">
                        从一个想法到一个完美的交付。全程自动化，结果可预测。
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-12 relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-[100px] left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-neutral-800 to-transparent"></div>

                    {steps.map((step, idx) => (
                        <div key={idx} className="relative group">
                            <div className="flex flex-col items-center text-center">
                                {/* Icon & Number Circle */}
                                <div className="relative mb-8">
                                    <div className="w-20 h-20 rounded-2xl bg-neutral-900 border border-white/5 flex items-center justify-center text-emerald-400 shadow-2xl transition-transform group-hover:scale-110 group-hover:bg-neutral-800">
                                        {step.icon}
                                    </div>
                                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-emerald-500 text-black text-xs font-bold flex items-center justify-center">
                                        {step.number}
                                    </div>
                                </div>

                                <h4 className="text-2xl font-bold text-white mb-4 transition-colors group-hover:text-emerald-400">
                                    {step.title}
                                </h4>
                                <p className="text-neutral-500 leading-relaxed font-light">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

import Link from 'next/link';
import ParticleCanvas from './ParticleCanvas';

export default function Hero() {
    return (
        <div className="relative pt-32 pb-20 px-6 min-h-screen flex flex-col justify-center overflow-hidden bg-noise">

            {/* Background Grid */}
            <div className="absolute inset-0 bg-grid-white opacity-[0.05] pointer-events-none"></div>

            {/* Neural Network Particle Background */}
            <ParticleCanvas className="absolute inset-0 w-full h-full opacity-80" />

            <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">

                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 text-emerald-400 text-xs font-medium uppercase tracking-wider shadow-xl backdrop-blur-md transition-transform hover:scale-105 cursor-default">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Results-Based Architecture v1.0
                    成果导向型架构 v1.0
                </div>

                {/* Headline */}
                <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-white leading-[1.1]">
                    Stop Paying for Tools.<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-br from-white via-neutral-200 to-neutral-500">
                        Start Paying for <span className="text-emerald-400">Results.</span>
                    </span>
                </h1>

                <p className="text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed">
                    全球首个以成果为导向的 AI 劳动力平台。雇佣 AI 代理完成研究、编程或内容创作。
                    <span className="text-white font-medium block mt-2"> 仅在任务完美交付后支付费用。</span>
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
                    <Link href="/start" className="group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-full bg-emerald-500 px-10 font-medium text-black transition-all duration-300 hover:bg-emerald-400 hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)] hover:scale-105 active:scale-95">
                        <span className="mr-2 text-lg">开始项目</span>
                        <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </Link>
                    <Link href="#how-it-works" className="inline-flex h-14 items-center justify-center rounded-full border border-neutral-700 bg-neutral-900/50 px-10 font-medium text-white transition-all hover:bg-neutral-800 hover:border-neutral-600 backdrop-blur-sm">
                        运作原理
                    </Link>
                </div>
            </div>
        </div>
    );
}

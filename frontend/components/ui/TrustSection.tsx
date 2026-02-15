export default function TrustSection() {
    return (
        <section className="py-12 border-y border-white/5 bg-neutral-950/50 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-6 text-center">
                <p className="text-sm font-medium text-neutral-500 uppercase tracking-widest mb-8">Trusted by forward-thinking teams</p>
                <div className="flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                    {/* Mock Logos - simple text for now, meant to be replaced by SVGs */}
                    <div className="text-xl font-bold text-white font-serif">ACME Corp</div>
                    <div className="text-xl font-bold text-white font-mono">Globex</div>
                    <div className="text-xl font-bold text-white font-sans tracking-tighter">Soylent</div>
                    <div className="text-xl font-bold text-white font-serif italic">Initech</div>
                    <div className="text-xl font-bold text-white font-mono tracking-widest">UMBRELLA</div>
                </div>
            </div>
        </section>
    );
}

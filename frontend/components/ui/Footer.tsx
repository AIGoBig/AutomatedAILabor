import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="py-12 border-t border-white/5 bg-neutral-950 relative z-10">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-neutral-500 text-sm">
                    &copy; 2026 自动化 AI 劳动力 (Automated AI Labor). 版权所有。
                </div>
                <div className="flex gap-6 text-sm text-neutral-400">
                    <Link href="#" className="hover:text-white transition-colors">Twitter</Link>
                    <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
                    <Link href="#" className="hover:text-white transition-colors">Terms</Link>
                </div>
            </div>
        </footer>
    );
}

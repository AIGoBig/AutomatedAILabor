import Navbar from '@/components/ui/Navbar';
import Hero from '@/components/ui/Hero';
import TrustSection from '@/components/ui/TrustSection';
import FeatureGrid from '@/components/ui/FeatureGrid';
import HowItWorks from '@/components/ui/HowItWorks';
import Pricing from '@/components/ui/Pricing';
import Footer from '@/components/ui/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-emerald-500/30 overflow-hidden">
      <Navbar />
      <Hero />
      <TrustSection />
      <FeatureGrid />
      <HowItWorks />
      <Pricing />
      <Footer />
    </main>
  );
}

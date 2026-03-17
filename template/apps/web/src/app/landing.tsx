'use client';

import { CTA, FAQ, Features, Footer, Hero, Logos, Pricing, Testimonials } from 'pages/landings/light/components';

import PublicHeader from '@/components/PublicHeader';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-teal-300 selection:text-black">
      <PublicHeader />

      <main className="flex-1">
        <Hero />
        <Logos />
        <Features />
        <Pricing />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>

      <Footer />
    </div>
  );
}

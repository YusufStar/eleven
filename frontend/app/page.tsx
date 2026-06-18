import { Suspense } from "react";
import { PaymentResultModal } from "@/components/payment";
import {
  LandingNav,
  LandingHero,
  LandingSocial,
  LandingFeatures,
  LandingWorkflow,
  LandingTestimonials,
  LandingPricing,
  LandingFaq,
  LandingCta,
  LandingFooter,
} from "@/components/landing";

export default function Page() {
  return (
    <div className="relative min-h-svh overflow-x-clip bg-zinc-950 text-white antialiased selection:bg-violet-500/30">
      {/* ambient page glow */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-zinc-950" />
        <div className="absolute left-1/2 top-[60%] h-[600px] w-[1000px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(76,29,149,0.12),transparent_70%)] blur-3xl" />
      </div>

      <LandingNav />
      <main>
        <LandingHero />
        <LandingSocial />
        <LandingFeatures />
        <LandingWorkflow />
        <LandingTestimonials />
        <LandingPricing />
        <LandingFaq />
        <LandingCta />
      </main>
      <LandingFooter />

      <Suspense fallback={null}>
        <PaymentResultModal />
      </Suspense>
    </div>
  );
}

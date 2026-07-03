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
    <div className="min-h-svh overflow-x-clip bg-background text-foreground antialiased">
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

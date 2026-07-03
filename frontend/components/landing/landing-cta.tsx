import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Reveal } from "./reveal";

export function LandingCta() {
  return (
    <section className="bg-foreground text-background">
      <div className="mx-auto max-w-6xl px-6 py-24 text-center md:py-32">
        <Reveal>
          <h2 className="mx-auto max-w-3xl font-serif text-4xl leading-tight tracking-tight sm:text-5xl md:text-6xl">
            Begin in <em>black &amp; white.</em>
          </h2>
          <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed opacity-70 md:text-base">
            Free for two seats. No card, no demo call — your workspace is ready
            in a minute.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-background px-8 text-foreground hover:bg-background/90"
            >
              <Link href="/signup">Start free</Link>
            </Button>
            <Link
              href="/login"
              className="text-sm opacity-70 transition-opacity hover:opacity-100"
            >
              Sign in
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

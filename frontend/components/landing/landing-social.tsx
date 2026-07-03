import { Marquee } from "@/components/ui/marquee";

const names = [
  "Northwind",
  "Atelier Mono",
  "Obsidian Group",
  "Porcelain",
  "Kairos Labs",
  "Meridian",
  "Grayscale Co",
  "Aldergate",
];

export function LandingSocial() {
  return (
    <section className="border-b py-14">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-center font-mono text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
          Trusted by teams at
        </p>
      </div>
      <div className="mask-fade-x mt-8" aria-hidden>
        <Marquee pauseOnHover className="[--duration:36s] [--gap:5rem]">
          {names.map((name) => (
            <span
              key={name}
              className="whitespace-nowrap font-serif text-xl text-muted-foreground/70"
            >
              {name}
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}

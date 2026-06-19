import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "./reveal";

const faqs = [
  {
    q: "Is Eleven really a CRM and a project tool in one?",
    a: "Yes. Contacts, companies, deals, and pipelines live alongside projects, tasks, and files — all linked, so your customer data and your delivery work share one source of truth.",
  },
  {
    q: "What does the free plan include?",
    a: "Create an organization, invite your team, and use contacts, deals, pipelines, projects, and tasks — no credit card required. It's a real working plan, not a trial.",
  },
  {
    q: "How does the one-time payment work?",
    a: "Professional is a single one-time upgrade per organization that unlocks full access for your whole team. No monthly subscription and no per-seat renewals — pay once, use forever.",
  },
  {
    q: "Can I invite my whole team?",
    a: "Absolutely. Eleven is multi-tenant with organizations, roles, and invitations built in, so the entire team works in the same shared workspace.",
  },
  {
    q: "Is my data secure?",
    a: "Your data is scoped to your organization and stored securely. Each workspace is isolated, and access is controlled by member roles.",
  },
];

export function LandingFaq() {
  return (
    <section id="faq" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-6">
        <Reveal className="text-center">
          <Badge variant="secondary" className="rounded-full text-primary">
            FAQ
          </Badge>
          <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Questions, answered
          </h2>
        </Reveal>

        <Reveal delay={0.05}>
          <Accordion
            type="single"
            collapsible
            defaultValue="faq-0"
            className="mt-12 overflow-hidden rounded-2xl border bg-card px-5 sm:px-6"
          >
            {faqs.map((item, i) => (
              <AccordionItem key={item.q} value={`faq-${i}`}>
                <AccordionTrigger className="py-5 text-[15px] text-foreground hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}

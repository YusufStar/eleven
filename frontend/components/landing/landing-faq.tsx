import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "./reveal";

const faqs = [
  {
    q: "What does Eleven replace?",
    a: "The four-tab tax. Tasks and sprints instead of Jira, chat instead of Slack, docs and files instead of Notion, planning instead of Linear — one workspace, one login, everything next to the work it's about.",
  },
  {
    q: "How do the AI reports work?",
    a: "Claude reads your real tasks, sprints, and activity through tool calling — no made-up numbers — and writes daily, weekly, and monthly summaries covering velocity, bottlenecks, team load, and risks.",
  },
  {
    q: "How does the free plan differ from Pro?",
    a: "Starter is fully functional for two seats and one project. Pro removes the limits and adds AI reports, unlimited chat history, meetings, and file storage.",
  },
  {
    q: "Do you support teams and roles?",
    a: "Yes. Invite teammates, set roles per workspace, and control who sees which projects.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Anytime, from settings, without talking to anyone. Your data stays exportable before and after.",
  },
];

export function LandingFaq() {
  return (
    <section id="questions" className="scroll-mt-16 border-b">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
              05 — Questions
            </p>
            <h2 className="mt-4 font-serif text-4xl tracking-tight md:text-5xl">
              Asked, <em>answered.</em>
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((f, i) => (
                <AccordionItem key={f.q} value={`item-${i}`}>
                  <AccordionTrigger className="py-6 text-left text-[15px] font-medium hover:no-underline">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
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
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-6">
        <Reveal className="text-center">
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] font-medium text-violet-300">
            FAQ
          </span>
          <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Questions, answered
          </h2>
        </Reveal>

        <div className="mt-12 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          {faqs.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition-colors hover:bg-white/[0.02] sm:px-6"
                >
                  <span className="text-[15px] font-medium text-white">
                    {item.q}
                  </span>
                  <span
                    className={`grid size-7 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-zinc-300 transition-transform duration-300 ${
                      isOpen ? "rotate-45 text-violet-300" : ""
                    }`}
                  >
                    <HugeiconsIcon icon={Add01Icon} className="size-4" />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-sm leading-relaxed text-zinc-400 sm:px-6">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

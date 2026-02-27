import { Suspense } from "react";
import Link from "next/link";
import { PaymentResultModal } from "@/components/payment";
import { Button } from "@/components/ui/button";

const benefits = [
  "Contacts & companies with status (Lead → Customer) and custom fields",
  "Sales pipelines with configurable stages and deal values",
  "Projects with members, links (Figma, GitHub), and drive-like files",
  "Tasks with status, priority, assignees, subtasks, and attachments",
  "Teams and organizations with invitations and roles",
];

export default function Page() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex justify-end gap-2 p-6">
        <Button variant="ghost" asChild>
          <Link href="/login">Sign in</Link>
        </Button>
        <Button asChild>
          <Link href="/signup">Get started</Link>
        </Button>
      </header>
      <main className="flex flex-1 flex-col px-6 pb-24">
        <section className="mx-auto flex max-w-2xl flex-col items-center pt-12 text-center">
          <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
            Eleven
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            CRM and project management in one place. Manage relationships,
            pipelines, and work as a team—without switching tools.
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/signup">Get started</Link>
          </Button>
        </section>

        <section className="mx-auto mt-24 max-w-2xl">
          <h2 className="text-xl font-semibold">What you get</h2>
          <ul className="mt-4 space-y-3 text-muted-foreground">
            {benefits.map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-primary">·</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto mt-24 max-w-2xl">
          <h2 className="text-xl font-semibold">Pricing</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-medium">Free</h3>
              <p className="mt-1 text-3xl font-semibold">$0</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Create an organization, add members, use contacts, deals,
                projects, and tasks. No credit card required.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-medium">Professional</h3>
              <p className="mt-1 text-3xl font-semibold">$1,000</p>
              <p className="mt-2 text-sm text-muted-foreground">
                One-time payment per organization. Unlock full access for your
                team. Pay once, use forever.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-24 flex max-w-2xl flex-col items-center text-center">
          <p className="text-muted-foreground">
            Start free. Upgrade when you need more.
          </p>
          <Button size="lg" className="mt-6" asChild>
            <Link href="/signup">Get started</Link>
          </Button>
        </section>
      </main>
      <Suspense fallback={null}>
        <PaymentResultModal />
      </Suspense>
    </div>
  );
}

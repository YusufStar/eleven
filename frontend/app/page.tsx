import { Suspense } from "react";
import Link from "next/link";
import { PaymentResultModal } from "@/components/payment";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    title: "Contacts & pipeline",
    description:
      "People and companies, lead-to-customer status, and sales pipelines with configurable stages.",
  },
  {
    title: "Projects & tasks",
    description:
      "Projects with members and files; tasks with status, priority, assignees, and attachments.",
  },
  {
    title: "Team & billing",
    description:
      "Organizations, invitations, roles, and one-time upgrade for full access.",
  },
];

export default function Page() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-6 py-4 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-foreground"
          >
            Eleven
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button className="shadow-md" asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="border-b border-border px-6 py-20 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              CRM and project management in one place
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              Manage contacts, deals, pipelines, projects, and tasks as a team—without switching tools.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" className="shadow-md" asChild>
                <Link href="/signup">Get started</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="px-6 py-16 sm:py-24">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-semibold text-foreground">
              What you get
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-muted-foreground">
              Everything you need to run relationships and work in one app.
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {features.map((f) => (
                <Card key={f.title}>
                  <CardHeader>
                    <CardTitle>{f.title}</CardTitle>
                    <CardDescription>{f.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-muted/30 px-6 py-16 sm:py-24">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-semibold text-foreground">
              Pricing
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-muted-foreground">
              Start free. Upgrade once when you need full access.
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 sm:max-w-2xl sm:mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Free</CardTitle>
                  <CardDescription>
                    Create an organization, add members, use contacts, deals, projects, and tasks. No credit card required.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold text-foreground">$0</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Professional</CardTitle>
                  <CardDescription>
                    One-time payment per organization. Unlock full access for your team. Pay once, use forever.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold text-foreground">$1,000</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="border-t border-border px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-muted-foreground">
              Ready to bring your CRM and projects together?
            </p>
            <Button size="lg" className="mt-6 shadow-md" asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </section>
      </main>

      <Suspense fallback={null}>
        <PaymentResultModal />
      </Suspense>
    </div>
  );
}

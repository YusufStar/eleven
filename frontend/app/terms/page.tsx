import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/legal-shell";

export const metadata: Metadata = {
  title: "Terms of Service — Eleven",
  description: "The terms that govern your use of Eleven.",
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" updated="July 2026">
      <p>
        These terms govern your access to and use of Eleven. By creating an account or using the service, you
        agree to them. This is a plain-language summary and should be reviewed by counsel before you rely on it
        commercially.
      </p>

      <h2>Your account</h2>
      <p>
        You are responsible for your account, for keeping your credentials secure, and for the activity of the
        members you invite to your organization. You must be able to form a binding contract to use Eleven.
      </p>

      <h2>Acceptable use</h2>
      <p>
        Don&apos;t misuse the service: no unlawful content, no attempts to breach security or access other
        organizations&apos; data, no reverse engineering, and no automated abuse. We may suspend accounts that
        put the platform or other customers at risk.
      </p>

      <h2>Your content</h2>
      <p>
        You own the content you create. You grant us the limited rights needed to host, display, and process
        it so we can operate the service (including generating AI reports from your workspace data). You are
        responsible for having the rights to the content you upload.
      </p>

      <h2>Plans & payment</h2>
      <p>
        Paid plans unlock the full workspace. Payments are handled by Stripe. Fees are described at checkout;
        access to paid features depends on a completed payment. You can stop using the service and delete your
        organization at any time from settings.
      </p>

      <h2>Availability & changes</h2>
      <p>
        We work to keep Eleven available and reliable but provide it &ldquo;as is&rdquo; without warranties.
        We may update the service and these terms; material changes will be reflected by the &ldquo;last
        updated&rdquo; date above.
      </p>

      <h2>Liability</h2>
      <p>
        To the extent permitted by law, Eleven is not liable for indirect or consequential damages, and our
        total liability is limited to the amounts you paid for the service in the prior twelve months.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms? Email <a href="mailto:legal@eleven.app">legal@eleven.app</a>.
      </p>
    </LegalShell>
  );
}

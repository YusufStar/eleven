import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/legal-shell";

export const metadata: Metadata = {
  title: "Privacy Policy — Eleven",
  description: "How Eleven collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="July 2026">
      <p>
        This policy explains what data Eleven (&ldquo;we&rdquo;) collects when you use the platform, why we
        collect it, and the choices you have. It is a plain-language summary and should be reviewed by
        counsel before you rely on it commercially.
      </p>

      <h2>What we collect</h2>
      <p>
        Account information (name, email, and profile image), the content you create in your workspace
        (tasks, projects, messages, files, and comments), and technical data such as log entries and device
        information needed to operate and secure the service. Payments are processed by Stripe; we never see
        your full card details.
      </p>

      <h2>How we use it</h2>
      <p>
        To provide and improve the service, authenticate you, send transactional and notification emails you
        have opted into, generate AI reports from your own workspace data, and keep the platform secure. We
        do not sell your personal data.
      </p>

      <h2>AI processing</h2>
      <p>
        AI reports are generated from your organization&apos;s own workspace data using the Anthropic Claude
        API. Report inputs are aggregate metrics about your tasks, sprints, and activity — not the contents of
        private messages.
      </p>

      <h2>Sharing</h2>
      <p>
        We share data only with the processors that run the service — for example our hosting provider, email
        delivery, Stripe for payments, and the AI provider for report generation — and only to the extent
        needed to operate Eleven.
      </p>

      <h2>Your choices</h2>
      <p>
        You can edit or delete your content, manage notification preferences (including quiet hours and
        digests), export your data, and delete your organization from settings. Deleting an organization
        permanently removes its projects, tasks, and files.
      </p>

      <h2>Retention & security</h2>
      <p>
        We keep data for as long as your account is active or as needed to provide the service, and use
        industry-standard measures to protect it. No method of transmission or storage is perfectly secure.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy? Email <a href="mailto:privacy@eleven.app">privacy@eleven.app</a>.
      </p>
    </LegalShell>
  );
}

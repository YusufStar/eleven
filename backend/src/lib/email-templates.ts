/**
 * Eleven transactional email templates — monochrome, rounded, table-based
 * (inline styles only, so they survive Gmail/Outlook).
 */

const INK = "#18181b";
const PAPER = "#fafafa";
const CANVAS = "#f4f4f5";
const MUTED = "#71717a";
const HAIRLINE = "#e4e4e7";

export type EmailContent = {
  /** hidden inbox preview line */
  preheader?: string;
  /** escaped — write plain text */
  title: string;
  /** escaped — write plain text, one paragraph per entry */
  paragraphs: string[];
  ctaLabel?: string;
  ctaUrl?: string;
  /** small line under the CTA, e.g. the raw link — NOT escaped */
  footnote?: string;
};

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function renderEmail(c: EmailContent): string {
  const preheader = c.preheader ?? c.paragraphs[0] ?? "";
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(c.title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${CANVAS};">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${CANVAS};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
          <!-- wordmark -->
          <tr>
            <td style="padding:0 8px 16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;font-weight:600;letter-spacing:-0.02em;color:${INK};">Eleven</td>
                  <td align="right" style="font-family:'SFMono-Regular',Menlo,Consolas,monospace;font-size:10px;letter-spacing:0.3em;color:${MUTED};">N&ordm;&nbsp;11</td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- card -->
          <tr>
            <td style="background-color:#ffffff;border:1px solid ${HAIRLINE};border-radius:20px;padding:36px 36px 32px;">
              <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;font-weight:400;letter-spacing:-0.01em;color:${INK};">${escapeHtml(c.title)}</h1>
              ${c.paragraphs
                .map(
                  (p) =>
                    `<p style="margin:0 0 14px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:${MUTED};">${escapeHtml(p)}</p>`,
                )
                .join("\n              ")}
              ${
                c.ctaLabel && c.ctaUrl
                  ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 6px;">
                <tr>
                  <td style="border-radius:999px;background-color:${INK};">
                    <a href="${escapeHtml(c.ctaUrl!)}" style="display:inline-block;padding:13px 30px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:${PAPER};text-decoration:none;border-radius:999px;">${escapeHtml(c.ctaLabel)}</a>
                  </td>
                </tr>
              </table>`
                  : ""
              }
              ${
                c.footnote
                  ? `<p style="margin:14px 0 0;font-family:'SFMono-Regular',Menlo,Consolas,monospace;font-size:11px;line-height:1.6;color:${MUTED};word-break:break-all;">${c.footnote}</p>`
                  : ""
              }
            </td>
          </tr>
          <!-- footer -->
          <tr>
            <td style="padding:20px 8px 0;text-align:center;">
              <p style="margin:0;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:${MUTED};">
                You&rsquo;re receiving this because you have an Eleven account.<br />
                &copy; Eleven &mdash; the monochrome workspace.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** CTA label per notification type — keeps wording consistent everywhere. */
export function notificationCta(type: string): string {
  switch (type) {
    case "TASK_ASSIGNED":
      return "Open the task";
    case "DEAL_STAGE_CHANGED":
    case "DEAL_WON":
    case "DEAL_ASSIGNED":
      return "Open the deal";
    case "PROJECT_MEMBER_ADDED":
    case "PROJECT_FILE_ADDED":
      return "Open the project";
    case "MEETING_INVITED":
      return "Join the meeting";
    case "CONTACTS_IMPORTED":
    case "CONTACT_ASSIGNED":
      return "Open contacts";
    case "TASK_COMPLETED":
      return "Open the task";
    default:
      return "Open Eleven";
  }
}

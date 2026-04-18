/**
 * Shared reminder-template shape + per-channel renderers.
 *
 * A single `ReminderTemplate` object is built once per (client, hearing)
 * pair in the NotificationService, then handed to each transport util.
 * Each util asks this module for its channel-specific rendering so the
 * wording stays consistent across email / WhatsApp / SMS.
 */

export interface ReminderTemplate {
  clientName: string;
  hearingDate: Date | string;
  purpose?: string;
  requirements?: string;
  /** Optional — short human name of the case, helps on small screens. */
  caseTitle?: string;
}

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

function formatDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString("en-IN", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

function clientGreeting(name: string): string {
  return name && name.trim().length > 0 ? name.trim() : "Client";
}

// ---------------------------------------------------------------
// EMAIL
// ---------------------------------------------------------------

export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

export function renderEmail(t: ReminderTemplate): RenderedEmail {
  const name = clientGreeting(t.clientName);
  const when = formatDate(t.hearingDate);
  const title = t.caseTitle ? ` (${t.caseTitle})` : "";

  const subject = `Upcoming Court Hearing Reminder${title}`;

  const textLines = [
    `Dear ${name},`,
    "",
    `This is a reminder that your hearing is scheduled on ${when}.`,
  ];
  if (t.purpose) textLines.push(`Purpose: ${t.purpose}`);
  if (t.requirements) textLines.push(`Requirements: ${t.requirements}`);
  textLines.push("", "Regards,", "Law Office");

  const html = `
    <div style="font-family:Arial,sans-serif;font-size:14px;color:#222;line-height:1.5">
      <p>Dear ${escapeHtml(name)},</p>
      <p>This is a reminder that your hearing is scheduled on <strong>${escapeHtml(when)}</strong>.</p>
      ${t.purpose ? `<p><strong>Purpose:</strong> ${escapeHtml(t.purpose)}</p>` : ""}
      ${t.requirements ? `<p><strong>Requirements:</strong> ${escapeHtml(t.requirements)}</p>` : ""}
      <p style="margin-top:24px">Regards,<br/>Law Office</p>
    </div>
  `.trim();

  return { subject, text: textLines.join("\n"), html };
}

// ---------------------------------------------------------------
// WHATSAPP — medium length, allows basic formatting
// ---------------------------------------------------------------

export function renderWhatsApp(t: ReminderTemplate): string {
  const name = clientGreeting(t.clientName);
  const when = formatDate(t.hearingDate);
  const lines = [
    `Hello ${name},`,
    `This is a reminder that your hearing is scheduled on *${when}*.`,
  ];
  if (t.purpose) lines.push(`Purpose: ${t.purpose}`);
  if (t.requirements) lines.push(`Requirements: ${t.requirements}`);
  lines.push("— Law Office");
  return lines.join("\n");
}

// ---------------------------------------------------------------
// SMS — must be short (keep under 320 chars to stay <= 2 segments)
// ---------------------------------------------------------------

const SMS_MAX_CHARS = 320;

export function renderSMS(t: ReminderTemplate): string {
  const name = clientGreeting(t.clientName);
  const when = formatDate(t.hearingDate);
  const base = `Hi ${name}, hearing on ${when}.`;
  const purpose = t.purpose ? ` Purpose: ${t.purpose}.` : "";
  const reqs = t.requirements ? ` Bring: ${t.requirements}.` : "";
  const signoff = " - Law Office";
  const full = `${base}${purpose}${reqs}${signoff}`;
  if (full.length <= SMS_MAX_CHARS) return full;
  // Drop requirements first, then purpose, to stay within budget.
  const noReq = `${base}${purpose}${signoff}`;
  if (noReq.length <= SMS_MAX_CHARS) return noReq;
  return `${base}${signoff}`.slice(0, SMS_MAX_CHARS);
}

// ---------------------------------------------------------------
// Internal
// ---------------------------------------------------------------

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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
  caseTitle?: string;
  caseNumber?: string;
  courtName?: string;
  district?: string;
  act?: string;
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
  const caseLabel = t.caseNumber
    ? t.caseTitle
      ? `${t.caseNumber} — ${t.caseTitle}`
      : t.caseNumber
    : t.caseTitle ?? "";
  const subject = `Upcoming Court Hearing Reminder${caseLabel ? ` (${caseLabel})` : ""}`;

  const textLines = [
    `Dear ${name},`,
    "",
    `This is a reminder that your court hearing is scheduled on ${when}.`,
    "",
  ];
  if (t.caseNumber) textLines.push(`Case No.: ${t.caseNumber}`);
  if (t.act) textLines.push(`Act: ${t.act}`);
  if (t.courtName) textLines.push(`Court: ${t.courtName}`);
  if (t.district) textLines.push(`District: ${t.district}`);
  if (t.purpose) textLines.push(`Purpose: ${t.purpose}`);
  if (t.requirements) textLines.push(`Requirements: ${t.requirements}`);
  textLines.push("", "Regards,", "Law Office");

  const caseRows = [
    t.caseNumber ? `<tr><td><strong>Case No.:</strong></td><td>${escapeHtml(t.caseNumber)}</td></tr>` : "",
    t.act ? `<tr><td><strong>Act:</strong></td><td>${escapeHtml(t.act)}</td></tr>` : "",
    t.courtName ? `<tr><td><strong>Court:</strong></td><td>${escapeHtml(t.courtName)}</td></tr>` : "",
    t.district ? `<tr><td><strong>District:</strong></td><td>${escapeHtml(t.district)}</td></tr>` : "",
    t.purpose ? `<tr><td><strong>Purpose:</strong></td><td>${escapeHtml(t.purpose)}</td></tr>` : "",
    t.requirements ? `<tr><td><strong>Requirements:</strong></td><td>${escapeHtml(t.requirements)}</td></tr>` : "",
  ].filter(Boolean).join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;font-size:14px;color:#222;line-height:1.5">
      <p>Dear ${escapeHtml(name)},</p>
      <p>This is a reminder that your court hearing is scheduled on <strong>${escapeHtml(when)}</strong>.</p>
      ${caseRows ? `<table style="border-collapse:collapse;margin:12px 0">${caseRows}</table>` : ""}
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
    `This is a reminder that your court hearing is scheduled on *${when}*.`,
    "",
  ];
  if (t.caseNumber) lines.push(`Case No.: ${t.caseNumber}`);
  if (t.act) lines.push(`Act: ${t.act}`);
  if (t.courtName) lines.push(`Court: ${t.courtName}`);
  if (t.district) lines.push(`District: ${t.district}`);
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
  const base = `Hi ${name}, court hearing on ${when}.`;
  const caseRef = t.caseNumber ? ` Case: ${t.caseNumber}.` : "";
  const court = t.courtName ? ` Court: ${t.courtName}.` : "";
  const purpose = t.purpose ? ` Purpose: ${t.purpose}.` : "";
  const reqs = t.requirements ? ` Bring: ${t.requirements}.` : "";
  const signoff = " - Law Office";
  // Build progressively, dropping least important parts to stay within limit.
  const full = `${base}${caseRef}${court}${purpose}${reqs}${signoff}`;
  if (full.length <= SMS_MAX_CHARS) return full;
  const noReq = `${base}${caseRef}${court}${purpose}${signoff}`;
  if (noReq.length <= SMS_MAX_CHARS) return noReq;
  const noPurpose = `${base}${caseRef}${court}${signoff}`;
  if (noPurpose.length <= SMS_MAX_CHARS) return noPurpose;
  return `${base}${caseRef}${signoff}`.slice(0, SMS_MAX_CHARS);
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

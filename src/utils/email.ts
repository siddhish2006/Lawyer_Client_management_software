import { Resend } from "resend";
import nodemailer, { Transporter } from "nodemailer";
import { env } from "../config/env";
import { ValidationError } from "../errors/ValidationError";
import { ReminderTemplate, renderEmail } from "./templates";
import { SendResult } from "./whatsapp";

let client: Resend | null = null;

function getClient(): Resend {
  if (!env.RESEND.API_KEY) {
    throw new ValidationError(
      "Resend is not configured. Set RESEND_API_KEY and EMAIL_FROM."
    );
  }
  if (!client) {
    client = new Resend(env.RESEND.API_KEY);
  }
  return client;
}

/**
 * Send an email reminder via Resend.
 * Subject / body / HTML are derived from the template.
 */
export async function sendEmail(
  destination: string,
  template: ReminderTemplate
): Promise<SendResult> {
  const resend = getClient();
  const { subject, text, html } = renderEmail(template);

  const { data, error } = await resend.emails.send({
    from: env.RESEND.FROM,
    to: destination,
    subject,
    text,
    html,
  });

  if (error) {
    throw new Error(
      `Resend send failed: ${error.message ?? JSON.stringify(error)}`
    );
  }

  if (!data?.id) {
    throw new Error("Resend accepted the email but returned no id");
  }

  return {
    providerName: "RESEND",
    messageId: data.id,
    providerEventType: "submitted",
  };
}

let smtpTransporter: Transporter | null = null;

function getSmtpTransporter(): Transporter {
  if (!env.SMTP.USER || !env.SMTP.PASS) {
    throw new ValidationError(
      "SMTP is not configured. Set SMTP_USER and SMTP_PASS (and SMTP_FROM if different)."
    );
  }
  if (!smtpTransporter) {
    smtpTransporter = nodemailer.createTransport({
      host: env.SMTP.HOST,
      port: env.SMTP.PORT,
      secure: env.SMTP.SECURE,
      auth: { user: env.SMTP.USER, pass: env.SMTP.PASS },
    });
  }
  return smtpTransporter;
}

export async function sendOtpMail(
  destination: string,
  code: string,
  purpose: "register" | "login" | "reset"
): Promise<void> {
  const subjects = {
    register: "Verify your account",
    login: "Your login code",
    reset: "Password reset code",
  };

  const intros = {
    register: "Use the code below to finish creating your account.",
    login: "Use the code below to sign in.",
    reset: "Use the code below to reset your password.",
  };

  const subject = subjects[purpose];
  const intro = intros[purpose];

  const text = `${intro}\n\nYour code: ${code}\n\nThis code expires in 10 minutes. If you didn't request it, ignore this email.`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#222">
      <h2 style="color:#92400e;margin-bottom:8px">${subject}</h2>
      <p>${intro}</p>
      <div style="font-size:32px;font-weight:bold;letter-spacing:8px;background:#fef3c7;padding:16px;text-align:center;border-radius:8px;margin:16px 0">
        ${code}
      </div>
      <p style="font-size:12px;color:#666">This code expires in 10 minutes. If you didn't request it, ignore this email.</p>
    </div>
  `;

  const transporter = getSmtpTransporter();
  await transporter.sendMail({
    from: env.SMTP.FROM,
    to: destination,
    subject,
    text,
    html,
  });
}

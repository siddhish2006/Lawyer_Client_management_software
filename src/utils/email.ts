import { Resend } from "resend";
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

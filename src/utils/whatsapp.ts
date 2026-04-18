import { GupshupService } from "../services/gupshup.service";
import { ReminderTemplate, renderWhatsApp } from "./templates";

export interface SendResult {
  providerName: string;
  messageId: string;
  providerEventType: string;
}

/**
 * Send a WhatsApp reminder via Gupshup.
 * Final delivery state arrives via the Gupshup webhook.
 */
export async function sendWhatsApp(
  destination: string,
  template: ReminderTemplate
): Promise<SendResult> {
  const body = renderWhatsApp(template);
  return GupshupService.sendTextMessage(destination, body);
}

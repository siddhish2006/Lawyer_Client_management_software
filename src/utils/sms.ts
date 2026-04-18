import { GupshupService } from "../services/gupshup.service";
import { ReminderTemplate, renderSMS } from "./templates";
import { SendResult } from "./whatsapp";

/**
 * Send an SMS reminder via Gupshup Enterprise SMS.
 */
export async function sendSMS(
  destination: string,
  template: ReminderTemplate
): Promise<SendResult> {
  const body = renderSMS(template);
  return GupshupService.sendSms(destination, body);
}

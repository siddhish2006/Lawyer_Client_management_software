import * as https from "https";
import { stringify } from "querystring";
import { env } from "../config/env";
import { ValidationError } from "../errors/ValidationError";

type JsonRecord = Record<string, unknown>;

export interface GupshupSendResult {
  providerName: "GUPSHUP";
  messageId: string;
  providerEventType: string;
}

export interface GupshupMessageEvent {
  eventType: string;
  providerMessageId: string | null;
  providerEventType: string;
  providerLastEventAt: Date | null;
  errorMessage: string | null;
}

export class GupshupService {
  private static readonly PROVIDER_NAME = "GUPSHUP" as const;

  private static isRecord(value: unknown): value is JsonRecord {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  private static getString(value: unknown): string | null {
    return typeof value === "string" && value.trim().length > 0 ? value : null;
  }

  private static getNumber(value: unknown): number | null {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  }

  private static normalizePhoneNumber(value: string): string {
    return value.replace(/\D/g, "");
  }

  private static buildMessagePayload(text: string): string {
    return JSON.stringify({
      type: "text",
      text,
    });
  }

  private static extractErrorMessage(payload: JsonRecord | null): string | null {
    if (!payload) {
      return null;
    }

    const directMessage = this.getString(payload.message);
    if (directMessage) {
      return directMessage;
    }

    const reason = this.getString(payload.reason);
    if (reason) {
      return reason;
    }

    const detail = this.getString(payload.details);
    if (detail) {
      return detail;
    }

    const description = this.getString(payload.description);
    if (description) {
      return description;
    }

    return null;
  }

  private static extractEventTimestamp(
    rootPayload: JsonRecord,
    nestedPayload: JsonRecord | null
  ): Date | null {
    const nestedSeconds = nestedPayload
      ? this.getNumber(nestedPayload.ts)
      : null;

    if (nestedSeconds !== null) {
      return new Date(nestedSeconds * 1000);
    }

    const rootMillis = this.getNumber(rootPayload.timestamp);
    if (rootMillis !== null) {
      return new Date(rootMillis);
    }

    return null;
  }

  static isConfigured(): boolean {
    return Boolean(
      env.GUPSHUP.API_KEY &&
      env.GUPSHUP.APP_NAME &&
      env.GUPSHUP.SOURCE_NUMBER
    );
  }

  static requireConfiguration(): void {
    if (!this.isConfigured()) {
      throw new ValidationError(
        "Gupshup is not configured. Please set GUPSHUP_API_KEY, GUPSHUP_APP_NAME, and GUPSHUP_SOURCE_NUMBER."
      );
    }
  }

  static validateWebhookToken(token?: string | null): void {
    const expectedToken = env.GUPSHUP.WEBHOOK_TOKEN.trim();

    if (!expectedToken) {
      return;
    }

    if (!token || token !== expectedToken) {
      throw new ValidationError("Invalid Gupshup webhook token");
    }
  }

  static async sendTextMessage(
    destination: string,
    text: string
  ): Promise<GupshupSendResult> {
    this.requireConfiguration();

    const requestUrl = new URL("/wa/api/v1/msg", env.GUPSHUP.API_BASE_URL);
    const formData = stringify({
      channel: "whatsapp",
      source: this.normalizePhoneNumber(env.GUPSHUP.SOURCE_NUMBER),
      destination: this.normalizePhoneNumber(destination),
      "src.name": env.GUPSHUP.APP_NAME,
      message: this.buildMessagePayload(text),
      disablePreview: "false",
    });

    const responseText = await new Promise<string>((resolve, reject) => {
      const request = https.request(
        requestUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": Buffer.byteLength(formData),
            apikey: env.GUPSHUP.API_KEY,
          },
        },
        (response) => {
          let data = "";

          response.setEncoding("utf8");
          response.on("data", (chunk) => {
            data += chunk;
          });
          response.on("end", () => {
            const statusCode = response.statusCode ?? 500;

            if (statusCode >= 200 && statusCode < 300) {
              resolve(data);
              return;
            }

            reject(
              new Error(
                `Gupshup send failed with status ${statusCode}: ${data || "empty response"}`
              )
            );
          });
        }
      );

      request.on("error", reject);
      request.write(formData);
      request.end();
    });

    let parsedResponse: JsonRecord = {};

    if (responseText.trim().length > 0) {
      const parsed = JSON.parse(responseText) as unknown;
      if (this.isRecord(parsed)) {
        parsedResponse = parsed;
      }
    }

    const messageId = this.getString(parsedResponse.messageId);
    if (!messageId) {
      throw new Error("Gupshup send succeeded but did not return a messageId");
    }

    const providerEventType =
      this.getString(parsedResponse.status)?.toLowerCase() ?? "submitted";

    return {
      providerName: this.PROVIDER_NAME,
      messageId,
      providerEventType,
    };
  }

  static parseMessageEvent(body: unknown): GupshupMessageEvent | null {
    if (!this.isRecord(body)) {
      throw new ValidationError("Invalid Gupshup webhook payload");
    }

    if (body.type !== "message-event") {
      return null;
    }

    const payload = this.isRecord(body.payload) ? body.payload : null;

    if (!payload) {
      throw new ValidationError("Invalid Gupshup message-event payload");
    }

    const providerEventType = this.getString(payload.type)?.toLowerCase();

    if (!providerEventType) {
      throw new ValidationError("Gupshup message-event type is missing");
    }

    const nestedPayload = this.isRecord(payload.payload) ? payload.payload : null;
    const providerMessageId =
      this.getString(payload.gsId) ?? this.getString(payload.id);

    return {
      eventType: "message-event",
      providerMessageId,
      providerEventType,
      providerLastEventAt: this.extractEventTimestamp(body, nestedPayload),
      errorMessage: this.extractErrorMessage(nestedPayload),
    };
  }
}

import * as https from "https";
import * as crypto from "crypto";
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
      // Fail-closed: reject if the secret is not configured.
      throw new ValidationError("Gupshup webhook token is not configured");
    }

    if (!token) {
      throw new ValidationError("Invalid Gupshup webhook token");
    }

    const provided = Buffer.from(token);
    const expected = Buffer.from(expectedToken);

    if (
      provided.length !== expected.length ||
      !crypto.timingSafeEqual(provided, expected)
    ) {
      throw new ValidationError("Invalid Gupshup webhook token");
    }
  }

  static isSmsConfigured(): boolean {
    return Boolean(
      env.GUPSHUP_SMS.USERID &&
      env.GUPSHUP_SMS.PASSWORD &&
      env.GUPSHUP_SMS.SOURCE_MASK
    );
  }

  static requireSmsConfiguration(): void {
    if (!this.isSmsConfigured()) {
      throw new ValidationError(
        "Gupshup SMS is not configured. Set GUPSHUP_SMS_USERID, GUPSHUP_SMS_PASSWORD, and GUPSHUP_SMS_SOURCE_MASK."
      );
    }
  }

  static async sendSms(
    destination: string,
    text: string
  ): Promise<GupshupSendResult> {
    this.requireSmsConfiguration();

    const requestUrl = new URL(
      "/GatewayAPI/rest",
      env.GUPSHUP_SMS.API_BASE_URL
    );
    requestUrl.search = stringify({
      method: "SendMessage",
      send_to: this.normalizePhoneNumber(destination),
      msg: text,
      msg_type: "TEXT",
      userid: env.GUPSHUP_SMS.USERID,
      password: env.GUPSHUP_SMS.PASSWORD,
      auth_scheme: "plain",
      v: "1.1",
      format: "JSON",
      mask: env.GUPSHUP_SMS.SOURCE_MASK,
    });

    const responseText = await new Promise<string>((resolve, reject) => {
      const request = https.request(
        requestUrl,
        { method: "GET" },
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
                `Gupshup SMS send failed with status ${statusCode}: ${data || "empty response"}`
              )
            );
          });
        }
      );
      request.on("error", reject);
      request.end();
    });

    let parsed: JsonRecord = {};
    if (responseText.trim().length > 0) {
      try {
        const p = JSON.parse(responseText) as unknown;
        if (this.isRecord(p)) parsed = p;
      } catch {
        // Non-JSON response — some Gupshup SMS endpoints return plaintext
        // like "success | <messageId>". Fall through with empty parsed.
      }
    }

    const response =
      this.isRecord(parsed.response) ? parsed.response : parsed;

    const status =
      this.getString(response.status)?.toLowerCase() ?? "submitted";
    const messageId =
      this.getString(response.id) ??
      this.getString(response.messageId) ??
      this.getString(response.msgId);

    if (status === "error" || !messageId) {
      const reason =
        this.getString(response.details) ??
        this.getString(response.message) ??
        responseText.slice(0, 200);
      throw new Error(`Gupshup SMS send rejected: ${reason}`);
    }

    return {
      providerName: this.PROVIDER_NAME,
      messageId,
      providerEventType: status,
    };
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

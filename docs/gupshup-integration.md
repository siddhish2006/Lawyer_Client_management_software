# Gupshup Integration Guide

Covers WhatsApp + Enterprise SMS setup via Gupshup, Resend for email, how
the pieces are wired, and how to verify with the test CLI.

---

## 1. Architecture

```
 hearing created
        │
        ▼
 NotificationService.createReminderRecord  (inside hearing txn)
        │
        ▼
 NotificationService.sendScheduledReminder
        │
        ├──►  src/utils/whatsapp.ts  ──► GupshupService.sendTextMessage  ──► api.gupshup.io/wa/api/v1/msg
        ├──►  src/utils/email.ts     ──► Resend SDK                       ──► resend.com/emails
        └──►  src/utils/sms.ts       ──► GupshupService.sendSms           ──► enterprise.smsgupshup.com/GatewayAPI/rest

 Gupshup WhatsApp delivery events
        │
        ▼
 POST /webhooks/gupshup   (token in ?token= OR X-Webhook-Token header)
        │
        ▼
 WebhookController.handleGupshup  ──► NotificationService.handleGupshupWebhook
        │
        ▼
 ReminderLog status updated  ──► syncReminderStateFromLogs
```

Log-status policy:

| Channel | Status on handoff | Resolves via |
|--------|-------------------|--------------|
| WhatsApp | `PENDING` | Gupshup webhook → `SENT`/`FAILED` |
| Email (Resend) | `SENT` | no webhook wired yet |
| SMS (Gupshup) | `SENT` | no webhook wired yet |

---

## 2. Files

| Path | Role |
|------|------|
| [src/utils/templates.ts](../src/utils/templates.ts) | `ReminderTemplate` shape + `renderEmail` / `renderWhatsApp` / `renderSMS` |
| [src/utils/whatsapp.ts](../src/utils/whatsapp.ts) | `sendWhatsApp(dest, template)` |
| [src/utils/email.ts](../src/utils/email.ts) | `sendEmail(dest, template)` |
| [src/utils/sms.ts](../src/utils/sms.ts) | `sendSMS(dest, template)` |
| [src/services/gupshup.service.ts](../src/services/gupshup.service.ts) | HTTP calls + webhook parser + token validation |
| [src/services/notification.service.ts](../src/services/notification.service.ts) | reminder orchestration, calls utils |
| [src/controllers/webhook.controller.ts](../src/controllers/webhook.controller.ts) | reads token, calls service |
| [src/routes/webhook.routes.ts](../src/routes/webhook.routes.ts) | `POST /webhooks/gupshup` |
| [src/config/env.ts](../src/config/env.ts) | env config |
| [test-notifications.ts](../test-notifications.ts) | standalone CLI to verify each util |

---

## 3. Environment variables

Put these in `.env` at the project root.

### WhatsApp (Gupshup)
```
GUPSHUP_API_KEY=<from Gupshup dashboard>
GUPSHUP_APP_NAME=<your WhatsApp app name>
GUPSHUP_SOURCE_NUMBER=<registered sender number, e.g. 919xxxxxxxxx>
GUPSHUP_API_BASE_URL=https://api.gupshup.io   # optional override
GUPSHUP_WEBHOOK_TOKEN=<random shared secret>   # required, fail-closed
```

### SMS (Gupshup Enterprise)
```
GUPSHUP_SMS_USERID=<Enterprise portal user id>
GUPSHUP_SMS_PASSWORD=<Enterprise portal password>
GUPSHUP_SMS_SOURCE_MASK=<approved 6-char sender mask>
GUPSHUP_SMS_API_BASE_URL=https://enterprise.smsgupshup.com   # optional override
```

### Email (Resend)
```
RESEND_API_KEY=re_xxx
EMAIL_FROM=reminders@yourdomain.com
```

Missing creds will surface at first send as `ValidationError`, not at
boot. If you want boot-time validation, call
`GupshupService.requireConfiguration()` and `requireSmsConfiguration()`
in `server.ts` after `dotenv` loads.

---

## 4. Gupshup WhatsApp setup

1. Create a Gupshup account at <https://www.gupshup.io/> and add a
   WhatsApp Business app.
2. Note the **API Key**, **App Name**, and **registered source
   number**.
3. Register a message template (HSM) for reminders if you plan to send
   outside the 24h session window — **the current `sendTextMessage`
   only sends free-form `type: "text"` messages and will be rejected
   for users who have not messaged you in the last 24 hours.** Template
   support is not yet implemented; see "Known gaps" below.
4. Configure the callback URL in the Gupshup dashboard:
   ```
   https://<your-host>/webhooks/gupshup?token=<GUPSHUP_WEBHOOK_TOKEN>
   ```
   or put the token in an `X-Webhook-Token` header — both are accepted.
5. Enable these event types: `sent`, `delivered`, `read`, `failed`.

### Webhook security
- Token compared with `crypto.timingSafeEqual`.
- Fail-closed: if `GUPSHUP_WEBHOOK_TOKEN` is unset, all webhook
  requests are rejected with 400.
- Invalid / missing / length-mismatched tokens return 400.

---

## 5. Gupshup Enterprise SMS setup

1. Log in to <https://enterprise.smsgupshup.com/>.
2. Under "Tools → HTTP API", note your **User ID** and **Password**.
3. Get a DLT-approved **sender mask** (6 chars, e.g. `LAWCMS`).
4. The util hits `GET /GatewayAPI/rest?method=SendMessage&...` with
   `v=1.1&format=JSON`. Response shape handled:
   - JSON `{ response: { status, id, details } }` — preferred.
   - Plain text `success | <msgId>` — tolerated but not parsed for id.
5. A non-2xx HTTP status, `status=error`, or no message id is thrown
   as an `Error`, which `NotificationService` logs as `FAILED`.

---

## 6. Resend email setup

1. Sign up at <https://resend.com/> and create an API key.
2. Verify the sender domain (SPF + DKIM) for `EMAIL_FROM`.
3. Set `RESEND_API_KEY` and `EMAIL_FROM` in `.env`.
4. The util uses the official `resend` SDK — no raw HTTP.

---

## 7. The `ReminderTemplate` body object

All three utils take the same template shape instead of a raw string.
One template is built per (client, hearing) pair and reused across
channels so wording stays consistent.

```ts
interface ReminderTemplate {
  clientName: string;            // e.g. "Alice Sharma"
  hearingDate: Date | string;    // ISO string or Date
  purpose?: string;              // e.g. "Final arguments"
  requirements?: string;         // e.g. "Bring ID proof"
  caseTitle?: string;            // e.g. "ABC vs State"
}
```

Channel-specific rendering lives in
[src/utils/templates.ts](../src/utils/templates.ts):

| Helper | Produces |
|--------|----------|
| `renderEmail(t)` | `{ subject, text, html }` — multi-line body + escaped HTML |
| `renderWhatsApp(t)` | single string with basic `*bold*` formatting |
| `renderSMS(t)` | short string, ≤ 320 chars; drops requirements/purpose if needed |

Utils call the renderer internally — callers never touch it directly.

Example:
```ts
import { sendEmail } from "./src/utils/email";
import { sendWhatsApp } from "./src/utils/whatsapp";
import { sendSMS } from "./src/utils/sms";

const template = {
  clientName: "Alice",
  hearingDate: "2026-05-10T10:30:00Z",
  purpose: "Final arguments",
  requirements: "Bring ID proof",
};

await sendEmail("alice@example.com", template);
await sendWhatsApp("919876543210", template);
await sendSMS("919876543210", template);
```

---

## 8. Testing with `test-notifications.ts`

Runs each util directly. Does not touch the database. Uses sensible
defaults for missing template fields (tomorrow's date, "Test Client").

```bash
# minimal smoke test
npx ts-node test-notifications.ts whatsapp 919876543210
npx ts-node test-notifications.ts sms      919876543210
npx ts-node test-notifications.ts email    you@example.com

# overriding template fields
npx ts-node test-notifications.ts email    you@example.com \
  --name "Alice Sharma" \
  --date "2026-05-10T10:30" \
  --purpose "Final arguments" \
  --requirements "Bring ID proof" \
  --case "ABC vs State"
```

On success each command prints:
```json
{
  "providerName": "GUPSHUP" | "RESEND",
  "messageId": "<provider id>",
  "providerEventType": "submitted" | "sent" | ...
}
```

On failure it prints the error message and exits with code 1. Common
causes:

| Error | Cause |
|-------|-------|
| `Gupshup is not configured...` | `GUPSHUP_API_KEY` / `APP_NAME` / `SOURCE_NUMBER` missing |
| `Gupshup SMS is not configured...` | `GUPSHUP_SMS_USERID` / `PASSWORD` / `SOURCE_MASK` missing |
| `Resend is not configured...` | `RESEND_API_KEY` missing |
| `Gupshup send failed with status 401` | bad `GUPSHUP_API_KEY` |
| `Gupshup send rejected: ...` | template not approved, number outside 24h window, etc. |
| `Resend send failed: ...` | bad API key, unverified `EMAIL_FROM` domain |

### Testing the WhatsApp webhook locally

With the server running on `localhost:3000`:

```bash
curl -X POST "http://localhost:3000/webhooks/gupshup?token=$GUPSHUP_WEBHOOK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "message-event",
    "payload": {
      "type": "delivered",
      "gsId": "<messageId from previous send>",
      "payload": { "ts": 1713398400 }
    },
    "timestamp": 1713398400000
  }'
```

Returns `204`. Look up the reminder log and reminder row to confirm
status flipped to `SENT`.

---

## 9. Known gaps / left to build

| # | Gap | Impact |
|---|-----|--------|
| 1 | No HSM template support | WhatsApp sends fail for recipients outside 24h window |
| 2 | Resend webhook not wired | email `SENT` state never reflects bounce/complaint |
| 3 | Gupshup SMS webhook not wired | SMS `SENT` state never reflects delivery failure |
| 4 | Inbound WhatsApp (`type: "message"`) ignored | no two-way replies |
| 5 | No E.164 phone validation | malformed numbers silently send and get rejected |
| 6 | No boot-time env sanity check | misconfig discovered at first send |
| 7 | Only `failed` mapped to `FAILED` | `rejected` / `undelivered` stay `PENDING` |
| 8 | No automated tests | only the manual CLI |
| 9 | Shared rate limit | `/webhooks/gupshup` shares the global 300/15min |
| 10 | No retry with backoff inside util | relies on per-reminder retry cap (3) |

---

## 10. Troubleshooting quick list

- **WhatsApp send returns `messageId` but webhook never fires** —
  check dashboard callback URL + event-type subscriptions; check your
  server is reachable from Gupshup (no firewall).
- **Webhook 400 "Invalid Gupshup webhook token"** — `?token=` missing
  or doesn't match `GUPSHUP_WEBHOOK_TOKEN` on the server.
- **Webhook 400 "Gupshup webhook token is not configured"** — you
  unset `GUPSHUP_WEBHOOK_TOKEN` on the server. It's required.
- **SMS util returns success but phone never receives** — sender mask
  not DLT-approved OR template not registered on mask. Check dashboard.
- **Email bounces silently** — Resend dashboard shows delivery state.
  Wire the Resend webhook to get it into the audit log.

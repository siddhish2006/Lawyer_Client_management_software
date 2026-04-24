# Testing: Hearing Save → Gupshup Notification with Case Info

End-to-end steps to verify that when a hearing is saved, the Gupshup
WhatsApp/SMS message (and email) includes the hearing's purpose,
requirements, and the case's case number, court, district, and act.

---

## Prerequisites

- Backend running (`npm run dev` from project root, port 8000)
- Frontend running (`npm run dev` from `cms/`, port 3000)
- At least one case in the DB with a client that has a WhatsApp/phone number
- Gupshup credentials set in `.env` (see step 1)

---

## Step 1 — Fill in Gupshup credentials in `.env`

Open `.env` and set these (leave blank ones you don't have yet):

```
# WhatsApp (required for WhatsApp test)
GUPSHUP_API_KEY=<from Gupshup dashboard>
GUPSHUP_APP_NAME=<your WhatsApp app name>
GUPSHUP_SOURCE_NUMBER=<registered sender, e.g. 919xxxxxxxxx>
GUPSHUP_WEBHOOK_TOKEN=<any random secret string>

# SMS (required for SMS test)
GUPSHUP_SMS_USERID=<enterprise portal user id>
GUPSHUP_SMS_PASSWORD=<enterprise portal password>
GUPSHUP_SMS_SOURCE_MASK=<approved 6-char sender, e.g. LAWCMS>

# Email (required for email test)
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=reminders@yourdomain.com
```

Restart the backend after editing `.env`.

---

## Step 2 — Preview the message text without sending (dry run)

Before hitting any live API, verify the rendered template text looks
correct using the test CLI. No database is touched.

```bash
cd Lawyer_Client_management_software

# WhatsApp preview (prints template JSON + rendered text, but no .env needed)
npx ts-node test-notifications.ts whatsapp 919876543210 \
  --name "Ramesh Kumar" \
  --date "2026-05-15T10:30" \
  --purpose "Arguments on bail application" \
  --requirements "Bring surety documents" \
  --case-number "CRL/456/2026" \
  --court "City Sessions Court" \
  --district "Kolkata" \
  --act "NDPS Act 1985"
```

Expected output before the send attempt:
```
→ sending whatsapp to 919876543210
→ template: {
  "clientName": "Ramesh Kumar",
  "hearingDate": "2026-05-15T10:30",
  "purpose": "Arguments on bail application",
  "requirements": "Bring surety documents",
  "caseNumber": "CRL/456/2026",
  "courtName": "City Sessions Court",
  "district": "Kolkata",
  "act": "NDPS Act 1985"
}
```

The WhatsApp message body that will be sent:
```
Hello Ramesh Kumar,
This is a reminder that your court hearing is scheduled on *15 May 2026 at 10:30 am*.

Case No.: CRL/456/2026
Act: NDPS Act 1985
Court: City Sessions Court
District: Kolkata
Purpose: Arguments on bail application
Requirements: Bring surety documents
— Law Office
```

If the output looks wrong, stop here and fix `src/utils/templates.ts`.

---

## Step 3 — Send a live test message via CLI

Once credentials are in `.env`, run the same command for real:

```bash
# WhatsApp
npx ts-node test-notifications.ts whatsapp <YOUR_WHATSAPP_NUMBER> \
  --name "Test Client" \
  --case-number "TEST/001/2026" \
  --court "Test Court" \
  --district "Test District" \
  --act "IPC 1860" \
  --purpose "Test purpose" \
  --requirements "Bring test documents"

# SMS
npx ts-node test-notifications.ts sms <YOUR_PHONE_NUMBER> \
  --name "Test Client" \
  --case-number "TEST/001/2026" \
  --court "Test Court" \
  --purpose "Test purpose"

# Email
npx ts-node test-notifications.ts email <YOUR_EMAIL> \
  --name "Test Client" \
  --case-number "TEST/001/2026" \
  --court "Test Court" \
  --district "Test District" \
  --act "IPC 1860" \
  --purpose "Test purpose" \
  --requirements "Bring test documents"
```

Success output:
```
✓ success
{
  "providerName": "GUPSHUP",
  "messageId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "providerEventType": "submitted"
}
```

Check your phone / inbox. All fields should appear in the message.

---

## Step 4 — Create a hearing via the frontend and check the full flow

This tests the complete path: frontend form → backend → Gupshup.

1. Open the frontend at `http://localhost:3000`.
2. Open a case that has at least one client with a WhatsApp number.
3. Click **Add Hearing**.
4. Fill in:
   - **Hearing Date** — any future date
   - **Purpose** — e.g. `Final arguments`
   - **Requirements** — e.g. `Bring ID and affidavit`
   - **Notification Channels** — select `whatsapp` (and/or `sms`, `email`)
5. Click **Add Hearing**.

The backend will:
- Create the hearing row
- Look up the case (case_number, court_name, district, act)
- Build the template with all fields
- Dispatch via Gupshup immediately (hearing date is within 5-day window)
  OR schedule a reminder for 5 days before the hearing date

**Check the client's phone** — if the hearing is within 5 days from now,
the message arrives immediately. Otherwise it sends on the reminder date.

---

## Step 5 — Verify the reminder log in the DB

After a hearing is saved and the send happens, confirm a log row was
created:

```bash
# in psql or any DB client:
SELECT
  rl.log_id,
  rl.channel,
  rl.status,
  rl.provider_name,
  rl.provider_message_id,
  rl.error_message,
  rl.sent_at
FROM reminder_logs rl
JOIN hearings h ON h.hearing_id = rl.hearing_id
ORDER BY rl.log_id DESC
LIMIT 5;
```

Expected for a successful WhatsApp send:
```
channel   = WHATSAPP
status    = PENDING       ← Gupshup webhook will flip this to SENT
provider_name = GUPSHUP
provider_message_id = <non-null>
error_message = NULL
```

For email/SMS the status will already be `SENT`.

---

## Step 6 — Simulate a Gupshup webhook delivery event (WhatsApp only)

Copy the `provider_message_id` from step 5, then:

```bash
curl -X POST \
  "http://localhost:8000/webhooks/gupshup?token=$GUPSHUP_WEBHOOK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "message-event",
    "payload": {
      "type": "delivered",
      "gsId": "<PASTE_MESSAGE_ID_HERE>",
      "payload": { "ts": 1713398400 }
    },
    "timestamp": 1713398400000
  }'
```

Response: `204 No Content`.

Re-run the query from step 5 — `status` should now be `SENT`.

---

## Step 7 — Check via the Notification Dashboard in the frontend

1. In the CMS frontend, open the **Notification Dashboard**.
2. Switch to the **Gupshup · Sent** pill to see confirmed deliveries.
3. Switch to **Pending** to see any awaiting webhook confirmation.
4. Switch to **Failed** to see any errors.

---

## Common errors and fixes

| Error | Fix |
|-------|-----|
| `Gupshup is not configured` | Set `GUPSHUP_API_KEY`, `GUPSHUP_APP_NAME`, `GUPSHUP_SOURCE_NUMBER` in `.env` and restart |
| `Gupshup SMS is not configured` | Set `GUPSHUP_SMS_USERID`, `GUPSHUP_SMS_PASSWORD`, `GUPSHUP_SMS_SOURCE_MASK` |
| `Gupshup send failed with status 401` | Wrong `GUPSHUP_API_KEY` |
| `Gupshup send rejected: ...` | Number not in 24h session window (need HSM template) OR wrong `APP_NAME` |
| `Resend is not configured` | Set `RESEND_API_KEY` |
| Webhook returns 400 "Invalid token" | `?token=` in curl doesn't match `GUPSHUP_WEBHOOK_TOKEN` in `.env` |
| Message sent but no case info in text | Case was saved without court_name or district — check the case record |
| No message at all after saving hearing | Hearing date > 5 days away — message is scheduled, not immediate |

/**
 * test-notifications.ts
 *
 * Manual verifier for the transport utils. Builds a ReminderTemplate
 * (either from CLI args or defaults) and hands it to the chosen util.
 * Does NOT touch the database.
 *
 * Usage:
 *   ts-node test-notifications.ts <whatsapp|sms|email> <destination> [--name ..] [--date ..] [--purpose ..] [--requirements ..] [--case ..] [--case-number ..] [--court ..] [--district ..] [--act ..]
 *
 * Examples:
 *   ts-node test-notifications.ts whatsapp 919876543210
 *   ts-node test-notifications.ts email    you@example.com --name "Alice" --date 2026-05-10T10:30
 *   ts-node test-notifications.ts sms      919876543210 --purpose "Final arguments" --requirements "Bring ID proof"
 *   ts-node test-notifications.ts whatsapp 919876543210 --case-number "CRL/123/2026" --court "City Civil Court" --district "Mumbai" --act "IPC 1860" --purpose "Arguments"
 */

import { sendEmail } from "./src/utils/email";
import { sendSMS } from "./src/utils/sms";
import { sendWhatsApp } from "./src/utils/whatsapp";
import { ReminderTemplate } from "./src/utils/templates";

type Channel = "whatsapp" | "sms" | "email";

function usage(): never {
  console.error(
    "Usage: ts-node test-notifications.ts <whatsapp|sms|email> <destination> [--name ..] [--date ..] [--purpose ..] [--requirements ..] [--case ..]"
  );
  process.exit(2);
}

function parseFlags(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i];
    if (tok.startsWith("--")) {
      const key = tok.slice(2);
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) {
        console.error(`Missing value for flag --${key}`);
        process.exit(2);
      }
      out[key] = value;
      i++;
    }
  }
  return out;
}

function buildTemplate(flags: Record<string, string>): ReminderTemplate {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return {
    clientName: flags.name ?? "Test Client",
    hearingDate: flags.date ?? tomorrow.toISOString(),
    purpose: flags.purpose ?? "Smoke-test reminder",
    requirements: flags.requirements,
    caseTitle: flags.case,
    caseNumber: flags["case-number"],
    courtName: flags.court,
    district: flags.district,
    act: flags.act,
  };
}

async function main() {
  const [, , rawChannel, destination, ...rest] = process.argv;

  if (!rawChannel || !destination) usage();

  const channel = rawChannel.toLowerCase() as Channel;
  const flags = parseFlags(rest);
  const template = buildTemplate(flags);

  console.log(`→ sending ${channel} to ${destination}`);
  console.log("→ template:", JSON.stringify(template, null, 2));

  let result;
  switch (channel) {
    case "whatsapp":
      result = await sendWhatsApp(destination, template);
      break;
    case "sms":
      result = await sendSMS(destination, template);
      break;
    case "email":
      result = await sendEmail(destination, template);
      break;
    default:
      usage();
  }

  console.log("✓ success");
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error("✗ failed");
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

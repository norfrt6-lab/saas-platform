import { Resend } from "resend";
import type { ReactElement } from "react";

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY environment variable is required");
  }
  return new Resend(apiKey);
}

let resend: Resend | null = null;

function getClient(): Resend {
  if (!resend) {
    resend = getResendClient();
  }
  return resend;
}

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react: ReactElement;
  from?: string;
}

export async function sendEmail({ to, subject, react, from }: SendEmailOptions) {
  const client = getClient();

  const result = await client.emails.send({
    from: from ?? "SaaS Platform <noreply@saas-platform.com>",
    to: Array.isArray(to) ? to : [to],
    subject,
    react,
  });

  if (result.error) {
    throw new Error(
      `Failed to send email to ${Array.isArray(to) ? to.join(", ") : to}: ${result.error.message}`,
    );
  }

  return result.data;
}

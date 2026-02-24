import { Resend } from "resend";
import type { ReactElement } from "react";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react: ReactElement;
  from?: string;
}

export async function sendEmail({ to, subject, react, from }: SendEmailOptions) {
  return resend.emails.send({
    from: from ?? "SaaS Platform <noreply@saas-platform.com>",
    to: Array.isArray(to) ? to : [to],
    subject,
    react,
  });
}

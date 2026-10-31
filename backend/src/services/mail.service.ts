import nodemailer, { Transporter } from "nodemailer";

export type MailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: { filename: string; content: Buffer; contentType?: string }[];
};

let transporter: Transporter | null | undefined;

function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;
  const host = process.env.SMTP_HOST;
  if (!host) {
    transporter = null;
    return transporter;
  }
  const port = Number(process.env.SMTP_PORT) || 587;
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transporter;
}

export function mailIsConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST);
}

// Sends through SMTP when SMTP_HOST is set; otherwise prints the message so
// development works without a mail server. Returns whether it was really sent.
export async function sendMail(input: MailInput): Promise<{ delivered: boolean }> {
  const t = getTransporter();
  if (!t) {
    const attached = input.attachments?.length ? ` (+${input.attachments.length} attachment)` : "";
    console.log(`[email:dev] To: ${input.to} | ${input.subject}${attached}\n${input.text}`);
    return { delivered: false };
  }
  await t.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER || "Brightloop <no-reply@brightloop.test>",
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
    attachments: input.attachments,
  });
  return { delivered: true };
}

import type { LowStockPayload, Notifier } from "./types";
import nodemailer from "nodemailer";

type EmailOpts = {
  enabled?: boolean;
  from: string;
  to: string;
  transport: any;
};

export function emailNotifier(opts: EmailOpts): Notifier | null {
  if (!opts?.enabled) return null as any;
  const transporter = nodemailer.createTransport(opts.transport);
  return async (p: LowStockPayload) => {
    const subject = `LOW STOCK — ${p.sku}: ${p.stock} (thr ${p.threshold})`;
    const text = `Low stock detected\nSKU: ${p.sku}\nStock: ${p.stock}\nThreshold: ${p.threshold}\nAt: ${p.at}`;
    await transporter.sendMail({ from: opts.from, to: opts.to, subject, text });
  };
}

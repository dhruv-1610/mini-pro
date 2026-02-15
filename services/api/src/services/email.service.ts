import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../config/logger';

let transporter: Transporter | null = null;

/**
 * Get or create the SMTP transporter. Returns null if SMTP is not configured.
 */
function getTransporter(): Transporter | null {
  if (transporter) return transporter;
  if (!env.SMTP_HOST) return null;

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth:
      env.SMTP_USER && env.SMTP_PASS
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
        : undefined,
    // Port 465 = implicit SSL (avoids "wrong version number" on Windows with 587/STARTTLS)
  });
  return transporter;
}

/**
 * Send verification email after registration.
 * If SMTP is not configured (SMTP_HOST missing), logs and returns without sending.
 */
export async function sendVerificationEmail(
  to: string,
  name: string,
  verificationToken: string,
): Promise<void> {
  const transport = getTransporter();
  if (!transport) {
    logger.warn('SMTP not configured (SMTP_HOST missing). Verification email not sent.', {
      to,
      hint: 'Set SMTP_HOST, SMTP_USER, SMTP_PASS (and optionally SMTP_FROM, FRONTEND_URL) to send emails.',
    });
    return;
  }

  const verificationLink = `${env.FRONTEND_URL.replace(/\/$/, '')}/verify-email?token=${encodeURIComponent(verificationToken)}`;
  const from = env.SMTP_FROM || 'CleanupCrew <noreply@cleanupcrew.local>';
  const subject = 'Verify your CleanupCrew account';
  const text = `Hi ${name},\n\nPlease verify your email by clicking the link below:\n\n${verificationLink}\n\nThis link expires in 24 hours. If you didn't create an account, you can ignore this email.\n\n— CleanupCrew`;
  const html = `
    <p>Hi ${name},</p>
    <p>Please verify your email by clicking the link below:</p>
    <p><a href="${verificationLink}">Verify my email</a></p>
    <p>Or copy this link: ${verificationLink}</p>
    <p>This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>
    <p>— CleanupCrew</p>
  `.trim();

  try {
    await transport.sendMail({ from, to, subject, text, html });
    logger.info('Verification email sent', { to });
  } catch (err) {
    logger.error('Failed to send verification email', { to, error: String(err) });
    throw err;
  }
}

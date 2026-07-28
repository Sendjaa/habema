import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export function getResend() {
  if (!resend) {
    throw new Error('RESEND_API_KEY not configured');
  }
  return resend;
}
import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import nodemailer from 'nodemailer';
import { env } from '$env/dynamic/private';

export const prerender = false;

const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,           // SSL
  secure: true,        // true for 465, false for 587
  auth: {
    user: env.EMAIL_APP_USER,
    pass: env.EMAIL_APP_PASSWORD
  }
});

export const actions: Actions = {
  default: async ({ request }) => {
    const data = await request.formData();

    const name = data.get('name')?.toString()?.trim() || 'Anonymous';
    const message = data.get('message')?.toString()?.trim() || '';
    const method = data.get('contactMethod')?.toString();
    const detail = data.get('contactDetail')?.toString()?.trim() || '';

    // Validate contact method + detail
    if (!method) {
      return fail(400, { error: 'Please select a contact method.' });
    }

    let replyTo: string | undefined;
    let contactSummary = '';

    switch (method) {
      case 'email':
        const email = data.get('email')?.toString()?.trim();
        if (!email) {
          return fail(400, { error: 'Please provide your email address.' });
        }
        replyTo = `"${name}" <${email}>`;
        contactSummary = `Contact via Email: ${email}`;
        break;

      case 'sms':
      case 'whatsapp':
      case 'phone':
      case 'telegram':
        if (!detail) {
          return fail(400, { error: 'Please provide your phone number.' });
        }
        // no replyTo for non-email; we'll see in the body
        contactSummary = `Contact via ${method.toUpperCase()}: ${detail}`;
        break;

      case 'none':
        contactSummary = `User requested: Do NOT contact them.`;
        break;

      default:
        return fail(400, { error: 'Unknown contact method.' });
    }

    // Build full email text
    const timestamp = new Date().toLocaleString('en-GB', { timeZone: 'Europe/Amsterdam' });
    const fullText = `
Preferred contact method:
${contactSummary}

Message:
${message}

---
Sent on: ${timestamp}
Sender name: ${name}
`.trim();

    try {
      await transporter.sendMail({
        from: `"blog.nickesselman.nl" <${env.EMAIL_APP_USER}>`,
        to: env.EMAIL_APP_TO_ADDRESS,
        ...(replyTo ? { replyTo } : {}),
        subject: `New message (${method}) from ${name}`,
        text: fullText
      });

      return { success: true, message: 'Your message was sent successfully!' };
    } catch (err) {
      console.error('Email send failed:', err);
      return fail(500, { error: 'Failed to send message. Please try again later.' });
    }
  }
};

import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import nodemailer from 'nodemailer';
import {
  EMAIL_APP_USER,
  EMAIL_APP_PASSWORD,
  EMAIL_APP_TO_ADDRESS
} from '$env/static/private';

export const prerender = false;

const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,           // SSL
  secure: true,        // true for 465, false for 587
  auth: {
    user: EMAIL_APP_USER,        // info@nickesselman.nl
    pass: EMAIL_APP_PASSWORD
  }
});

export const actions: Actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const name = data.get('name')?.toString() ?? 'Anonymous';
    const email = data.get('email')?.toString() ?? EMAIL_APP_USER;
    const message = data.get('message')?.toString() ?? '';

    const timestamp = new Date().toLocaleString();
    const fullText = `
${message}

---
Sent on: ${timestamp}
Sender email: ${email}
`.trim();

    try {
      await transporter.sendMail({
        from: `"Nickesselman.nl" <${EMAIL_APP_USER}>`,
        to: EMAIL_APP_TO_ADDRESS,
        replyTo: `"${name}" <${email}>`,
        subject: `New contact from ${name}`,
        text: fullText
      });

      return { success: true, message: 'Email sent successfully!' };
    } catch (err) {
      console.error('Email send failed:', err);
      return fail(500, { error: 'Failed to send email. Please try again later.' });
    }
  }
};

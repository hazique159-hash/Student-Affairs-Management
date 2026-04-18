
'use server';

import { Resend } from 'resend';

/**
 * @fileOverview Server actions for processing institutional notifications via Resend.
 */

const resend = new Resend(process.env.RESEND_API_KEY || 're_fdEuxFMi_9XkgZzWpba7wXcQWUuyyw99S');

interface DispatchResult {
  success: boolean;
  count: number;
  message: string;
}

/**
 * Dispatches a bulk broadcast to multiple recipients.
 */
export async function sendBroadcastToEmails(
  title: string,
  content: string,
  emails: string[]
): Promise<DispatchResult> {
  const uniqueEmails = Array.from(new Set(emails.filter(e => !!e && e.includes('@'))));

  if (uniqueEmails.length === 0) {
    return { success: true, count: 0, message: 'No valid recipients found.' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'AffairsConnect <notifications@student.affair.com>',
      to: uniqueEmails,
      subject: `[AffairsConnect] ${title}`,
      text: content,
      html: renderHtmlTemplate(title, content),
    });

    if (error) throw new Error(error.message);

    return {
      success: true,
      count: uniqueEmails.length,
      message: `Broadcast successfully dispatched to ${uniqueEmails.length} contacts.`,
    };
  } catch (err: any) {
    console.error('[BROADCAST] Failed:', err);
    return { success: false, count: 0, message: `Dispatch failed: ${err.message}` };
  }
}

/**
 * Dispatches a single targeted notification (e.g., for counseling or fines).
 */
export async function sendTargetedNotification(
  email: string,
  subject: string,
  title: string,
  message: string
): Promise<boolean> {
  if (!email || !email.includes('@')) return false;

  try {
    await resend.emails.send({
      from: 'AffairsConnect <notifications@student.affair.com>',
      to: email,
      subject: `[Official] ${subject}`,
      text: message,
      html: renderHtmlTemplate(title, message),
    });
    return true;
  } catch (err) {
    console.error('[TARGETED MAIL] Failed:', err);
    return false;
  }
}

function renderHtmlTemplate(title: string, content: string) {
  return `
    <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px; background-color: #f9f9f9;">
      <div style="background-color: #3F51B5; color: white; padding: 15px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 20px;">AffairsConnect</h1>
      </div>
      <div style="padding: 20px; background-color: white; border: 1px solid #eee; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="color: #3F51B5; margin-top: 0;">${title}</h2>
        <p style="white-space: pre-wrap; font-size: 15px; line-height: 1.6;">${content}</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px dotted #ccc; font-size: 11px; color: #888; text-align: center;">
          <p>This is an official communication from the Student Affairs Management System.</p>
          <p>Please do not reply to this automated email.</p>
        </div>
      </div>
    </div>
  `;
}

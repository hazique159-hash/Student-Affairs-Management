
'use server';

import { Resend } from 'resend';

/**
 * @fileOverview Server action for processing notification broadcasts via Resend.
 */

const resend = new Resend(process.env.RESEND_API_KEY || 're_fdEuxFMi_9XkgZzWpba7wXcQWUuyyw99S');

interface BroadcastResult {
  success: boolean;
  count: number;
  message: string;
  isSimulated: boolean;
}

export async function sendBroadcastToEmails(
  title: string,
  content: string,
  emails: string[]
): Promise<BroadcastResult> {
  const uniqueEmails = Array.from(new Set(emails.filter(e => !!e && e.includes('@'))));

  if (uniqueEmails.length === 0) {
    return {
      success: true,
      count: 0,
      message: 'No valid recipient emails found.',
      isSimulated: false,
    };
  }

  console.log(`[BROADCAST] Dispatching: "${title}" to ${uniqueEmails.length} recipients.`);

  try {
    // Note: Resend Free tier (onboarding@resend.dev) usually only allows sending 
    // to the email address registered with the Resend account (e.g., hazique159@gmail.com).
    const { data, error } = await resend.emails.send({
      from: 'AffairsConnect <onboarding@resend.dev>',
      to: uniqueEmails,
      subject: `[AffairsConnect] ${title}`,
      text: content,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">${title}</h2>
          <p style="white-space: pre-wrap; font-size: 16px; line-height: 1.6;">${content}</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center;">
            <p>This is an automated notification from AffairsConnect Student Affairs Management System.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('[BROADCAST] Resend API Error:', error);
      throw new Error(error.message);
    }

    return {
      success: true,
      count: uniqueEmails.length,
      isSimulated: false,
      message: `Successfully dispatched to ${uniqueEmails.length} recipients via Resend.`,
    };
  } catch (err: any) {
    console.error('[BROADCAST] Delivery Failed:', err);
    return {
      success: false,
      count: 0,
      isSimulated: false,
      message: `Email delivery failed: ${err.message}`,
    };
  }
}

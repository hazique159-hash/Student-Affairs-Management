
'use server';

import { Resend } from 'resend';

/**
 * @fileOverview Server action for processing notification broadcasts.
 * 
 * This action handles the logic of sending emails to a list of recipients.
 * It uses Resend as the delivery provider.
 */

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;

interface BroadcastResult {
  success: boolean;
  count: number;
  message: string;
}

export async function sendBroadcastToEmails(
  title: string,
  content: string,
  emails: string[]
): Promise<BroadcastResult> {
  // If no emails, skip
  if (!emails || emails.length === 0) {
    return {
      success: true,
      count: 0,
      message: 'No recipients selected.',
    };
  }

  // Deduplicate emails
  const uniqueEmails = Array.from(new Set(emails.filter(e => !!e && e.includes('@'))));

  console.log(`[BROADCAST] Dispatching notification: "${title}"`);
  console.log(`[BROADCAST] Target Recipients: ${uniqueEmails.length}`);

  if (!resend) {
    console.warn('[BROADCAST] RESEND_API_KEY is not set. Simulating dispatch...');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      success: true,
      count: uniqueEmails.length,
      message: `SIMULATION: Broadcast dispatched to ${uniqueEmails.length} recipients. (Add RESEND_API_KEY to .env for real delivery)`,
    };
  }

  try {
    // Send using Resend batch API for efficiency
    // Note: Resend Free tier requires verified domains or your own email
    const { data, error } = await resend.emails.send({
      from: 'AffairsConnect <onboarding@resend.dev>', // Replace with your verified sender
      to: uniqueEmails,
      subject: `[AffairsConnect] ${title}`,
      text: content,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #4f46e5;">${title}</h2>
          <p style="white-space: pre-wrap;">${content}</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #666;">
            This is an automated notification from AffairsConnect Student Affairs Management System.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('[BROADCAST] Resend Error:', error);
      throw new Error(error.message);
    }

    return {
      success: true,
      count: uniqueEmails.length,
      message: `Successfully sent broadcast to ${uniqueEmails.length} recipients via Resend.`,
    };
  } catch (err: any) {
    console.error('[BROADCAST] Dispatch Failed:', err);
    return {
      success: false,
      count: 0,
      message: `Dispatch failed: ${err.message}`,
    };
  }
}

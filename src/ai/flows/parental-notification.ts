'use server';

/**
 * @fileOverview Determines if a parental notification is required based on institutional policy and generates/sends the notification.
 *
 * - shouldNotifyParent - A function that determines if a parental notification is needed.
 * - NotifyParentInput - The input type for the shouldNotifyParent function.
 * - NotifyParentOutput - The return type for the shouldNotifyParent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const NotifyParentInputSchema = z.object({
  studentId: z.string().describe('The student ID.'),
  notificationType: z
    .enum(['counseling', 'fine', 'blockage'])
    .describe('The type of notification being sent to the student.'),
  studentEmail: z.string().email().describe('The student email address.'),
  studentPhoneNumber: z.string().describe('The student phone number.'),
  parentEmail: z.string().email().describe('The parent email address.'),
  parentPhoneNumber: z.string().describe('The parent phone number.'),
});
export type NotifyParentInput = z.infer<typeof NotifyParentInputSchema>;

const NotifyParentOutputSchema = z.object({
  shouldNotifyParent: z
    .boolean()
    .describe(
      'Whether or not the parent should be notified based on institutional policy.'
    ),
  notificationDetails: z.string().optional().describe('Details for the notification to the parent, if any.'),
});
export type NotifyParentOutput = z.infer<typeof NotifyParentOutputSchema>;

export async function shouldNotifyParent(
  input: NotifyParentInput
): Promise<NotifyParentOutput> {
  return shouldNotifyParentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'shouldNotifyParentPrompt',
  input: {schema: NotifyParentInputSchema},
  output: {schema: NotifyParentOutputSchema},
  prompt: `Based on the following institutional policy, determine if a parent should be notified.

Institutional Policy: Parental notification is required for all counseling sessions, for fines exceeding $50, and for all portal blockages.

Student ID: {{{studentId}}}
Notification Type: {{{notificationType}}}

Given the above information, determine if the parent should be notified.

Return a JSON object with the "shouldNotifyParent" field set to true or false.  If shouldNotifyParent is true, populate the notificationDetails field with a brief message suitable for sending to the parent.`, // eslint-disable-line max-len
});

const shouldNotifyParentFlow = ai.defineFlow(
  {
    name: 'shouldNotifyParentFlow',
    inputSchema: NotifyParentInputSchema,
    outputSchema: NotifyParentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);

    if (output === undefined) {
      throw new Error('No output from prompt');
    }
    // In a real implementation, you would send the notification here using
    // a service like SendGrid, Twilio, or a WhatsApp bot.
    //sendNotification(input.parentEmail, input.parentPhoneNumber, output.notificationDetails);

    return output;
  }
);

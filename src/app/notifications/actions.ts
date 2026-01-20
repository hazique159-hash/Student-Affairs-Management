"use server";

import { shouldNotifyParent, type NotifyParentInput, type NotifyParentOutput } from "@/ai/flows/parental-notification";
import { z } from "zod";

const NotifyParentInputSchema = z.object({
  studentId: z.string(),
  notificationType: z.enum(['counseling', 'fine', 'blockage']),
  studentEmail: z.string().email(),
  studentPhoneNumber: z.string(),
  parentEmail: z.string().email(),
  parentPhoneNumber: z.string(),
});

export async function getParentalNotificationSuggestion(data: NotifyParentInput): Promise<NotifyParentOutput | { error: string }> {
  const parsedData = NotifyParentInputSchema.safeParse(data);

  if (!parsedData.success) {
    return { error: "Invalid input data." };
  }

  try {
    const result = await shouldNotifyParent(parsedData.data);
    return result;
  } catch (error) {
    console.error("Error in getParentalNotificationSuggestion:", error);
    return { error: "An unexpected error occurred while processing the notification." };
  }
}

import { z } from "zod";

// No database tables needed for this simple countdown tool.

export const holidaysResponseSchema = z.array(z.string());

export type HolidaysResponse = z.infer<typeof holidaysResponseSchema>;

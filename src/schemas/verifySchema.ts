import { z } from "zod";

export const verifySchema = z.object({
  code: z
    .string()
    .min(6, "Verify code must be at least 6 digits")
    .max(6, "Verify code must be less than 6 digits"),
});

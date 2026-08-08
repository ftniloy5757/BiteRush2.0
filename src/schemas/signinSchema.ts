import { z } from "zod";

export const signinschema = z.object({
  identifier: z.string(),
  password: z.string(),
});

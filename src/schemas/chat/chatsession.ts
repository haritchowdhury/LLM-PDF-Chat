import { z } from "zod";

export const chatSession = z.object({
  session: z.string(),
  upload: z.string(),
});

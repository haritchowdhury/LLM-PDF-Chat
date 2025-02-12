import { z } from "zod";

export const getTopicsSchema = z.object({
  topic1: z.string(),
  topic2: z.string(),
  topic3: z.string(),
  topic4: z.string(),
  topic5: z.string(),
});

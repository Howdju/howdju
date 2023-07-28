import { z } from "zod";

export const TopicMessage = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("SEND_EMAIL"),
    params: z.object({
      to: z.union([z.string(), z.array(z.string())]),
      subject: z.string(),
      bodyHtml: z.string(),
      bodyText: z.string(),
      tags: z.object({}).passthrough().optional(),
    }),
  }),
  z.object({
    type: z.literal("AUTO_CONFIRM_URL_LOCATOR"),
    params: z.object({
      urlLocatorId: z.string(),
    }),
  }),
]);
export type TopicMessage = z.infer<typeof TopicMessage>;

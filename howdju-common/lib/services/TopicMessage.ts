import { z } from "zod";

export const TopicMessage = z.discriminatedUnion("type", [
  /** Send an email. */
  z.object({
    type: z.literal("SEND_EMAIL"),
    params: z.object({
      // Email senders must be preconfigured in AWS SES.
      from: z.string().email().optional(),
      to: z.union([z.string().email(), z.array(z.string().email())]),
      subject: z.string(),
      bodyHtml: z.string(),
      bodyText: z.string(),
      tags: z.object({}).passthrough().optional(),
    }),
  }),
  /** Check whether a UrlLocator accurately reflects its MediaExcerpt's localRep. */
  z.object({
    type: z.literal("AUTO_CONFIRM_URL_LOCATOR"),
    params: z.object({
      urlLocatorId: z.string(),
    }),
  }),
  /** Confirm that urlId's canonicalUrl reflects what its HTML says. */
  z.object({
    type: z.literal("CONFIRM_CANONICAL_URL"),
    params: z.object({
      urlId: z.string(),
    }),
  }),
]);
export type TopicMessage = z.infer<typeof TopicMessage>;

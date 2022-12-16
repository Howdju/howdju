import { z } from "zod";
import isUrl from "validator/lib/isURL";
import isIso8601 from "validator/lib/isISO8601";
import { extractDomain } from "./urls";
import { isMoment } from "moment";

type UrlOptions = { domain: RegExp };
/** Zod refinement for whether a string is a valid URL.
 *
 * If domain is present, the URL must m
 */
export const url =
  (options: UrlOptions) => (val: string, ctx: z.RefinementCtx) => {
    const { domain: domainPattern } = options;
    if (!isUrl(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Must be a URL",
      });
    }

    if (domainPattern) {
      const domain = extractDomain(val);
      if (!domainPattern.test(domain)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `URL domain must match: ${domainPattern}.`,
        });
      }
    }
  };

// Must have tuple type to pass as a spread argument.
export const iso8601Datetime: [
  (val: string) => boolean,
  (val: string) => z.CustomErrorParams
] = [
  (val: string) => isIso8601(val),
  (val: string) => ({
    message: `Invalid ISO8601 datetime (e.g. "2022-11-19T21:21:33Z"): ${val}`,
  }),
];

export const momentTimestamp: [
  (val: any) => boolean,
  (val: any) => z.CustomErrorParams
] = [
  (val: any) => isMoment(val),
  () => ({ message: "Must be a moment timestamp." }),
];

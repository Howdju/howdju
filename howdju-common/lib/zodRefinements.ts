import { z } from "zod";
import moment, { Moment } from "moment";
import isUrl from "validator/lib/isURL";

import { extractDomain } from "./urls";

type UrlOptions = { domain: RegExp };
/** Zod refinement for whether a string is a valid URL.
 *
 * If domain is present, the URL must m
 */
const urlRefinement =
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

export const urlString = (options: UrlOptions) =>
  z.string().superRefine(urlRefinement(options));

// @types/moment doesn't provide this constructor, but it works.
type MomentConstructor = {
  new (...args: Parameters<typeof moment>): Moment;
};
export const momentObject = z.instanceof(
  moment as unknown as MomentConstructor,
  {
    message: "Must be a moment timestamp.",
  }
);

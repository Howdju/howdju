import { z } from "zod";
import moment, { Moment } from "moment";
import isUrl from "validator/lib/isURL";

import { extractDomain } from "./urls";

type UrlOptions = { domain?: RegExp };
/** Zod refinement for whether a string is a valid URL.
 *
 * If domain is present, the URL must match it.
 */
const urlRefinement =
  (options: UrlOptions) => (val: string, ctx: z.RefinementCtx) => {
    const { domain } = options ?? {};
    if (!isUrl(val, { protocols: ["http", "https"], require_protocol: true })) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Must be a valid URL",
      });
    }

    if (domain) {
      const domain = extractDomain(val);
      if (!domain.test(domain)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `URL domain must match: ${domain}.`,
        });
      }
    }
  };

export const urlString = (options?: UrlOptions) =>
  z.string().superRefine(urlRefinement(options ?? {}));

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

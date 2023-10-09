import { z } from "zod";
import moment from "moment";
import isUrl from "validator/lib/isURL";

import { extractDomain } from "./urls";
import { MomentConstructor } from "./moment";

type UrlOptions = {
  domain?: RegExp;
};

// Allow localhost while in development
const require_tld = process.env.NODE_ENV !== "development";

/** Don't allow javascript: URLs to avoid XSS. */
export function isValidUrl(val: string) {
  return isUrl(val, {
    protocols: ["http", "https"],
    require_protocol: true,
    require_tld,
  });
}

/** Zod refinement for whether a string is a valid URL.
 *
 * If domain is present, the URL's domain must match it.
 */
const urlRefinement =
  (options: UrlOptions) => (val: string, ctx: z.RefinementCtx) => {
    const { domain: domainPattern } = options ?? {};
    if (!isValidUrl(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Must be a valid URL",
        params: {
          val,
          require_tld,
        },
      });
    }

    if (domainPattern) {
      const domain = extractDomain(val);
      if (!domain || !domainPattern.test(domain)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `URL domain must match: ${domainPattern}.`,
          params: {
            val,
          },
        });
      }
    }
  };

export const urlString = (options?: UrlOptions) =>
  z.string().superRefine(urlRefinement(options ?? {}));

export const momentObject = z.instanceof(
  moment as unknown as MomentConstructor,
  {
    message: "Must be a moment timestamp.",
  }
);

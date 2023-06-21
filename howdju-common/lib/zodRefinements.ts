import { z } from "zod";
import moment from "moment";
import isUrl from "validator/lib/isURL";

import { extractDomain } from "./urls";
import { MomentConstructor } from "./moment";

type UrlOptions = {
  domain?: RegExp;
};

/** Zod refinement for whether a string is a valid URL.
 *
 * If domain is present, the URL's domain must match it.
 */
const urlRefinement =
  (options: UrlOptions) => (val: string, ctx: z.RefinementCtx) => {
    const { domain: domainPattern } = options ?? {};
    // Allow localhost while in development
    const require_tld = process.env.NODE_ENV !== "development";
    if (
      !isUrl(val, {
        protocols: ["http", "https"],
        require_protocol: true,
        require_tld,
      })
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Must be a valid URL",
      });
    }

    if (domainPattern) {
      const domain = extractDomain(val);
      if (!domain || !domainPattern.test(domain)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `URL domain must match: ${domainPattern}.`,
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

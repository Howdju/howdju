import { Moment } from "moment";
import { z } from "zod";

import { AuthRefreshToken, momentObject } from "howdju-common";

export const Cookie = z.object({
  name: z.string(),
  value: z.string(),
  domain: z.string().optional(),
  path: z.string().optional(),
  expires: momentObject,
  secure: z.boolean().optional(),
  sameSite: z.enum(["strict", "lax", "none"]).optional(),
  httpOnly: z.boolean().optional(),
});
export type Cookie = z.infer<typeof Cookie>;

export const cookieNames = {
  AUTH_REFRESH_TOKEN: "auth-refresh-token",
};

export function createAuthRefreshCookie(
  token: AuthRefreshToken,
  expires: Moment,
  isSecure: boolean
): Cookie {
  return {
    name: cookieNames.AUTH_REFRESH_TOKEN,
    value: token,
    // undefined sets it to the current domain, ignoring subdomains.
    domain: undefined,
    path: "/",
    expires,
    secure: isSecure,
    sameSite: "strict",
    httpOnly: true,
  };
}

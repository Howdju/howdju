/** Schemas representing persisted data. */

import { z } from "zod";
import { momentTimestamp } from "./zodRefinements";
import { User } from "./zodSchemas";

export const UserData = User.omit({
  created: true,
  externalIds: true,
}).extend({
  acceptedTerms: z.any().refine(...momentTimestamp),
  affirmedMajorityConsent: z.any().refine(...momentTimestamp),
  affirmed13YearsOrOlder: z.any().refine(...momentTimestamp),
  affirmedNotGdpr: z.any().refine(...momentTimestamp),
});
export type UserData = z.infer<typeof UserData>;

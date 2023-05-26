import moment, { Moment } from "moment";

// @types/moment doesn't provide this constructor, but it works.
export type MomentConstructor = {
  new (...args: Parameters<typeof moment>): Moment;
};
export const MomentConstructor = moment as unknown as MomentConstructor;

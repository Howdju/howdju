import { isSchema, Schema } from "joi";

export function isJoiSchema(val: any): val is Schema {
  return isSchema(val);
}

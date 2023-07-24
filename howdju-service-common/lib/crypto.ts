import crypto from "crypto";

export function randomBase64String(length: number) {
  const bitCount = 6 * length;
  const byteCount = Math.ceil(bitCount / 8);
  return crypto.randomBytes(byteCount).toString("base64").slice(0, length);
}

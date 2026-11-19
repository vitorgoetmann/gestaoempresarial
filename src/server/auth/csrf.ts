import crypto from "crypto";
import { getEnv } from "../env";

export function createCsrfToken(): { token: string; signed: string } {
  const token = crypto.randomBytes(32).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getEnv().CSRF_SECRET)
    .update(token)
    .digest("hex");
  return { token, signed: `${token}.${signature}` };
}

export function validateCsrfToken(
  token: string | null,
  signed: string | null,
): boolean {
  if (!token || !signed) {
    return false;
  }

  const [raw, signature] = signed.split(".");
  if (!raw || !signature || raw !== token) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", getEnv().CSRF_SECRET)
    .update(raw)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expected, "hex"),
  );
}

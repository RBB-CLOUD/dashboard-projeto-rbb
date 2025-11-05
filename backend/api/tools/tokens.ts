import crypto from "crypto";
const PEPPER = process.env.TOKEN_PEPPER || "change-me";
export function newToken(prefix = "rbb") {
  return `${prefix}_${crypto.randomBytes(24).toString("base64url")}`;
}
export function hashToken(raw: string) {
  return crypto
    .createHash("sha256")
    .update(raw + PEPPER)
    .digest("hex");
}
export function tokenPrefix(raw: string) {
  return raw.split("_")[0];
}

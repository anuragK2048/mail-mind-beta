import crypto from "crypto";

export function generateCSRFtoken(): string {
  return crypto.randomBytes(32).toString("hex");
}

console.log(generateCSRFtoken());

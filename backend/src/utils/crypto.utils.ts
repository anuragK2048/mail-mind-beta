import crypto from "crypto";
import { ENCRYPTION_KEY } from "../config";

export function generateCSRFtoken(): string {
  return crypto.randomBytes(32).toString("hex");
}

console.log(generateCSRFtoken());

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Ensure the encryption key is the correct length (32 bytes for aes-256)
const key = crypto
  .createHash("sha256")
  .update(String(ENCRYPTION_KEY))
  .digest("base64")
  .substring(0, 32);

export function encrypt(text: string): string {
  // 1. Generate a random, unique Initialization Vector (IV) for each encryption
  const iv = crypto.randomBytes(IV_LENGTH);

  // 2. Create the cipher instance
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // 3. Encrypt the text
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  // 4. Get the authentication tag
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  try {
    // 1. Split the parts from the combined string
    const parts = encryptedText.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted text format.");
    }
    const [ivHex, authTagHex, encryptedDataHex] = parts;

    // 2. Convert parts from hex back to buffers
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const encryptedData = Buffer.from(encryptedDataHex, "hex");

    // 3. Create the decipher instance
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    // 4. Set the authentication tag. This is crucial for verifying integrity.
    decipher.setAuthTag(authTag);

    // 5. Decrypt the text
    let decrypted = decipher.update(encryptedData, undefined, "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Failed to decrypt token.");
  }
}

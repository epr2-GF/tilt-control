
import dotenv from "dotenv";

dotenv.config();

const secret = process.env.JWT_SECRET;

if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
  throw new Error(
    "JWT_SECRET must be configured and contain at least 32 bytes."
  );
}

export const JWT_SECRET = secret;

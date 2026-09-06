// src/lib/crypto/otp.ts
import { hmacSha256Bytes } from "./hmac";
import { utf8ToBytes } from "./encoding";

/**
 * Performs Dynamic Truncation on a 32-byte HMAC digest according to RFC 4226.
 * Returns a 6-digit zero-padded OTP string.
 */
export function dynamicTruncation(hmacDigest: Uint8Array): string {
  // Low 4 bits of the last byte indicate the offset [0..15]
  const offset = hmacDigest[hmacDigest.length - 1] & 0x0f;

  // Extract 31-bit integer from 4 bytes starting at offset
  const binaryCode =
    ((hmacDigest[offset] & 0x7f) << 24) |
    ((hmacDigest[offset + 1] & 0xff) << 16) |
    ((hmacDigest[offset + 2] & 0xff) << 8) |
    (hmacDigest[offset + 3] & 0xff);

  const otp = binaryCode % 1000000;
  return otp.toString().padStart(6, "0");
}

/**
 * Generates an HMAC-based One-Time Password (HOTP) using counter.
 */
export function generateHOTP(secret: string, counter: number | bigint): string {
  const counterBytes = new Uint8Array(8);
  const view = new DataView(counterBytes.buffer);
  const cBig = BigInt(counter);
  view.setBigUint64(0, cBig, false); // 8-byte big-endian counter

  const digest = hmacSha256Bytes(secret, counterBytes);
  return dynamicTruncation(digest);
}

/**
 * Generates a Time-based One-Time Password (TOTP) with a defined validity window.
 * Default time step is 300 seconds (5 minutes).
 */
export function generateTOTP(
  secret: string,
  timeStepSeconds: number = 300
): { otp: string; expiresAt: Date } {
  const now = Date.now();
  const timeStepMs = timeStepSeconds * 1000;
  const counter = Math.floor(now / timeStepMs);

  const otp = generateHOTP(secret, counter);
  const expiresAt = new Date((counter + 1) * timeStepMs);

  return { otp, expiresAt };
}

/**
 * Verifies a TOTP within the current time step and optional window steps.
 */
export function verifyTOTP(
  inputOtp: string,
  secret: string,
  timeStepSeconds: number = 300,
  windowSteps: number = 1
): boolean {
  if (!inputOtp || inputOtp.length !== 6) return false;

  const now = Date.now();
  const timeStepMs = timeStepSeconds * 1000;
  const currentCounter = Math.floor(now / timeStepMs);

  for (let i = -windowSteps; i <= windowSteps; i++) {
    const validOtp = generateHOTP(secret, currentCounter + i);
    if (validOtp === inputOtp.trim()) {
      return true;
    }
  }

  return false;
}

/**
 * Generates a standard 6-digit registration / 2FA verification OTP with 10-minute validity.
 */
export function generateVerificationOtp(masterSecret: string = "biterush_otp_master"): {
  otp: string;
  expiresAt: Date;
} {
  const timeSeed = Date.now().toString() + Math.random().toString();
  const digest = hmacSha256Bytes(masterSecret, utf8ToBytes(timeSeed));
  const otp = dynamicTruncation(digest);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  return { otp, expiresAt };
}

/**
 * Verifies a verification OTP against stored expected OTP and expiration timestamp.
 */
export function verifyStoredOtp(
  inputOtp: string,
  storedOtp: string | undefined,
  expiresAt: Date | string | number | undefined
): boolean {
  if (!inputOtp) return false;
  if (!storedOtp || !expiresAt) return false;
  if (Date.now() > new Date(expiresAt).getTime()) return false;
  return inputOtp.trim() === storedOtp.trim();
}

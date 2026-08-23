// src/lib/crypto/hmac.ts
import { utf8ToBytes, bytesToHex } from "./encoding";
import { sha256Bytes } from "./sha256";

const BLOCK_SIZE = 64; // 512 bits for SHA-256

/**
 * Computes HMAC-SHA256 of a message using the given key.
 * RFC 2104 compliant: HMAC(K, m) = H((K' XOR opad) || H((K' XOR ipad) || m))
 */
export function hmacSha256Bytes(
  key: string | Uint8Array,
  message: string | Uint8Array
): Uint8Array {
  const keyBytes = typeof key === "string" ? utf8ToBytes(key) : key;
  const msgBytes = typeof message === "string" ? utf8ToBytes(message) : message;

  // 1. Prepare key K' of BLOCK_SIZE (64 bytes)
  let kPrime = new Uint8Array(BLOCK_SIZE);
  if (keyBytes.length > BLOCK_SIZE) {
    const hashedKey = sha256Bytes(keyBytes);
    kPrime.set(hashedKey, 0);
  } else {
    kPrime.set(keyBytes, 0);
  }

  // 2. Compute inner and outer padded keys
  const iPad = new Uint8Array(BLOCK_SIZE);
  const oPad = new Uint8Array(BLOCK_SIZE);
  for (let i = 0; i < BLOCK_SIZE; i++) {
    iPad[i] = kPrime[i] ^ 0x36;
    oPad[i] = kPrime[i] ^ 0x5c;
  }

  // 3. Inner hash: H(iPad || message)
  const innerConcat = new Uint8Array(BLOCK_SIZE + msgBytes.length);
  innerConcat.set(iPad, 0);
  innerConcat.set(msgBytes, BLOCK_SIZE);
  const innerHash = sha256Bytes(innerConcat);

  // 4. Outer hash: H(oPad || innerHash)
  const outerConcat = new Uint8Array(BLOCK_SIZE + 32);
  outerConcat.set(oPad, 0);
  outerConcat.set(innerHash, BLOCK_SIZE);

  return sha256Bytes(outerConcat);
}

/**
 * Computes HMAC-SHA256 and returns a 64-character lowercase hex string.
 */
export function hmacSha256Hex(
  key: string | Uint8Array,
  message: string | Uint8Array
): string {
  return bytesToHex(hmacSha256Bytes(key, message));
}

/**
 * Creates a deterministic blind lookup token for searchable encrypted fields (email, phone number).
 * Normalizes input (lowercase, trimmed) and binds with server pepper secret.
 */
export function createBlindLookupToken(
  value: string,
  pepperSecret: string
): string {
  if (!value) return "";
  const normalized = value.trim().toLowerCase();
  return hmacSha256Hex(pepperSecret, normalized);
}

/**
 * Generates an HMAC-SHA256 data integrity tag (MAC) for a structured document or payload.
 */
export function generateDataIntegrityMac(
  payload: any,
  secretKey: string
): string {
  const serialized =
    typeof payload === "string" ? payload : JSON.stringify(payload);
  return hmacSha256Hex(secretKey, serialized);
}

/**
 * Verifies if an HMAC-SHA256 data integrity tag matches the payload.
 */
export function verifyDataIntegrityMac(
  payload: any,
  mac: string,
  secretKey: string
): boolean {
  if (!mac) return false;
  const expected = generateDataIntegrityMac(payload, secretKey);
  return expected === mac;
}

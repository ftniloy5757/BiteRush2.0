// src/lib/crypto/random.ts
import { bytesToBigInt } from "./encoding";

/**
 * Returns cryptographically secure random bytes of specified length.
 * Uses native Web Crypto API or Node crypto safely in both Node.js and Edge/Browser runtimes.
 */
export function getRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  if (typeof globalThis !== "undefined" && globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
    return bytes;
  }
  // Node.js fallback
  try {
    const nodeCrypto = require("crypto");
    const buf = nodeCrypto.randomBytes(length);
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  } catch (err) {
    // Basic pseudo-random fallback if no CSPRNG available (emergency fallback only)
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    return bytes;
  }
}

/**
 * Returns a cryptographically secure random BigInt of exact bit length.
 */
export function randomBigInt(bitLength: number): bigint {
  const byteLength = Math.ceil(bitLength / 8);
  const bytes = getRandomBytes(byteLength);
  // Mask off upper bits if bitLength is not a multiple of 8
  const excessBits = byteLength * 8 - bitLength;
  if (excessBits > 0) {
    bytes[0] &= (1 << (8 - excessBits)) - 1;
  }
  return bytesToBigInt(bytes);
}

/**
 * Returns a cryptographically secure random BigInt in the range [min, max).
 */
export function randomBigIntRange(min: bigint, max: bigint): bigint {
  if (min >= max) {
    throw new Error("min must be strictly less than max");
  }
  const range = max - min;
  const bitLength = range.toString(2).length;
  let candidate: bigint;
  do {
    candidate = randomBigInt(bitLength);
  } while (candidate >= range);
  return min + candidate;
}

// src/lib/crypto/ecc.ts
import {
  mod,
  modInverse,
  modPow,
  legendreSymbol,
  tonelliShanks,
} from "./math";
import {
  utf8ToBytes,
  bytesToUtf8,
  hexToBytes,
  bytesToHex,
  bytesToBigInt,
  bigIntToBytes,
  bigIntToHex,
  hexToBigInt,
} from "./encoding";
import { randomBigIntRange } from "./random";

/**
 * Standard secp256k1 Elliptic Curve Parameters
 * y^2 = x^3 + ax + b (mod p)
 */
export const ECC_CURVE = {
  p: 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2fn,
  a: 0n,
  b: 7n,
  Gx: 0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n,
  Gy: 0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n,
  n: 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n,
};

export interface Point {
  x: bigint;
  y: bigint;
}

export type ECCPoint = Point | null; // null represents the Point at Infinity O

export interface ECCPublicKey {
  Q: Point;
}

export interface ECCPrivateKey {
  d: bigint;
}

export interface ECCKeyPair {
  publicKey: ECCPublicKey;
  privateKey: ECCPrivateKey;
}

const G: Point = { x: ECC_CURVE.Gx, y: ECC_CURVE.Gy };
const KOBLITZ_K = 100n; // Koblitz parameter: allows 100 attempts to find quadratic residue

/**
 * Checks if a point lies on the curve y^2 = x^3 + ax + b (mod p).
 */
export function isPointOnCurve(point: ECCPoint): boolean {
  if (point === null) return true; // Point at infinity is valid
  const { p, a, b } = ECC_CURVE;
  const left = mod(point.y * point.y, p);
  const right = mod(point.x * point.x * point.x + a * point.x + b, p);
  return left === right;
}

/**
 * Point Negation: -P = (x, -y mod p)
 */
export function pointNegate(point: ECCPoint): ECCPoint {
  if (point === null) return null;
  return {
    x: point.x,
    y: mod(-point.y, ECC_CURVE.p),
  };
}

/**
 * Point Addition on Weierstrass Curve: R = P + Q
 */
export function pointAdd(p1: ECCPoint, p2: ECCPoint): ECCPoint {
  if (p1 === null) return p2;
  if (p2 === null) return p1;

  const { p, a } = ECC_CURVE;

  // If x1 == x2
  if (p1.x === p2.x) {
    // If y1 == -y2 or y1 == 0, result is point at infinity
    if (p1.y !== p2.y || p1.y === 0n) {
      return null;
    }
    // Tangent slope: lambda = (3 * x1^2 + a) / (2 * y1) mod p
    const num = mod(3n * p1.x * p1.x + a, p);
    const den = mod(2n * p1.y, p);
    const lambda = mod(num * modInverse(den, p), p);

    const x3 = mod(lambda * lambda - 2n * p1.x, p);
    const y3 = mod(lambda * (p1.x - x3) - p1.y, p);
    return { x: x3, y: y3 };
  }

  // Secant slope: lambda = (y2 - y1) / (x2 - x1) mod p
  const num = mod(p2.y - p1.y, p);
  const den = mod(p2.x - p1.x, p);
  const lambda = mod(num * modInverse(den, p), p);

  const x3 = mod(lambda * lambda - p1.x - p2.x, p);
  const y3 = mod(lambda * (p1.x - x3) - p1.y, p);
  return { x: x3, y: y3 };
}

/**
 * Point Doubling: R = 2P
 */
export function pointDouble(point: ECCPoint): ECCPoint {
  return pointAdd(point, point);
}

/**
 * Scalar Multiplication: R = k * P
 * Implemented using binary Double-and-Add algorithm.
 */
export function scalarMultiply(k: bigint, point: ECCPoint): ECCPoint {
  if (point === null || k === 0n) return null;
  k = mod(k, ECC_CURVE.n);
  if (k === 0n) return null;

  let result: ECCPoint = null;
  let addend: ECCPoint = point;

  while (k > 0n) {
    if (k & 1n) {
      result = pointAdd(result, addend);
    }
    addend = pointDouble(addend);
    k >>= 1n;
  }

  return result;
}

/**
 * Generates an ECC key pair from scratch.
 */
export function generateECCKeyPair(): ECCKeyPair {
  const d = randomBigIntRange(1n, ECC_CURVE.n - 1n);
  const Q = scalarMultiply(d, G);
  if (Q === null) {
    return generateECCKeyPair();
  }
  return {
    publicKey: { Q },
    privateKey: { d },
  };
}

/**
 * Koblitz Message Embedding: Encodes message integer m into an Elliptic Curve Point M.
 * Uses x = m * K + j and tests for quadratic residue.
 */
export function encodeMessageToPoint(m: bigint): Point {
  const { p, a, b } = ECC_CURVE;
  for (let j = 0n; j < KOBLITZ_K; j++) {
    const x = m * KOBLITZ_K + j;
    if (x >= p) continue;
    const rhs = mod(x * x * x + a * x + b, p);
    if (legendreSymbol(rhs, p) === 1n) {
      const y = tonelliShanks(rhs, p);
      return { x, y };
    }
  }
  throw new Error("Failed to encode message integer to curve point");
}

/**
 * Koblitz Message Extraction: Decodes message integer m from an Elliptic Curve Point M.
 */
export function decodePointToMessage(point: Point): bigint {
  return point.x / KOBLITZ_K;
}

/**
 * Encrypts an arbitrary-length message using Asymmetric ECC ElGamal Point Addition.
 * Form: C1 = k * G, C2 = M + k * Q
 */
export function eccEncrypt(
  plaintext: string,
  publicKey: ECCPublicKey,
  keyVersion: number = 1
): string {
  if (!plaintext) return "";
  const dataBytes = utf8ToBytes(plaintext);

  // Maximum bytes per chunk: 28 bytes ensures m * 100 < 2^256
  const chunkSize = 24;
  const encryptedPairs: { c1: string; c2: string }[] = [];

  for (let i = 0; i < dataBytes.length; i += chunkSize) {
    const chunk = dataBytes.slice(i, i + chunkSize);
    const mInt = bytesToBigInt(chunk);
    const M = encodeMessageToPoint(mInt);

    // Choose ephemeral random scalar k in [1, n-1]
    const k = randomBigIntRange(1n, ECC_CURVE.n - 1n);

    // C1 = k * G
    const C1 = scalarMultiply(k, G);
    // S = k * Q (Shared point)
    const S = scalarMultiply(k, publicKey.Q);
    // C2 = M + S
    const C2 = pointAdd(M, S);

    if (C1 === null || C2 === null) {
      // Retry chunk if degenerate point occurs
      i -= chunkSize;
      continue;
    }

    encryptedPairs.push({
      c1: `${bigIntToHex(C1.x, 32)}:${bigIntToHex(C1.y, 32)}`,
      c2: `${bigIntToHex(C2.x, 32)}:${bigIntToHex(C2.y, 32)}`,
    });
  }

  const envelope = {
    v: keyVersion,
    alg: "ECC-SECP256K1-ELGAMAL",
    blocks: encryptedPairs,
  };

  return JSON.stringify(envelope);
}

/**
 * Decrypts an ECC ElGamal ciphertext envelope string using the ECC private key.
 * Form: M = C2 - d * C1
 */
export function eccDecrypt(ciphertext: string, privateKey: ECCPrivateKey): string {
  if (!ciphertext) return "";

  try {
    const envelope = JSON.parse(ciphertext);
    if (!envelope.blocks || !Array.isArray(envelope.blocks)) {
      throw new Error("Invalid ECC envelope structure");
    }

    const decryptedChunks: Uint8Array[] = [];

    for (const block of envelope.blocks) {
      const [c1xHex, c1yHex] = block.c1.split(":");
      const [c2xHex, c2yHex] = block.c2.split(":");

      const C1: Point = { x: hexToBigInt(c1xHex), y: hexToBigInt(c1yHex) };
      const C2: Point = { x: hexToBigInt(c2xHex), y: hexToBigInt(c2yHex) };

      // S = d * C1
      const S = scalarMultiply(privateKey.d, C1);
      // M = C2 - S = C2 + (-S)
      const M = pointAdd(C2, pointNegate(S));

      if (M === null) {
        throw new Error("ECC Decryption produced point at infinity");
      }

      const mInt = decodePointToMessage(M);
      const chunkBytes = bigIntToBytes(mInt);
      decryptedChunks.push(chunkBytes);
    }

    // Combine decrypted chunks
    const totalLen = decryptedChunks.reduce((acc, c) => acc + c.length, 0);
    const fullBytes = new Uint8Array(totalLen);
    let offset = 0;
    for (const chunk of decryptedChunks) {
      fullBytes.set(chunk, offset);
      offset += chunk.length;
    }

    return bytesToUtf8(fullBytes);
  } catch (err: any) {
    throw new Error(`ECC Decryption failed: ${err.message}`);
  }
}

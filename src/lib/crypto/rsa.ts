// src/lib/crypto/rsa.ts
import {
  gcd,
  modInverse,
  modPow,
  randomPrime,
} from "./math";
import {
  utf8ToBytes,
  bytesToUtf8,
  hexToBytes,
  bytesToHex,
  bytesToBigInt,
  bigIntToBytes,
} from "./encoding";
import { getRandomBytes } from "./random";

export interface RSAPublicKey {
  e: bigint;
  n: bigint;
}

export interface RSAPrivateKey {
  d: bigint;
  n: bigint;
}

export interface RSAKeyPair {
  publicKey: RSAPublicKey;
  privateKey: RSAPrivateKey;
}

/**
 * Generates an RSA key pair from scratch.
 * Default bitLength is 1024 (two 512-bit prime numbers).
 */
export function generateRSAKeyPair(bitLength: number = 1024): RSAKeyPair {
  const halfBits = Math.floor(bitLength / 2);
  const e = 65537n;

  let p: bigint;
  let q: bigint;
  let phi: bigint;

  do {
    p = randomPrime(halfBits);
    q = randomPrime(halfBits);
    while (p === q) {
      q = randomPrime(halfBits);
    }
    phi = (p - 1n) * (q - 1n);
  } while (gcd(e, phi) !== 1n);

  const n = p * q;
  const d = modInverse(e, phi);

  return {
    publicKey: { e, n },
    privateKey: { d, n },
  };
}

/**
 * Applies PKCS#1 v1.5 padding to a message block.
 * Padded format: 0x00 || 0x02 || PS (non-zero random bytes) || 0x00 || Message
 */
function padPKCS1v15(dataChunk: Uint8Array, targetLen: number): Uint8Array {
  if (dataChunk.length > targetLen - 11) {
    throw new Error(`Data chunk too large for RSA block size (${targetLen} bytes)`);
  }
  const psLen = targetLen - dataChunk.length - 3;
  const padded = new Uint8Array(targetLen);
  padded[0] = 0x00;
  padded[1] = 0x02;

  // Fill PS with non-zero random bytes
  let i = 0;
  while (i < psLen) {
    const r = getRandomBytes(psLen - i + 8);
    for (let j = 0; j < r.length && i < psLen; j++) {
      if (r[j] !== 0) {
        padded[2 + i] = r[j];
        i++;
      }
    }
  }

  padded[2 + psLen] = 0x00;
  padded.set(dataChunk, 3 + psLen);
  return padded;
}

/**
 * Removes PKCS#1 v1.5 padding from a decrypted block.
 */
function unpadPKCS1v15(padded: Uint8Array): Uint8Array {
  if (padded.length < 11 || padded[0] !== 0x00 || padded[1] !== 0x02) {
    // If leading 0x00 was truncated by BigInt conversion, check if padded[0] == 0x02
    if (padded[0] === 0x02) {
      let sepIndex = -1;
      for (let i = 1; i < padded.length; i++) {
        if (padded[i] === 0x00) {
          sepIndex = i;
          break;
        }
      }
      if (sepIndex !== -1) {
        return padded.slice(sepIndex + 1);
      }
    }
    throw new Error("Invalid PKCS#1 v1.5 padding structure");
  }

  let sepIndex = -1;
  for (let i = 2; i < padded.length; i++) {
    if (padded[i] === 0x00) {
      sepIndex = i;
      break;
    }
  }

  if (sepIndex === -1 || sepIndex < 10) {
    throw new Error("Invalid PKCS#1 v1.5 padding delimiter");
  }

  return padded.slice(sepIndex + 1);
}

/**
 * Encrypts an arbitrary-length string using RSA and PKCS#1 v1.5 chunking.
 * Returns a JSON envelope string.
 */
export function rsaEncrypt(
  plaintext: string,
  publicKey: RSAPublicKey,
  keyVersion: number = 1
): string {
  if (!plaintext) return "";
  const dataBytes = utf8ToBytes(plaintext);
  const k = Math.ceil(publicKey.n.toString(16).length / 2); // modulus byte size
  const maxChunkSize = Math.max(1, k - 11);

  const encryptedBlocks: string[] = [];
  for (let i = 0; i < dataBytes.length; i += maxChunkSize) {
    const chunk = dataBytes.slice(i, i + maxChunkSize);
    const padded = padPKCS1v15(chunk, k);
    const m = bytesToBigInt(padded);
    const c = modPow(m, publicKey.e, publicKey.n);
    encryptedBlocks.push(bytesToHex(bigIntToBytes(c, k)));
  }

  const envelope = {
    v: keyVersion,
    alg: "RSA-1024-PKCS1",
    blocks: encryptedBlocks,
  };

  return JSON.stringify(envelope);
}

/**
 * Decrypts an RSA ciphertext envelope string using the RSA private key.
 */
export function rsaDecrypt(ciphertext: string, privateKey: RSAPrivateKey): string {
  if (!ciphertext) return "";

  try {
    const envelope = JSON.parse(ciphertext);
    if (!envelope.blocks || !Array.isArray(envelope.blocks)) {
      throw new Error("Invalid RSA envelope structure");
    }

    const k = Math.ceil(privateKey.n.toString(16).length / 2);
    const decryptedChunks: Uint8Array[] = [];

    for (const hexBlock of envelope.blocks) {
      const blockBytes = hexToBytes(hexBlock);
      const c = bytesToBigInt(blockBytes);
      const m = modPow(c, privateKey.d, privateKey.n);
      const padded = bigIntToBytes(m, k);
      const unpadded = unpadPKCS1v15(padded);
      decryptedChunks.push(unpadded);
    }

    // Combine all unpadded chunks
    const totalLen = decryptedChunks.reduce((acc, c) => acc + c.length, 0);
    const fullBytes = new Uint8Array(totalLen);
    let offset = 0;
    for (const chunk of decryptedChunks) {
      fullBytes.set(chunk, offset);
      offset += chunk.length;
    }

    return bytesToUtf8(fullBytes);
  } catch (err: any) {
    // If string is not in JSON envelope, return empty or rethrow
    throw new Error(`RSA Decryption failed: ${err.message}`);
  }
}

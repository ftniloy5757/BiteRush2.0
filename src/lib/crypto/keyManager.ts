// src/lib/crypto/keyManager.ts
import { RSAPublicKey, RSAPrivateKey, generateRSAKeyPair } from "./rsa";
import { ECCPublicKey, ECCPrivateKey, generateECCKeyPair, Point } from "./ecc";
import { hexToBigInt, bigIntToHex } from "./encoding";

export interface KeyRing {
  version: number;
  rsaPublicKey: RSAPublicKey;
  rsaPrivateKey: RSAPrivateKey;
  eccPublicKey: ECCPublicKey;
  eccPrivateKey: ECCPrivateKey;
}

// In-memory keystore caching historical keyrings for multi-version rotation
const keyRings: Map<number, KeyRing> = new Map();

// Default fallback pepper if not specified in environment
const DEFAULT_PEPPER = "biterush_pepper_blind_lookup_master_secret_2026";

/**
 * Parses RSA Public Key from "e_hex:n_hex" string.
 */
export function parseRSAPublicKey(formatted: string): RSAPublicKey {
  const [eHex, nHex] = formatted.split(":");
  return {
    e: hexToBigInt(eHex),
    n: hexToBigInt(nHex),
  };
}

/**
 * Formats RSA Public Key to "e_hex:n_hex" string.
 */
export function formatRSAPublicKey(key: RSAPublicKey): string {
  return `${bigIntToHex(key.e)}:${bigIntToHex(key.n)}`;
}

/**
 * Parses RSA Private Key from "d_hex:n_hex" string.
 */
export function parseRSAPrivateKey(formatted: string): RSAPrivateKey {
  const [dHex, nHex] = formatted.split(":");
  return {
    d: hexToBigInt(dHex),
    n: hexToBigInt(nHex),
  };
}

/**
 * Formats RSA Private Key to "d_hex:n_hex" string.
 */
export function formatRSAPrivateKey(key: RSAPrivateKey): string {
  return `${bigIntToHex(key.d)}:${bigIntToHex(key.n)}`;
}

/**
 * Parses ECC Public Key from "Qx_hex:Qy_hex" string.
 */
export function parseECCPublicKey(formatted: string): ECCPublicKey {
  const [xHex, yHex] = formatted.split(":");
  const Q: Point = {
    x: hexToBigInt(xHex),
    y: hexToBigInt(yHex),
  };
  return { Q };
}

/**
 * Formats ECC Public Key to "Qx_hex:Qy_hex" string.
 */
export function formatECCPublicKey(key: ECCPublicKey): string {
  return `${bigIntToHex(key.Q.x, 32)}:${bigIntToHex(key.Q.y, 32)}`;
}

/**
 * Parses ECC Private Key from "d_hex" string.
 */
export function parseECCPrivateKey(formatted: string): ECCPrivateKey {
  return {
    d: hexToBigInt(formatted),
  };
}

/**
 * Formats ECC Private Key to "d_hex" string.
 */
export function formatECCPrivateKey(key: ECCPrivateKey): string {
  return bigIntToHex(key.d, 32);
}

/**
 * Key Manager class responsible for key lifecycle, multi-version rotation, and distribution.
 */
export class KeyManager {
  private static activeVersion: number = 1;

  /**
   * Initializes or fetches the KeyRing for the given version.
   */
  public static getKeyRing(version: number = this.activeVersion): KeyRing {
    if (keyRings.has(version)) {
      return keyRings.get(version)!;
    }

    // Try loading from environment variables if version == 1
    if (
      version === 1 &&
      process.env.CRYPTO_RSA_PUBLIC_KEY &&
      process.env.CRYPTO_RSA_PRIVATE_KEY &&
      process.env.CRYPTO_ECC_PUBLIC_KEY &&
      process.env.CRYPTO_ECC_PRIVATE_KEY
    ) {
      try {
        const ring: KeyRing = {
          version: 1,
          rsaPublicKey: parseRSAPublicKey(process.env.CRYPTO_RSA_PUBLIC_KEY),
          rsaPrivateKey: parseRSAPrivateKey(process.env.CRYPTO_RSA_PRIVATE_KEY),
          eccPublicKey: parseECCPublicKey(process.env.CRYPTO_ECC_PUBLIC_KEY),
          eccPrivateKey: parseECCPrivateKey(process.env.CRYPTO_ECC_PRIVATE_KEY),
        };
        keyRings.set(1, ring);
        return ring;
      } catch (err) {
        console.warn("Failed parsing environment keys, generating fresh keyring:", err);
      }
    }

    // Otherwise generate fresh keypair and store in keyring
    const rsaPair = generateRSAKeyPair(1024);
    const eccPair = generateECCKeyPair();

    const ring: KeyRing = {
      version,
      rsaPublicKey: rsaPair.publicKey,
      rsaPrivateKey: rsaPair.privateKey,
      eccPublicKey: eccPair.publicKey,
      eccPrivateKey: eccPair.privateKey,
    };

    keyRings.set(version, ring);
    return ring;
  }

  public static getActiveVersion(): number {
    const envVer = parseInt(process.env.CRYPTO_KEY_VERSION || "1", 10);
    return isNaN(envVer) ? this.activeVersion : envVer;
  }

  public static getPepperSecret(): string {
    return process.env.CRYPTO_PEPPER_SECRET || DEFAULT_PEPPER;
  }

  public static getRSAPublicKey(version?: number): RSAPublicKey {
    return this.getKeyRing(version || this.getActiveVersion()).rsaPublicKey;
  }

  public static getRSAPrivateKey(version?: number): RSAPrivateKey {
    return this.getKeyRing(version || this.getActiveVersion()).rsaPrivateKey;
  }

  public static getECCPublicKey(version?: number): ECCPublicKey {
    return this.getKeyRing(version || this.getActiveVersion()).eccPublicKey;
  }

  public static getECCPrivateKey(version?: number): ECCPrivateKey {
    return this.getKeyRing(version || this.getActiveVersion()).eccPrivateKey;
  }

  /**
   * Rotates keys to a new version, preserving previous version keys in the keyring.
   */
  public static rotateKeys(): {
    newVersion: number;
    rsaPublicKeyFormatted: string;
    eccPublicKeyFormatted: string;
  } {
    const newVersion = this.getActiveVersion() + 1;
    this.activeVersion = newVersion;
    const newRing = this.getKeyRing(newVersion);

    return {
      newVersion,
      rsaPublicKeyFormatted: formatRSAPublicKey(newRing.rsaPublicKey),
      eccPublicKeyFormatted: formatECCPublicKey(newRing.eccPublicKey),
    };
  }
}

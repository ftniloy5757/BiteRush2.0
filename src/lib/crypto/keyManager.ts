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

// Verified deterministic default master keypair for Version 1 (used if not set in environment)
const DEFAULT_V1_RSA_PUBLIC =
  "010001:bac2534b78b9342b2c45e7ad375c33a6e1a5a8617cc5a2d38541a28adc60e33ffbbb1214e990a3dda807bdc1aad2a7bd53e204c244b7480224dfdf45dfafb1d0677f8b3dcb4e7ee74e5755b362b83c3be7a3a2664948ca6670008ebad5ebdf8bf08ecf00104281195a1ed84b715031e991449863d2527f2fca136ee767452fab";
const DEFAULT_V1_RSA_PRIVATE =
  "9184c314466fc0a7772accf759f07ccaa67dc6b2975f039d5ef2a26d228457edcdfe987b34f69fc8219a4e8fedc39031e47f7307d03523659047e417f4d058725ebb6ff0a70087b5f4645ff11b852708e8f775a18070367f424640d460bdaa40c087d4526b64457cd982663de812c3f15c8d940a1866bcc6bf76b216d85c8069:bac2534b78b9342b2c45e7ad375c33a6e1a5a8617cc5a2d38541a28adc60e33ffbbb1214e990a3dda807bdc1aad2a7bd53e204c244b7480224dfdf45dfafb1d0677f8b3dcb4e7ee74e5755b362b83c3be7a3a2664948ca6670008ebad5ebdf8bf08ecf00104281195a1ed84b715031e991449863d2527f2fca136ee767452fab";
const DEFAULT_V1_ECC_PUBLIC =
  "5bfeaa5f355c8764caaf81f9bc4b68a01fd4637eb21cca2bcac101f1ed857991:94926855bf94d1f377b7fe762369069cc9343b87ad36b042df460303db465598";
const DEFAULT_V1_ECC_PRIVATE =
  "48b91a1c216daacb13590c58202aa6ac9f685c8b97946e9b56591979ead0ab41";

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

    // Load version 1 keys from environment or deterministic fallback
    if (version === 1) {
      try {
        const rsaPubStr = process.env.CRYPTO_RSA_PUBLIC_KEY || DEFAULT_V1_RSA_PUBLIC;
        const rsaPrivStr = process.env.CRYPTO_RSA_PRIVATE_KEY || DEFAULT_V1_RSA_PRIVATE;
        const eccPubStr = process.env.CRYPTO_ECC_PUBLIC_KEY || DEFAULT_V1_ECC_PUBLIC;
        const eccPrivStr = process.env.CRYPTO_ECC_PRIVATE_KEY || DEFAULT_V1_ECC_PRIVATE;

        const ring: KeyRing = {
          version: 1,
          rsaPublicKey: parseRSAPublicKey(rsaPubStr),
          rsaPrivateKey: parseRSAPrivateKey(rsaPrivStr),
          eccPublicKey: parseECCPublicKey(eccPubStr),
          eccPrivateKey: parseECCPrivateKey(eccPrivStr),
        };
        keyRings.set(1, ring);
        return ring;
      } catch (err) {
        console.warn("Failed loading version 1 keys, generating fallback:", err);
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

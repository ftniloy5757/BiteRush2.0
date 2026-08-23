// src/lib/crypto/cryptoService.ts
import { KeyManager } from "./keyManager";
import { rsaEncrypt, rsaDecrypt } from "./rsa";
import { eccEncrypt, eccDecrypt } from "./ecc";
import { sha256Hex } from "./sha256";
import {
  hmacSha256Hex,
  createBlindLookupToken,
  generateDataIntegrityMac,
  verifyDataIntegrityMac,
} from "./hmac";
import { generateVerificationOtp, verifyStoredOtp } from "./otp";

/**
 * Centralized facade for all cryptographic operations in BiteRush 2.0.
 * API routes call CryptoService directly without needing low-level mathematics.
 */
export class CryptoService {
  /**
   * Extracts version from a JSON ciphertext envelope.
   */
  private static extractVersion(ciphertext: string): number {
    try {
      const parsed = JSON.parse(ciphertext);
      return typeof parsed.v === "number" ? parsed.v : KeyManager.getActiveVersion();
    } catch {
      return KeyManager.getActiveVersion();
    }
  }

  // ==========================================
  // 1. RSA - User Profile PII Protection
  // ==========================================

  public static encryptProfile(plaintext: string): string {
    if (!plaintext) return "";
    const version = KeyManager.getActiveVersion();
    const pubKey = KeyManager.getRSAPublicKey(version);
    return rsaEncrypt(plaintext, pubKey, version);
  }

  public static decryptProfile(ciphertext: string): string {
    if (!ciphertext) return "";
    // If plaintext is passed (e.g. unencrypted mock data), return as-is
    if (!ciphertext.startsWith("{") || !ciphertext.includes("RSA")) {
      return ciphertext;
    }
    const version = this.extractVersion(ciphertext);
    const privKey = KeyManager.getRSAPrivateKey(version);
    return rsaDecrypt(ciphertext, privKey);
  }

  // ==========================================
  // 2. ECC - Orders, Chat, Reviews & Support
  // ==========================================

  public static encryptOrderField(plaintext: string): string {
    if (!plaintext) return "";
    const version = KeyManager.getActiveVersion();
    const pubKey = KeyManager.getECCPublicKey(version);
    return eccEncrypt(plaintext, pubKey, version);
  }

  public static decryptOrderField(ciphertext: string): string {
    if (!ciphertext) return "";
    if (!ciphertext.startsWith("{") || !ciphertext.includes("ECC")) {
      return ciphertext;
    }
    const version = this.extractVersion(ciphertext);
    const privKey = KeyManager.getECCPrivateKey(version);
    return eccDecrypt(ciphertext, privKey);
  }

  public static encryptChat(messageText: string): string {
    return this.encryptOrderField(messageText);
  }

  public static decryptChat(ciphertext: string): string {
    return this.decryptOrderField(ciphertext);
  }

  public static encryptReview(reviewText: string): string {
    return this.encryptOrderField(reviewText);
  }

  public static decryptReview(ciphertext: string): string {
    return this.decryptOrderField(ciphertext);
  }

  public static encryptSupport(messageText: string): string {
    return this.encryptOrderField(messageText);
  }

  public static decryptSupport(ciphertext: string): string {
    return this.decryptOrderField(ciphertext);
  }

  // ==========================================
  // 3. Blind Lookup Indexing (HMAC-SHA256)
  // ==========================================

  public static createEmailLookupHmac(email: string): string {
    if (!email) return "";
    return createBlindLookupToken(email, KeyManager.getPepperSecret());
  }

  public static createPhoneLookupHmac(contactNumber: string): string {
    if (!contactNumber) return "";
    return createBlindLookupToken(contactNumber, KeyManager.getPepperSecret());
  }

  // ==========================================
  // 4. Two-Factor Authentication (OTP)
  // ==========================================

  public static generateOTP(): { otp: string; expiresAt: Date } {
    return generateVerificationOtp(KeyManager.getPepperSecret());
  }

  public static verifyOTP(
    inputOtp: string,
    storedOtp?: string,
    expiresAt?: Date
  ): boolean {
    return verifyStoredOtp(inputOtp, storedOtp, expiresAt);
  }

  // ==========================================
  // 5. Data Integrity & Tamper Detection (MAC)
  // ==========================================

  public static generateIntegrityMac(payload: any): string {
    return generateDataIntegrityMac(payload, KeyManager.getPepperSecret());
  }

  public static verifyIntegrityMac(payload: any, mac: string): boolean {
    return verifyDataIntegrityMac(payload, mac, KeyManager.getPepperSecret());
  }

  // ==========================================
  // 6. Generic Hash & HMAC
  // ==========================================

  public static hash(input: string): string {
    return sha256Hex(input);
  }

  public static hmac(message: string, secret?: string): string {
    const key = secret || KeyManager.getPepperSecret();
    return hmacSha256Hex(key, message);
  }
}

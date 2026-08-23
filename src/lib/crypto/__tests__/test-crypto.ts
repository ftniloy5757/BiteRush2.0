// src/lib/crypto/__tests__/test-crypto.ts
import { sha256Hex } from "../sha256";
import { hmacSha256Hex, createBlindLookupToken } from "../hmac";
import { generateRSAKeyPair, rsaEncrypt, rsaDecrypt } from "../rsa";
import { generateECCKeyPair, eccEncrypt, eccDecrypt } from "../ecc";
import { generateHOTP, generateTOTP, verifyTOTP, generateVerificationOtp, verifyStoredOtp } from "../otp";
import { CryptoService } from "../cryptoService";
import { KeyManager } from "../keyManager";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`FAIL: ${msg}`);
  }
  console.log(`PASS: ${msg}`);
}

async function runTests() {
  console.log("=== Starting Cryptography Unit Tests ===");

  // 1. SHA-256 NIST Test Vectors
  console.log("\n--- Testing SHA-256 ---");
  const shaEmpty = sha256Hex("");
  assert(
    shaEmpty === "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "SHA-256 of empty string matches NIST vector"
  );

  const shaAbc = sha256Hex("abc");
  assert(
    shaAbc === "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    "SHA-256 of 'abc' matches NIST vector"
  );

  // 2. HMAC-SHA256 Test Vector
  console.log("\n--- Testing HMAC-SHA256 ---");
  // RFC 4231 Test Case 2: key = "Jefe", data = "what do ya want for nothing?"
  const hmacTest = hmacSha256Hex("Jefe", "what do ya want for nothing?");
  assert(
    hmacTest === "5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843",
    "HMAC-SHA256 matches RFC 4231 test vector"
  );

  // Blind lookup token
  const lookup1 = createBlindLookupToken("Customer@BiteRush.com ", "test_secret");
  const lookup2 = createBlindLookupToken("customer@biterush.com", "test_secret");
  assert(lookup1 === lookup2, "Blind lookup tokens are case-insensitive and trimmed");

  // 3. RSA Asymmetric Encryption
  console.log("\n--- Testing RSA-1024 Encryption & Decryption ---");
  const rsaPair = generateRSAKeyPair(512); // 512-bit for rapid testing
  const originalProfile = "Sensitive User Contact: +8801712345678, Address: Gulshan-2, Dhaka";
  const rsaCiphertext = rsaEncrypt(originalProfile, rsaPair.publicKey);
  assert(rsaCiphertext.includes("RSA") && rsaCiphertext !== originalProfile, "RSA encryption produces valid envelope");
  const rsaDecrypted = rsaDecrypt(rsaCiphertext, rsaPair.privateKey);
  assert(rsaDecrypted === originalProfile, "RSA decryption restores original profile text exactly");

  // 4. ECC Asymmetric Encryption
  console.log("\n--- Testing ECC SECP256K1 Point Encryption & Decryption ---");
  const eccPair = generateECCKeyPair();
  const originalOrderNote = "Special instructions: Door code #402. Please leave package on porch.";
  const eccCiphertext = eccEncrypt(originalOrderNote, eccPair.publicKey);
  assert(eccCiphertext.includes("ECC") && eccCiphertext !== originalOrderNote, "ECC encryption produces valid envelope");
  const eccDecrypted = eccDecrypt(eccCiphertext, eccPair.privateKey);
  assert(eccDecrypted === originalOrderNote, "ECC decryption restores original order notes exactly");

  // 5. OTP Dynamic Truncation & Verification
  console.log("\n--- Testing OTP Generation & Validation ---");
  const otpRes = generateVerificationOtp("test_secret");
  assert(otpRes.otp.length === 6 && /^\d{6}$/.test(otpRes.otp), "OTP is a valid 6-digit numeric string");
  assert(verifyStoredOtp(otpRes.otp, otpRes.otp, otpRes.expiresAt), "Valid OTP is accepted");
  assert(!verifyStoredOtp("000000", otpRes.otp, otpRes.expiresAt), "Invalid OTP is rejected");
  const expiredDate = new Date(Date.now() - 1000);
  assert(!verifyStoredOtp(otpRes.otp, otpRes.otp, expiredDate), "Expired OTP is rejected");

  // 6. CryptoService Facade
  console.log("\n--- Testing CryptoService Facade ---");
  const profileText = "Niloy Farhan - Customer Profile Data";
  const encProfile = CryptoService.encryptProfile(profileText);
  const decProfile = CryptoService.decryptProfile(encProfile);
  assert(decProfile === profileText, "CryptoService.encryptProfile and decryptProfile work end-to-end");

  const chatMessage = "Hey rider, I am waiting by the gate!";
  const encChat = CryptoService.encryptChat(chatMessage);
  const decChat = CryptoService.decryptChat(encChat);
  assert(decChat === chatMessage, "CryptoService.encryptChat and decryptChat work end-to-end");

  const reviewText = "Food was piping hot and delicious!";
  const encReview = CryptoService.encryptReview(reviewText);
  const decReview = CryptoService.decryptReview(encReview);
  assert(decReview === reviewText, "CryptoService.encryptReview and decryptReview work end-to-end");

  console.log("\n🎉 ALL CRYPTOGRAPHY TESTS PASSED SUCCESSFULLY! 🎉\n");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

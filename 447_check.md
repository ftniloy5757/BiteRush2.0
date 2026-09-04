

| Requirement | Status | Current State in BiteRush 2.0 |
| :---- | :---: | :---- |
| **1\. Login & Registration Modules** | ⚠️ **Partial** | Registration and login routes exist (/api/sign-up, NextAuth). However, plaintext data is still stored in DB (see below). |
| **2\. Encrypt User Info before storage & Decrypt on retrieval** | ⚠️ **Partial / Flawed** | RSA encryption is used (firstNameEncrypted, etc.), **BUT plaintext fields (firstName, email, contactNumber) are still simultaneously saved** in MongoDB\! |
| **3\. Password Hashed & Salted** | **Fulfilled** | Uses bcryptjs (bcrypt.hash(password, 10\)). *(Note: Verify if your instructor allows bcryptjs or requires your custom SHA-256 \+ salt).* |
| **4\. Two-Step Authentication (2FA) before access** | ❌ **Failed** | 2FA is **only enforced at sign-up** (/verify/\[userId\]). During **Login**, submitting email \+ password **immediately grants a session** without prompting for an OTP\! |
| **5\. Key Management Module (Generate, Distribute, Store, Rotate)** | **Fulfilled** | Handled in src/lib/crypto/keyManager.ts & /api/admin/keys (RSA/ECC key generation, in-memory keystore, versioning, rotation). |
| **6\. Create, View, and Edit Posts** | ❌ **Missing** | BiteRush is a food delivery app. There is **no "Post" model or Post CRUD**. The team repurposed ECC for Orders/Reviews/Chat instead. |
| **7\. All Critical Data Encrypted (Compromise Resistance)** | ❌ **Failed** | Plaintext fields in User.ts (email, firstName, contactNumber) and Order.ts (shippingAddress, review) are still stored and marked required. A DB dump leaks all PII. |
| **8\. MAC / HMAC Data Integrity Verification** | ⚠️ **Partial** | generateIntegrityMac is called on save, but **verifyIntegrityMac is NEVER called** anywhere on read or update\! |
| **9\. Exclusively Asymmetric Encryption (No Symmetric)** | **Fulfilled** | Strictly asymmetric: RSA (user profiles) and ECC ElGamal (orders, reviews, chat). No AES/DES/symmetric ciphers. |
| **10\. At least Two Different Asymmetric Algorithms** | **Fulfilled** | RSA-1024 \+ PKCS\#1 v1.5 and ECC secp256k1 ElGamal are both used for distinct subsystems. |
| **11\. From-Scratch Implementation (No Built-ins)** | **Fulfilled** | rsa.ts, ecc.ts, sha256.ts, hmac.ts, and math.ts are pure TypeScript/BigInt implementations from scratch. |
| **12\. Role-Based Access Control (Admin vs Regular Users)** | ⚠️ **Buggy** | Roles exist (admin, customer, restaurant, rider), but /admin is missing from middleware.ts, and admin APIs contain role bugs. |
| **13\. Secure Session Management** | **Fulfilled** | NextAuth JWT with HTTP-only cookies. |

---

## 5 Critical Issues to Fix Before Submission

### 1\. 2FA is Missing at Login (Strict Requirement)

* **Requirement**: *"A verification function must enforce two-step authentication, validating both primary credentials and a second factor before granting access."*  
* **The Bug**: In   
* option.ts, when bcrypt.compare succeeds, it immediately returns the user object and logs them in.  
* **The Fix**: Login must validate credentials, issue a temporary challenge token, generate/send a 6-digit OTP, and only issue the NextAuth session token after   
* verify-code validates the second factor.

### 2\. Plaintext Leak in Database (Violates "Prevent Plaintext Access")

* **Requirement**: *"All critical data... must be stored in encrypted form to prevent plaintext access even if the database is compromised."*  
* **The Bug**: In   
* sign-up/route.ts and   
* User.ts, firstName, lastName, email, and contactNumber are stored in plaintext alongside the encrypted fields. In   
* Order.ts, shippingAddress is stored in plaintext.  
* **The Fix**: Remove the plaintext required constraints on these fields. Store masked/empty values in plaintext columns (e.g. firstName: "\[ENCRYPTED\]", email: emailLookupHmac) and rely strictly on the \*Encrypted fields.

### 3\. Missing Post CRUD ("Create, View, and Edit Posts")

* **Requirement**: *"Users must be able to create, view, and edit posts and view or update profiles, with all data automatically encrypted before storage and decrypted on retrieval."*  
* **The Issue**: BiteRush adapted this requirement to Orders, Rider Chat, and Food Reviews. However:  
  * If your course evaluator checks specifically for a **Post CRUD module** (common for CSE447 projects modeled on forums/social feeds), they may mark this as missing.  
  * Furthermore, reviews in BiteRush can only be created once; they cannot be edited.  
* **The Recommendation**: Either add a simple "Community Feed / Food Posts" tab where users can create, view, edit, and delete ECC-encrypted posts, or verify with your instructor if orders/reviews satisfy the "posts" criteria.

### 4\. Integrity MAC is Never Verified

* **Requirement**: *"Message Authentication Codes (MAC) such as CBC-MAC or HMAC must verify data integrity and detect unauthorized modifications."*  
* **The Bug**: In   
* cryptoService.ts, verifyIntegrityMac is defined, but it is **not called in any route**.  
* **The Fix**: When fetching a user profile (GET /api/user/profile) or order details (GET /api/orders/\[id\]), recalculate the HMAC of the encrypted payload and compare it with doc.integrityMac. If they don't match, return a 400 / 403 Data Tampering Detected error.

### 5\. Role-Based Access Control (RBAC) Bugs in Admin Routes

* In   
* users/route.ts and   
* create-admin/route.ts:  
* typescript  
* // BUG: checks for "restaurant" instead of "admin"\!  
* return session?.user?.role \=== "restaurant";  
* In   
* middleware.ts: /admin/:path\* is missing from config.matcher, leaving /admin pages unprotected by middleware.


![][image1]

Department of Computer Science and Engineering  
**Course:** CSE447: Cryptography and Cryptanalysis  
**Semester:** Summer 2026

**Project Report**

*Title:* 

**Submitted To:** \[Instructor Name\]  
**Group No:**  e.g., 01

**Section:** e.g., 01

**Submission Date:** \[DD Month YYYY\]

**Group Members**

| No. | Full Name | Student ID |
| :---: | ----- | :---: |
| *1* | *\[Member 1 Full Name\]* | *\[Member 1 Student ID\]* |
| *2* | *\[Member 2 Full Name\]* | *\[Member 2 Student ID\]* |
| *3* | *\[Member 3 Full Name\]* | *\[Member 3 Student ID\]* |

# **Table of Contents**

1\.  Introduction and System Overview	3

2\.  Login and Registration Module	4

3\.  User Data Encryption and Decryption	5

4\.  Password Hashing and Salting	6

5\.  Two-Factor Authentication (2FA)	7

6\.  Key Management Module	8

7\.  Post and Profile Management	9

8\.  Data Storage Security	10

9\.  Message Authentication Code (MAC)	11

10\.  Role-Based Access Control (RBAC)	12

11\.  Secure Session Management	13

12\.  GitHub Repository and Project Structure	14

13\.  Conclusion	15

# **1\. Introduction and System Overview**

This report documents the design, implementation, and security analysis of the CSE447 Lab Project. The system is a secure web application integrating multiple cryptographic protocols as required by the course specification. All encryption algorithms have been implemented from scratch without relying on built-in framework encryption functions.

**1.1 Project Overview**

*\[ Briefly describe the web application — its purpose, users, and core functionality. \]*

**1.2 Technology Stack**

*\[ List programming language, framework, database, and any external libraries used (excluding built-in crypto). \]*

**1.3 System Architecture Diagram**

*\[ Insert a system architecture / flow diagram here showing major modules and data flow. \]*

# **2\. Login and Registration Module**

The system provides secure registration and login flows. New users supply credentials which are validated, encrypted, and persisted. During login, stored encrypted data is retrieved and decrypted for verification.

**2.1 Registration Flow**

*\[ Describe the step-by-step registration process (input validation → encryption → storage). Include a flowchart if possible. \]*

**2.2 Login Flow**

*\[ Describe the login process (credential retrieval → decryption → comparison → session creation). \]*

**2.3 Implementation Details**

| Requirement | Implementation Details |
| ----- | ----- |
| **Login Module** | *\[ Describe how users are authenticated — algorithm used, flow \]* |
| **Registration Module** | *\[ Describe user registration, input fields, validation rules \]* |
| **Data Encrypted Before Storage** | *\[ Specify which fields are encrypted and with which algorithm \]* |
| **Data Decrypted on Retrieval** | *\[ Explain the decryption process on login/profile fetch \]* |

# **3\. User Data Encryption and Decryption**

All sensitive user information (e.g., username, email, contact info) is encrypted before storage using asymmetric encryption algorithms implemented from scratch, and decrypted upon retrieval.

**3.1 Fields Encrypted**

*\[ List all database fields that are encrypted (e.g., name, email, phone). Specify which algorithm is applied to each. \]*

**3.2 Encryption Algorithm \- RSA Implementation**

*\[ Explain your from-scratch RSA implementation: key size, padding scheme, modular exponentiation approach, etc. \]*

**3.3 Encryption Algorithm \- ECC Implementation**

*\[ Explain your from-scratch ECC implementation: curve parameters (e.g., NIST P-256), point multiplication, encryption scheme (e.g., ECIES). \]*

**3.4 How Both Algorithms Are Used Differently**

*\[ Clarify which part of the system uses RSA and which part uses ECC, satisfying the requirement that a single algorithm is not used for all operations. \]*

# **4\. Password Hashing and Salting**

Passwords are never stored in plaintext. A cryptographic hash function combined with a random salt is applied before storage to prevent dictionary and rainbow-table attacks.

**4.1 Hashing Algorithm Used**

*\[ State the hash function used (e.g., SHA-256, SHA-3) and justify the choice. \]*

**4.2 Salt Generation**

*\[ Describe how the random salt is generated, its length, and where it is stored relative to the hash. \]*

**4.3 Verification Process**

*\[ Explain how a password is verified on login (retrieve salt → re-hash input → compare). \]*

# **5\. Two-Factor Authentication (2FA)**

The system enforces two-step verification: the user must pass both primary credential validation and a second authentication factor before a session is granted.

**5.1 2FA Method**

*\[ Describe the second factor used (e.g., TOTP, email OTP, SMS code, security question). Explain the flow. \]*

**5.2 Code Snippet**

*\[ Paste relevant 2FA implementation code here. \]*

# **6\. Key Management Module**

A dedicated Key Management Module handles the full lifecycle of cryptographic keys: secure storage, and rotation.

**6.1 Key Storage Security**

*\[ Detail how private keys are protected in the database or file system (e.g., encrypted with another key, hardware token, etc.). \]*

**6.2 Key Rotation Policy**

*\[ Describe the rotation schedule and how old keys are safely invalidated without breaking existing encrypted records. \]*

# **7\. Post and Profile Management**

Users can create, view, and edit posts, as well as view and update their profiles. All post and profile data is automatically encrypted before storage and decrypted on retrieval.

**7.1 Post Module**

*\[ Describe the Create / Read / Update flow for posts. List all fields that are encrypted and the algorithm applied. \]*

**7.2 Profile Module**

*\[ Describe the profile view / update flow. List which profile fields are encrypted. \]*

**7.3 Screenshots**

*\[ Insert screenshots of the post creation, post listing, and profile management pages. \]*

# **8\. Data Storage Security**

All critical data \- user information, posts, and cryptographic keys \- is stored in encrypted form to prevent plaintext access even in the event of a database compromise.

**8.1 Evidence of Encrypted Storage**

*\[ Insert a screenshot of the raw database records (showing ciphertext, not plaintext) to demonstrate encrypted storage. \]*

# **9\. Message Authentication Code (MAC)**

Message Authentication Codes (MACs) are used to verify the integrity of stored data and detect any unauthorized modifications. The system implements CBC-MAC or HMAC as required.

**9.1 MAC Algorithm Used**

*\[ State whether CBC-MAC or HMAC is used. Justify the choice. Describe the implementation from scratch. \]*

**9.2 Integrity Verification Flow**

*\[ Describe when and how MAC verification is performed (on every read, on critical operations, etc.). \]*

# **10\. Role-Based Access Control (RBAC)**

Role-Based Access Control defines distinct privilege levels for Administrators and Regular Users, ensuring that sensitive operations are restricted appropriately.

**10.1 Roles Defined**

*\[ List all roles in the system (e.g., Admin, User) and their high-level responsibilities. \]*

**10.2 Permission Matrix**

| Operation / Resource | Admin | Regular User |
| ----- | :---: | :---: |
| View own profile | ✔ | ✔ |
| Edit own profile | ✔ | ✔ |
| Create / Edit posts | ✔ | ✔ |
| Delete any post | ✔ | ✘ |
| View all user accounts | ✔ | ✘ |
| Manage / rotate keys | ✔ | ✘ |
| Assign roles to users | ✔ | ✘ |
| View audit logs | ✔ | ✘ |

*(Add or remove rows as appropriate for your system. Tick marks above are placeholders.)*

# **11\. Secure Session Management**

Authentication tokens and session identifiers are managed securely to prevent session hijacking, fixation, and replay attacks.

**11.1 Token Signing / Verification**

*\[ Describe how tokens are signed (e.g., HMAC-SHA256 or RSA) and how they are verified on each request. \]*

# **12\. GitHub Repository and Project Structure**

| Field | Details |
| ----- | ----- |
| **GitHub Repository URL** | *\[ https://github.com/your-username/your-repo-name \]* |

**12.1 Repository Structure**

*\[ Paste or describe the top-level folder/file structure of your repository (e.g., output of \`tree\` command or a directory listing). \]*

**12.2 README Overview**

*\[ Summarise what your README.md contains: setup instructions, environment requirements, how to run the project locally. \]*

# **13\. Conclusion**

*\[ Write a brief concluding paragraph reflecting on challenges faced, lessons learned, and the overall outcome of the project. \]*

[image1]: <data:image/png;base64,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>
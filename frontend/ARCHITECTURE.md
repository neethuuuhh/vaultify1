# Vaultify Architecture

## 📊 Zero-Knowledge Flow Chart

[User Enters Master Password]
            │
            ▼
[Client-Side Web Crypto API (PBKDF2)]
    ├──► Derived Auth Key ──► Sent to Server ──► Hashed with bcrypt (Login/Auth)
    └──► Derived Encryption Key ──► Stored in Local Memory ONLY (Never leaves browser)
                                           │
                                           ▼
                              [AES-256-GCM Encrypt / Decrypt]
                                           │
                                           ▼
                          [Node.js Backend / Dumb Storage]
                          (Stores ONLY unreadable ciphertext blob)

## Component Summary
* **Frontend (React / Vite):** Handles all cryptographic operations locally on the client device.
* **Backend (Node.js / Express):** Acts as a storage locker; authenticates via JWT and handles opaque encrypted data without knowing plaintext contents.
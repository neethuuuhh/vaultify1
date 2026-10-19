# 🔒 Vaultify: Zero-Knowledge Password Manager

Vaultify is a secure, lightweight, web-based password manager built on a **Zero-Knowledge Architecture**. It ensures that encryption and decryption operations happen exclusively on the client side, meaning the server acts strictly as a "dumb" storage locker for encrypted data blobs.

---

## 🛡️ Core Security Architecture

* **Zero-Knowledge Principle**: The user's Master Password is the root of trust. It never leaves the client browser, and the server has zero knowledge of the master password or plaintext credentials.
* **Client-Side Cryptography**: Powered by the browser's native **Web Crypto API**:
  * **Key Derivation**: Uses **PBKDF2** with a unique salt and high iteration count ($100,000+$) to securely derive both an authentication key and an encryption key.
  * **Encryption**: Uses **AES-256-GCM** (Galois/Counter Mode) to ensure both confidentiality and integrity of stored credentials.
* **The "Dumb" Backend**: Node.js and Express server that handles user authentication via hashed auth keys, issues JWT session tokens, and syncs encrypted JSON blobs without ever being able to read them.

---

## 🚀 Tech Stack

* **Frontend**: React.js, Vite, Web Crypto API
* **Backend**: Node.js, Express.js, JSON Web Tokens (JWT), `bcryptjs`
* **Cryptography**: PBKDF2, AES-GCM, SHA-256

---

## ⚙️ Getting Started & Local Setup

### 1. Backend Setup
Navigate to the backend directory, install dependencies, and start the server:
```powershell
cd backend
npm install
node server.js
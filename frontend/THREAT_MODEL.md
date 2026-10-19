# Vaultify Threat Model

## 🛡️ Security Boundaries & Flow

[Attacker / Breach Scenario]
            │
            ▼
[Database / Server Compromise] ──► Exposes ONLY AES-256-GCM ciphertext blobs
            │                     (No keys exist on the server to decrypt them)
            ▼
[Result: Data Remains Secure & Unreadable]

## Threat Mitigations
* **Database Leaks:** Stored data is completely unreadable ciphertext because the server lacks the client-side encryption keys.
* **Network Interception (MitM):** TLS encryption protects transit; Master Passwords are never transmitted.
* **Unattended Devices:** An automatic 5-minute inactivity timer wipes decrypted keys and session data from React memory.
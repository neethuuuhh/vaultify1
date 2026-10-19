export async function deriveKeys(masterPassword, saltHex) {
  const enc = new TextEncoder();
  const salt = hexToUint8Array(saltHex);
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw", enc.encode(masterPassword), { name: "PBKDF2" }, false, ["deriveKey", "deriveBits"]
  );
  const encryptionKey = await window.crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]
  );
  const authBits = await window.crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial, 256
  );
  const authKeyHex = uint8ArrayToHex(new Uint8Array(authBits));
  return { encryptionKey, authKeyHex };
}

export async function encryptVault(vaultData, encryptionKey) {
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedData = enc.encode(JSON.stringify(vaultData));
  const ciphertext = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, encryptionKey, encodedData);
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.byteLength);
  return btoa(String.fromCharCode(...combined));
}

export async function decryptVault(base64Ciphertext, encryptionKey) {
  const decoded = Uint8Array.from(atob(base64Ciphertext), c => c.charCodeAt(0));
  const iv = decoded.slice(0, 12);
  const ciphertext = decoded.slice(12);
  const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, encryptionKey, ciphertext);
  return JSON.parse(new TextDecoder().decode(decrypted));
}

function uint8ArrayToHex(buffer) {
  return Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToUint8Array(hexString) {
  return new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
}

export function generateSalt() {
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  return uint8ArrayToHex(array);
}
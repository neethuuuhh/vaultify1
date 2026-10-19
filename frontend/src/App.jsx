import React, { useState, useEffect } from 'react';
import { deriveKeys, encryptVault, decryptVault, generateSalt } from './utils/crypto';

const API_URL = 'http://localhost:5000/api';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState('');
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [username, setUsername] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [vault, setVault] = useState([]);
  const [rawBlob, setRawBlob] = useState('');
  
  // Form states for new entry
  const [site, setSite] = useState('');
  const [siteUser, setSiteUser] = useState('');
  const [sitePass, setSitePass] = useState('');

  // Logout & Cleanup Function
  const handleLogout = () => {
    setIsLoggedIn(false);
    setEncryptionKey(null);
    setToken('');
    setVault([]);
    setRawBlob('');
    setMasterPassword('');
  };

  // Auto-Lock Timer Hook (Clears memory after 5 minutes of inactivity)
  useEffect(() => {
    if (!isLoggedIn) return;

    let inactivityTimer;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      // Auto-lock after 5 minutes (300,000 ms) of inactivity
      inactivityTimer = setTimeout(() => {
        alert('Session auto-locked due to 5 minutes of inactivity for security.');
        handleLogout();
      }, 5 * 60 * 1000);
    };

    // Listen to user activity events
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keypress', resetTimer);
    window.addEventListener('click', resetTimer);

    resetTimer(); // Initialize timer on login

    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keypress', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
  }, [isLoggedIn]);

  async function handleRegister(e) {
    e.preventDefault();
    try {
      const salt = generateSalt();
      const { authKeyHex } = await deriveKeys(masterPassword, salt);
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, authKey: authKeyHex, salt })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      // Save salt locally for this user
      localStorage.setItem(`salt_${username}`, salt);

      alert('Registration successful! Please log in.');
      setIsRegistering(false);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    try {
      const savedSalt = localStorage.getItem(`salt_${username}`);
      if (!savedSalt) {
        alert('User salt not found on this browser. Please register first!');
        return;
      }

      const { encryptionKey, authKeyHex } = await deriveKeys(masterPassword, savedSalt);
      
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, authKey: authKeyHex })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setToken(data.token);
      setEncryptionKey(encryptionKey);
      setIsLoggedIn(true);

      fetchVault(data.token, encryptionKey);
    } catch (err) {
      alert('Login failed: ' + err.message);
    }
  }

  async function fetchVault(jwtToken, encKey) {
    const res = await fetch(`${API_URL}/vault`, {
      headers: { 'Authorization': `Bearer ${jwtToken}` }
    });
    const data = await res.json();
    setRawBlob(data.encryptedVault);
    if (data.encryptedVault) {
      const decrypted = await decryptVault(data.encryptedVault, encKey);
      setVault(decrypted);
    } else {
      setVault([]);
    }
  }

  async function saveVaultToBackend(updatedVault, jwtToken, encKey) {
    const encrypted = await encryptVault(updatedVault, encKey);
    setRawBlob(encrypted);
    await fetch(`${API_URL}/vault`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify({ encryptedVault: encrypted })
    });
  }

  async function handleAddEntry(e) {
    e.preventDefault();
    const updatedVault = [...vault, { site, username: siteUser, password: sitePass }];
    setVault(updatedVault);
    setSite(''); setSiteUser(''); setSitePass('');
    await saveVaultToBackend(updatedVault, token, encryptionKey);
  }

  if (!isLoggedIn) {
    return (
      <div style={{ padding: '40px', fontFamily: 'Arial', maxWidth: '400px', margin: 'auto' }}>
        <h2>🔒 Vaultify Zero-Knowledge Manager</h2>
        <form onSubmit={isRegistering ? handleRegister : handleLogin}>
          <div>
            <label>Username:</label><br/>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} required style={{width:'100%', padding:'8px', margin:'8px 0'}} />
          </div>
          <div>
            <label>Master Password:</label><br/>
            <input type="password" value={masterPassword} onChange={e => setMasterPassword(e.target.value)} required style={{width:'100%', padding:'8px', margin:'8px 0'}} />
          </div>
          <button type="submit" style={{width:'100%', padding:'10px', background:'#007BFF', color:'#fff', border:'none', cursor:'pointer'}}>
            {isRegistering ? 'Register' : 'Login'}
          </button>
        </form>
        <button onClick={() => setIsRegistering(!isRegistering)} style={{background:'none', border:'none', color:'blue', cursor:'pointer', marginTop:'15px'}}>
          {isRegistering ? 'Already have an account? Login' : "Don't have an account? Register"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial', maxWidth: '800px', margin: 'auto' }}>
      <h1>🛡️ Welcome to Your Vault, {username}</h1>
      <button onClick={handleLogout} style={{padding:'5px 10px', background:'#dc3545', color:'white', border:'none', cursor:'pointer'}}>Logout</button>
      
      <h3>Add New Password</h3>
      <form onSubmit={handleAddEntry} style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
        <input placeholder="Website" value={site} onChange={e => setSite(e.target.value)} required style={{padding:'8px'}} />
        <input placeholder="Username/Email" value={siteUser} onChange={e => setSiteUser(e.target.value)} required style={{padding:'8px'}} />
        <input placeholder="Password" value={sitePass} onChange={e => setSitePass(e.target.value)} required style={{padding:'8px'}} />
        <button type="submit" style={{padding:'8px 15px', background:'#28a745', color:'white', border:'none', cursor:'pointer'}}>Add</button>
      </form>

      <h3>Stored Accounts</h3>
      <table border="1" cellPadding="10" style={{width:'100%', borderCollapse:'collapse', marginBottom:'20px'}}>
        <thead>
          <tr style={{background:'#f2f2f2'}}>
            <th>Website</th>
            <th>Username</th>
            <th>Password</th>
          </tr>
        </thead>
        <tbody>
          {vault.length === 0 ? (
            <tr><td colSpan="3" style={{textAlign:'center'}}>No passwords stored yet.</td></tr>
          ) : (
            vault.map((item, idx) => (
              <tr key={idx}>
                <td>{item.site}</td>
                <td>{item.username}</td>
                <td>{item.password}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <h3>Sanity Check (Zero-Knowledge Proof)</h3>
      <p style={{fontSize:'12px', color:'#666'}}>This is the actual encrypted gibberish stored on the server database. The server has zero clue what your passwords are!</p>
      <textarea readOnly value={rawBlob} rows="4" style={{width:'100%', fontFamily:'monospace', padding:'8px'}} />
    </div>
  );
}
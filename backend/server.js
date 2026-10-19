require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'super_secret_vaultify_key_change_me';

const users = {};

app.post('/api/register', async (req, res) => {
  try {
    const { username, authKey, salt } = req.body;
    if (users[username]) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedAuthKey = await bcrypt.hash(authKey, 10);

    users[username] = {
      hashedAuthKey,
      salt,
      encryptedVault: '' 
    };

    res.json({ message: 'User registered successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, authKey } = req.body;
    const user = users[username];
    if (!user) return res.status(400).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(authKey, user.hashedAuthKey);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ token, salt: user.salt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

app.get('/api/vault', authenticateToken, (req, res) => {
  const user = users[req.user.username];
  res.json({ encryptedVault: user.encryptedVault });
});

app.put('/api/vault', authenticateToken, (req, res) => {
  const { encryptedVault } = req.body;
  const user = users[req.user.username];
  user.encryptedVault = encryptedVault;
  res.json({ message: 'Vault updated successfully!' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./dbSqlite');
require('dotenv').config();

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Test database connection
app.get('/api/health', (req, res) => {
  try {
    const result = db.prepare('SELECT 1 as test').get();
    res.json({ 
      status: 'ok', 
      database: 'connected (SQLite)',
      test: result
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Register endpoint
app.post('/api/register', async (req, res) => {
  console.log('\n=== Registration Request Received ===');
  console.log('Request body:', req.body);
  
  try {
    const { username, password, email, phone } = req.body;
    
    if (!username || !password || !email || !phone) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ message: 'All fields are required' });
    }

    console.log('✓ All fields present');
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✓ Password hashed');
    
    console.log('Attempting database insert...');
    const stmt = db.prepare(
      'INSERT INTO kodusers (username, password, email, phone, role, balance) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const result = stmt.run(username, hashedPassword, email, phone, 'Customer', 100000.00);

    console.log('✓ Registration successful! User ID:', result.lastInsertRowid);
    res.status(201).json({ message: 'Registration successful', uid: result.lastInsertRowid });
  } catch (error) {
    console.error('\n❌ Registration Error Details:');
    console.error('Error message:', error.message);
    
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ message: 'Username or email already exists' });
    }
    res.status(500).json({ message: 'Registration failed: ' + error.message });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  console.log('\n=== Login Request Received ===');
  
  try {
    const { username, password } = req.body;

    const user = db.prepare('SELECT * FROM kodusers WHERE username = ?').get(username);
    
    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      console.log('❌ Invalid password');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const exparity = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    
    const stmt = db.prepare('INSERT INTO CJWT (token, uid, exparity) VALUES (?, ?, ?)');
    stmt.run(token, user.uid, exparity);

    res.cookie('authToken', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

    console.log('✓ Login successful for user:', username);
    res.json({ message: 'Login successful', token });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// Check balance endpoint
app.get('/api/balance', async (req, res) => {
  try {
    const token = req.cookies.authToken || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = db.prepare('SELECT balance FROM kodusers WHERE username = ?').get(decoded.username);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ balance: user.balance });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    res.status(500).json({ message: 'Failed to fetch balance', error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n✓ Server running on port ${PORT}`);
  console.log(`✓ Using SQLite database`);
  console.log(`✓ Health check: http://localhost:${PORT}/api/health\n`);
});

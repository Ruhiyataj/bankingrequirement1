const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');
require('dotenv').config();

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Test database connection
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    const [tables] = await pool.query("SHOW TABLES LIKE 'kodusers'");
    const [cjwtTables] = await pool.query("SHOW TABLES LIKE 'CJWT'");
    res.json({ 
      status: 'ok', 
      database: 'connected',
      kodusersTable: tables.length > 0 ? 'exists' : 'missing',
      cjwtTable: cjwtTables.length > 0 ? 'exists' : 'missing'
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
    const [result] = await pool.query(
      'INSERT INTO kodusers (username, password, email, phone, role, balance) VALUES (?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, email, phone, 'Customer', 100000.00]
    );

    console.log('✓ Registration successful! User ID:', result.insertId);
    res.status(201).json({ message: 'Registration successful', uid: result.insertId });
  } catch (error) {
    console.error('\n❌ Registration Error Details:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Username or email already exists' });
    }
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({ message: 'Database tables not initialized. Please run: npm run init-db' });
    }
    if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      return res.status(500).json({ message: 'Cannot connect to database. Please check your internet connection and database credentials.' });
    }
    res.status(500).json({ message: 'Registration failed: ' + error.message });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const [users] = await pool.query('SELECT * FROM kodusers WHERE username = ?', [username]);
    
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const exparity = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    await pool.query(
      'INSERT INTO CJWT (token, uid, exparity) VALUES (?, ?, ?)',
      [token, user.uid, exparity]
    );

    res.cookie('authToken', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

    res.json({ message: 'Login successful', token });
  } catch (error) {
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
    
    const [users] = await pool.query('SELECT balance FROM kodusers WHERE username = ?', [decoded.username]);

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ balance: users[0].balance });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    res.status(500).json({ message: 'Failed to fetch balance', error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

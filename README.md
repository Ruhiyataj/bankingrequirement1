# kodBank Application

A banking application with JWT authentication, built with Node.js, Express, React, and MySQL.

## Features
- User registration with default balance of ₹100,000
- JWT-based authentication
- Secure login with token storage
- Balance checking with animated display

## Setup Instructions

### Stage 1: Database Setup
1. Install dependencies:
   ```
   npm install
   ```

2. Initialize database tables:
   ```
   npm run init-db
   ```

### Stage 2: Backend Setup
1. Start the backend server:
   ```
   npm run dev
   ```
   Server runs on http://localhost:3000

### Stage 3: Frontend Setup
1. Install frontend dependencies:
   ```
   cd client
   npm install
   ```

2. Start the frontend development server:
   ```
   npm run dev
   ```
   Frontend runs on http://localhost:5173

## Usage Flow
1. Register at http://localhost:5173/register
2. Login with your credentials
3. Click "Check Balance" to see your balance with celebration animation

## Database Schema
- **kodusers**: uid, username, email, password, balance, phone, role
- **CJWT**: tid, token, uid, exparity

## Tech Stack
- Backend: Node.js, Express, JWT, bcrypt
- Frontend: React, React Router, Vite
- Database: MySQL (Aiven)

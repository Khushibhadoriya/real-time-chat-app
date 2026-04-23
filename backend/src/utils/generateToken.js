// backend/src/utils/generateToken.js

import jwt from 'jsonwebtoken';

// ─────────────────────────────────────────────
// WHAT IS JWT?
// JSON Web Token — a secure way to prove identity
//
// Structure: header.payload.signature
// Example:   eyJhbGc.eyJ1c2VySWQ.xK2ulsDR
//
// HOW IT WORKS:
// 1. User logs in with email + password
// 2. Server verifies credentials
// 3. Server creates a JWT containing userId (not password!)
// 4. Server sends JWT to client
// 5. Client stores JWT and sends it with every future request
// 6. Server verifies JWT signature — if valid, user is authenticated
//
// WHY NOT SESSIONS?
// Sessions store data on server (memory/database)
// JWT is stateless — server doesn't store anything
// Perfect for scaling (multiple servers can verify same token)
// ─────────────────────────────────────────────

export const generateToken = (userId) => {
  // jwt.sign(payload, secret, options)
  // payload = data to store in token (keep it minimal — no passwords!)
  // secret = our JWT_SECRET from .env (used to sign + verify)
  // expiresIn = token becomes invalid after this time
  const token = jwt.sign(
    { userId },                          // Payload: just the userId
    process.env.JWT_SECRET,              // Secret key from .env
    { expiresIn: process.env.JWT_EXPIRE || '7d' }  // Expires in 7 days
  );

  return token;
};
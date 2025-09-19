const express = require('express');
const router = express.Router();

// Simple authentication routes (for demo purposes)
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // Simple demo authentication
  if (username === 'admin' && password === 'admin123') {
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: 1,
        username: 'admin',
        role: 'admin'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

module.exports = router;

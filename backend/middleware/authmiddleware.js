const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// verify the User is Logged In
exports.verifyToken = (req, res, next) => {
  const tokenHeader = req.headers['authorization'];
  
  // take away the word "Bearer" from the token
  const token = tokenHeader && tokenHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Access Denied: No Token Provided!" });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified; // Attach the user data (id, role) to the request object
    next(); // Go to the next step
  } catch (err) {
    res.status(400).json({ message: "Invalid Token" });
  }
};

// verify that the user is admin
exports.verifyAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next(); // you're the boss
  } else {
    res.status(403).json({ message: "Access Denied: Admins Only" }); 
  }
};
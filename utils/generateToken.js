const jwt = require("jsonwebtoken");

const generateToken = (id, expiresIn = process.env.JWT_EXPIRE) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn,
  });
};

module.exports = generateToken;



const jwt = require('jsonwebtoken');
const { AuthFailureError } = require('../core/error.response');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret'; // nhớ có trong .env

const createToken = async (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
};

const createRefreshToken = async (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

const verifyToken = async (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new AuthFailureError('Vui lòng đăng nhập lại');
  }
};

module.exports = {
  createToken,
  createRefreshToken,
  verifyToken,
};

const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const { AppError } = require("../utils/appError");
const JWTKEY = process.env.JWT_KEY;
const JWTEXPIRY = process.env.JWT_EXPIRY_TIME || "30m";
const JWTREFRESHEXPIRY = process.env.JWT_REFRESH_TOKEN_EXPIRY_TIME || "24h";
const MINPASSWORDLENGTH = 8;

const getUser = async (username) => {
  const user = await userModel.findOne({ username: username });
  return user;
};

const addUser = async (username, password) => {
  if (!validator.isEmail(username)) {
    throw new AppError(400, "Invalid username provided");
  }
  if (password.length < MINPASSWORDLENGTH) {
    throw new AppError(400, "Password should be atleast 8 characters long");
  }
  const existingUser = await userModel.findOne({ username: username });
  if (existingUser) {
    throw new AppError(400, "username already exists!");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await userModel.create({
    username: username,
    password: hashedPassword,
  });
  return user;
};

const loginUser = async (username, password) => {
  if (!validator.isEmail(username)) {
    throw new AppError(400, "Invalid username or password provided");
  }
  const user = await userModel.findOne({ username: username });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError(400, "invalid username or password!");
  }
  const accessToken = jwt.sign(
    {
      username: username,
    },
    JWTKEY,
    { expiresIn: JWTEXPIRY }
  );
  const refreshToken = jwt.sign(
    {
      username: username,
    },
    JWTKEY,
    { expiresIn: JWTREFRESHEXPIRY }
  );
  return { accessToken, refreshToken };
};

const generateToken = (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, secretKey);
    const accessToken = jwt.sign({ username: decoded.username }, secretKey, {
      expiresIn: JWTEXPIRY,
    });
    return accessToken;
  } catch (error) {
    throw new AppError(401, "Invalid refresh token");
  }
};

module.exports = { getUser, addUser, loginUser, generateToken };

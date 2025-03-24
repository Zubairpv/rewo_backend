import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const verifyToken = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(403).json({ error: "Access denied" });

  try {
    const verified = jwt.verify(
      token.replace("Bearer ", ""),
      process.env.JWT_SECRET
    );
    req.user = verified;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};
export const validateAdminLogin = (req, res, next) => {
  const { user_name, password } = req.body;

  if (!user_name || !password) {
    return res.status(400).json({
      success: false,
      data: {},
      message: "user_name and password are required",
    });
  }

  next(); // Move to the next middleware/controller
};
export const validateAdminCreate = (req, res, next) => {
  const { user_name, password, name } = req.body;

  if (!user_name || !password) {
    return res.status(400).json({
      success: false,
      data: {},
      message: "user_name,name and password are required",
    });
  }

  next(); // Move to the next middleware/controller
};

import jwt from "jsonwebtoken";
import User from "../models/userschema.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; 

    if (!token) {
      return res.status(401).json({ message: "No token provided, Authorization denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_USER_KEY); 

    if (!decoded) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const user = await User.findById(decoded.id).select("-__v");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user; 
    next(); 
  } catch (error) {
    return res.status(500).json({ message: "Token verification failed", error });
  }
};

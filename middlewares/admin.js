import jwt from "jsonwebtoken";
import adminschema from "../models/adminschema.js";

export const adminMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ message: "No token provided, access denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_ADMIN_KEY);
    if (!decoded) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const admin = await adminschema
      .findById(decoded.id)
      .select("-password -__v");
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    req.admin = admin;
    next();
  } catch (error) {
    console.error("ADMIN MIDDLEWARE ERROR =>", error);
    return res
      .status(500)
      .json({ message: "Token verification failed", error });
  }
};

import jwt from "jsonwebtoken";
import Vendor from "../models/venderschema.js";

export const vendorAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_VENDOR_KEY);

    const vendor = await Vendor.findById(decoded.id);
    console.log(vendor, "Here is vendor");

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    req.vendor = vendor;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Authentication failed",
      error,
    });
  }
};

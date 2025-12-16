import adminschema from "../../models/adminschema.js";
import bcrypt from "bcryptjs";
import Vendor from "../../models/venderschema.js";
import jwt from "jsonwebtoken";

export const adminRegister = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields required",
      });
    }

    const existingAdmin = await adminschema.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin with this email already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const registerAdmin = await adminschema.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
    });

    return res.status(201).json({
      success: true,
      message: "Admin registered successfully!",
      admin: {
        name: registerAdmin.name,
        email: registerAdmin.email,
      },
    });
  } catch (error) {
    console.error("ADMIN REGISTER ERROR =>", error);
    return res.status(500).json({
      success: false,
      message: "Failed to register admin",
      error: error.message,
    });
  }
};

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and Password required",
      });
    }

    const admin = await adminschema.findOne({ email });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.JWT_ADMIN_KEY,
      { expiresIn: "90d" }
    );

    return res.status(200).json({
      success: true,
      message: "Admin login successful!",
      admin: {
        name: admin.name,
        email: admin.email,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      },
      token,
    });
  } catch (error) {
    console.error("ADMIN LOGIN ERROR =>", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const adminProfile = async (req, res) => {
  try {
    const admin = req.admin;

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "No admin found ",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Admin found successfully (Profile)",
      admin: {
        name: admin.name,
        email: admin.email,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin profile",
      error,
    });
  }
};

export const approveVendor = async (req, res) => {
  try {
    const vendorId = req.params.id;

    const vendor = await Vendor.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    if (vendor.status === "approved") {
      return res.status(400).json({
        success: false,
        message: "Vendor already approved",
      });
    }

    vendor.status = "approved";
    vendor.approved = "true";
    vendor.createdByAdmin = req.admin._id;
    await vendor.save();

    return res.status(200).json({
      success: true,
      message: "Vendor approved successfully!",
      vendor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to approve vendor",
      error,
    });
  }
};

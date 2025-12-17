import { sendEmail } from "../../utils/sendEmail.js";
import { generateOtp } from "../../utils/generateOtp.js";
import { OAuth2Client } from "google-auth-library";
import User from "../../models/userschema.js";
import Address from "../../models/addressschema.js";
import Vendor from "../../models/venderschema.js";
import jwt from "jsonwebtoken";
import Product from "../../models/products/productschema.js";
import Cart from "../../models/cartschema.js";
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const sendOtp = async (req, res) => {
  try {
    const { phone, role = "user" } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const otp = generateOtp();
    const otpExpiry = Date.now() + 10 * 60 * 1000;

    let userOrVendor;

    if (role === "vendor") {
      userOrVendor = await Vendor.findOne({ phone });

      if (!userOrVendor) {
        userOrVendor = await Vendor.create({ phone });
      }
    } else {
      userOrVendor = await User.findOne({ phone });

      if (!userOrVendor) {
        userOrVendor = await User.create({ phone, role: "user" });
      }
    }

    userOrVendor.otp = otp;
    userOrVendor.otpExpiry = otpExpiry;
    userOrVendor.loginMethod = "phone";

    await userOrVendor.save();

    console.log(`OTP sent to ${role} (${phone}) => ${otp}`);

    return res.status(200).json({
      success: true,
      message: `${role} OTP sent successfully`,
      otp,
    });
  } catch (error) {
    console.error("SEND OTP ERROR =>", error);
    return res.status(500).json({
      success: false,
      message: "Error sending OTP",
    });
  }
};

export const linkEmail = async (req, res) => {
  try {
    const userId = req.user._id;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findById(userId);
    console.log(user);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.email) {
      return res
        .status(400)
        .json({ message: "Email already linked with your account" });
    }

    if (user.loginMethod !== "phone") {
      return res.status(400).json({
        message: "Only mobile-based accounts can link an email",
      });
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({
        message: "This email is already linked to another account",
      });
    }

    user.email = email;
    user.emailLinked = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email linked successfully!",
      user,
    });
  } catch (error) {
    console.error("LINK EMAIL ERROR =>", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp, role = "user" } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone and OTP are required",
      });
    }

    let userOrVendor;

    if (role === "vendor") {
      userOrVendor = await Vendor.findOne({ phone }).select(
        "+otp +otpExpiry +status"
      );

      if (!userOrVendor) {
        return res.status(400).json({
          success: false,
          message: "Vendor not found",
        });
      }
    } else {
      userOrVendor = await User.findOne({ phone }).select("+otp +otpExpiry");

      if (!userOrVendor) {
        return res.status(400).json({
          success: false,
          message: "User not found",
        });
      }
    }

    if (userOrVendor.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (userOrVendor.otpExpiry < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    userOrVendor.otp = undefined;
    userOrVendor.otpExpiry = undefined;
    userOrVendor.isVerified = true;

    await userOrVendor.save();

    if (role === "vendor") {
      if (userOrVendor.status !== "approved") {
        return res.status(200).json({
          success: true,
          approvalPending: true,
          message: "Your account is pending admin approval. Please wait.",
          vendorStatus: userOrVendor.status,
        });
      }
    }

    const token =
      role === "vendor"
        ? jwt.sign({ id: userOrVendor._id }, process.env.JWT_VENDOR_KEY, {
            expiresIn: "90d",
          })
        : jwt.sign({ id: userOrVendor._id }, process.env.JWT_USER_KEY, {
            expiresIn: "90d",
          });

    return res.status(200).json({
      success: true,
      message: `${role} OTP verified successfully`,
      token,
      user: userOrVendor,
    });
  } catch (error) {
    console.error("VERIFY OTP ERROR =>", error);
    return res.status(500).json({
      success: false,
      message: "Error verifying OTP",
      error,
    });
  }
};

export const profile = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId)
      .populate({
        path: "addresses",
        select: "-__v -updatedAt",
      })
      .select("-__v");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User profile fetched successfully!",
      user,
    });
  } catch (error) {
    console.error("Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get profile, Internal Server Error!",
    });
  }
};

export const deleteAccount = async (req, res) => {
  console.log("delete account hitting ");
  try {
    const userId = req.user._id;
    console.log(userId);
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 🔴 Optional: related cleanup
    await Cart.deleteOne({ userId }); // cart delete
    await Address.deleteMany({ userId }); // addresses delete

    // 🔥 finally delete user
    await User.findByIdAndDelete(userId);

    return res.status(200).json({
      success: true,
      message: "User account deleted successfully",
    });
  } catch (error) {
    console.error("Delete Account Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete account, Internal Server Error",
    });
  }
};

export const updateProfile = async (req, res) => {
  console.log("User update profile hitting ");
  try {
    const userId = req.user._id;
    const { name, dob, gender, geoLocation } = req.body;
    if (!geoLocation) {
      return res.status(404).json({
        success: false,
        message: "No geo location found!",
      });
    }

    const allowedGenders = ["male", "female", "other"];
    if (!geoLocation) {
      return res.status(404).json({
        message: "Profile can't updated.",
      });
    }

    if (gender && !allowedGenders.includes(gender.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid gender value. Allowed: male, female, other",
      });
    }

    if (name && (name.length < 2 || name.length > 50)) {
      return res.status(400).json({
        success: false,
        message: "Name must be between 2 and 50 characters",
      });
    }

    if (dob) {
      const dobDate = new Date(dob);
      if (isNaN(dobDate.getTime()) || dobDate > new Date()) {
        return res.status(400).json({
          success: false,
          message: "Invalid date of birth",
        });
      }
    }

    if (geoLocation) {
      const { lat, lng } = geoLocation;

      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({
          success: false,
          message: "Invalid latitude or longitude range",
        });
      }
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (name) user.name = name;
    if (dob) user.dob = new Date(dob);
    if (gender) user.gender = gender.toLowerCase();
    if (geoLocation) user.geoLocation = geoLocation;

    if (req.file) {
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: "Profile image must be JPG or PNG",
        });
      }
      user.profile = `/uploads/${req.file.filename}`;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully!",
      user,
    });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR =>", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
};

export const linkPhone = async (req, res) => {
  try {
    const userId = req.user._id;
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    const existing = await User.findOne({ phone });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Phone number already linked with another account",
      });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.phone = phone;
    await user.save();

    res.json({
      success: true,
      message: "Phone number linked successfully!",
      user,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to link phone",
      error: err.message,
    });
  }
};

// link phone is pending

export const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: "ID token required" });

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    // Your logic: if email exists (phone-linked), return that user; else create new
    let user = await User.findOne({ email });

    if (user) {
      // attach googleId if not present
      if (!user.googleId) {
        user.googleId = googleId;
        user.profile = user.profile || picture;
        user.emailLinked = true;
        await user.save();
      }
    } else {
      user = await User.create({
        email,
        name,
        profile: picture,
        loginMethod: "google",
        isVerified: true,
        googleId,
        emailLinked: true,
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_USER_KEY, {
      expiresIn: "7d",
    });

    return res.status(200).json({ success: true, user, token });
  } catch (err) {
    console.error("GOOGLE LOGIN ERROR:", err);
    return res
      .status(500)
      .json({ message: "Google Login Failed", error: err.message });
  }
};

export const addAddress = async (req, res) => {
  console.log("address controller hitting");

  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { pincode, state, city, houseNumber, area, landmark, addressType } =
      req.body;

    // Required fields
    if (!pincode || !state || !city || !houseNumber || !area) {
      return res.status(400).json({
        success: false,
        message: "All required address fields must be provided",
      });
    }

    // Pincode validation
    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pincode",
      });
    }

    const allowedTypes = ["home", "office", "other"];
    if (!allowedTypes.includes(addressType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid address type",
      });
    }

    // 1️⃣ Create address
    const address = await Address.create({
      userId,
      pincode,
      state: state.trim(),
      city: city.trim(),
      houseNumber: houseNumber.trim(),
      area: area.trim(),
      landmark: landmark?.trim() || "",
      addressType,
    });

    // 2️⃣ Assign address to user
    await User.findByIdAndUpdate(
      userId,
      { $push: { addresses: address._id } },
      { new: true }
    );

    return res.status(201).json({
      success: true,
      message: "Address added and assigned to user successfully",
      address,
    });
  } catch (err) {
    console.error("Add Address Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// This is pending

export const addToCart = async (req, res) => {
  console.log("Addto cart hitting ");
  try {
    const userId = req.user._id;
    console.log(userId);

    const { productId, storeId } = req.body;
    console.log(productId, "Product id");
    console.log(storeId, "Store id");
    if (!productId || !storeId) {
      return res.status(400).json({
        success: false,
        message: "productId and storeId are required",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.items.push({
        productId,
        storeId,
        quantity: 1,
        price: product.sellingPrice, // ya product.price
      });
    }

    cart.totalAmount = cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Product added to cart",
      cart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to add product to cart",
    });
  }
};

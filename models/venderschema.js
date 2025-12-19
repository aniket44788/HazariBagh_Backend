import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    // ================= VENDOR BASIC =================
    name: { type: String, required: true },

    email: {
      type: String,
      lowercase: true,
    },

    role: {
      type: String,
      default: "vendor",
      immutable: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
    },

    profileImage: {
      type: String,
      default: null,
    },
    stores: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
      },
    ],

    // ================= IDENTITY VERIFICATION =================
    aadhar: {
      numberMasked: { type: String },
      documentImage: { type: String },
      verified: { type: Boolean, default: false },
    },

    pan: {
      number: { type: String },
      documentImage: { type: String },
      verified: { type: Boolean, default: false },
    },

    gst: {
      number: { type: String },
      documentImage: { type: String },
      verified: { type: Boolean, default: false },
    },

    // ================= BANK DETAILS =================
    bank: {
      accountHolderName: { type: String },
      accountNumber: { type: String, select: false },
      ifsc: { type: String },
      bankName: { type: String },
      verified: { type: Boolean, default: false },
    },

    // ================= ADMIN CONTROL =================
    approved: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    rejectionReason: {
      type: String,
      default: null,
    },

    createdByAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    otp: {
      type: String,
      select: false,
    },

    otpExpiry: {
      type: Date,
      select: false,
    },

    loginMethod: {
      type: String,
      enum: ["phone", "email", "google"],
      default: "phone",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Vendor", vendorSchema);

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

    shop: {
      name: { type: String, required: true },

      description: { type: String, default: "" },

      category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
      },

      shopImage: { type: String },

      documents: {
        shopLicense: { type: String }, // trade license
        fssai: { type: String }, // food business
        other: [{ type: String }],
      },

      address: {
        street: { type: String, default: "" },
        city: { type: String, default: "" },
        state: { type: String, default: "" },
        pincode: { type: String, default: "" },
        landmark: { type: String, default: "" },
      },

      geoLocation: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
      },

      verified: {
        type: Boolean,
        default: false,
      },
    },

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

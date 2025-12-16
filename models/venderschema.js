import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    name: { type: String },

    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
    },

    role: {
      type: String,
      default: "vendor",
      immutable: true,
    },

    phone: {
      type: String,
      unique: true,
      required: true,
      sparse: true,
    },

    password: { type: String },

    profileImage: {
      type: String,
      default: null,
    },

    shopImage: {
      type: String,
      default: null,
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

    approved: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
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

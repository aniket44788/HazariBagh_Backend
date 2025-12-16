import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },

    gender: {
      type: String,
      enum: ["male", "female", "other", null],
      default: null,
    },

    email: {
      type: String,
      lowercase: true,
      unique: true,
      sparse: true,
    },

    profile: {
      type: String,
      default: null,
    },

    phone: {
      type: String,
      unique: true,
      sparse: true,
    },

    dob: {
      type: Date,
      default: null,
    },

    addresses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
      },
    ],
    geoLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    otp: {
      type: String,
    },

    otpExpiry: {
      type: Date,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    emailLinked: {
      type: Boolean,
      default: false,
    },

    googleId: {
      type: String,
      sparse: true,
    },

    loginMethod: {
      type: String,
      enum: ["email", "phone", "google"],
    },

    role: {
      type: String,
      enum: ["user", "vendor"],
      default: "user",
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);

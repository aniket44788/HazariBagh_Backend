// This is grocery store schema.  + fashion Store schema

import mongoose from "mongoose";

const storeSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    description: String,
    shopImage: String,

    documents: {
      shopLicense: String,
      fssai: String,
      other: [String],
    },

    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      landmark: String,
    },

    geoLocation: {
      lat: Number,
      lng: Number,
    },

    openingHours: {
      open: { type: String, default: "09:00" },
      close: { type: String, default: "21:00" },
    },

    delivery: {
      type: {
        type: String,
        enum: ["per_km", "flat", "free"],
        default: "per_km",
      },
      perKmCharge: Number,
      flatCharge: Number,
      maxRadiusKm: Number,
      baseDeliveryTime: Number,
      timePerKm: Number,
    },

    tax: {
      gstPercent: {
        type: Number,
        min: 0,
        max: 28,
      },
    },

    verified: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["Blocked", "active", "rejected"],
      default: "active",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Store", storeSchema);

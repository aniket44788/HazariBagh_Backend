import mongoose from "mongoose";

const fashionStoreSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },

    storeName: {
      type: String,
      required: true,
      trim: true,
    },

    storeImage: {
      type: String,
      default: null,
    },

    description: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      default: "",
    },

    email: {
      type: String,
      default: "",
      lowercase: true,
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

    shopCategory: {
      type: String,
      enum: ["men", "women", "kids", "unisex"],
      default: "unisex",
    },

    brandsAvailable: {
      type: [String],
      default: [],
    },

    hasTrialRoom: {
      type: Boolean,
      default: false,
    },

    delivery: {
      type: {
        type: String,
        enum: ["per_km", "flat", "free"],
        default: "per_km",
      },

      perKmCharge: {
        type: Number,
        default: 0, // ₹ per km
        min: 0,
      },

      flatCharge: {
        type: Number,
        default: 0, // ₹ flat
        min: 0,
      },

      maxRadiusKm: {
        type: Number,
        default: 10, // delivery range
        min: 1,
      },

      baseDeliveryTime: {
        type: Number,
        default: 20, // minutes
        min: 0,
      },

      timePerKm: {
        type: Number,
        default: 5, // minutes per km
        min: 0,
      },
    },

    returnPolicyDays: {
      type: Number,
      default: 0,
    },

    exchangeAvailable: {
      type: Boolean,
      default: false,
    },

    openingHours: {
      open: { type: String, default: "10:00" },
      close: { type: String, default: "22:00" },
    },

    status: {
      type: String,
      enum: ["active", "inactive", "closed"],
      default: "active",
    },

    tax: {
      gstPercent: {
        type: Number,
        default: 5,
        min: 0,
        max: 28,
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("FashionStore", fashionStoreSchema);

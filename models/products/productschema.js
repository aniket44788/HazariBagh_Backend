import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    images: {
      type: [String],
      default: [],
    },

    mrp: {
      type: Number,
      required: true,
      min: 0,
    },

    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    discountPercentage: {
      type: Number,
      default: 0,
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    lowStockAlert: {
      type: Number,
      default: 5,
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },

    unit: {
      type: String,
      enum: [
        // Weight
        "kg",
        "g",
        "mg",

        // Volume
        "l",
        "ml",

        // Count based
        "pcs",
        "piece",
        "dozen",
        "pair",

        // Packaging
        "packet",
        "pack",
        "box",
        "bag",
        "sack",

        // Produce specific
        "bunch",
        "bundle",

        // Liquid containers
        "bottle",
        "can",
        "jar",

        // Misc
        "tray",
        "roll",
      ],
      required: true,
    },

    quantity: {
      type: Number,
      default: 1,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },

    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

productSchema.pre("save", function (next) {
  if (this.mrp > 0 && this.sellingPrice > 0) {
    this.discountPercentage = Math.round(
      ((this.mrp - this.sellingPrice) / this.mrp) * 100
    );
  }
});

productSchema.index({ name: "text", keywords: "text" });

export default mongoose.model("Product", productSchema);

import mongoose from "mongoose";

const fashionProductSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FashionStore",
      required: true,
    },

    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },

    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FashionSubCategory",
      required: true,
    },

    
    // ✅ Sizes (single value, predefined)
    clothSize: {
      type: String,
      enum: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
    },

    pantSize: {
      type: String,
      enum: ["28", "30", "32", "34", "36", "38", "40", "42"],
    },

    shoeSize: {
      type: String,
      enum: ["6", "7", "8", "9", "10", "11", "12"],
    },

    price: {
      type: Number,
      required: true,
    },

    mrp: Number,

    // ✅ Product images
    fashionproductimage: {
      type: [String],
      default: [],
    },

    colors: {
      type: [String],
      default: [],
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("FashionProduct", fashionProductSchema);

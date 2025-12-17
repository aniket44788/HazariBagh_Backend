import Product from "../../models/products/productschema.js";
import Vendor from "../../models/venderschema.js";
import Category from "../../models/categories/categoryschema.js";
import SubCategory from "../../models/categories/subcategoryschema.js";
// import Unit from "../../models/units/unitschema.js";
import Store from "../../models/Stores/storeschema.js";

import fashionProduct from "../../models/products/fashionproductSchema.js";
import fashionStore from "../../models/Stores/fashionstoreschema.js";

export const createGroceryProduct = async (req, res) => {
  console.log("Create grocery Controller hitting ");

  try {
    const vendor = req.vendor;
    const {
      name,
      description,
      mrp,
      sellingPrice,
      stock,
      categoryId,
      subCategoryId,
      unit,
      storeId,
    } = req.body;

    if (!name) {
      return res.status(404).json({
        message: "No name found . Please enter your name",
      });
    }
    if (!mrp) {
      return res.status(404).json({
        message: "No mrp found . Please enter mrp",
      });
    }

    if (!sellingPrice) {
      return res.status(404).json({
        message: "No sellingPrice found . Please enter sellingPrice",
      });
    }

    if (!categoryId) {
      return res.status(404).json({
        message: "No categoryId found . Please enter categoryId",
      });
    }

    if (!storeId) {
      return res.status(404).json({
        message: "No storeId found . Please enter storeId",
      });
    }

    const ALLOWED_UNITS = [
      "kg",
      "g",
      "mg",
      "l",
      "ml",
      "pcs",
      "piece",
      "dozen",
      "pair",
      "packet",
      "pack",
      "box",
      "bag",
      "sack",
      "bunch",
      "bundle",
      "bottle",
      "can",
      "jar",
      "tray",
      "roll",
    ];

    if (!ALLOWED_UNITS.includes(unit)) {
      return res.status(400).json({
        success: false,
        message: "Invalid unit value",
      });
    }

    // Vendor authentication
    if (!vendor) {
      return res.status(401).json({
        success: false,
        message: "Vendor authentication required",
      });
    }

    // Validate Store
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    // Check store vendor mapping
    if (!store.vendorId) {
      return res.status(400).json({
        success: false,
        message: "Store does not have a vendor assigned!",
      });
    }

    if (store.vendorId.toString() !== vendor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to add products to this store",
      });
    }

    // Validate Category
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Validate SubCategory (optional)
    let subCategory = null;
    if (subCategoryId) {
      subCategory = await SubCategory.findById(subCategoryId);
      if (!subCategory) {
        return res.status(404).json({
          success: false,
          message: "SubCategory not found",
        });
      }
    }

    // Check Duplicate Product inside same store
    const existingProduct = await Product.findOne({
      name: name.trim(),
      storeId,
    });

    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message: "Product with this name already exists in this store",
      });
    }

    const images = req.files ? req.files.map((file) => file.path) : [];

    const product = await Product.create({
      vendorId: vendor._id,
      storeId: store._id,
      name: name.trim(),
      description: description || "",
      mrp,
      sellingPrice,
      stock: stock || 0,
      category: category._id,
      subCategory: subCategory ? subCategory._id : null,
      unit,
      images,
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("CREATE PRODUCT ERROR =>", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create product, Internal Server Error!",
      error: error.message,
    });
  }
};

export const getGroceryProduct = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("category", "name")
      .populate("subCategory", "name")
      .populate("unit", "unit")
      .populate("storeId", "storeName storeAddress")
      .populate("vendorId", "name phone");

    return res.status(200).json({
      success: true,
      totalProducts: products.length,
      products,
    });
  } catch (error) {
    console.error("GET GROCERY PRODUCTS ERROR =>", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch grocery products",
      error: error.message,
    });
  }
};

// Create fashion products ------------- >

export const createFashionProduct = async (req, res) => {
  try {
    const vendor = req.vendor;

    const {
      storeId,
      title,
      price,
      mrp,
      gender,
      categoryId,
      subCategoryId,
      clothSize,
      pantSize,
      shoeSize,
      colors,
    } = req.body;

    // 🔴 Only required check
    if (!storeId || !title || !price || !categoryId || !subCategoryId) {
      return res.status(400).json({
        success: false,
        message: "Title, Price, Store, Category & SubCategory are required",
      });
    }

    // 🔐 Vendor auth
    if (!vendor?._id) {
      return res.status(401).json({
        success: false,
        message: "Vendor authentication required",
      });
    }

    // 🖼️ Images
    const images = req.files ? req.files.map((file) => file.path) : [];

    // ✅ CREATE PRODUCT (JUST ASSIGN IDS)
    const product = await fashionProduct.create({
      vendorId: vendor._id,
      storeId,
      title: title.trim(),
      price,
      mrp,
      gender,
      category: categoryId,
      subCategory: subCategoryId,
      clothSize,
      pantSize,
      shoeSize,
      colors,
      fashionproductimage: images,
    });

    return res.status(201).json({
      success: true,
      message: "Fashion product created successfully",
      product,
    });
  } catch (error) {
    console.error("CREATE FASHION PRODUCT ERROR =>", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create fashion product",
      error: error.message,
    });
  }
};

export const getAllFashionProducts = async (req, res) => {
  try {
    const products = await fashionProduct
      .find({ isAvailable: true })
      .populate("storeId", "storeName")
      .populate("vendorId", "name phone")
      .populate("category", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      totalProducts: products.length,
      products,
    });
  } catch (error) {
    console.error("GET FASHION PRODUCTS ERROR =>", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch fashion products",
      error: error.message,
    });
  }
};

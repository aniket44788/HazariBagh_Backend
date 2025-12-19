import express from "express";
import multer from "multer";
import {
  createFashionStore,
  createStore,
  createVendor,
  deleteStore,
  getAllFashionStores,
  getAllStores,
  getFashionStoreById,
  getStoreById,
  getStoresWithDistance,
  sendVendorOtp,
  updateFashionStore,
  updateRejectedVendor,
  updateStore,
  vendorProfile,
  verifyVendorOtp,
} from "../../controllers/vendorcontroller/vendorcontroller.js";

import { vendorAuth } from "../../middlewares/vendor.js";

import { upload } from "../../utils/multer.js";

const vendorRouter = express.Router();

vendorRouter.post(
  "/register",
  (req, res, next) => {
    upload.fields([
      { name: "profileImage", maxCount: 1 },
      { name: "shopImage", maxCount: 1 },
      { name: "shopLicense", maxCount: 1 },
      { name: "fssai", maxCount: 1 },
      { name: "aadharDoc", maxCount: 1 },
      { name: "panDoc", maxCount: 1 },
      { name: "gstDoc", maxCount: 1 },
    ])(req, res, (err) => {
      // 🔴 Multer errors
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return res.status(400).json({
            success: false,
            message: "Unexpected file field. Check file field names",
          });
        }

        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      // 🔴 Custom fileFilter errors
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      // ✅ REQUIRED FILE CHECK
      const requiredFiles = [
        "profileImage",
        "shopImage",
        "shopLicense",
        "aadharDoc",
        "panDoc",
        "gstDoc",
      ];

      for (const file of requiredFiles) {
        if (!req.files?.[file]?.length) {
          return res.status(400).json({
            success: false,
            message: `${file} file is required`,
          });
        }
      }

      next();
    });
  },
  createVendor
);

vendorRouter.post("/send-otp", sendVendorOtp);
vendorRouter.post("/verify-otp", verifyVendorOtp);

// Profile routes
vendorRouter.get("/profile", vendorAuth, vendorProfile);

vendorRouter.put(
  "/update",
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "shopImage", maxCount: 1 },
    { name: "shopLicense", maxCount: 1 },
    { name: "fssai", maxCount: 1 },
    { name: "aadharDoc", maxCount: 1 },
    { name: "panDoc", maxCount: 1 },
    { name: "gstDoc", maxCount: 1 },
  ]),
  updateRejectedVendor
);

// ==================== GROCERY STORE ROUTES ====================

vendorRouter.post(
  "/createstore",
  vendorAuth,
  upload.fields([
    { name: "storeImage", maxCount: 1 },
    { name: "shopLicense", maxCount: 1 },
    { name: "fssai", maxCount: 1 },
  ]),
  createStore
);

vendorRouter.put(
  "/updatestore/:id",
  upload.single("storeImage"),
  vendorAuth,
  updateStore
);

// ==================== FASHION STORE ROUTES ====================

vendorRouter.post(
  "/createfashionstore",
  upload.single("storeImage"),
  vendorAuth,
  createFashionStore
);

vendorRouter.put(
  "/updatefashionstore/:id",
  upload.single("storeImage"),
  vendorAuth,
  updateFashionStore
);

vendorRouter.get("/getfashionstore", getAllFashionStores);
vendorRouter.get("/getfashionstore/:id", getFashionStoreById);

// ==================== GENERAL STORE ROUTES ====================

vendorRouter.get("/getallstores", getAllStores);
vendorRouter.get("/getstore/:id", getStoreById);

vendorRouter.delete("/deletestore", vendorAuth, deleteStore);

// ==================== UTILITY ROUTES ====================

vendorRouter.get("/storedistance/:userId", getStoresWithDistance);

export default vendorRouter;

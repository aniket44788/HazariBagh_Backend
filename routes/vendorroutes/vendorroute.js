import express from "express";
import {
  createFashionStore,
  createStore,
  deleteStore,
  getAllFashionStores,
  getAllStores,
  getFashionStoreById,
  getStoreById,
  getStoresWithDistance,
  updateFashionStore,
  updateStore,
  updateVendor,
  vendorProfile,
} from "../../controllers/vendorcontroller/vendorcontroller.js";

import { upload } from "../../utils/multer.js";
import { vendorAuth } from "../../middlewares/vendor.js";

const vendorRouter = express.Router();

// Vendor Profile --- >

vendorRouter.get("/profile", vendorAuth, vendorProfile);
vendorRouter.put("/update" , upload.single("profileImage") ,  vendorAuth , updateVendor)

// Create Grocery Store ------>

vendorRouter.post(
  "/createstore",
  upload.single("storeImage"),
  vendorAuth,
  createStore
);
vendorRouter.put(
  "/updatestore/:id",
  upload.single("storeImage"),
  vendorAuth,
  updateStore
);

// Create Fashion Store ---->

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

vendorRouter.get("/getallstores", getAllStores);
vendorRouter.get("/getstore/:id", getStoreById);

vendorRouter.delete("/deletestore", vendorAuth, deleteStore);

vendorRouter.get("/storedistance/:userId", getStoresWithDistance);

export default vendorRouter;

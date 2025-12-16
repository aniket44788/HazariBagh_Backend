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
  updateStore,
  vendorProfile,
} from "../../controllers/vendorcontroller/vendorcontroller.js";

import { upload } from "../../utils/multer.js";
import { vendorAuth } from "../../middlewares/vendor.js";

const vendorRouter = express.Router();

vendorRouter.get("/profile", vendorAuth, vendorProfile);
vendorRouter.post(
  "/createstore",
  upload.single("storeImage"),
  vendorAuth,
  createStore
);

vendorRouter.post(
  "/createfashionstore",
  upload.single("storeImage"),
  vendorAuth,
  createFashionStore
);

vendorRouter.get("/getfashionstore", getAllFashionStores);
vendorRouter.get("/getfashionstore/:id", getFashionStoreById);

vendorRouter.get("/getallstores", getAllStores);
vendorRouter.get("/getstore/:id", getStoreById);

vendorRouter.put("/updatestore", vendorAuth, updateStore);
vendorRouter.delete("/deletestore", vendorAuth, deleteStore);

vendorRouter.get("/storedistance/:userId", getStoresWithDistance);

export default vendorRouter;

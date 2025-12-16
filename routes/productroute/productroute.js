import express from "express";
import {
  createFashionProduct,
  createGroceryProduct,
  getAllFashionProducts,
  getGroceryProduct,
} from "../../controllers/productcontroller/productcontroller.js";

import { vendorAuth } from "../../middlewares/vendor.js";
import { upload } from "../../utils/multer.js";
import productschema from "../../models/products/productschema.js";


const proudctRouter = express.Router();

// Create Grocery Product   --- >

proudctRouter.post(
  "/create",
  upload.array("images"),
  vendorAuth,
  createGroceryProduct
);

proudctRouter.get("/getall", getGroceryProduct);

// Fashion Products  --------->

proudctRouter.post("/createfashionproduct", upload.array("fashionproductimage", 5) , vendorAuth, createFashionProduct);
proudctRouter.get("/getfashionproducts" , getAllFashionProducts)
export default proudctRouter;

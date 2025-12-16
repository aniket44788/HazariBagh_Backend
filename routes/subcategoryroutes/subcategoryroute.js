import express from "express";
import {
  deleteSubCategory,
  getAllSubCategories,
  getSubCategoryById,
  subCategoryCreate,
  updateSubCategory,
} from "../../controllers/subcategorycontrollers/subcategorycontroller.js";
import { adminMiddleware } from "../../middlewares/admin.js";

import { upload } from "../../utils/multer.js";

const subcategoryRoute = express.Router();

subcategoryRoute.post(
  "/create/:categoryId",
  upload.single("image"),
  adminMiddleware,
  subCategoryCreate
);

subcategoryRoute.get("/getall", getAllSubCategories);
subcategoryRoute.get("/:id", getSubCategoryById);
subcategoryRoute.put("/:id", upload.single("image"),  adminMiddleware, updateSubCategory);
subcategoryRoute.delete("/:id", adminMiddleware, deleteSubCategory);

export default subcategoryRoute;

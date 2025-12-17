import express from "express";
import {
  createCategory,
  deleteCategory,
  getallCategory,
  updateCategory,
} from "../../controllers/categorycontroller/categorycontroller.js";
import { adminMiddleware } from "../../middlewares/admin.js";
import { upload } from "../../utils/multer.js";

const categoryRouter = express.Router();

categoryRouter.post(
  "/create",
  upload.single("image"),
  adminMiddleware,
  createCategory
);

categoryRouter.get("/getall", getallCategory);
categoryRouter.put("/update/:id", upload.single("image")  , adminMiddleware, updateCategory);
categoryRouter.delete("/delete/:id" , adminMiddleware, deleteCategory ) 
export default categoryRouter;

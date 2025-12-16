import express from "express";
import {
  createCategory,
  getallCategory,
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

export default categoryRouter;

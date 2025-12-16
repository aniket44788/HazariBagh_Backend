import express from "express";
import {
  createUnit,
  getUnitsByCategory,
} from "../../controllers/categorycontroller/unitscontroller.js";
import { adminMiddleware } from "../../middlewares/admin.js";
import { vendorAuth } from "../../middlewares/vendor.js";

const unitRouter = express.Router();

unitRouter.post("/createunit/:categoryId", adminMiddleware, createUnit);
unitRouter.get(
  "/getunit/:categoryId",
  getUnitsByCategory
);

export default unitRouter;

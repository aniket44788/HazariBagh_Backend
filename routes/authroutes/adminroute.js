import express from "express";
import {
  adminLogin,
  adminProfile,
  adminRegister,
  approveVendor,
  getPendingVendors,
} from "../../controllers/authcontrollers/admincontroller.js";
import { adminMiddleware } from "../../middlewares/admin.js";

const adminRouter = express.Router();

adminRouter.post("/register", adminRegister);
adminRouter.post("/login", adminLogin);
adminRouter.get("/profile", adminMiddleware, adminProfile);
adminRouter.put("/approve-vendor/:id", adminMiddleware, approveVendor);

adminRouter.get("/vendors/pending", adminMiddleware, getPendingVendors);

export default adminRouter;

import express from "express";
import { createOrder } from "../../controllers/ordercontroller/ordercontroller.js";
import { authMiddleware } from "../../middlewares/auth.js";

const orderRouter = express.Router();

orderRouter.post("/create", createOrder, authMiddleware);

export default orderRouter;

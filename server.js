import express from "express";
import cors from "cors";
import { configDotenv } from "dotenv";
configDotenv();
import database from "./config/database.js";
import userRouter from "./routes/authroutes/authroute.js";
import adminRouter from "./routes/authroutes/adminroute.js";
import categoryRouter from "./routes/categoryroutes/categoryroute.js";
import vendorRouter from "./routes/vendorroutes/vendorroute.js";
import subcategoryRoute from "./routes/subcategoryroutes/subcategoryroute.js";
import productRouter from "./routes/productroute/productroute.js";
import unitRouter from "./routes/categoryroutes/unitroutes.js";
import orderRouter from "./routes/orderroutes/orderroute.js";

database();

const corsOptions = {
  origin: "*",
  methods: "GET,POST,PUT,PATCH,DELETE",
  allowedHeaders: ["Content-Type", "Authorization"],
};

const port = process.env.PORT;
const app = express();
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use(cors(corsOptions));

app.use("/user", userRouter);
app.use("/admin", adminRouter);
app.use("/vendor", vendorRouter);

app.use("/category", categoryRouter);
app.use("/subcategory", subcategoryRoute);

app.use("/product", productRouter);

app.use("/unit", unitRouter);

app.use("/order", orderRouter);

app.get("/", (req, res) => {
  return res.send(" Hazari Bag Server is started");
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on the this port ${port}`);
});

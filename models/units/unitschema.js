import mongoose from "mongoose";

const unitSchema = new mongoose.Schema(
  {
    unit: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Unit", unitSchema);

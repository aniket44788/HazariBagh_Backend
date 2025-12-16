import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },


    pincode: {
      type: String,
      required: true,
    },

    state: {
      type: String,
      required: true,
    },

    city: {
      type: String,
      required: true,
    },

    houseNumber: {
      type: String,
      required: true,
    },


    area: {
      type: String,
      required: true,
    },

    landmark: {
      type: String,
      default: "",
    },

    addressType: {
      type: String,
      enum: ["home", "office", "other"],
      default: "home",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Address", addressSchema);

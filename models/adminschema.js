import mongoose from "mongoose";


const adminSchema = new mongoose.Schema(
{
name: { type: String, required: true },
email: { type: String, unique: true, required: true },
password: { type: String, required: true },
role: {
type: String,
enum: ["superadmin", "admin", "employee"],
default: "admin",
},
isActive: { type: Boolean, default: true },
},
{ timestamps: true }
);


export default mongoose.model("Admin", adminSchema);
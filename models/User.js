import mongoose from "mongoose";
import { ROLES } from "../config/constants.js";

const userSchema = new mongoose.Schema({
    name: { type: String },
    nationalID: { type: String, required: true },
    password: { type: String, required: true ,select: false },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.STUDENT },
});

export default mongoose.model("User", userSchema);
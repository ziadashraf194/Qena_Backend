import mongoose from "mongoose";
import { RELATION } from "../config/constants.js";

const stuDataSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    secondName: { type: String, required: true },
    thirdName: { type: String, required: true },
    fourthName: { type: String, required: true },
    birthDate: { type: Date, required: true },
    gender: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    whatsapp: { type: String, required: true },
    email: { type: String, required: true , trim: true , unique: true },

    percentage: { type: Number, required: true, min: 0, max: 100 },
    score: { type: Number, required: true,},
    nationalIdImage:{ type: String, required: true },
    certificateImage:{ type: String, required: true },

    parent:{
        phone: { type: String, required: true },
        address: { type: String, required: true },
        name: { type: String, required: true },
        relation: { type: String, required: true, enum: Object.values(RELATION) },
        nationalID:{
            type: String, 
            required: true,
        }
    },

    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    }

});

export default mongoose.model("StudentData", stuDataSchema);

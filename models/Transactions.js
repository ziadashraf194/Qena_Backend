import mongoose from "mongoose";
import { PAYMENT_METHOD, TRANSACTION_STATUS } from "../config/constants.js";
const transactionSchema = new mongoose.Schema({
    studentData: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "StudentData", 
        required: true
    },
    
    merchantRefNumber: { 
        type: String, 
        required: true, 
        unique: true 
    },
    
    fawryRefNumber: { 
        type: String, 
        default: null 
    },
    
    amount: { 
        type: Number, 
        required: true 
    },
    
    paymentMethod: { 
        type: String, 
        enum: Object.values(PAYMENT_METHOD),
        required: true 
    },
    
    status: { 
        type: String, 
        enum: Object.values(TRANSACTION_STATUS),
        default: TRANSACTION_STATUS.PENDING 
    },
    
    paymentDetails: {
        fawryStatusCode: String,
        statusDescription: String,
        paymentTime: Date
    }
}, { timestamps: true });

export default mongoose.model("Transaction", transactionSchema);
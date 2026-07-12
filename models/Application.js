import mongoose from "mongoose";
import { PAYMENT_STATUS, ADMIN_STATUS } from "../config/constants.js";

const ApplicationSchema = new mongoose.Schema({
  studentDataId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StudentData", 
    required: true,
  },
  
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Faculty",
    required: true
  },
  
  paymentStatus: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.UNPAID
  },
  fawryReferenceNumber: {
        type: String,
        default: null 
    },
    paymentExpiry: {
        type: Date,
        default: null 
    },
  successfulTransactionId: {
    type: String,
    default: null 
  },
  
  adminStatus: {
    type: String,
    enum: Object.values(ADMIN_STATUS),
    default: ADMIN_STATUS.PENDING,
  },
  massage:{
    type: String,
    required: false,
    default: ""
  }
}, { timestamps: true });

export default mongoose.model("Application", ApplicationSchema);
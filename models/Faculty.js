import mongoose from "mongoose";

const facultySchema = new mongoose.Schema({
    name: { type: String, required: true },
    minPercentage: { type: Number, required: true, min: 50, max: 100 },
    applicationFee: { type: Number, required: true },
});

export default mongoose.model("Faculty", facultySchema);
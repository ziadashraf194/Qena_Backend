import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
    },
    price: {
        type: Number,
        required: true,
    },
    category: { 
        type: String,      
        ref: "Category",   
        required: true,
        index: true
    },
    images: [
        {
            type: String,
        },
    ],
    stock: {
        type: Number,
        required: true,
    },
}, {timestamps: true});

const Product = mongoose.model("Product", productSchema);

export default Product;

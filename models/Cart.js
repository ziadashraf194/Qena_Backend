import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
    user: {
        type: String, 
        ref: "User",  
        required: true,
        unique: true  
    },
    items: [
        {
            productSlug: {
                type: String,
                required: true,
            },
            price: { 
                type: Number,
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
                min: 1,
                default: 1
            },
        },
    ],
    totalPrice: {
        type: Number,
        required: true,
        default: 0
    },
    totalItems: {
        type: Number,
        required: true,
        default: 0
    },
    
}, { timestamps: true });

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
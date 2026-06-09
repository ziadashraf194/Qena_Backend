import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userSlug: {
        type: String,
        required: true,
    },
    items: [
        {
            productSlug: { type: String, required: true },
            price: { type: Number, required: true },
            quantity: { type: Number, required: true }
        }
    ],
    totalPrice: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
        default: "pending",
    },
    address: {
        shippingAddress: { type: String, required: true },
        city: { type: String, required: true }, 
        phone: { type: String, required: true }, 
    },
    paymentMethod: {
        type: String,
        enum: ["card", "cash", "fawry", "ewallet"],
        default: "cash",
    },
    paymentStatus: {
        type: String,
        enum: ["paid", "unpaid"],
        default: "unpaid",
    },
}, { timestamps: true });
orderSchema.virtual('productDetails', {
    ref: 'Product',       
    localField: 'items.productSlug', 
    foreignField: 'slug',     
    justOne: false            
});
const Order = mongoose.model("Order", orderSchema);
export default Order;
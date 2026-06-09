import mongoose from "mongoose";
import crypto from "crypto";
import Order from "../models/Order.js"; 
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { PAYMENT_METHODS, PAYMENT_STATUS , ORDER_STATUS } from "../config/constants.js";
import { processFawryPayment } from "../services/fawryService.js";

const generateHash = (string) => crypto.createHash("sha256").update(string).digest("hex");

export const handleFawryWebhook = async (req, res) => {
    try {
     
        const { 
            merchantRefNum, 
            fawryRefNumber, 
            orderAmount, 
            orderStatus, 
            messageSignature 
        } = req.body;


        const secureKey = process.env.FAWRY_SECURE_KEY;
        
   
        const computedSignature = generateHash(
            `${merchantRefNum}${fawryRefNumber}${Number(orderAmount).toFixed(2)}${orderStatus}${secureKey}`
        );
        if (computedSignature !== messageSignature) {
            return res.status(400).send("Invalid signature");
        }

        if (orderStatus === "PAID") {
            
            const order = await Order.findById(merchantRefNum);
            
            if (!order) {
                return res.status(404).send("Order not found");
            }

            order.paymentStatus = PAYMENT_STATUS.PAID;       
            order.orderStatus = ORDER_STATUS.COMPLETED;     
            
            await order.save();
            
            
            return res.status(200).send("OK");
        }

        return res.status(200).send("Status received but not handled (Not PAID)");

    } catch (error) {
        console.error("Webhook Error:", error.message);
        return res.status(500).send("Internal Server Error");
    }
};


export const createOrder = async (req, res) => {
    try {
        const userSlug = req.user.slug;
        const { shippingAddress, city, phone, paymentMethod } = req.body;

        if (!shippingAddress || !city || !phone || !paymentMethod) {
            return res.status(400).json({ status: "error", message: "Shipping address, city, phone, and payment method are required." });
        }

        if (!Object.values(PAYMENT_METHODS).includes(paymentMethod)) {
            return res.status(400).json({ status: "error", message: "The selected payment method is invalid." });
        }

        const cart = await Cart.findOne({ user: userSlug });
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ status: "error", message: "Your cart is empty." });
        }

        const slugsInCart = cart.items.map(item => item.productSlug);
        const products = await Product.find({ slug: { $in: slugsInCart } });

        const decrementedItems = [];
        let stockError = null;

        for (const item of cart.items) {
            const product = products.find(p => p.slug === item.productSlug);
            if (!product) {
                stockError = `Product with slug ${item.productSlug} is not available.`;
                break;
            }

            const updatedProduct = await Product.findOneAndUpdate(
                { slug: item.productSlug, stock: { $gte: item.quantity } },
                { $inc: { stock: -item.quantity } },
                { returnDocument: 'after' }
            );

            if (!updatedProduct) {
                stockError = `Insufficient stock for product: (${product.name}).`;
                break;
            }
            decrementedItems.push({ slug: item.productSlug, quantity: item.quantity });
        }

        if (stockError) {
            for (const rollbackItem of decrementedItems) {
                await Product.updateOne({ slug: rollbackItem.slug }, { $inc: { stock: rollbackItem.quantity } });
            }
            return res.status(400).json({ status: "error", message: stockError });
        }

        const orderId = new mongoose.Types.ObjectId();
        
        const orderData = {
            _id: orderId,
            userSlug,
            totalPrice: cart.totalPrice,
            address: { phone }
        };

        let paymentGatewayResult = null;

        if (paymentMethod !== PAYMENT_METHODS.CASH) {
            try {
                paymentGatewayResult = await processFawryPayment(paymentMethod, orderData, cart);
            } catch (error) {
                console.error("Payment Gateway Error: ", error.message);
                
                for (const rollbackItem of decrementedItems) {
                    await Product.updateOne({ slug: rollbackItem.slug }, { $inc: { stock: rollbackItem.quantity } });
                }
                return res.status(402).json({ status: "error", message: error.message });
            }
        }

        const orderItems = cart.items.map(item => ({
            productSlug: item.productSlug,
            price: item.price,
            quantity: item.quantity
        }));

        await Order.create([{
            _id: orderId,
            userSlug: userSlug,
            items: orderItems,
            totalPrice: cart.totalPrice,
            address: { shippingAddress, city, phone },
            paymentMethod: paymentMethod, 
            paymentStatus: PAYMENT_STATUS.UNPAID, 
            status: ORDER_STATUS.PENDING 
        }]);

        cart.items = [];
        cart.totalPrice = 0;
        cart.totalItems = 0;
        await cart.save();

        const finalResponse = {
            status: "success",
            message: "Order created successfully.",
            orderId: orderId
        };

        if (paymentGatewayResult && paymentGatewayResult.type === "REFERENCE_NUMBER") {
            finalResponse.fawryRefNumber = paymentGatewayResult.fawryRefNumber;
            finalResponse.message = "Order placed successfully. Please pay using the Fawry reference number provided.";
        }

        return res.status(201).json(finalResponse);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: "error", message: "Internal server error." });
    }
};

export const getUserOrders = async (req, res) => {
    try {
        const userSlug = req.user.slug;

        const orders = await Order.find({ userSlug })
            .sort({ createdAt: -1 })
            .populate({
                path: 'productDetails', 
                select: 'name images slug' 
            })
            .lean();

     
        const enrichedOrders = orders.map(order => ({
            ...order,
            items: order.items.map(item => ({
                ...item,
                product: order.productDetails.find(p => p.slug === item.productSlug) || null
            }))
        }));

        res.status(200).json(enrichedOrders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId)
            .populate({
                path: 'productDetails',
                select: 'name images slug'
            })
            .lean();

        if (!order) {
            return res.status(404).json({ status: "error", message: "Order not found" });
        }

        if (order.userSlug !== req.user.slug && req.user.role !== "admin") {
            return res.status(403).json({ status: "error", message: "Not authorized to view this order" });
        }

        const itemsWithDetails = order.items.map(item => ({
            ...item,
            product: order.productDetails.find(p => p.slug === item.productSlug) || null
        }));

        return res.status(200).json({ 
            status: "success", 
            order: { 
                ...order, 
                items: itemsWithDetails,
                productDetails: undefined 
            } 
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: "error", message: "Internal server error" });
    }
};

export const getAllOrdersByAdmin = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search;
        const status = req.query.status;

        const skip = (page - 1) * limit;

        let queryObj = {};

        if (search) {
            queryObj.$or = [
                { userSlug: { $regex: search, $options: "i" } },
                { "address.phone": { $regex: search, $options: "i" } },
                { "address.shippingAddress": { $regex: search, $options: "i" } }
            ];
        }

        if (status) {
            queryObj.status = status;
        }

        const totalOrders = await Order.countDocuments(queryObj);

        const orders = await Order.find(queryObj)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate({
                path: 'productDetails',
                select: 'name images'
            })
            .lean();

        const totalPages = Math.ceil(totalOrders / limit);

        return res.status(200).json({ 
            status: "success", 
            pagination: {
                currentPage: page,
                limit: limit,
                totalPages: totalPages,
                totalOrders: totalOrders,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            },
            results: orders.length, 
            orders 
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: "error", message: "Internal server error" });
    }
};

export const updateOrderStatusByAdmin = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, paymentStatus } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ status: "error", message: "Order not found" });
        }

        if (status) {
            const allowedStatuses = Object.values(ORDER_STATUS);
            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({ 
                    status: "error", 
                    message: "server error" 
                });
            }
            order.status = status;
        }

        if (paymentStatus) {
            const allowedPaymentStatuses = Object.values(PAYMENT_STATUS);
            if (!allowedPaymentStatuses.includes(paymentStatus)) {
                return res.status(400).json({ 
                    status: "error", 
                    message: "server error" 
                });
            }
            order.paymentStatus = paymentStatus;
        }

        await order.save();

        return res.status(200).json({
            status: "success",
            message: "Order status updated successfully",
            order
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: "error", message: "Internal server error" });
    }
};


export const deleteOrderByAdmin = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findByIdAndDelete(orderId);
        if (!order) {
            return res.status(404).json({ status: "error", message: "Order not found" });
        }

        return res.status(200).json({ status: "success", message: "Order deleted permanently from database" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: "error", message: "Internal server error" });
    }
};
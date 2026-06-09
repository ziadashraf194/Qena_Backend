import Product from "../models/Product.js";
import { createSlug } from "../utils/slugify.js";
import { ROLES } from "../config/constants.js";

export const createProduct = async (req, res) => {
    try {
        const { name, description, price, category, stock } = req.body;
        const images = req.files?.map((file) => file.path);

        if (!name || !price || !category || !stock) {
            return res.status(400).json({ status: "error", message: "All fields are required" });
        }

        const slug = createSlug(name);

        const product = await Product.create({
            name,
            slug,
            description,
            price,
            category,
            stock,
            images: images || []
        });

        res.status(201).json({ status: "success", product });
    } catch (error) {
        console.error("Create Product Error:", error);
        res.status(500).json({ status: "error", message: "Internal server error" });
    }
};


export const getAllProducts = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            search, 
            category, 
            minPrice, 
            maxPrice 
        } = req.query;

        const queryObj = {};

        if (search) {
            queryObj.name = { $regex: search, $options: "i" };
        }

        if (category) {
            queryObj.category = category;
        }

        if (minPrice || maxPrice) {
            queryObj.price = {};
            if (minPrice) queryObj.price.$gte = Number(minPrice);
            if (maxPrice) queryObj.price.$lte = Number(maxPrice);
        }

        const currentPage = Number(page);
        const pageSize = Number(limit);
        const skip = (currentPage - 1) * pageSize;

        const totalProducts = await Product.countDocuments(queryObj);

        const products = await Product.find(queryObj)
            .populate({
                path: "category",
                foreignField: "slug"
            })
            .skip(skip)
            .limit(pageSize)
            .lean(); 

        const mappedProducts = products.map(product => ({
            ...product,
            category: product.category ? product.category.name : "No category",
            images: product.images ? product.images.map(image => `${image}`) : [],
            description: product.description || "No description",
            stock: product.stock || 0
        }));

        res.status(200).json({ 
            status: "success", 
            meta: {
                totalResults: totalProducts,
                totalPages: Math.ceil(totalProducts / pageSize),
                currentPage,
                limit: pageSize
            },
            products: mappedProducts 
        });

    } catch (error) {
        console.error("Get All Products Error:", error);
        res.status(500).json({ status: "error", message: "Internal server error" });
    }
};


export const getProductBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        const product = await Product.findOne({ slug }).populate({
            path: "category",
            foreignField: "slug"
        }).lean();

        if (!product) {
            return res.status(404).json({ status: "error", message: "Product not found" });
        }

        const mappedProduct = {
            ...product,
            category: product.category ? product.category.name : "No category", 
            description: product.description || "No description",
            stock: product.stock || 0,
        };

        res.status(200).json({ status: "success", product: mappedProduct });
 
        
    } catch (error) {
        console.error("Get Product Error:", error);
        res.status(500).json({ status: "error", message: "Internal server error" });
    }
};


export const updateProduct = async (req, res) => {
    try {
        const { slug } = req.params;
        const updates = req.body;

        if (updates.name) {
            updates.slug = createSlug(updates.name);
        }

        const updatedProduct = await Product.findOneAndUpdate({slug}, updates);

        if (!updatedProduct) {
            return res.status(404).json({ status: "error", message: "Product not found" });
        }

        res.status(200).json({ status: "success", product: updatedProduct });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Internal server error" });
    }
};


export const deleteProduct = async (req, res) => {
    try {
        const { slug } = req.params;
        const product = await Product.findOneAndDelete({slug});

        if (!product) {
            return res.status(404).json({ status: "error", message: "Product not found" });
        }

        res.status(200).json({ status: "success", message: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Internal server error" });
    }
};
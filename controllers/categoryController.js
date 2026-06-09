import Category from "../models/Category.js";
import { createSlug } from "../utils/slugify.js";

export const createCategory = async (req, res) => {
    try {
        const { name , description } = req.body;

        if (!name) {
            return res.status(400).json({ status: "error", message: "Category name is required" });
        }

        const categoryExists = await Category.findOne({ name });
        if (categoryExists) {
            return res.status(400).json({ status: "error", message: "Category already exists" });
        }

        const slug = createSlug(name);

        const category = await Category.create({ name, description , slug , image : req.file?.path });
        res.status(201).json({ status: "success", category });
    } catch (error) {
        console.error("Create Category Error:", error);
        res.status(500).json({ status: "error", message: "Internal server error" });
    }
};

export const getCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        res.status(200).json({ status: "success", results: categories.length, categories });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Internal server error" });
    }
};

export const updateCategory = async (req, res) => {
    try {
        const { slug } = req.params;
        const { name , description } = req.body;

        if (!name) {
            return res.status(400).json({ status: "error", message: "Category name is required" });
        }


        const updatedCategory = await Category.findOneAndUpdate(
            {slug: slug}, 
            { name , description , image : req.file?.path }, 
        );

        if (!updatedCategory) {
            return res.status(404).json({ status: "error", message: "Category not found" });
        }

        res.status(200).json({ status: "success", category: updatedCategory });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Internal server error" });
        console.log(error);
        
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const { slug } = req.params;
        const category = await Category.findOneAndDelete({slug});

        if (!category) {
            return res.status(404).json({ status: "error", message: "Category not found" });
        }

        res.status(200).json({ status: "success", message: "Category deleted successfully" });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Internal server error" });
    }
};
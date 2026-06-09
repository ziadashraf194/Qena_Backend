import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import { createSlug } from "../utils/slugify.js";
import { ROLES } from "../config/constants.js";
import bcrypt from "bcrypt"; 

export const registerUser = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ status: "error", message: "All fields are required" });
        }
        if(password.length < 6){
            return res.status(400).json({ status: "error", message: "Password must be at least 6 characters long" });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(email)){
            return res.status(400).json({ status: "error", message: "Invalid email" });
        }
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ status: "error", message: "User already exists" });
        }

        const slug = createSlug(firstName + " " + lastName);
        const hashedPassword = await bcrypt.hash(password, 10); 

        const user = await User.create({ 
            firstName, 
            lastName, 
            slug, 
            email, 
            password: hashedPassword, 
            role: ROLES.USER 
        });

        const token = generateToken(user.slug, user.role);

        res.status(201).json({ status: "success", user: {firstName: user.firstName, lastName: user.lastName, slug: user.slug, email: user.email, role: user.role}, token });
    } catch (error) {
        console.error("Register Error:", error); 
        res.status(500).json({ status: "error", message: "internal server error" });
    }
}

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email }).select("+password");

        if (user && (await bcrypt.compare(password, user.password))) {
            
            const token = generateToken(user.slug, user.role);

            res.status(200).json({ status: "success", user: {firstName: user.firstName, lastName: user.lastName, slug: user.slug, email: user.email, role: user.role}, token });
        } else {
            res.status(401).json({ status: "error", message: "Invalid email or password" });
        }
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ status: "error", message: "internal server error" });
    }
}


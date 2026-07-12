import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import { ROLES } from "../config/constants.js";
import bcrypt from "bcrypt"; 



export const loginUser = async (req, res) => {
    try {
        const { nationalID, password } = req.body;
        
        const user = await User.findOne({ nationalID }).select("+password");

        if (user && (await bcrypt.compare(password, user.password))) {
            
            const token = generateToken(user._id, user.role);

            res.status(200).json({ status: "success", user: {id: user._id, nationalID: user.nationalID, role: user.role}, token });
        } else {
            res.status(401).json({ status: "error", message: "Invalid nationalID or password" });
        }
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ status: "error", message: "internal server error" });
    }
}

export const registerStu = async (req, res) => {
    try {
        const { nationalID, password } = req.body;
        
        const user = await User.findOne({ nationalID });

        if (user) {
            res.status(400).json({ status: "error", message: "User already exists" });
        } else {
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = new User({ nationalID, password: hashedPassword });
            await newUser.save();
            const token = generateToken(newUser._id, newUser.role);
            res.status(201).json({ status: "success", user: {id: newUser._id, nationalID: newUser.nationalID, role: newUser.role}, token });
        }
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ status: "error", message: "internal server error" });
    }
}


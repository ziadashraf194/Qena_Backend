import jwt from "jsonwebtoken";

export const generateToken = (slug, role) => {
    const token = jwt.sign({ slug, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return `Bearer ${token}`;
}
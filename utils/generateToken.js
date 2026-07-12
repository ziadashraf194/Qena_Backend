import jwt from "jsonwebtoken";

export const generateToken = (id, role) => {
    const token = jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return token;
}
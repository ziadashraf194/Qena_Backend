import jwt from "jsonwebtoken";

export const auth = (req, res, next) => {

    const authHeader = req.headers.authorization;

    if (!authHeader)
        return res.status(401).json({
            status: "error",
            message: "Invalid token"
        });

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();

    } catch {
        return res.status(401).json({
            status: "error",
            message: "Invalid token"
        });
    }
};
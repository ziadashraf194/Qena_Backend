import { Router } from "express";
import authRoutes from "./authRoutes.js";
import categoryRoutes from "./categoryRoutes.js";
import productRoutes from "./productRoutes.js";
import cartRoutes from "./cartRoutes.js";
import orderRoutes from "./orderRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/category", categoryRoutes);
router.use("/product", productRoutes);
router.use("/cart", cartRoutes);
router.use("/order", orderRoutes);

router.get("/", (req, res) => {
    res.send("Hello World!");
});


export default router;
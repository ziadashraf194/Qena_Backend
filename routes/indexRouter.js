import { Router } from "express";
import authRoutes from "./authRoutes.js";
import studentRoutes from "./studentRouter.js";
import facultyRoutes from "./facultyRoutes.js";
import applicationRoutes from "./applicationRouter.js";
import fawryRoutes from "./paymentRouter.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/student", studentRoutes);
router.use("/faculty", facultyRoutes);
router.use("/application", applicationRoutes);
router.use("/fawry", fawryRoutes);


router.get("/", (req, res) => {
    res.send("Hello World!");
});


export default router;
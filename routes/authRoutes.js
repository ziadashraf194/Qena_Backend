import { Router } from "express";
import {  loginUser, registerStu } from "../controllers/authController.js";
const router = Router();

router.post("/login", loginUser);
router.post("/register", registerStu);

export default router;
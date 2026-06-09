import express from "express";
import { createCategory, getCategories, updateCategory, deleteCategory } from "../controllers/categoryController.js";
import { upload } from "../middleware/uploadMiddleware.js";
import { authorize } from "../middleware/authorize.js";
import { auth } from "../middleware/auth.js"
import { ROLES } from "../config/constants.js";

const router = express.Router();

router.post("/", auth, authorize(ROLES.ADMIN), upload.single("image"), createCategory);

router.get("/", getCategories);

router.put("/:slug", auth, authorize(ROLES.ADMIN), upload.single("image"), updateCategory);

router.delete("/:slug", auth, authorize(ROLES.ADMIN), deleteCategory);

export default router;
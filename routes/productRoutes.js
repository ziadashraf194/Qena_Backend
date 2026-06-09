import express from "express";
import { upload } from "../middleware/uploadMiddleware.js";
import { authorize } from "../middleware/authorize.js";
import { auth } from "../middleware/auth.js"
import { ROLES } from "../config/constants.js";
import { createProduct , getAllProducts , getProductBySlug , updateProduct , deleteProduct } from "../controllers/productController.js";

const router = express.Router();

router.post("/", auth, authorize(ROLES.ADMIN), upload.array("images", 5), createProduct);
router.get("/", getAllProducts);
router.get("/:slug", getProductBySlug);
router.put("/:slug", auth, authorize(ROLES.ADMIN), upload.array("images", 5), updateProduct);
router.delete("/:slug", auth, authorize(ROLES.ADMIN), deleteProduct);


export default router;
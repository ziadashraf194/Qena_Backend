import express from "express";
import { createOrder , handleFawryWebhook , getUserOrders , getOrderById , getAllOrdersByAdmin , updateOrderStatusByAdmin , deleteOrderByAdmin } from "../controllers/orderController.js"; 
import { auth } from "../middleware/auth.js"; 
import { authorize } from "../middleware/authorize.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();

router.post("/", auth, createOrder);
router.get("/", auth, getUserOrders);

router.get("/admin", auth, authorize(ROLES.ADMIN), getAllOrdersByAdmin);

router.get("/:orderId", auth, getOrderById);

router.put("/:orderId/admin", auth, authorize(ROLES.ADMIN), updateOrderStatusByAdmin);

router.delete("/:orderId", auth, authorize(ROLES.ADMIN), deleteOrderByAdmin);

router.post("/webhook/fawry", handleFawryWebhook);


export default router;
import { Router } from "express";
import { initiatePayment , fawryCallback } from "../controllers/paymentController.js";
import { auth } from "../middleware/auth.js";


const router = Router();

router.post("/initiate", auth, initiatePayment);
router.post("/callback", fawryCallback);

export default router;
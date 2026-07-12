import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { ROLES } from "../config/constants.js";
import {
    getMyApplications,
    getAllApplicationsForAdmin,
    updateApplicationStatus,
    createApplication,
} from "../controllers/applicationController.js";
const router = Router();

router.post("/", auth, createApplication);
router.get("/my-applications", auth, getMyApplications);
router.get("/", auth, authorize(ROLES.ADMIN), getAllApplicationsForAdmin);
router.put("/:applicationId/status", auth, authorize(ROLES.ADMIN), updateApplicationStatus);

export default router;
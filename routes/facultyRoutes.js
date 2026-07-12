import { Router } from "express";

import {createFaculty, getAllFaculties} from "../controllers/facultyController.js";

import {auth} from "../middleware/auth.js";
import {authorize} from "../middleware/authorize.js";
import {ROLES} from "../config/constants.js";

const router = Router();

router.post("/", auth, authorize(ROLES.ADMIN), createFaculty);
router.get("/", getAllFaculties);

export default router;
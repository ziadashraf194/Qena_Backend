import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { fillStudentProfile, getStudentProfile } from "../controllers/studentController.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = Router();

router.post("/fill", auth, fillStudentProfile);
router.get("/", auth, getStudentProfile);

router.post("/upload", auth, upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ status: "error", message: "برجاء رفع ملف" });
    }
    const filePath = `/api/uploads/${req.file.filename}`;
    res.status(200).json({ status: "success", url: filePath });
});

export default router;
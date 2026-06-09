import express from "express";
import path from "path";
import dp from "./config/dp.js"
import router from "./routes/indexRouter.js";
import cors from "cors";
import "dotenv/config";
dp();
const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use("/api", router);
const __dirname = path.resolve();
app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));
const PORT = process.env.PORT ;



app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

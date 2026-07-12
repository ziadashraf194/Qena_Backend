import dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcrypt";
import User from "./models/User.js";
import connectDB from "./config/dp.js";


await connectDB();

const users = [
  {
    name: "Admin",
    nationalID: "12345678901234",
    password: await bcrypt.hash("12345678", 10),
    role: "admin",
  },
  {
    name: "Student",
    nationalID: "98765432109876",
    password: await bcrypt.hash("12345678", 10),
    role: "student",
  },
];

await User.insertMany(users);

console.log("Users created successfully");
process.exit();
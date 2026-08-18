import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import { verifyRequest } from "./middleware/verifyRequest.js";

import authRoutes from "./routes/auth.js";
import courseRoutes from "./routes/courses.js";
import studentRoutes from "./routes/students.js";
import enrollmentRoutes from "./routes/enrollments.js";
import dashboardRoutes from "./routes/dashboard.js";
import shopifyRoutes from "./routes/shopify.js";

const app = express();
app.use(cors());
app.use(express.json());



app.get("/", (req, res) => res.send("Shopify LMS backend running"));

app.use("/", authRoutes);
app.use("/api/courses", verifyRequest, courseRoutes);
app.use("/api/students", verifyRequest, studentRoutes);
app.use("/api/enrollments", verifyRequest, enrollmentRoutes);
app.use("/api/dashboard", verifyRequest, dashboardRoutes);
app.use("/api/shopify", verifyRequest, shopifyRoutes);

const PORT = process.env.PORT || 3000;

connectDB()
    .then(() => {
        console.log("DB connected");
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => {
        console.error("Database connection failed", err);
    });

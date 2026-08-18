import express from "express";
import Course from "../models/Course.js";
import Student from "../models/Student.js";
import Enrollment from "../models/Enrollment.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const shop = req.shop;
    const [totalCourses, totalStudents, totalEnrollments, completed, inProgress, recent] =
      await Promise.all([
        Course.countDocuments({ shop }),
        Student.countDocuments({ shop }),
        Enrollment.countDocuments({ shop }),
        Enrollment.countDocuments({ shop, status: "Completed" }),
        Enrollment.countDocuments({ shop, status: "In Progress" }),
        Enrollment.find({ shop }).sort({ enrollmentDate: -1 }).limit(5).populate(["student", "course"]),
      ]);

    res.json({ totalCourses, totalStudents, totalEnrollments, completed, inProgress, recentEnrollments: recent });
  } catch (err) {
    res.status(500).json({ error: "Failed to load dashboard" });
  }
});

export default router;
import express from "express";
import Enrollment from "../models/Enrollment.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ shop: req.shop })
      .populate("student")
      .populate("course")
      .sort({ enrollmentDate: -1 });
    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch enrollments" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { studentId, courseId } = req.body;
    if (!studentId || !courseId) {
      return res.status(400).json({ error: "Student and course are required" });
    }

    const enrollment = await Enrollment.create({ shop: req.shop, student: studentId, course: courseId });
    const populated = await enrollment.populate(["student", "course"]);
    res.status(201).json(populated);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "This student is already enrolled in this course" });
    }
    res.status(500).json({ error: "Failed to enroll student" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["In Progress", "Completed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const enrollment = await Enrollment.findOneAndUpdate(
      { _id: req.params.id, shop: req.shop },
      { status },
      { new: true }
    ).populate(["student", "course"]);

    if (!enrollment) return res.status(404).json({ error: "Enrollment not found" });
    res.json(enrollment);
  } catch (err) {
    res.status(500).json({ error: "Failed to update enrollment" });
  }
});

export default router;
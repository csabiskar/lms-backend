import express from "express";
import Student from "../models/Student.js";
import Enrollment from "../models/Enrollment.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const students = await Student.find({ shop: req.shop }).sort({ createdAt: -1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, email } = req.body;
    const errors = {};
    if (!name?.trim()) errors.name = "Name is required";
    if (!email?.trim() || !/^\S+@\S+\.\S+$/.test(email)) errors.email = "Valid email is required";
    if (Object.keys(errors).length) return res.status(400).json({ errors });

    const student = await Student.create({
      shop: req.shop, name: name.trim(), email: email.trim().toLowerCase(),
    });
    res.status(201).json(student);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "A student with this email already exists" });
    }
    res.status(500).json({ error: "Failed to create student" });
  }
});

router.get("/:id/courses", async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.params.id, shop: req.shop })
      .populate("course")
      .sort({ enrollmentDate: -1 });

    res.json(enrollments.map((e) => ({
      enrollmentId: e._id, course: e.course, enrollmentDate: e.enrollmentDate, status: e.status,
    })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch student's courses" });
  }
});

export default router;
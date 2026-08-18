import express from "express";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const courses = await Course.find({ shop: req.shop }).sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const course = await Course.findOne({ _id: req.params.id, shop: req.shop });
    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch course" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, description, instructorName, category, duration, status } = req.body;

    const errors = {};
    if (!title?.trim()) errors.title = "Title is required";
    if (!description?.trim()) errors.description = "Description is required";
    if (!instructorName?.trim()) errors.instructorName = "Instructor name is required";
    if (!category?.trim()) errors.category = "Category is required";
    if (!duration?.trim()) errors.duration = "Duration is required";
    if (Object.keys(errors).length) return res.status(400).json({ errors });

    const course = await Course.create({
      shop: req.shop, title, description, instructorName, category, duration,
      status: status || "Active",
    });
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ error: "Failed to create course" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, shop: req.shop },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: "Failed to update course" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const course = await Course.findOneAndDelete({ _id: req.params.id, shop: req.shop });
    if (!course) return res.status(404).json({ error: "Course not found" });
    await Enrollment.deleteMany({ course: course._id, shop: req.shop });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete course" });
  }
});

export default router;
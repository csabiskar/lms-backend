import express from "express";
import axios from "axios";
import Shop from "../models/Shop.js";
import Course from "../models/Course.js";
import Student from "../models/Student.js";
import Enrollment from "../models/Enrollment.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const shop = req.shop;
    
    // Fetch DB stats
    const [totalCourses, totalStudents, totalEnrollments, completed, inProgress, recent, shopDoc] =
      await Promise.all([
        Course.countDocuments({ shop }),
        Student.countDocuments({ shop }),
        Enrollment.countDocuments({ shop }),
        Enrollment.countDocuments({ shop, status: "Completed" }),
        Enrollment.countDocuments({ shop, status: "In Progress" }),
        Enrollment.find({ shop }).sort({ enrollmentDate: -1 }).limit(5).populate(["student", "course"]),
        Shop.findOne({ shop })
      ]);

    // Fetch Shopify GraphQL data
    let shopifyData = null;
    if (shopDoc && shopDoc.accessToken) {
      try {
        const { data } = await axios.post(
          `https://${shop}/admin/api/2024-01/graphql.json`,
          {
            query: `{ shop { name contactEmail } }`
          },
          {
            headers: {
              "X-Shopify-Access-Token": shopDoc.accessToken,
              "Content-Type": "application/json"
            }
          }
        );
        shopifyData = data.data?.shop;
      } catch (gqlErr) {
        console.error("GraphQL Error:", gqlErr.response?.data || gqlErr.message);
      }
    }

    res.json({ 
      totalCourses, totalStudents, totalEnrollments, completed, inProgress, 
      recentEnrollments: recent, 
      shopifyData 
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load dashboard" });
  }
});

export default router;
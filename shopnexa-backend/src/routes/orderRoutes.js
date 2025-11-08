import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
const router = express.Router();

// Protected: only logged-in users
router.post("/", authMiddleware, async (req, res) => {
  // Example: create an order for req.user.id
  const user = req.user;
  // ...business logic (call Supabase or DB)
  res.json({ message: "Order received", userId: user.id });
});

router.get("/", (req, res) => {
    res.json({ message: "Orders route working" });
  });
  
export default router;

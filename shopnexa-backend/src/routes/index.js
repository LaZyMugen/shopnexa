import express from "express";
import userRoutes from "./userRoutes.js";
import orderRoutes from "./orderRoutes.js";
import authRoutes from "./authRoutes.js";


const router = express.Router();

console.log("✅ index.js loaded");

router.get("/", (req, res) => {
  res.send("ShopNexa backend is running");
});

router.use("/users", userRoutes);
router.use("/orders", orderRoutes);
router.use("/auth", authRoutes);

export default router;
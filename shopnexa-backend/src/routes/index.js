import express from "express";
import userRoutes from "./userRoutes.js";
import orderRoutes from "./orderRoutes.js";
import authRoutes from "./authRoutes.js";
import productRoutes from "./productRoutes.js";
import categoryRoutes from "./categoryRoutes.js";
import demoRoutes from "./demoRoutes.js";
import healthRoutes from "./healthRoutes.js";
import adminRoutes from "./adminRoutes.js";
import migrationRoutes from "./migrationRoutes.js";




const router = express.Router();

router.get("/", (req, res) => {
  res.send("ShopNexa backend is running");
});


router.use("/health", healthRoutes);
router.use("/users", userRoutes);
router.use("/orders", orderRoutes);
router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/admin", adminRoutes);
router.use("/admin", migrationRoutes);
router.use("/demo", demoRoutes);

export default router;
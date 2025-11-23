import express from "express";
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  bulkDecrementStock
} from "../controllers/productController.js";

const router = express.Router();

router.post("/", createProduct);
// Enhanced GET /products with filtering & pagination
router.get("/", getAllProducts);
router.get("/:id", getProductById);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

// Bulk stock decrement (public demo endpoint)
router.post('/bulk-decrement', bulkDecrementStock);

export default router;

import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { createOrder, listOrders, getOrder, updateOrderStatus, sendShipperMessage } from "../controllers/orderController.js";

const router = express.Router();

// Create order (authenticated)
router.post("/", authMiddleware, createOrder);

// List orders (authenticated - could be admin scoped later)
router.get("/", authMiddleware, listOrders);

// Get single order
router.get("/:id", authMiddleware, getOrder);

// Update status
router.put("/:id/status", authMiddleware, updateOrderStatus);

// Message shipper
router.post("/:id/shipper-message", authMiddleware, sendShipperMessage);

export default router;

import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { createFeedback, listFeedbackForProduct, listRecentFeedback } from '../controllers/feedbackController.js';

const router = express.Router();

// Product-specific feedback
router.post('/:id/feedback', authMiddleware, createFeedback);
router.get('/:id/feedback', listFeedbackForProduct);

// Recent feedback across products
router.get('/feedback/recent/list', listRecentFeedback);

export default router;

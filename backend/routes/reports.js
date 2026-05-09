import express from 'express';
import { getDailySales, getMonthlyReport, getBestSelling, getDashboardStats } from '../controllers/reportController.js';

const router = express.Router();

router.get('/daily', getDailySales);
router.get('/monthly', getMonthlyReport);
router.get('/best-selling', getBestSelling);
router.get('/dashboard', getDashboardStats);

export default router;
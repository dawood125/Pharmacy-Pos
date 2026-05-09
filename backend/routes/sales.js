import express from 'express';
import { createSale, getSales, getSale, getSaleByInvoice } from '../controllers/saleController.js';

const router = express.Router();

router.post('/', createSale);
router.get('/', getSales);
router.get('/invoice/:invoice', getSaleByInvoice);
router.get('/:id', getSale);

export default router;
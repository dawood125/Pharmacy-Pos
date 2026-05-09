import express from 'express';
import { getReturns, getReturn, getReturnByInvoice, createReturn } from '../controllers/returnController.js';

const router = express.Router();

router.get('/', getReturns);
router.get('/invoice/:invoice', getReturnByInvoice);
router.get('/:id', getReturn);
router.post('/', createReturn);

export default router;
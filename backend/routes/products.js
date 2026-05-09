import express from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStock,
  getExpiringSoon
} from '../controllers/productController.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/low-stock', getLowStock);
router.get('/expiring', getExpiringSoon);
router.get('/:id', getProduct);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;
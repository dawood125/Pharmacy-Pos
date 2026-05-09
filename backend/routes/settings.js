import express from 'express';
import {
  getSettings,
  getSetting,
  updateSetting,
  updateMultiple,
  getStoreConfig,
  getTaxConfig
} from '../controllers/settingController.js';

const router = express.Router();

router.get('/', getSettings);
router.get('/store', getStoreConfig);
router.get('/tax', getTaxConfig);
router.get('/:key', getSetting);
router.put('/', updateMultiple);
router.post('/', updateSetting);

export default router;
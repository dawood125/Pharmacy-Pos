import express from 'express';
import { getUsers, getUser, createUser, updateUser, deleteUser, getStats } from '../controllers/userController.js';

const router = express.Router();

router.get('/stats', getStats);
router.get('/', getUsers);
router.get('/:id', getUser);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
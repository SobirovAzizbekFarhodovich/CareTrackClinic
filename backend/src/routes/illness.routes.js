import express from 'express';
import {
  createIllness,
  deleteIllness,
  getIllnessById,
  getIllnesses,
  updateIllness,
} from '../controllers/illness.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('admin', 'clinician', 'receptionist'), getIllnesses);
router.get('/:id', authorize('admin', 'clinician', 'receptionist'), getIllnessById);
router.post('/', authorize('admin'), createIllness);
router.patch('/:id', authorize('admin', 'clinician'), updateIllness);
router.delete('/:id', authorize('admin'), deleteIllness);

export default router;

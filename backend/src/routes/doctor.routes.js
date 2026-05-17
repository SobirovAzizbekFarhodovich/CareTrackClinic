import express from 'express';
import {
  createDoctor,
  deleteDoctor,
  getDoctorById,
  getDoctors,
  updateDoctor,
} from '../controllers/doctor.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('admin', 'clinician', 'receptionist'), getDoctors);
router.get('/:id', authorize('admin', 'clinician', 'receptionist'), getDoctorById);
router.post('/', authorize('admin'), createDoctor);
router.patch('/:id', authorize('admin'), updateDoctor);
router.delete('/:id', authorize('admin'), deleteDoctor);

export default router;

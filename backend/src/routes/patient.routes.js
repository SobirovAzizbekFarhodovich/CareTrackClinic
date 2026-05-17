import express from 'express';
import {
  createPatient,
  deletePatient,
  getPatientById,
  getPatientProfile,
  getPatients,
  updatePatient,
} from '../controllers/patient.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('admin', 'clinician', 'receptionist'), getPatients);
router.get('/:id/profile', authorize('admin', 'clinician', 'receptionist'), getPatientProfile);
router.get('/:id', authorize('admin', 'clinician', 'receptionist'), getPatientById);
router.post('/', authorize('admin', 'receptionist'), createPatient);
router.patch('/:id', authorize('admin', 'clinician', 'receptionist'), updatePatient);
router.delete('/:id', authorize('admin'), deletePatient);

export default router;

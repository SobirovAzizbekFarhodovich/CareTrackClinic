import express from 'express';
import authRoutes from './authRoutes.js';
import doctorRoutes from './doctor.routes.js';
import patientRoutes from './patient.routes.js';
import illnessRoutes from './illness.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/doctors', doctorRoutes);
router.use('/patients', patientRoutes);
router.use('/illnesses', illnessRoutes);

export default router;

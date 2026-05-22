import db from '../database/data.js';

export async function getDoctorForClinician(user) {
  if (user.role !== 'clinician') {
    return null;
  }

  const doctor = await db.oneOrNone(
    'SELECT id FROM doctors WHERE user_id = $1',
    [user.id]
  );

  if (!doctor) {
    const error = new Error('Doctor profile is required for clinician access');
    error.status = 403;
    throw error;
  }

  return doctor;
}

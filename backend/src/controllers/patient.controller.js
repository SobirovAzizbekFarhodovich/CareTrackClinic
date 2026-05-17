import db from '../database/data.js';

function patientFilters(query) {
  const conditions = [];
  const values = [];

  if (query.search) {
    values.push(`%${query.search}%`);
    conditions.push(
      `(p.first_name ILIKE $${values.length} OR p.last_name ILIKE $${values.length} OR p.email ILIKE $${values.length} OR p.phone ILIKE $${values.length})`
    );
  }

  if (query.doctorId) {
    values.push(query.doctorId);
    conditions.push(`p.doctor_id = $${values.length}`);
  }

  if (query.gender) {
    values.push(query.gender);
    conditions.push(`p.gender = $${values.length}::gender_type`);
  }

  return {
    where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    values,
  };
}

const patientSelect = `
  SELECT p.id, p.doctor_id, p.first_name, p.last_name, p.date_of_birth, p.gender,
         p.blood_group, p.phone, p.email, p.address, p.emergency_contact,
         p.emergency_phone, p.insurance_number, p.notes, p.is_active,
         p.registered_at, p.created_at, p.updated_at,
         d.first_name AS doctor_first_name, d.last_name AS doctor_last_name,
         d.specialization AS doctor_specialization, d.department AS doctor_department
  FROM patients p
  JOIN doctors d ON d.id = p.doctor_id
`;

export async function getPatients(req, res) {
  try {
    const { where, values } = patientFilters(req.query);
    const patients = await db.any(`${patientSelect} ${where} ORDER BY p.created_at DESC`, values);
    return res.status(200).json({ data: patients });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch patients', error: error.message });
  }
}

export async function getPatientById(req, res) {
  try {
    const patient = await db.oneOrNone(`${patientSelect} WHERE p.id = $1`, [req.params.id]);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    return res.status(200).json({ data: patient });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch patient', error: error.message });
  }
}

export async function getPatientProfile(req, res) {
  try {
    const patient = await db.oneOrNone(
      `SELECT id, doctor_id, first_name, last_name, date_of_birth, gender, blood_group,
              phone, email, address, emergency_contact, emergency_phone, insurance_number,
              notes, is_active, registered_at, created_at, updated_at
       FROM patients
       WHERE id = $1`,
      [req.params.id]
    );

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const doctor = await db.oneOrNone(
      `SELECT id, first_name, last_name, specialization, department, phone, email,
              room_number, is_available
       FROM doctors
       WHERE id = $1`,
      [patient.doctor_id]
    );

    const illnesses = await db.any(
      `SELECT id, patient_id, icd_code, icd_description, diagnosis, severity,
              status, symptoms, treatment_plan, prescribed_meds, diagnosed_at,
              resolved_at, follow_up_date, notes, created_at, updated_at
       FROM illnesses
       WHERE patient_id = $1
       ORDER BY diagnosed_at DESC, created_at DESC`,
      [patient.id]
    );

    return res.status(200).json({ data: { ...patient, doctor, illnesses } });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch patient profile', error: error.message });
  }
}

export async function createPatient(req, res) {
  try {
    const {
      doctorId,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      bloodGroup,
      phone,
      email,
      address,
      emergencyContact,
      emergencyPhone,
      insuranceNumber,
      notes,
    } = req.body;

    if (!doctorId || !firstName || !lastName || !dateOfBirth || !gender || !phone || !email || !address) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }

    const patient = await db.one(
      `INSERT INTO patients
        (doctor_id, first_name, last_name, date_of_birth, gender, blood_group, phone,
         email, address, emergency_contact, emergency_phone, insurance_number, notes)
       VALUES ($1, $2, $3, $4, $5::gender_type, $6::blood_group, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id, doctor_id, first_name, last_name, date_of_birth, gender, blood_group,
                 phone, email, address, emergency_contact, emergency_phone,
                 insurance_number, notes, is_active, registered_at, created_at, updated_at`,
      [
        doctorId,
        firstName,
        lastName,
        dateOfBirth,
        gender,
        bloodGroup || null,
        phone,
        email.trim().toLowerCase(),
        address,
        emergencyContact,
        emergencyPhone,
        insuranceNumber,
        notes,
      ]
    );

    return res.status(201).json({ data: patient });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create patient', error: error.message });
  }
}

export async function updatePatient(req, res) {
  try {
    const {
      doctorId,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      bloodGroup,
      phone,
      email,
      address,
      emergencyContact,
      emergencyPhone,
      insuranceNumber,
      notes,
      isActive,
    } = req.body;

    const patient = await db.oneOrNone(
      `UPDATE patients
       SET doctor_id = COALESCE($2, doctor_id),
           first_name = COALESCE($3, first_name),
           last_name = COALESCE($4, last_name),
           date_of_birth = COALESCE($5, date_of_birth),
           gender = COALESCE($6::gender_type, gender),
           blood_group = COALESCE($7::blood_group, blood_group),
           phone = COALESCE($8, phone),
           email = COALESCE($9, email),
           address = COALESCE($10, address),
           emergency_contact = COALESCE($11, emergency_contact),
           emergency_phone = COALESCE($12, emergency_phone),
           insurance_number = COALESCE($13, insurance_number),
           notes = COALESCE($14, notes),
           is_active = COALESCE($15, is_active)
       WHERE id = $1
       RETURNING id, doctor_id, first_name, last_name, date_of_birth, gender, blood_group,
                 phone, email, address, emergency_contact, emergency_phone,
                 insurance_number, notes, is_active, registered_at, created_at, updated_at`,
      [
        req.params.id,
        doctorId,
        firstName,
        lastName,
        dateOfBirth,
        gender,
        bloodGroup,
        phone,
        email && email.trim().toLowerCase(),
        address,
        emergencyContact,
        emergencyPhone,
        insuranceNumber,
        notes,
        isActive,
      ]
    );

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    return res.status(200).json({ data: patient });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update patient', error: error.message });
  }
}

export async function deletePatient(req, res) {
  try {
    const patient = await db.oneOrNone('DELETE FROM patients WHERE id = $1 RETURNING id', [req.params.id]);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete patient', error: error.message });
  }
}

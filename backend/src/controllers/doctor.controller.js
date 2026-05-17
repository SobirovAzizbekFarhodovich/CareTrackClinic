import db from '../database/data.js';

function doctorFilters(query) {
  const conditions = [];
  const values = [];

  if (query.search) {
    values.push(`%${query.search}%`);
    conditions.push(
      `(first_name ILIKE $${values.length} OR last_name ILIKE $${values.length} OR email ILIKE $${values.length} OR specialization ILIKE $${values.length})`
    );
  }

  if (query.department) {
    values.push(query.department);
    conditions.push(`department = $${values.length}::department_type`);
  }

  if (query.isAvailable !== undefined) {
    values.push(query.isAvailable === 'true');
    conditions.push(`is_available = $${values.length}`);
  }

  return {
    where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    values,
  };
}

export async function getDoctors(req, res) {
  try {
    const { where, values } = doctorFilters(req.query);
    const doctors = await db.any(
      `SELECT id, first_name, last_name, specialization, department, phone, email,
              room_number, is_available, created_at, updated_at
       FROM doctors
       ${where}
       ORDER BY created_at DESC`,
      values
    );

    return res.status(200).json({ data: doctors });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch doctors', error: error.message });
  }
}

export async function getDoctorById(req, res) {
  try {
    const doctor = await db.oneOrNone(
      `SELECT id, first_name, last_name, specialization, department, phone, email,
              room_number, is_available, created_at, updated_at
       FROM doctors
       WHERE id = $1`,
      [req.params.id]
    );

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    return res.status(200).json({ data: doctor });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch doctor', error: error.message });
  }
}

export async function createDoctor(req, res) {
  try {
    const {
      firstName,
      lastName,
      specialization,
      department,
      phone,
      email,
      roomNumber,
      isAvailable = true,
    } = req.body;

    if (!firstName || !lastName || !specialization || !department || !email) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }

    const doctor = await db.one(
      `INSERT INTO doctors
        (first_name, last_name, specialization, department, phone, email, room_number, is_available)
       VALUES ($1, $2, $3, $4::department_type, $5, $6, $7, $8)
       RETURNING id, first_name, last_name, specialization, department, phone, email,
                 room_number, is_available, created_at, updated_at`,
      [firstName, lastName, specialization, department, phone, email.trim().toLowerCase(), roomNumber, isAvailable]
    );

    return res.status(201).json({ data: doctor });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create doctor', error: error.message });
  }
}

export async function updateDoctor(req, res) {
  try {
    const {
      firstName,
      lastName,
      specialization,
      department,
      phone,
      email,
      roomNumber,
      isAvailable,
    } = req.body;

    const doctor = await db.oneOrNone(
      `UPDATE doctors
       SET first_name = COALESCE($2, first_name),
           last_name = COALESCE($3, last_name),
           specialization = COALESCE($4, specialization),
           department = COALESCE($5::department_type, department),
           phone = COALESCE($6, phone),
           email = COALESCE($7, email),
           room_number = COALESCE($8, room_number),
           is_available = COALESCE($9, is_available)
       WHERE id = $1
       RETURNING id, first_name, last_name, specialization, department, phone, email,
                 room_number, is_available, created_at, updated_at`,
      [
        req.params.id,
        firstName,
        lastName,
        specialization,
        department,
        phone,
        email && email.trim().toLowerCase(),
        roomNumber,
        isAvailable,
      ]
    );

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    return res.status(200).json({ data: doctor });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update doctor', error: error.message });
  }
}

export async function deleteDoctor(req, res) {
  try {
    const doctor = await db.oneOrNone(
      `DELETE FROM doctors
       WHERE id = $1
       RETURNING id`,
      [req.params.id]
    );

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete doctor', error: error.message });
  }
}

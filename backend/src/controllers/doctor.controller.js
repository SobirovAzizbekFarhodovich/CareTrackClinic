import db from '../database/data.js';
import { hashPassword } from '../utils/password.js';

function doctorErrorResponse(res, error, fallbackMessage) {
  if (error.code === '23505') {
    return res.status(409).json({ message: 'Doctor or user email already exists' });
  }

  if (error.code === '23503') {
    return res.status(409).json({ message: 'Doctor cannot be deleted while assigned patients exist' });
  }

  return res.status(500).json({ message: fallbackMessage, error: error.message });
}

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
      `SELECT id, user_id, first_name, last_name, specialization, department, phone, email,
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
      `SELECT id, user_id, first_name, last_name, specialization, department, phone, email,
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
      password,
      roomNumber,
      isAvailable = true,
    } = req.body;

    if (!firstName || !lastName || !specialization || !department || !email || !password) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const doctor = await db.tx(async (t) => {
      const user = await t.one(
        `INSERT INTO users (first_name, last_name, email, password_hash, role)
         VALUES ($1, $2, $3, $4, 'clinician'::user_role)
         RETURNING id`,
        [firstName, lastName, normalizedEmail, hashPassword(password)]
      );

      return t.one(
        `INSERT INTO doctors
          (user_id, first_name, last_name, specialization, department, phone, email, room_number, is_available)
         VALUES ($1, $2, $3, $4, $5::department_type, $6, $7, $8, $9)
         RETURNING id, user_id, first_name, last_name, specialization, department, phone, email,
                   room_number, is_available, created_at, updated_at`,
        [user.id, firstName, lastName, specialization, department, phone, normalizedEmail, roomNumber, isAvailable]
      );
    });

    return res.status(201).json({ data: doctor });
  } catch (error) {
    return doctorErrorResponse(res, error, 'Failed to create doctor');
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

    const normalizedEmail = email && email.trim().toLowerCase();
    const doctor = await db.tx(async (t) => {
      const existingDoctor = await t.oneOrNone(
        'SELECT id, user_id FROM doctors WHERE id = $1',
        [req.params.id]
      );

      if (!existingDoctor) {
        return null;
      }

      const updatedDoctor = await t.one(
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
         RETURNING id, user_id, first_name, last_name, specialization, department, phone, email,
                   room_number, is_available, created_at, updated_at`,
        [
          req.params.id,
          firstName,
          lastName,
          specialization,
          department,
          phone,
          normalizedEmail,
          roomNumber,
          isAvailable,
        ]
      );

      await t.none(
        `UPDATE users
         SET first_name = COALESCE($2, first_name),
             last_name = COALESCE($3, last_name),
             email = COALESCE($4, email)
         WHERE id = $1`,
        [existingDoctor.user_id, firstName, lastName, normalizedEmail]
      );

      return updatedDoctor;
    });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    return res.status(200).json({ data: doctor });
  } catch (error) {
    return doctorErrorResponse(res, error, 'Failed to update doctor');
  }
}

export async function deleteDoctor(req, res) {
  try {
    const doctor = await db.tx(async (t) => {
      const deletedDoctor = await t.oneOrNone(
        `DELETE FROM doctors
         WHERE id = $1
         RETURNING id, user_id`,
        [req.params.id]
      );

      if (deletedDoctor?.user_id) {
        await t.none('DELETE FROM users WHERE id = $1', [deletedDoctor.user_id]);
      }

      return deletedDoctor;
    });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    return res.status(204).send();
  } catch (error) {
    return doctorErrorResponse(res, error, 'Failed to delete doctor');
  }
}

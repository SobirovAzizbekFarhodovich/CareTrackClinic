import db from '../database/data.js';

function illnessFilters(query) {
  const conditions = [];
  const values = [];

  if (query.search) {
    values.push(`%${query.search}%`);
    conditions.push(
      `(i.icd_code ILIKE $${values.length} OR i.icd_description ILIKE $${values.length} OR i.diagnosis ILIKE $${values.length})`
    );
  }

  if (query.patientId) {
    values.push(query.patientId);
    conditions.push(`i.patient_id = $${values.length}`);
  }

  if (query.severity) {
    values.push(query.severity);
    conditions.push(`i.severity = $${values.length}::severity_level`);
  }

  if (query.status) {
    values.push(query.status);
    conditions.push(`i.status = $${values.length}::illness_status`);
  }

  return {
    where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    values,
  };
}

const illnessSelect = `
  SELECT i.id, i.patient_id, i.icd_code, i.icd_description, i.diagnosis,
         i.severity, i.status, i.symptoms, i.treatment_plan, i.prescribed_meds,
         i.diagnosed_at, i.resolved_at, i.follow_up_date, i.notes,
         i.created_at, i.updated_at,
         p.first_name AS patient_first_name, p.last_name AS patient_last_name
  FROM illnesses i
  JOIN patients p ON p.id = i.patient_id
`;

export async function getIllnesses(req, res) {
  try {
    const { where, values } = illnessFilters(req.query);
    const illnesses = await db.any(`${illnessSelect} ${where} ORDER BY i.created_at DESC`, values);
    return res.status(200).json({ data: illnesses });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch illnesses', error: error.message });
  }
}

export async function getIllnessById(req, res) {
  try {
    const illness = await db.oneOrNone(`${illnessSelect} WHERE i.id = $1`, [req.params.id]);

    if (!illness) {
      return res.status(404).json({ message: 'Illness not found' });
    }

    return res.status(200).json({ data: illness });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch illness', error: error.message });
  }
}

export async function createIllness(req, res) {
  try {
    const {
      patientId,
      icdCode,
      icdDescription,
      diagnosis,
      severity = 'mild',
      status = 'active',
      symptoms,
      treatmentPlan,
      prescribedMeds,
      diagnosedAt,
      resolvedAt,
      followUpDate,
      notes,
    } = req.body;

    if (!patientId || !icdCode || !icdDescription || !diagnosis) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }

    const illness = await db.one(
      `INSERT INTO illnesses
        (patient_id, icd_code, icd_description, diagnosis, severity, status,
         symptoms, treatment_plan, prescribed_meds, diagnosed_at, resolved_at,
         follow_up_date, notes)
       VALUES ($1, $2, $3, $4, $5::severity_level, $6::illness_status,
               $7, $8, $9, COALESCE($10, CURRENT_DATE), $11, $12, $13)
       RETURNING id, patient_id, icd_code, icd_description, diagnosis, severity,
                 status, symptoms, treatment_plan, prescribed_meds, diagnosed_at,
                 resolved_at, follow_up_date, notes, created_at, updated_at`,
      [
        patientId,
        icdCode,
        icdDescription,
        diagnosis,
        severity,
        status,
        symptoms,
        treatmentPlan,
        prescribedMeds,
        diagnosedAt,
        resolvedAt,
        followUpDate,
        notes,
      ]
    );

    return res.status(201).json({ data: illness });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create illness', error: error.message });
  }
}

export async function updateIllness(req, res) {
  try {
    const {
      patientId,
      icdCode,
      icdDescription,
      diagnosis,
      severity,
      status,
      symptoms,
      treatmentPlan,
      prescribedMeds,
      diagnosedAt,
      resolvedAt,
      followUpDate,
      notes,
    } = req.body;

    const illness = await db.oneOrNone(
      `UPDATE illnesses
       SET patient_id = COALESCE($2, patient_id),
           icd_code = COALESCE($3, icd_code),
           icd_description = COALESCE($4, icd_description),
           diagnosis = COALESCE($5, diagnosis),
           severity = COALESCE($6::severity_level, severity),
           status = COALESCE($7::illness_status, status),
           symptoms = COALESCE($8, symptoms),
           treatment_plan = COALESCE($9, treatment_plan),
           prescribed_meds = COALESCE($10, prescribed_meds),
           diagnosed_at = COALESCE($11, diagnosed_at),
           resolved_at = COALESCE($12, resolved_at),
           follow_up_date = COALESCE($13, follow_up_date),
           notes = COALESCE($14, notes)
       WHERE id = $1
       RETURNING id, patient_id, icd_code, icd_description, diagnosis, severity,
                 status, symptoms, treatment_plan, prescribed_meds, diagnosed_at,
                 resolved_at, follow_up_date, notes, created_at, updated_at`,
      [
        req.params.id,
        patientId,
        icdCode,
        icdDescription,
        diagnosis,
        severity,
        status,
        symptoms,
        treatmentPlan,
        prescribedMeds,
        diagnosedAt,
        resolvedAt,
        followUpDate,
        notes,
      ]
    );

    if (!illness) {
      return res.status(404).json({ message: 'Illness not found' });
    }

    return res.status(200).json({ data: illness });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update illness', error: error.message });
  }
}

export async function deleteIllness(req, res) {
  try {
    const illness = await db.oneOrNone('DELETE FROM illnesses WHERE id = $1 RETURNING id', [req.params.id]);

    if (!illness) {
      return res.status(404).json({ message: 'Illness not found' });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete illness', error: error.message });
  }
}

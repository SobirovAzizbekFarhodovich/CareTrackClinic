BEGIN;

DROP TRIGGER IF EXISTS set_illnesses_updated_at ON illnesses;
DROP TRIGGER IF EXISTS set_patients_updated_at ON patients;
DROP TRIGGER IF EXISTS set_doctors_updated_at ON doctors;
DROP TRIGGER IF EXISTS set_users_updated_at ON users;

DROP TABLE IF EXISTS illnesses;
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS doctors;
DROP TABLE IF EXISTS users;

DROP FUNCTION IF EXISTS trigger_set_updated_at();

DROP TYPE IF EXISTS illness_status;
DROP TYPE IF EXISTS severity_level;
DROP TYPE IF EXISTS blood_group;
DROP TYPE IF EXISTS gender_type;
DROP TYPE IF EXISTS department_type;
DROP TYPE IF EXISTS user_role;

COMMIT;

-- ============================================================
-- CareTrack Clinic — TYBT
-- Migration: Asosiy jadvallar
-- Foydalanish: psql -U postgres -d caretrack_db -f migration.sql
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- Extension
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- Umumiy trigger funksiyasi (updated_at avtomatik yangilanadi)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- JADVAL 1: users
-- ============================================================
CREATE TYPE user_role AS ENUM ('admin', 'clinician', 'receptionist');

CREATE TABLE IF NOT EXISTS users (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT         NOT NULL,
    password_reset_token_hash TEXT,
    password_reset_expires_at TIMESTAMPTZ,
    role          user_role    NOT NULL DEFAULT 'receptionist',
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- JADVAL 2: doctors
-- ============================================================
CREATE TYPE department_type AS ENUM (
    'general_practice',
    'cardiology',
    'neurology',
    'dermatology',
    'orthopedics',
    'diagnostics',
    'emergency'
);

CREATE TABLE IF NOT EXISTS doctors (
    id             UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID            NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    first_name     VARCHAR(100)    NOT NULL,
    last_name      VARCHAR(100)    NOT NULL,
    specialization VARCHAR(150)    NOT NULL,
    department     department_type NOT NULL,
    phone          VARCHAR(20),
    email          VARCHAR(255)    NOT NULL UNIQUE,
    room_number    VARCHAR(20),
    is_available   BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_doctors_updated_at
    BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- JADVAL 3: patients
-- ============================================================
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');
CREATE TYPE blood_group  AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');

CREATE TABLE IF NOT EXISTS patients (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id         UUID         NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    first_name        VARCHAR(100) NOT NULL,
    last_name         VARCHAR(100) NOT NULL,
    date_of_birth     DATE         NOT NULL,
    gender            gender_type  NOT NULL,
    blood_group       blood_group,
    phone             VARCHAR(20) NOT NULL,
    email             VARCHAR(255) NOT NULL UNIQUE,
    address           TEXT        NOT NULL,
    emergency_contact VARCHAR(150),
    emergency_phone   VARCHAR(20),
    insurance_number  VARCHAR(100),
    notes             TEXT,
    is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
    registered_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- JADVAL 4: illnesses
-- ============================================================
CREATE TYPE severity_level AS ENUM ('mild', 'moderate', 'severe', 'critical');
CREATE TYPE illness_status  AS ENUM ('active', 'resolved', 'chronic', 'monitoring');

CREATE TABLE IF NOT EXISTS illnesses (
    id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      UUID           NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    icd_code        VARCHAR(20)    NOT NULL,
    icd_description VARCHAR(255)   NOT NULL,
    diagnosis       TEXT           NOT NULL,
    severity        severity_level NOT NULL DEFAULT 'mild',
    status          illness_status NOT NULL DEFAULT 'active',
    symptoms        TEXT,
    treatment_plan  TEXT,
    prescribed_meds TEXT,
    diagnosed_at    DATE           NOT NULL DEFAULT CURRENT_DATE,
    resolved_at     DATE,
    follow_up_date  DATE,
    notes           TEXT,
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_resolved_after_diagnosed
        CHECK (resolved_at IS NULL OR resolved_at >= diagnosed_at),

    CONSTRAINT chk_icd_code_format
        CHECK (icd_code ~ '^[A-Z][0-9]{2}(\.[0-9]{1,4})?$')
);

CREATE TRIGGER set_illnesses_updated_at
    BEFORE UPDATE ON illnesses
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

COMMIT;

-- ============================================================
-- ROLLBACK (kerak bo'lganda qo'lda ishlatiladi)
-- ============================================================
-- BEGIN;
-- DROP TRIGGER IF EXISTS set_illnesses_updated_at ON illnesses;
-- DROP TRIGGER IF EXISTS set_patients_updated_at   ON patients;
-- DROP TRIGGER IF EXISTS set_doctors_updated_at    ON doctors;
-- DROP TRIGGER IF EXISTS set_users_updated_at      ON users;
-- DROP TABLE IF EXISTS illnesses;
-- DROP TABLE IF EXISTS patients;
-- DROP TABLE IF EXISTS doctors;
-- DROP TABLE IF EXISTS users;
-- DROP FUNCTION IF EXISTS trigger_set_updated_at();
-- DROP TYPE IF EXISTS illness_status;
-- DROP TYPE IF EXISTS severity_level;
-- DROP TYPE IF EXISTS blood_group;
-- DROP TYPE IF EXISTS gender_type;
-- DROP TYPE IF EXISTS department_type;
-- DROP TYPE IF EXISTS user_role;
-- COMMIT;

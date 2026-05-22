BEGIN;

ALTER TABLE doctors
    DROP CONSTRAINT IF EXISTS doctors_user_id_fkey,
    ADD CONSTRAINT doctors_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE doctors
    ALTER COLUMN user_id DROP NOT NULL;

COMMIT;

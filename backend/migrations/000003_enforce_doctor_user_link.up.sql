BEGIN;

ALTER TABLE doctors
    ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE doctors
    DROP CONSTRAINT IF EXISTS doctors_user_id_fkey,
    ADD CONSTRAINT doctors_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

COMMIT;

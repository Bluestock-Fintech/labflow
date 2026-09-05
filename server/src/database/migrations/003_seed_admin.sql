-- Dev-only seed: super admin account for local testing.
-- Credentials: admin@labflow.local / Admin@123
INSERT INTO users (name, email, mobile, password_hash, role)
VALUES ('Super Admin', 'admin@labflow.local', '9999999999',
        '$2b$12$pBAHs9TpuAhxVBmcamZueeQS0AY2aan8n6uQu3vGztdeQIZfeIcgq', 'SUPER_ADMIN')
ON CONFLICT (email) DO NOTHING;

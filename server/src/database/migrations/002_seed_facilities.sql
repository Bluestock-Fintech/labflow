INSERT INTO facilities (name, default_scope) VALUES
  ('AC', 'FLOOR'),
  ('Inverter', 'FLOOR'),
  ('Premium Chair', 'FLOOR'),
  ('Parking', 'COMMON'),
  ('WiFi', 'COMMON'),
  ('RO Water', 'COMMON'),
  ('CCTV', 'COMMON'),
  ('Locker', 'COMMON')
ON CONFLICT (name) DO NOTHING;

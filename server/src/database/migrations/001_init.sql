-- LabFlow core schema (Phase 1 MVP)
-- Normalized per plan: users -> libraries -> floors -> seats, facilities, pricing.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'LIBRARY_OWNER', 'CUSTOMER');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  mobile TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL,
  status user_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE library_status AS ENUM ('DRAFT', 'PUBLISHED', 'SUSPENDED', 'CLOSED');

CREATE TABLE libraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  email TEXT,
  mobile TEXT,
  address TEXT,
  city TEXT,
  area TEXT,
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  status library_status NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_libraries_owner_id ON libraries(owner_id);

-- Master facility catalog (AC, Inverter, Parking, WiFi, RO Water, ...)
CREATE TYPE facility_scope AS ENUM ('COMMON', 'FLOOR');

CREATE TABLE facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  default_scope facility_scope NOT NULL DEFAULT 'FLOOR',
  status TEXT NOT NULL DEFAULT 'ACTIVE'
);

-- Library-level common facilities (Parking, WiFi, RO Water — usually free/informational)
CREATE TABLE library_facilities (
  library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES facilities(id),
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (library_id, facility_id)
);

CREATE TYPE floor_status AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');

CREATE TABLE floors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  floor_number INTEGER NOT NULL,
  floor_name TEXT NOT NULL,
  total_seats INTEGER NOT NULL CHECK (total_seats > 0),
  full_time_price NUMERIC(10,2) NOT NULL,
  half_time_price NUMERIC(10,2) NOT NULL,
  status floor_status NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (library_id, floor_number)
);
CREATE INDEX idx_floors_library_id ON floors(library_id);

-- Per-floor facilities: master facility (AC, Inverter, Premium Chair) with a floor-specific price
CREATE TABLE floor_facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id),
  custom_name TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (facility_id IS NOT NULL OR custom_name IS NOT NULL)
);
CREATE INDEX idx_floor_facilities_floor_id ON floor_facilities(floor_id);

-- Actual seat records, not a derived count
CREATE TYPE seat_status AS ENUM ('AVAILABLE', 'BLOCKED', 'RETIRED');

CREATE TABLE seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  seat_number TEXT NOT NULL,
  seat_code TEXT NOT NULL,
  status seat_status NOT NULL DEFAULT 'AVAILABLE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (floor_id, seat_number)
);
CREATE INDEX idx_seats_floor_id ON seats(floor_id);

CREATE TABLE library_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  storage_key TEXT NOT NULL,
  title TEXT,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_library_photos_library_id ON library_photos(library_id);

-- Business rule: max 10 floors per library, enforced in application code (not DB), per plan.

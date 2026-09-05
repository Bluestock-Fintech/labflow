CREATE TYPE order_status AS ENUM ('PENDING_APPROVAL', 'CONFIRMED', 'REJECTED', 'CANCELLED');
CREATE TYPE order_source AS ENUM ('OWNER', 'CUSTOMER');
CREATE TYPE payment_method AS ENUM ('CASH', 'ONLINE');
CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID');

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  floor_id UUID NOT NULL REFERENCES floors(id),
  seat_id UUID NOT NULL REFERENCES seats(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_mobile TEXT NOT NULL,
  order_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  start_date DATE NOT NULL,
  duration_label TEXT NOT NULL,
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  end_date DATE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  payment_method payment_method NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'PENDING',
  status order_status NOT NULL DEFAULT 'CONFIRMED',
  source order_source NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_library_id ON orders(library_id);
CREATE INDEX idx_orders_seat_id ON orders(seat_id);
CREATE INDEX idx_orders_status ON orders(status);

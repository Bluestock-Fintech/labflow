CREATE TYPE order_seat_type AS ENUM ('FULL_TIME', 'HALF_TIME');
ALTER TABLE orders ADD COLUMN seat_type order_seat_type NOT NULL DEFAULT 'FULL_TIME';

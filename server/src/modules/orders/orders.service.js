import { pool } from '../../config/db.js';
import { ApiError } from '../../utils/apiResponse.js';
import { getLibraryForOwner } from '../libraries/libraries.service.js';
import { getFloorWithPricing } from '../floors/floors.service.js';

function computeAmount(pricing, durationLabel, durationDays, seatType = 'FULL_TIME') {
  const presets = seatType === 'HALF_TIME' ? pricing.half_presets : pricing.presets;
  const preset = presets.find((p) => p.label === durationLabel);
  if (preset) return preset.total;
  const perDay = seatType === 'HALF_TIME' ? pricing.per_chair_half_per_day_price : pricing.per_chair_per_day_price;
  return Math.round(perDay * durationDays * 100) / 100;
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function assertSeatOnFloor(client, floorId, seatId, libraryId) {
  const { rows } = await client.query(
    `SELECT s.id, s.status, s.seat_code, f.library_id
     FROM seats s JOIN floors f ON f.id = s.floor_id
     WHERE s.id = $1 AND s.floor_id = $2`,
    [seatId, floorId]
  );
  const seat = rows[0];
  if (!seat || seat.library_id !== libraryId) {
    throw new ApiError(404, 'NOT_FOUND', 'Seat not found on this floor.');
  }
  return seat;
}

export async function createOwnerOrder(libraryId, ownerId, payload) {
  await getLibraryForOwner(libraryId, ownerId);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const seat = await assertSeatOnFloor(client, payload.floor_id, payload.seat_id, libraryId);
    if (seat.status !== 'AVAILABLE') {
      throw new ApiError(409, 'SEAT_UNAVAILABLE', 'This seat is not available.');
    }

    const pricing = (await getFloorWithPricing(payload.floor_id)).pricing;
    const seatType = payload.seat_type ?? 'FULL_TIME';
    const amount = computeAmount(pricing, payload.duration_label, payload.duration_days, seatType);
    const endDate = addDays(payload.start_date, payload.duration_days);
    const paymentStatus = payload.payment_method === 'CASH' ? 'PAID' : 'PENDING';

    const { rows } = await client.query(
      `INSERT INTO orders (
         library_id, floor_id, seat_id, customer_name, customer_email, customer_mobile,
         start_date, duration_label, duration_days, end_date, amount, seat_type,
         payment_method, payment_status, status, source
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'CONFIRMED','OWNER')
       RETURNING *`,
      [libraryId, payload.floor_id, payload.seat_id, payload.customer_name,
       payload.customer_email || null, payload.customer_mobile, payload.start_date,
       payload.duration_label, payload.duration_days, endDate, amount, seatType,
       payload.payment_method, paymentStatus]
    );

    await client.query(`UPDATE seats SET status = 'BLOCKED' WHERE id = $1`, [seat.id]);

    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function createPublicOrder(library, payload) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const seat = await assertSeatOnFloor(client, payload.floor_id, payload.seat_id, library.id);
    if (seat.status !== 'AVAILABLE') {
      throw new ApiError(409, 'SEAT_UNAVAILABLE', 'This seat is no longer available.');
    }

    const pricing = (await getFloorWithPricing(payload.floor_id)).pricing;
    const seatType = payload.seat_type ?? 'FULL_TIME';
    const amount = computeAmount(pricing, payload.duration_label, payload.duration_days, seatType);
    const endDate = addDays(payload.start_date, payload.duration_days);

    // Seat stays AVAILABLE until the owner approves — there's no hold/lock
    // mechanism yet, so a second customer could pick the same seat in the
    // meantime. Acceptable for now; a real booking flow needs a short TTL hold.
    const { rows } = await client.query(
      `INSERT INTO orders (
         library_id, floor_id, seat_id, customer_name, customer_email, customer_mobile,
         start_date, duration_label, duration_days, end_date, amount, seat_type,
         payment_method, payment_status, status, source
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'PENDING','PENDING_APPROVAL','CUSTOMER')
       RETURNING *`,
      [library.id, payload.floor_id, payload.seat_id, payload.customer_name,
       payload.customer_email || null, payload.customer_mobile, payload.start_date,
       payload.duration_label, payload.duration_days, endDate, amount, seatType,
       payload.payment_method]
    );

    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function listOrders(libraryId, ownerId) {
  await getLibraryForOwner(libraryId, ownerId);
  const { rows } = await pool.query(
    `SELECT o.*, f.floor_name, s.seat_code
     FROM orders o
     JOIN floors f ON f.id = o.floor_id
     JOIN seats s ON s.id = o.seat_id
     WHERE o.library_id = $1
     ORDER BY o.created_at DESC`,
    [libraryId]
  );
  return rows;
}

async function getOrderForOwner(orderId, libraryId, ownerId) {
  await getLibraryForOwner(libraryId, ownerId);
  const { rows } = await pool.query(
    `SELECT * FROM orders WHERE id = $1 AND library_id = $2`,
    [orderId, libraryId]
  );
  const order = rows[0];
  if (!order) throw new ApiError(404, 'NOT_FOUND', 'Order not found.');
  return order;
}

export async function approveOrder(orderId, libraryId, ownerId) {
  const order = await getOrderForOwner(orderId, libraryId, ownerId);
  if (order.status !== 'PENDING_APPROVAL') {
    throw new ApiError(422, 'INVALID_STATE', 'Only pending orders can be approved.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: seatRows } = await client.query(
      `SELECT status FROM seats WHERE id = $1 FOR UPDATE`,
      [order.seat_id]
    );
    if (seatRows[0]?.status !== 'AVAILABLE') {
      throw new ApiError(409, 'SEAT_UNAVAILABLE', 'This seat was booked by someone else in the meantime.');
    }
    await client.query(`UPDATE seats SET status = 'BLOCKED' WHERE id = $1`, [order.seat_id]);
    const { rows } = await client.query(
      `UPDATE orders SET status = 'CONFIRMED', updated_at = now() WHERE id = $1 RETURNING *`,
      [orderId]
    );
    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function markOrderPaid(orderId, libraryId, ownerId) {
  const order = await getOrderForOwner(orderId, libraryId, ownerId);
  if (order.payment_status === 'PAID') {
    throw new ApiError(422, 'INVALID_STATE', 'This order is already marked as paid.');
  }
  const { rows } = await pool.query(
    `UPDATE orders SET payment_status = 'PAID', updated_at = now() WHERE id = $1 RETURNING *`,
    [orderId]
  );
  return rows[0];
}

export async function rejectOrder(orderId, libraryId, ownerId) {
  const order = await getOrderForOwner(orderId, libraryId, ownerId);
  if (order.status !== 'PENDING_APPROVAL') {
    throw new ApiError(422, 'INVALID_STATE', 'Only pending orders can be rejected.');
  }
  const { rows } = await pool.query(
    `UPDATE orders SET status = 'REJECTED', updated_at = now() WHERE id = $1 RETURNING *`,
    [orderId]
  );
  return rows[0];
}

// Renew: same customer, same seat, a fresh order picking up where the
// current one leaves off. Skips the "seat must be AVAILABLE" check since
// the seat is expected to already be BLOCKED by this customer's own order.
export async function renewOrder(previousOrderId, libraryId, ownerId, payload) {
  const previous = await getOrderForOwner(previousOrderId, libraryId, ownerId);
  if (previous.status !== 'CONFIRMED') {
    throw new ApiError(422, 'INVALID_STATE', 'Only a confirmed order can be renewed.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const pricing = (await getFloorWithPricing(previous.floor_id)).pricing;
    const seatType = payload.seat_type ?? previous.seat_type ?? 'FULL_TIME';
    const amount = computeAmount(pricing, payload.duration_label, payload.duration_days, seatType);
    const endDate = addDays(payload.start_date, payload.duration_days);
    const paymentStatus = payload.payment_method === 'CASH' ? 'PAID' : 'PENDING';

    const { rows } = await client.query(
      `INSERT INTO orders (
         library_id, floor_id, seat_id, customer_name, customer_email, customer_mobile,
         start_date, duration_label, duration_days, end_date, amount, seat_type,
         payment_method, payment_status, status, source
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'CONFIRMED','OWNER')
       RETURNING *`,
      [libraryId, previous.floor_id, previous.seat_id, previous.customer_name,
       previous.customer_email, previous.customer_mobile, payload.start_date,
       payload.duration_label, payload.duration_days, endDate, amount, seatType,
       payload.payment_method, paymentStatus]
    );

    await client.query(`UPDATE seats SET status = 'BLOCKED' WHERE id = $1`, [previous.seat_id]);

    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Leave: the customer is vacating early. Cancels the active order and frees
// the seat back to AVAILABLE so it can be booked by someone else.
export async function cancelOrder(orderId, libraryId, ownerId) {
  const order = await getOrderForOwner(orderId, libraryId, ownerId);
  if (order.status !== 'CONFIRMED') {
    throw new ApiError(422, 'INVALID_STATE', 'Only a confirmed order can be cancelled.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `UPDATE orders SET status = 'CANCELLED', updated_at = now() WHERE id = $1 RETURNING *`,
      [orderId]
    );
    await client.query(`UPDATE seats SET status = 'AVAILABLE' WHERE id = $1`, [order.seat_id]);
    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

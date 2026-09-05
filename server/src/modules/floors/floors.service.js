import { pool } from '../../config/db.js';
import { ApiError } from '../../utils/apiResponse.js';
import { getLibraryForOwner } from '../libraries/libraries.service.js';

const MAX_FLOORS_PER_LIBRARY = 10;

// Floor 3 -> 301, 302, ... 309, 310, ...; Floor 4 -> 401, 402, ...
function seatCode(floorNumber, seatIndex) {
  return `${floorNumber}${String(seatIndex).padStart(2, '0')}`;
}

export async function createFloor(libraryId, ownerId, payload) {
  await getLibraryForOwner(libraryId, ownerId);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: countRows } = await client.query(
      'SELECT COUNT(*)::int AS count FROM floors WHERE library_id = $1',
      [libraryId]
    );
    if (countRows[0].count >= MAX_FLOORS_PER_LIBRARY) {
      throw new ApiError(422, 'FLOOR_LIMIT_REACHED', `A library can have at most ${MAX_FLOORS_PER_LIBRARY} floors.`);
    }

    const { rows: maxRows } = await client.query(
      'SELECT COALESCE(MAX(floor_number), 0) + 1 AS next FROM floors WHERE library_id = $1',
      [libraryId]
    );
    const floorNumber = maxRows[0].next;

    const { rows: floorRows } = await client.query(
      `INSERT INTO floors (library_id, floor_number, floor_name, total_seats, full_time_price, half_time_price, per_day_price, layout_config, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [libraryId, floorNumber, payload.floor_name, payload.total_seats, payload.full_time_price,
       payload.half_time_price ?? Math.round((payload.full_time_price / 2) * 100) / 100,
       payload.per_day_price ?? null,
       payload.layout_config ? JSON.stringify(payload.layout_config) : null,
       payload.status ?? 'DRAFT']
    );
    const floor = floorRows[0];

    for (const f of payload.facilities) {
      await client.query(
        `INSERT INTO floor_facilities (floor_id, facility_id, custom_name, price)
         VALUES ($1, $2, $3, $4)`,
        [floor.id, f.facility_id ?? null, f.custom_name ?? null, f.price]
      );
    }

    for (let i = 1; i <= payload.total_seats; i += 1) {
      const code = seatCode(floorNumber, i);
      await client.query(
        `INSERT INTO seats (floor_id, seat_number, seat_code) VALUES ($1, $2, $3)`,
        [floor.id, String(i), code]
      );
    }

    await client.query('COMMIT');
    return getFloorWithPricing(floor.id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getFloorWithPricing(floorId) {
  const { rows: floorRows } = await pool.query('SELECT * FROM floors WHERE id = $1', [floorId]);
  const floor = floorRows[0];
  if (!floor) throw new ApiError(404, 'NOT_FOUND', 'Floor not found.');

  const { rows: facilities } = await pool.query(
    `SELECT ff.id, ff.facility_id, COALESCE(f.name, ff.custom_name) AS name, ff.price
     FROM floor_facilities ff LEFT JOIN facilities f ON f.id = ff.facility_id
     WHERE ff.floor_id = $1
     ORDER BY ff.created_at`,
    [floorId]
  );

  const facilitiesTotal = facilities.reduce((sum, f) => sum + Number(f.price), 0);
  const baseFullTime = Number(floor.full_time_price);
  const baseHalfTime = Number(floor.half_time_price);
  const perChairFullTime = baseFullTime + facilitiesTotal;
  const perChairHalfTime = baseHalfTime + facilitiesTotal;

  const basePerDay = floor.per_day_price != null
    ? Number(floor.per_day_price)
    : Math.round((baseFullTime / 30) * 100) / 100;
  const perChairPerDay = Math.round((basePerDay + facilitiesTotal / 30) * 100) / 100;
  const perChairHalfPerDay = Math.round(((baseHalfTime / 30) + facilitiesTotal / 30) * 100) / 100;

  const round2 = (n) => Math.round(n * 100) / 100;

  const { rows: seats } = await pool.query(
    `SELECT id, seat_number, seat_code, status FROM seats WHERE floor_id = $1 ORDER BY seat_number::int`,
    [floorId]
  );

  return {
    ...floor,
    facilities,
    seats,
    pricing: {
      base_full_time_price: baseFullTime,
      base_half_time_price: baseHalfTime,
      base_per_day_price: basePerDay,
      facilities_total: facilitiesTotal,
      per_chair_full_time_price: perChairFullTime,
      per_chair_half_time_price: perChairHalfTime,
      per_chair_per_day_price: perChairPerDay,
      per_chair_half_per_day_price: perChairHalfPerDay,
      presets: [
        { label: '15 Days', kind: 'DAYS', value: 15, total: round2(perChairPerDay * 15) },
        { label: '1 Month', kind: 'MONTHS', value: 1, total: round2(perChairFullTime * 1) },
        { label: '2 Months', kind: 'MONTHS', value: 2, total: round2(perChairFullTime * 2) },
        { label: '3 Months', kind: 'MONTHS', value: 3, total: round2(perChairFullTime * 3) },
      ],
      half_presets: [
        { label: '15 Days', kind: 'DAYS', value: 15, total: round2(perChairHalfPerDay * 15) },
        { label: '1 Month', kind: 'MONTHS', value: 1, total: round2(perChairHalfTime * 1) },
        { label: '2 Months', kind: 'MONTHS', value: 2, total: round2(perChairHalfTime * 2) },
        { label: '3 Months', kind: 'MONTHS', value: 3, total: round2(perChairHalfTime * 3) },
      ],
    },
  };
}

export function calculateCustomDuration(pricing, days) {
  return Math.round(pricing.per_chair_per_day_price * days * 100) / 100;
}

export async function listFloors(libraryId, ownerId) {
  await getLibraryForOwner(libraryId, ownerId);
  const { rows } = await pool.query(
    'SELECT id FROM floors WHERE library_id = $1 ORDER BY floor_number',
    [libraryId]
  );
  return Promise.all(rows.map((r) => getFloorWithPricing(r.id)));
}

async function assertFloorBelongsToOwner(floorId, libraryId, ownerId) {
  await getLibraryForOwner(libraryId, ownerId);
  const { rows } = await pool.query(
    'SELECT id FROM floors WHERE id = $1 AND library_id = $2',
    [floorId, libraryId]
  );
  if (!rows[0]) throw new ApiError(404, 'NOT_FOUND', 'Floor not found.');
}

export async function getFloor(floorId, libraryId, ownerId) {
  await assertFloorBelongsToOwner(floorId, libraryId, ownerId);
  return getFloorWithPricing(floorId);
}

export async function updateFloor(floorId, libraryId, ownerId, payload) {
  await assertFloorBelongsToOwner(floorId, libraryId, ownerId);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (payload.total_seats !== undefined) {
      const { rows } = await client.query(
        'SELECT floor_number, total_seats FROM floors WHERE id = $1 FOR UPDATE',
        [floorId]
      );
      const { floor_number: floorNumber, total_seats: currentTotal } = rows[0];
      const newTotal = payload.total_seats;

      if (newTotal > currentTotal) {
        for (let n = currentTotal + 1; n <= newTotal; n += 1) {
          await client.query(
            `INSERT INTO seats (floor_id, seat_number, seat_code) VALUES ($1, $2, $3)`,
            [floorId, String(n), seatCode(floorNumber, n)]
          );
        }
      } else if (newTotal < currentTotal) {
        // No bookings/subscriptions table exists yet, so removing the
        // highest-numbered seats is safe. Once bookings exist, this must
        // refuse to remove seats that have active/future bookings.
        await client.query(
          `DELETE FROM seats WHERE floor_id = $1 AND seat_number::int > $2`,
          [floorId, newTotal]
        );
      }
    }

    const fields = [];
    const values = [];
    let i = 1;

    if (payload.floor_name !== undefined) { fields.push(`floor_name = $${i++}`); values.push(payload.floor_name); }
    if (payload.total_seats !== undefined) { fields.push(`total_seats = $${i++}`); values.push(payload.total_seats); }
    if (payload.full_time_price !== undefined) { fields.push(`full_time_price = $${i++}`); values.push(payload.full_time_price); }
    if (payload.half_time_price !== undefined) { fields.push(`half_time_price = $${i++}`); values.push(payload.half_time_price); }
    if (payload.per_day_price !== undefined) { fields.push(`per_day_price = $${i++}`); values.push(payload.per_day_price); }
    if (payload.layout_config !== undefined) { fields.push(`layout_config = $${i++}`); values.push(JSON.stringify(payload.layout_config)); }
    if (payload.status !== undefined) { fields.push(`status = $${i++}`); values.push(payload.status); }
    fields.push(`updated_at = now()`);

    if (fields.length > 0) {
      values.push(floorId);
      await client.query(`UPDATE floors SET ${fields.join(', ')} WHERE id = $${i}`, values);
    }

    if (payload.facilities !== undefined) {
      await client.query('DELETE FROM floor_facilities WHERE floor_id = $1', [floorId]);
      for (const f of payload.facilities) {
        await client.query(
          `INSERT INTO floor_facilities (floor_id, facility_id, custom_name, price)
           VALUES ($1, $2, $3, $4)`,
          [floorId, f.facility_id ?? null, f.custom_name ?? null, f.price]
        );
      }
    }

    await client.query('COMMIT');
    return getFloorWithPricing(floorId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function deleteFloor(floorId, libraryId, ownerId) {
  await assertFloorBelongsToOwner(floorId, libraryId, ownerId);

  const { rows } = await pool.query('SELECT status FROM floors WHERE id = $1', [floorId]);
  if (rows[0].status !== 'DRAFT') {
    throw new ApiError(422, 'FLOOR_PUBLISHED', 'Published floors can\'t be deleted — change the status to Draft first.');
  }

  const { rows: orderRows } = await pool.query(
    'SELECT COUNT(*)::int AS count FROM orders WHERE floor_id = $1',
    [floorId]
  );
  if (orderRows[0].count > 0) {
    throw new ApiError(409, 'HAS_ORDERS', 'This floor has existing orders and can\'t be deleted.');
  }

  await pool.query('DELETE FROM floors WHERE id = $1', [floorId]);
}

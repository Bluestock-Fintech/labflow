import { pool } from '../../config/db.js';
import { ApiError } from '../../utils/apiResponse.js';
import { getFloorWithPricing } from '../floors/floors.service.js';

async function getPublishedLibraryBySlug(slug) {
  const { rows } = await pool.query(
    `SELECT id, name, slug, email, mobile, address, city, area, latitude, longitude, map_link, status
     FROM libraries WHERE slug = $1`,
    [slug]
  );
  const library = rows[0];
  if (!library) throw new ApiError(404, 'NOT_FOUND', 'Library not found.');
  return library;
}

export async function getPublicLibrary(slug) {
  const library = await getPublishedLibraryBySlug(slug);

  const { rows: facilities } = await pool.query(
    `SELECT lf.facility_id, f.name, lf.price
     FROM library_facilities lf JOIN facilities f ON f.id = lf.facility_id
     WHERE lf.library_id = $1`,
    [library.id]
  );

  const { rows: photos } = await pool.query(
    `SELECT id, storage_key, title, description, display_order
     FROM library_photos WHERE library_id = $1 AND status = 'ACTIVE'
     ORDER BY display_order`,
    [library.id]
  );

  const { rows: floorCountRows } = await pool.query(
    `SELECT COUNT(*)::int AS count, COALESCE(SUM(total_seats), 0)::int AS total_seats
     FROM floors WHERE library_id = $1 AND status = 'PUBLISHED'`,
    [library.id]
  );

  return {
    ...library,
    facilities,
    photos,
    floor_count: floorCountRows[0].count,
    total_seats: floorCountRows[0].total_seats,
  };
}

export async function listPublicLibraries() {
  const { rows } = await pool.query(
    `SELECT
       l.id, l.name, l.slug, l.city, l.area, l.mobile,
       COALESCE(f.floor_count, 0)::int AS floor_count,
       COALESCE(f.total_seats, 0)::int AS total_seats,
       COALESCE(f.available_seats, 0)::int AS available_seats,
       f.cheapest_full_time_price,
       p.storage_key AS cover_photo
     FROM libraries l
     LEFT JOIN LATERAL (
       SELECT
         COUNT(*)::int AS floor_count,
         COALESCE(SUM(fl.total_seats), 0)::int AS total_seats,
         COALESCE(SUM(fl.total_seats) FILTER (WHERE true), 0)::int AS available_seats,
         MIN(fl.full_time_price) AS cheapest_full_time_price
       FROM floors fl WHERE fl.library_id = l.id AND fl.status = 'PUBLISHED'
     ) f ON true
     LEFT JOIN LATERAL (
       SELECT storage_key FROM library_photos
       WHERE library_id = l.id AND status = 'ACTIVE'
       ORDER BY display_order LIMIT 1
     ) p ON true
     WHERE l.status = 'PUBLISHED'
     ORDER BY l.created_at DESC`
  );

  // available_seats needs an actual per-seat count, not seat totals — patch it
  // with a second lightweight query rather than a heavier correlated subquery.
  const { rows: seatCounts } = await pool.query(
    `SELECT fl.library_id, COUNT(*) FILTER (WHERE s.status = 'AVAILABLE')::int AS available
     FROM floors fl JOIN seats s ON s.floor_id = fl.id
     WHERE fl.status = 'PUBLISHED'
     GROUP BY fl.library_id`
  );
  const availableByLibrary = new Map(seatCounts.map((r) => [r.library_id, r.available]));

  return rows.map((r) => ({
    ...r,
    available_seats: availableByLibrary.get(r.id) ?? 0,
  }));
}

export async function getPublicLibraryFloors(slug) {
  const library = await getPublishedLibraryBySlug(slug);

  const { rows } = await pool.query(
    `SELECT id FROM floors WHERE library_id = $1 AND status = 'PUBLISHED' ORDER BY floor_number`,
    [library.id]
  );

  return Promise.all(rows.map((r) => getFloorWithPricing(r.id)));
}

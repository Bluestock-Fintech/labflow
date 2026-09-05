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

const EARTH_RADIUS_KM = 6371;

function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function listPublicLibraries({ lat, lng, pincode, city, radiusKm = 30 } = {}) {
  const params = [];
  let cityClause = '';
  if (city) {
    params.push(city);
    cityClause = `AND l.city ILIKE $${params.length}`;
  }

  const { rows } = await pool.query(
    `SELECT
       l.id, l.name, l.slug, l.city, l.area, l.mobile, l.pincode, l.latitude, l.longitude,
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
     WHERE l.status = 'PUBLISHED' ${cityClause}
     ORDER BY l.created_at DESC`,
    params
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

  let results = rows.map((r) => ({
    ...r,
    available_seats: availableByLibrary.get(r.id) ?? 0,
  }));

  if (lat != null && lng != null) {
    results = results
      .map((r) => ({
        ...r,
        distance_km:
          r.latitude != null && r.longitude != null
            ? Math.round(haversineKm(lat, lng, Number(r.latitude), Number(r.longitude)) * 10) / 10
            : null,
      }))
      .filter((r) => r.distance_km != null && r.distance_km <= radiusKm)
      .sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity));
  } else if (pincode) {
    // No precise geo-radius without a pincode/lat-lng lookup table — approximate
    // by matching the postal circle (first 3 digits of the 6-digit PIN).
    const circle = String(pincode).slice(0, 3);
    results = results.filter((r) => r.pincode && String(r.pincode).slice(0, 3) === circle);
  }

  return results;
}

export async function getPublicLibraryFloors(slug) {
  const library = await getPublishedLibraryBySlug(slug);

  const { rows } = await pool.query(
    `SELECT id FROM floors WHERE library_id = $1 AND status = 'PUBLISHED' ORDER BY floor_number`,
    [library.id]
  );

  return Promise.all(rows.map((r) => getFloorWithPricing(r.id)));
}

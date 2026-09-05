import { pool } from '../../config/db.js';
import { ApiError } from '../../utils/apiResponse.js';
import { generateUniqueSlug } from '../libraries/libraries.service.js';

const LIBRARY_STATUSES = ['DRAFT', 'PUBLISHED', 'SUSPENDED', 'CLOSED'];

export async function getOverview() {
  const [libraries, floors, seats, customers, owners] = await Promise.all([
    pool.query(`SELECT status, COUNT(*)::int AS count FROM libraries GROUP BY status`),
    pool.query(`SELECT COUNT(*)::int AS count FROM floors`),
    pool.query(`SELECT COUNT(*)::int AS count FROM seats`),
    pool.query(`SELECT COUNT(*)::int AS count FROM users WHERE role = 'CUSTOMER'`),
    pool.query(`SELECT COUNT(*)::int AS count FROM users WHERE role = 'LIBRARY_OWNER'`),
  ]);

  const byStatus = Object.fromEntries(LIBRARY_STATUSES.map((s) => [s, 0]));
  for (const row of libraries.rows) byStatus[row.status] = row.count;
  const totalLibraries = Object.values(byStatus).reduce((a, b) => a + b, 0);

  return {
    totalLibraries,
    librariesByStatus: byStatus,
    pendingApproval: byStatus.DRAFT,
    totalFloors: floors.rows[0].count,
    totalSeats: seats.rows[0].count,
    totalCustomers: customers.rows[0].count,
    totalOwners: owners.rows[0].count,
  };
}

export async function listLibraries({ status } = {}) {
  const params = [];
  let where = '';
  if (status) {
    params.push(status);
    where = `WHERE l.status = $${params.length}`;
  }

  const { rows } = await pool.query(
    `SELECT l.id, l.name, l.slug, l.email, l.mobile, l.address, l.city, l.area, l.pincode,
            l.is_claimed, l.status, l.created_at,
            u.id AS owner_id, u.name AS owner_name, u.email AS owner_email, u.mobile AS owner_mobile,
            COALESCE(f.floor_count, 0)::int AS floor_count,
            COALESCE(f.total_seats, 0)::int AS total_seats
     FROM libraries l
     LEFT JOIN users u ON u.id = l.owner_id
     LEFT JOIN (
       SELECT library_id, COUNT(*) AS floor_count, SUM(total_seats) AS total_seats
       FROM floors
       GROUP BY library_id
     ) f ON f.library_id = l.id
     ${where}
     ORDER BY l.created_at DESC`,
    params
  );
  return rows;
}

export async function getLibraryDetail(libraryId) {
  const { rows } = await pool.query(
    `SELECT l.*, u.name AS owner_name, u.email AS owner_email, u.mobile AS owner_mobile
     FROM libraries l JOIN users u ON u.id = l.owner_id
     WHERE l.id = $1`,
    [libraryId]
  );
  const library = rows[0];
  if (!library) throw new ApiError(404, 'NOT_FOUND', 'Library not found.');

  const { rows: floors } = await pool.query(
    `SELECT fl.*, COALESCE(s.seat_count, 0)::int AS seat_count
     FROM floors fl
     LEFT JOIN (
       SELECT floor_id, COUNT(*) AS seat_count FROM seats GROUP BY floor_id
     ) s ON s.floor_id = fl.id
     WHERE fl.library_id = $1
     ORDER BY fl.floor_number ASC`,
    [libraryId]
  );

  return { ...library, floors };
}

export async function updateLibraryStatus(libraryId, status) {
  if (!LIBRARY_STATUSES.includes(status)) {
    throw new ApiError(422, 'VALIDATION_ERROR', `status must be one of ${LIBRARY_STATUSES.join(', ')}`);
  }
  const { rows } = await pool.query(
    `UPDATE libraries SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
    [status, libraryId]
  );
  if (!rows[0]) throw new ApiError(404, 'NOT_FOUND', 'Library not found.');
  return rows[0];
}

export async function bulkImportLibraries(libraries) {
  const created = [];
  for (const lib of libraries) {
    const slug = await generateUniqueSlug(lib.name);
    const { rows } = await pool.query(
      `INSERT INTO libraries
         (owner_id, name, slug, email, mobile, address, city, area, pincode, map_link,
          latitude, longitude, status, is_claimed)
       VALUES (NULL, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'PUBLISHED', false)
       RETURNING *`,
      [
        lib.name, slug, lib.email ?? null, lib.mobile ?? null, lib.address ?? null,
        lib.city ?? null, lib.area ?? null, lib.pincode ?? null, lib.map_link ?? null,
        lib.latitude ?? null, lib.longitude ?? null,
      ]
    );
    created.push(rows[0]);
  }
  return created;
}

export async function listCustomers() {
  const { rows } = await pool.query(
    `SELECT id, name, email, mobile, status, created_at
     FROM users WHERE role = 'CUSTOMER'
     ORDER BY created_at DESC`
  );
  return rows;
}

import { pool } from '../../config/db.js';
import { slugify } from '../../utils/slugify.js';
import { ApiError } from '../../utils/apiResponse.js';

export async function generateUniqueSlug(base) {
  const root = slugify(base) || 'library';
  let slug = root;
  let attempt = 0;
  while (true) {
    const { rows } = await pool.query('SELECT 1 FROM libraries WHERE slug = $1', [slug]);
    if (rows.length === 0) return slug;
    attempt += 1;
    slug = `${root}-${attempt + 1}`;
  }
}

export async function createLibrary(ownerId, payload) {
  const slug = await generateUniqueSlug(payload.name);
  const { rows } = await pool.query(
    `INSERT INTO libraries (owner_id, name, slug, email, mobile, address, city, area)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [ownerId, payload.name, slug, payload.email ?? null, payload.mobile ?? null,
     payload.address ?? null, payload.city ?? null, payload.area ?? null]
  );
  return rows[0];
}

export async function listOwnerLibraries(ownerId) {
  const { rows } = await pool.query(
    `SELECT * FROM libraries WHERE owner_id = $1 ORDER BY created_at DESC`,
    [ownerId]
  );
  return rows;
}

export async function getLibraryForOwner(libraryId, ownerId) {
  const { rows } = await pool.query(
    `SELECT * FROM libraries WHERE id = $1 AND owner_id = $2`,
    [libraryId, ownerId]
  );
  const library = rows[0];
  if (!library) throw new ApiError(404, 'NOT_FOUND', 'Library not found.');
  return library;
}

export async function updateLibrary(libraryId, ownerId, payload) {
  await getLibraryForOwner(libraryId, ownerId);

  const fields = ['name', 'email', 'mobile', 'address', 'city', 'area', 'map_link'];
  const updates = fields.filter((f) => payload[f] !== undefined);
  if (updates.length === 0) return getLibraryForOwner(libraryId, ownerId);

  const setClause = updates.map((f, i) => `${f} = $${i + 1}`).join(', ');
  const values = updates.map((f) => (payload[f] === '' ? null : payload[f]));

  const { rows } = await pool.query(
    `UPDATE libraries SET ${setClause}, updated_at = now()
     WHERE id = $${updates.length + 1} AND owner_id = $${updates.length + 2}
     RETURNING *`,
    [...values, libraryId, ownerId]
  );
  return rows[0];
}

export async function getCommonFacilities(libraryId, ownerId) {
  await getLibraryForOwner(libraryId, ownerId);
  const { rows } = await pool.query(
    `SELECT lf.facility_id, f.name, lf.price
     FROM library_facilities lf JOIN facilities f ON f.id = lf.facility_id
     WHERE lf.library_id = $1`,
    [libraryId]
  );
  return rows;
}

export async function setCommonFacilities(libraryId, ownerId, facilities) {
  await getLibraryForOwner(libraryId, ownerId);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM library_facilities WHERE library_id = $1', [libraryId]);
    for (const f of facilities) {
      await client.query(
        `INSERT INTO library_facilities (library_id, facility_id, price) VALUES ($1, $2, $3)`,
        [libraryId, f.facility_id, f.price]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  const { rows } = await pool.query(
    `SELECT lf.facility_id, f.name, lf.price
     FROM library_facilities lf JOIN facilities f ON f.id = lf.facility_id
     WHERE lf.library_id = $1`,
    [libraryId]
  );
  return rows;
}

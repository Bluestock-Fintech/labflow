import { pool } from '../../config/db.js';

export async function getMyOrders(userId) {
  const { rows: userRows } = await pool.query('SELECT mobile FROM users WHERE id = $1', [userId]);
  const mobile = userRows[0]?.mobile;
  if (!mobile) return [];

  const { rows } = await pool.query(
    `SELECT o.*, f.floor_name, s.seat_code, l.name AS library_name, l.slug AS library_slug
     FROM orders o
     JOIN floors f ON f.id = o.floor_id
     JOIN seats s ON s.id = o.seat_id
     JOIN libraries l ON l.id = o.library_id
     WHERE o.customer_mobile = $1
     ORDER BY o.created_at DESC`,
    [mobile]
  );
  return rows;
}

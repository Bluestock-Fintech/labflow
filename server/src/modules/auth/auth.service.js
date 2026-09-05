import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../../config/db.js';
import { ApiError } from '../../utils/apiResponse.js';

const SALT_ROUNDS = 12;

export async function register({ name, email, mobile, password, role }) {
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, mobile, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, mobile, role, status, created_at`,
    [name, email, mobile, password_hash, role]
  );
  return rows[0];
}

export async function login({ email, password }) {
  const { rows } = await pool.query(
    `SELECT id, name, email, mobile, password_hash, role, status FROM users WHERE email = $1`,
    [email]
  );
  const user = rows[0];
  if (!user) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
  if (user.status !== 'ACTIVE') throw new ApiError(403, 'ACCOUNT_INACTIVE', 'This account is not active.');

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');

  const token = jwt.sign(
    { sub: user.id, role: user.role, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  delete user.password_hash;
  return { user, token };
}

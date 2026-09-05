import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/apiResponse.js';
import { pool } from '../../config/db.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM facilities ORDER BY name');
  ok(res, rows);
}));

export default router;

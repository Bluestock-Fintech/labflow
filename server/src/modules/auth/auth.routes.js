import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { created, ok } from '../../utils/apiResponse.js';
import { validate } from '../../middleware/validate.js';
import { registerSchema, loginSchema } from './auth.validation.js';
import * as authService from './auth.service.js';

const router = Router();

router.post('/register', validate(registerSchema), asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  created(res, user, 'Account created successfully');
}));

router.post('/login', validate(loginSchema), asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  ok(res, result, 'Logged in successfully');
}));

export default router;

import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/apiResponse.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import * as customersService from './customers.service.js';

const router = Router();

router.use(authenticate, authorize('CUSTOMER'));

router.get('/me/orders', asyncHandler(async (req, res) => {
  const orders = await customersService.getMyOrders(req.user.sub);
  ok(res, orders);
}));

export default router;

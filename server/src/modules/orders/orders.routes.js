import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { created, ok } from '../../utils/apiResponse.js';
import { validate } from '../../middleware/validate.js';
import { createOwnerOrderSchema, renewOrderSchema } from './orders.validation.js';
import * as ordersService from './orders.service.js';

const router = Router({ mergeParams: true });

router.post('/', validate(createOwnerOrderSchema), asyncHandler(async (req, res) => {
  const order = await ordersService.createOwnerOrder(req.params.libraryId, req.user.sub, req.body);
  created(res, order, 'Order created successfully');
}));

router.get('/', asyncHandler(async (req, res) => {
  const orders = await ordersService.listOrders(req.params.libraryId, req.user.sub);
  ok(res, orders);
}));

router.put('/:orderId/approve', asyncHandler(async (req, res) => {
  const order = await ordersService.approveOrder(req.params.orderId, req.params.libraryId, req.user.sub);
  ok(res, order, 'Order approved');
}));

router.put('/:orderId/reject', asyncHandler(async (req, res) => {
  const order = await ordersService.rejectOrder(req.params.orderId, req.params.libraryId, req.user.sub);
  ok(res, order, 'Order rejected');
}));

router.put('/:orderId/mark-paid', asyncHandler(async (req, res) => {
  const order = await ordersService.markOrderPaid(req.params.orderId, req.params.libraryId, req.user.sub);
  ok(res, order, 'Marked as paid');
}));

router.post('/:orderId/renew', validate(renewOrderSchema), asyncHandler(async (req, res) => {
  const order = await ordersService.renewOrder(req.params.orderId, req.params.libraryId, req.user.sub, req.body);
  created(res, order, 'Subscription renewed');
}));

router.put('/:orderId/cancel', asyncHandler(async (req, res) => {
  const order = await ordersService.cancelOrder(req.params.orderId, req.params.libraryId, req.user.sub);
  ok(res, order, 'Order cancelled — seat is available again');
}));

export default router;

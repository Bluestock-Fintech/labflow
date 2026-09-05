import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { created, ok } from '../../utils/apiResponse.js';
import { validate } from '../../middleware/validate.js';
import { createPublicOrderSchema } from '../orders/orders.validation.js';
import * as ordersService from '../orders/orders.service.js';
import * as publicService from './public.service.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const libraries = await publicService.listPublicLibraries();
  ok(res, libraries);
}));

router.get('/:slug', asyncHandler(async (req, res) => {
  const library = await publicService.getPublicLibrary(req.params.slug);
  ok(res, library);
}));

router.get('/:slug/floors', asyncHandler(async (req, res) => {
  const floors = await publicService.getPublicLibraryFloors(req.params.slug);
  ok(res, floors);
}));

router.post('/:slug/orders', validate(createPublicOrderSchema), asyncHandler(async (req, res) => {
  const library = await publicService.getPublicLibrary(req.params.slug);
  const order = await ordersService.createPublicOrder(library, req.body);
  created(res, order, 'Booking request submitted — the library will confirm shortly.');
}));

export default router;

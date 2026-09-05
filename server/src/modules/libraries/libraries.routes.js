import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { created, ok } from '../../utils/apiResponse.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { createLibrarySchema, updateLibrarySchema, commonFacilitiesSchema } from './libraries.validation.js';
import * as librariesService from './libraries.service.js';
import floorsRouter from '../floors/floors.routes.js';
import ordersRouter from '../orders/orders.routes.js';

const router = Router();

router.use(authenticate, authorize('LIBRARY_OWNER'));

router.post('/', validate(createLibrarySchema), asyncHandler(async (req, res) => {
  const library = await librariesService.createLibrary(req.user.sub, req.body);
  created(res, library, 'Library created successfully');
}));

router.get('/', asyncHandler(async (req, res) => {
  const libraries = await librariesService.listOwnerLibraries(req.user.sub);
  ok(res, libraries);
}));

router.get('/:libraryId', asyncHandler(async (req, res) => {
  const library = await librariesService.getLibraryForOwner(req.params.libraryId, req.user.sub);
  ok(res, library);
}));

router.put('/:libraryId', validate(updateLibrarySchema), asyncHandler(async (req, res) => {
  const library = await librariesService.updateLibrary(req.params.libraryId, req.user.sub, req.body);
  ok(res, library, 'Library updated');
}));

router.get('/:libraryId/facilities', asyncHandler(async (req, res) => {
  const facilities = await librariesService.getCommonFacilities(req.params.libraryId, req.user.sub);
  ok(res, facilities);
}));

router.put('/:libraryId/facilities', validate(commonFacilitiesSchema), asyncHandler(async (req, res) => {
  const facilities = await librariesService.setCommonFacilities(req.params.libraryId, req.user.sub, req.body.facilities);
  ok(res, facilities, 'Common facilities updated');
}));

router.use('/:libraryId/floors', floorsRouter);
router.use('/:libraryId/orders', ordersRouter);

export default router;

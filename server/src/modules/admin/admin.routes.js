import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/apiResponse.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { updateLibraryStatusSchema } from './admin.validation.js';
import * as adminService from './admin.service.js';

const router = Router();

router.use(authenticate, authorize('SUPER_ADMIN'));

router.get('/overview', asyncHandler(async (req, res) => {
  const overview = await adminService.getOverview();
  ok(res, overview);
}));

router.get('/libraries', asyncHandler(async (req, res) => {
  const libraries = await adminService.listLibraries({ status: req.query.status });
  ok(res, libraries);
}));

router.get('/libraries/:libraryId', asyncHandler(async (req, res) => {
  const library = await adminService.getLibraryDetail(req.params.libraryId);
  ok(res, library);
}));

router.patch('/libraries/:libraryId/status', validate(updateLibraryStatusSchema), asyncHandler(async (req, res) => {
  const library = await adminService.updateLibraryStatus(req.params.libraryId, req.body.status);
  ok(res, library, 'Library status updated');
}));

router.get('/customers', asyncHandler(async (req, res) => {
  const customers = await adminService.listCustomers();
  ok(res, customers);
}));

export default router;

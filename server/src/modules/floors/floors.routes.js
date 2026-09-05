import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { created, ok } from '../../utils/apiResponse.js';
import { validate } from '../../middleware/validate.js';
import { createFloorSchema, updateFloorSchema } from './floors.validation.js';
import * as floorsService from './floors.service.js';

const router = Router({ mergeParams: true });

router.post('/', validate(createFloorSchema), asyncHandler(async (req, res) => {
  const floor = await floorsService.createFloor(req.params.libraryId, req.user.sub, req.body);
  created(res, floor, 'Floor created successfully');
}));

router.get('/', asyncHandler(async (req, res) => {
  const floors = await floorsService.listFloors(req.params.libraryId, req.user.sub);
  ok(res, floors);
}));

router.get('/:floorId', asyncHandler(async (req, res) => {
  const floor = await floorsService.getFloor(req.params.floorId, req.params.libraryId, req.user.sub);
  ok(res, floor);
}));

router.put('/:floorId', validate(updateFloorSchema), asyncHandler(async (req, res) => {
  const floor = await floorsService.updateFloor(req.params.floorId, req.params.libraryId, req.user.sub, req.body);
  ok(res, floor, 'Floor updated successfully');
}));

router.delete('/:floorId', asyncHandler(async (req, res) => {
  await floorsService.deleteFloor(req.params.floorId, req.params.libraryId, req.user.sub);
  ok(res, null, 'Floor deleted successfully');
}));

export default router;

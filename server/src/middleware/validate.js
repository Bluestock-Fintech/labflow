import { ApiError } from '../utils/apiResponse.js';

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new ApiError(422, 'VALIDATION_ERROR', message);
  }
  req.body = result.data;
  next();
};

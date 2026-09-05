import { ApiError } from '../utils/apiResponse.js';

export function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
  }

  if (err?.code === '23505') {
    return res.status(409).json({
      success: false,
      error: { code: 'DUPLICATE', message: 'Record already exists.' },
    });
  }

  console.error(err);
  return res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong.' },
  });
}

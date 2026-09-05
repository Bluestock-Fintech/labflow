import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/apiResponse.js';

export function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError(401, 'UNAUTHENTICATED', 'Missing access token.');

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    throw new ApiError(401, 'UNAUTHENTICATED', 'Invalid or expired token.');
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      throw new ApiError(403, 'FORBIDDEN', 'You do not have permission to do this.');
    }
    next();
  };
}

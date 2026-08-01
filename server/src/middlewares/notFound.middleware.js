import { ApiError } from '../utils/ApiError.js';

export function notFoundHandler(req, res, next) {
  const error = new ApiError(404, `Route ${req.originalUrl} not found`);
  next(error);
}

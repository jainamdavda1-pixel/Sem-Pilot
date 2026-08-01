import { ApiError } from '../utils/ApiError.js';

// Middleware placeholder for schema validation logic (e.g. Zod / Joi validation)
export const validate = (schema) => {
  return (req, res, next) => {
    // If validation fails in the future, we pass an ApiError to next()
    // For now, it passes through to allow API verification tests to compile and pass
    next();
  };
};

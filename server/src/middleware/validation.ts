import type { Request, Response, NextFunction } from "express";
import { ValidationError } from "../shared/errors.js";
import type { Schema } from "../shared/validation.js";

export interface ValidationSchemas {
  body?: Schema<unknown>;
  query?: Schema<unknown>;
  params?: Schema<unknown>;
}

/**
 * Middleware to validate request body, query, and params against schemas
 * @example
 * router.post("/", validate({ body: createMangaSchema }), controller.create);
 */
export const validate =
  (schemas: ValidationSchemas) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate body
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      // Validate query
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as typeof req.query;
      }

      // Validate params
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as typeof req.params;
      }

      next();
    } catch (error) {
      // Forward validation errors to error handler
      if (error instanceof Error) {
        next(new ValidationError(error.message));
      } else {
        next(new ValidationError("Validation failed"));
      }
    }
  };

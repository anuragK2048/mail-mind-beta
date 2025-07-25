// src/middleware/validateRequest.ts
import { Request, Response, NextFunction, RequestHandler } from "express"; // Import RequestHandler
import { AnyZodObject, ZodError } from "zod";

interface ValidationSchemas {
  params?: AnyZodObject;
  body?: AnyZodObject;
  query?: AnyZodObject;
}

/**
 * A middleware factory that returns a validation middleware.
 * It uses Zod to validate request params, body, and query.
 *
 * @param schemas - An object containing Zod schemas for params, body, and/or query.
 * @returns An Express RequestHandler.
 */
export const validateRequest =
  (
    schemas: ValidationSchemas
  ): RequestHandler => // <-- FIX 1: Explicitly type the return
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      next(); // <-- FIX 2: Call next() and don't return it
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.flatten().fieldErrors;
        res.status(400).json({
          // <-- FIX 3: Don't return the result of res.json()
          message: "Validation failed",
          errors: formattedErrors,
        });
        return; // <-- FIX 4: Just return to exit the function
      }
      next(error);
    }
  };

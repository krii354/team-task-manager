import type { NextFunction, Request, Response } from "express";
import { ZodSchema, ZodError } from "zod";
import { ApiError } from "../utils/ApiError";

type Source = "body" | "query" | "params";

export function validate(schema: ZodSchema, source: Source = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const data = schema.parse(req[source]);
      // Reassign parsed (and possibly coerced) data back onto the request.
      (req as unknown as Record<Source, unknown>)[source] = data;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const fieldErrors = err.flatten().fieldErrors;
        return next(ApiError.unprocessable("Validation failed", fieldErrors));
      }
      next(err);
    }
  };
}

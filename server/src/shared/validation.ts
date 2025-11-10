import { ValidationError } from "./errors.js";

export interface Schema<T> {
  parse(data: unknown): T;
}

export const validateWithSchema = <T>(
  schema: Schema<T>,
  data: unknown,
): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Validation failed";
    throw new ValidationError(message);
  }
};

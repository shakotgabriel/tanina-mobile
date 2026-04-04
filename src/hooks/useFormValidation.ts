import { useState } from 'react';

export type ValidationSchema<T extends Record<string, unknown>> = {
  [K in keyof T]?: (value: T[K], values: T) => string | null;
};

type FieldErrors<T extends Record<string, unknown>> = Partial<Record<keyof T, string>>;
type FieldTouched<T extends Record<string, unknown>> = Partial<Record<keyof T, boolean>>;

export function useFormValidation<T extends Record<string, unknown>>(
  schema: ValidationSchema<T>,
  values: T
) {
  const [errors, setErrors] = useState<FieldErrors<T>>({});
  const [touched, setTouched] = useState<FieldTouched<T>>({});

  const validateField = <K extends keyof T>(field: K, value: T[K]) => {
    const validator = schema[field];
    const error = validator ? validator(value, values) : null;

    setErrors((prev) => {
      if (!error) {
        const next = { ...prev };
        delete next[field];
        return next;
      }

      return { ...prev, [field]: error };
    });

    return error;
  };

  const touchField = <K extends keyof T>(field: K) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const validateAll = () => {
    const nextErrors: FieldErrors<T> = {};

    (Object.keys(schema) as (keyof T)[]).forEach((field) => {
      const validator = schema[field];
      if (!validator) {
        return;
      }

      const error = validator(values[field], values);
      if (error) {
        nextErrors[field] = error;
      }
    });

    setErrors(nextErrors);

    const allTouched: FieldTouched<T> = {};
    (Object.keys(schema) as (keyof T)[]).forEach((field) => {
      allTouched[field] = true;
    });
    setTouched(allTouched);

    return Object.keys(nextErrors).length === 0;
  };

  const clearFieldError = <K extends keyof T>(field: K) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  return {
    errors,
    touched,
    validateField,
    validateAll,
    touchField,
    clearFieldError,
  };
}

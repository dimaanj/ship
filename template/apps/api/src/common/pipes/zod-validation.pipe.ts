import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ZodError, ZodType } from 'zod';

type ValidationErrors = Record<string, string | string[]>;

const formatZodError = (zodError: ZodError): ValidationErrors => {
  const errors: ValidationErrors = {};

  for (const issue of zodError.issues) {
    const key = issue.path.join('.') || 'global';

    if (!errors[key]) {
      errors[key] = [];
    }

    (errors[key] as string[]).push(issue.message);
  }

  return errors;
};

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  private schema?: ZodType;

  constructor(schema?: ZodType) {
    this.schema = schema;
  }

  transform(value: unknown, _metadata: ArgumentMetadata) {
    if (!this.schema) return value;

    const result = this.schema.safeParse(value);

    if (!result.success) {
      throw new BadRequestException({ errors: formatZodError(result.error) });
    }

    return result.data;
  }
}

export function ZodValidation(schema: ZodType) {
  return new ZodValidationPipe(schema);
}

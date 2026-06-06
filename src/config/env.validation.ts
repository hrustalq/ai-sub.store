import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { EnvironmentVariablesDto } from './dto/environment-variables.dto';

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariablesDto {
  const normalized = {
    DATABASE_URL: 'file:./dev.db',
    ...config,
  };

  const validated = plainToInstance(EnvironmentVariablesDto, normalized, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(
      `Environment validation failed:\n${errors
        .map((error) => Object.values(error.constraints ?? {}).join(', '))
        .join('\n')}`,
    );
  }

  return validated;
}

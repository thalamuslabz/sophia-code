import { z } from 'zod';

/**
 * Environment variables validation schema using Zod
 */
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Server configuration
  PORT: z.coerce.number().positive().default(3000),

  // Frontend URL for CORS
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),

  // Database configuration
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().positive().default(5432),
  DB_USERNAME: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('postgres'),
  DB_DATABASE: z.string().default('sophia'),

  // API key for authentication (simple auth for MVP)
  API_KEY: z.string().min(16).optional(),
});

/**
 * Validates environment variables against the schema
 */
export function validateEnv(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.format());
    throw new Error('Invalid environment variables');
  }

  return result.data;
}
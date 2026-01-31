import { z } from 'zod';

const envSchema = z.object({
  VITE_AI_PROVIDER: z.enum(['opencode', 'anthropic', 'openai', 'gemini']).default('opencode'),
  VITE_OPENCODE_API_KEY: z.string().optional(),
  VITE_ANTHROPIC_API_KEY: z.string().optional(),
  VITE_OPENAI_API_KEY: z.string().optional(),
  VITE_API_BASE_URL: z.string().url().optional(),
  VITE_API_KEY: z.string().optional(), // API key for backend authentication
});

// In a real app, we would validate import.meta.env
// For this scaffolding phase, we'll allow partials to prevent crash during setup if keys are missing
// but validation logic remains for when we go live.
export const env = envSchema.parse({
  VITE_AI_PROVIDER: import.meta.env.VITE_AI_PROVIDER || 'opencode',
  ...import.meta.env
});

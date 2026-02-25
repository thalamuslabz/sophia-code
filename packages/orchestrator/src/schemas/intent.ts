import { z } from 'zod';

export const intentStatusSchema = z.enum([
  'pending',
  'approved',
  'rejected',
  'in_progress',
  'completed',
  'failed'
]);

export const intentSchema = z.object({
  id: z.string().regex(/^int-\d{8}-\d{3}$/),
  createdAt: z.string().datetime(),
  project: z.string().min(1).max(100),
  author: z.string().min(1).max(100),
  description: z.string().min(10).max(2000),
  contractRef: z.string().optional(),
  contractHash: z.string().regex(/^sha256:[a-f0-9]{64}$/).optional(),
  acceptanceCriteria: z.array(z.string().min(1)).min(1),
  outOfScope: z.array(z.string()).default([]),
  status: intentStatusSchema,
  approvedAt: z.string().datetime().optional(),
  approvedBy: z.string().optional(),
  rejectedAt: z.string().datetime().optional(),
  rejectedReason: z.string().optional()
});

export type Intent = z.infer<typeof intentSchema>;
export type IntentStatus = z.infer<typeof intentStatusSchema>;

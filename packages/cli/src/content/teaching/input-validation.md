# Input Validation

## Why Validate?
User input is the primary attack vector for web applications.
Without validation, you're vulnerable to injection attacks, data corruption,
and unexpected behavior.

## The Pattern
1. **Define a schema** using Zod, Joi, or similar
2. **Validate at the boundary** — where data enters your system
3. **Reject invalid data** with clear error messages
4. **Never trust client-side validation** alone

## Code Example

**Wrong:**
```typescript
app.post('/users', (req, res) => {
  const { name, email } = req.body;
  db.insert({ name, email }); // No validation!
});
```

**Right:**
```typescript
import { z } from 'zod';

const CreateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

app.post('/users', (req, res) => {
  const result = CreateUserSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.issues });
  }
  db.insert(result.data);
});
```

## Related Policies
- SEC-004: Input validation recommended

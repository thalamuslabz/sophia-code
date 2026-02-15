# Architecture Decision Records

## When to Use
When making significant technical choices that affect the project long-term.

## ADR Template
```markdown
# ADR-NNN: Title

## Status
Proposed | Accepted | Deprecated | Superseded by ADR-NNN

## Context
What is the issue that we're seeing that is motivating this decision?

## Decision
What is the change that we're proposing?

## Consequences
What becomes easier or more difficult to do because of this change?
```

## Key Principles
- Record decisions when they're made, not after
- Include context about what alternatives were considered
- Link related ADRs together
- Never delete ADRs — supersede them
- Keep them in version control alongside code

## When to Write an ADR
- Choosing a framework or library
- Changing database technology
- Modifying API contracts
- Adopting a new pattern or convention
- Any decision you'd need to explain to a new team member

## Common Mistakes
- Not recording the "why" behind decisions
- Writing ADRs after the fact (context is lost)
- Making them too detailed (they're decisions, not docs)
- Not linking to relevant code or tickets

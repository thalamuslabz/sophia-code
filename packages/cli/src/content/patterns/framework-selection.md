# Framework Selection Guide

## When to Use
When starting a new project or evaluating framework changes.

## Decision Matrix
| Factor | Weight | Questions to Ask |
|--------|--------|-----------------|
| Team Experience | High | Does the team know this framework? |
| Community | High | Active maintenance? Good docs? |
| Performance | Medium | Meets requirements? |
| Ecosystem | Medium | Libraries, tools, integrations? |
| Learning Curve | Medium | How long to be productive? |
| Lock-in | Low | How hard to migrate away? |

## Key Principles
- Choose boring technology when possible
- Prefer frameworks with strong TypeScript support
- Check the maintenance pulse: recent commits, issue response time
- Evaluate the ecosystem, not just the framework
- Build a small proof-of-concept before committing

## Red Flags
- No release in 6+ months
- Single maintainer with no succession plan
- Breaking changes in minor versions
- Poor or outdated documentation
- Tiny community (hard to hire, find answers)

## Common Mistakes
- Choosing based on hype instead of fit
- Not considering the team's existing skills
- Ignoring operational complexity (deployment, monitoring)
- Picking the most feature-rich option when simpler would work
- Not evaluating migration cost from current stack

# Git Hygiene

## Clean History
A clean git history tells the story of your project.
Good commits make debugging, reviewing, and onboarding easier.

## Commit Best Practices
1. **Atomic commits**: One logical change per commit
2. **Meaningful messages**: Describe why, not just what
3. **No secrets**: Never commit passwords, keys, or tokens
4. **No binaries**: Use Git LFS for large files
5. **Clean staging**: Review what you're committing

## Branch Strategy
- main/master: Always deployable
- feature branches: One feature per branch
- Pull requests: All changes reviewed before merge

## Common Mistakes
- Committing node_modules or build artifacts
- Giant commits with unrelated changes
- Vague commit messages like "fix stuff"
- Force pushing to shared branches

## Related Policies
- REPO-001: No large binary files
- SEC-002: No .env files committed

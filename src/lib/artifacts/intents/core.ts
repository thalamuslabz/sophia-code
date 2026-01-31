import type { IntentArtifact } from '../types';

export const CodeReviewIntent: IntentArtifact = {
  id: 'intent.core.code-review',
  version: '1.0.0',
  kind: 'intent',
  name: 'Security Code Reviewer',
  description: 'Analyzes code diffs for security vulnerabilities and style violations.',
  author: 'System',
  tags: ['security', 'code-quality', 'review'],
  requiredContext: ['diff'],
  promptTemplate: `
You are a senior security engineer. Review the following code diff for:
1. OWASP Top 10 vulnerabilities
2. Secret leaks
3. Performance bottlenecks

Code Diff:
{{diff}}

Provide a structured analysis.
`
};

export const RefactorIntent: IntentArtifact = {
  id: 'intent.core.refactor',
  version: '1.0.0',
  kind: 'intent',
  name: 'Functional Refactor',
  description: 'Refactors a function to be more readable and functional.',
  author: 'System',
  tags: ['refactor', 'clean-code'],
  requiredContext: ['code_block'],
  promptTemplate: `
Refactor the following code to use functional patterns (immutability, pure functions).

Code:
{{code_block}}
`
};

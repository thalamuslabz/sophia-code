import { registry } from './registry';
import { CodeReviewIntent, RefactorIntent } from './intents/core';
import { PIIGate, SecretGate } from './gates/core';

// Bootstrap the registry
registry.register(CodeReviewIntent);
registry.register(RefactorIntent);
registry.register(PIIGate);
registry.register(SecretGate);

export { registry };

# State Management with Redux Toolkit

## Overview

This document outlines the state management implementation for the Sophia Code application using Redux Toolkit. The application has transitioned from using Zustand to Redux Toolkit to provide a more robust and scalable state management solution.

## Store Structure

The Redux store is organized into multiple slices that handle different aspects of the application state:

```
src/store/
├── slices/
│   ├── mission.slice.ts       # Mission status, logs, trust score
│   ├── governance.slice.ts    # Gates and gate management
│   ├── context.slice.ts       # Mission context, metrics, vendor info
│   └── ui.slice.ts            # UI state management
├── store.ts                   # Store configuration
├── hooks.ts                   # Typed hooks for React components
└── index.ts                   # Exports for easy imports
```

## Slices

### Mission Slice

The mission slice manages the core mission state, including:

- Mission status (idle, planning, executing, gated, completed, failed)
- Trust score
- Mission logs

Actions:
- `setStatus`: Update the mission status
- `addLog`: Add a new log entry with automatic ID and timestamp generation
- `setTrustScore`: Set the trust score to a specific value
- `adjustTrustScore`: Adjust the trust score by a delta (positive or negative)
- `resetMission`: Reset the mission to its initial state

### Governance Slice

The governance slice manages governance gates that can be triggered during mission execution:

- Active gates with status (pending, approved, rejected)
- Gate resolution management

Actions:
- `addGate`: Add a new governance gate
- `updateGateStatus`: Update the status of an existing gate
- `clearGates`: Clear all active gates

Thunk Actions:
- `triggerGate`: Complex action that adds a gate, updates mission status, adjusts trust score, and logs the gate trigger
- `resolveGate`: Complex action that resolves a gate (approved or rejected) and performs the appropriate state updates

### Context Slice

The context slice manages mission context information:

- Mission ID
- Vendor information
- Performance metrics (latency, cost)

Actions:
- `setMissionId`: Set the mission ID
- `setVendor`: Set the vendor information
- `updateMetrics`: Update specific metrics
- `setMetrics`: Set all metrics at once
- `resetContext`: Reset the context with a new mission ID

### UI Slice

The UI slice manages global UI state:

- Current view
- Loading indicators
- Active tabs
- Modal states
- Confirmation dialogs
- Selected artifact

Actions:
- `setCurrentView`: Switch between main views
- `setLoadingData`: Control loading state
- `setActiveTab`: Manage active tabs for different sections
- `toggleModal`: Control visibility of modals
- `showConfirmation`/`hideConfirmation`: Manage confirmation dialogs
- `setSelectedArtifactId`: Track selected artifact

## Integration with Components

Components interact with the Redux store using the typed hooks:

```typescript
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectMissionStatus, addLog } from '../store/slices/mission.slice';

function MyComponent() {
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectMissionStatus);

  const handleAction = () => {
    dispatch(addLog('Action performed', 'info'));
  };

  return (
    // Component JSX
  );
}
```

## GovernanceEngine Integration

The GovernanceEngine has been updated to work with Redux:

- It now accepts a `dispatch` function to dispatch actions
- Pattern detection dispatches the `triggerGate` thunk action
- Budget enforcement also uses the dispatch pattern

Example:

```typescript
// In a component
GovernanceEngine.analyzeStream(chunk, dispatch);

// In the engine
static analyzeStream(chunk: string, dispatch: AppDispatch): void {
  if (PATTERNS.PII.test(chunk)) {
    dispatch(triggerGate({
      id: `gate-${Date.now()}`,
      type: 'pii',
      severity: 'high',
      message: 'Potential PII detected in output stream.'
    }));
    return;
  }
  // Additional patterns...
}
```

## Testing

Each slice has comprehensive tests covering:

- Initial state
- Individual action creators
- Combined state transitions
- Thunk actions
- Error handling
- Edge cases

## Advantages of Redux Toolkit

1. **Immutable Updates**: Redux Toolkit uses Immer under the hood for immutable updates (similar to Zustand but with a more structured approach).

2. **DevTools Integration**: Built-in support for Redux DevTools enables time-travel debugging and state inspection.

3. **Middleware Support**: Easily add middleware for logging, async operations, and more.

4. **Structured State Management**: Clearly defined actions and reducers help maintain a clear data flow.

5. **TypeScript Integration**: Strong typing for state, actions, and selectors.

6. **Thunk Support**: Built-in support for thunks to handle complex async logic.

7. **Selectors**: Efficient memoized selectors for deriving data from state.

## Migration Notes

The migration from Zustand to Redux Toolkit was implemented as follows:

1. Set up the basic Redux store structure
2. Create individual slices matching the Zustand store organization
3. Update components to use Redux hooks instead of Zustand hooks
4. Modify the GovernanceEngine to work with Redux dispatch
5. Add comprehensive tests for the Redux implementation

The application now has a more scalable state management solution that provides better tooling support and a more structured approach to state updates.
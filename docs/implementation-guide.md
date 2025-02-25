# Implementation Guide: Context-Reducer Pattern

This guide will help you implement the new context-reducer pattern in your Manufacturing Terminal application.

## 1. Overview of Changes

We're transitioning from a simple context to a more robust context with reducer pattern, which offers several benefits:

- **Centralized State Management**: All application state in one place
- **Predictable State Updates**: Clear actions with specific intent
- **Better Debugging**: Track state changes through dispatched actions
- **Type Safety**: Improved TypeScript type checking for state and actions
- **Easier Testing**: Action-based approach makes testing simpler

## 2. Core Files to Replace

Start by replacing these core files:

1. **src/contexts/terminalContext.tsx**: Replace with the new version that includes the reducer pattern
2. **src/components/TerminalLogin.tsx**: Update to use the new context pattern
3. **src/components/TerminalInfo.tsx**: Refactor to access state through the reducer
4. **src/app/page.tsx**: Update main HomePage component
5. **src/app/login/page.tsx**: Update LoginPage component

## 3. Implementation Steps

### Step 1: Update the Terminal Context

1. Replace your current `terminalContext.tsx` with the new version:
   - The new context includes a reducer function that handles all state updates
   - Type-safe actions are defined for each state change
   - Helper action creators make it easier to dispatch common actions

### Step 2: Update Component Dependencies

For each component, update the imports to use the new context:

```typescript
// Old import
import { useTerminal } from "@/contexts/terminalContext";

// New import
import { useTerminal, terminalActions } from "@/contexts/terminalContext";
```

### Step 3: Update State Access

Update how components access and modify state:

```typescript
// Old way
const { terminalData, setTerminalData } = useTerminal();
// Access state:
terminalData.terminalName
// Update state:
setTerminalData({ ...terminalData, terminalState: "RUNNING" });

// New way
const { state, dispatch } = useTerminal();
// Access state:
state.terminal.terminalName
// Update state:
dispatch(terminalActions.setTerminalState("RUNNING"));
```

### Step 4: Test Components Individually

After updating each component, test it to ensure it still works with the new context pattern:

1. Test terminal login
2. Test job scanning
3. Test state transitions
4. Test user authentication

## 4. Key Benefits of the New Implementation

### 4.1 Improved State Structure

The new state structure is more comprehensive:

```typescript
type AppState = {
  terminal: TerminalData;
  currentJob: JobData | null;
  isLoadingJob: boolean;
  isLoadingUser: boolean;
  error: string | null;
};
```

This gives you:
- Loading states for UI feedback
- Error handling at the application level
- Clear separation between terminal data and job data

### 4.2 Type-Safe Actions

All state changes go through typed actions:

```typescript
type ActionType =
  | { type: "SET_TERMINAL_DATA"; payload: Partial<TerminalData> }
  | { type: "SET_TERMINAL_STATE"; payload: TerminalData["terminalState"] }
  | { type: "SET_CURRENT_JOB"; payload: JobData | null }
  // ... more actions
```

This prevents accidental state corruption and makes state changes predictable.

### 4.3 Helper Action Creators

The new implementation includes helper functions to create actions:

```typescript
// Instead of writing this:
dispatch({ type: "SET_TERMINAL_STATE", payload: "RUNNING" });

// You can write this:
dispatch(terminalActions.setTerminalState("RUNNING"));
```

This improves code readability and provides better type checking.

## 5. Testing Your Implementation

After implementing all the changes, test the full workflow:

1. Terminal login
2. Job scanning
3. User authentication
4. State transitions (IDLE → SETUP → RUNNING → etc.)
5. Handling error states

Make sure state persists correctly in localStorage and is restored when the page reloads.

## 6. Next Steps

Once the basic implementation is working, consider these enhancements:

1. **Error Handling**: Implement toast notifications for errors stored in state
2. **Loading States**: Add loading indicators based on loading states
3. **Logging**: Add logging of state changes for debugging
4. **Persistence**: Enhance localStorage handling for more state properties
5. **Security**: Implement token-based authentication for API calls

## 7. Troubleshooting

If you encounter issues:

1. **Check the Console**: Look for errors in the browser console
2. **Verify Actions**: Make sure the correct actions are being dispatched
3. **Check State Structure**: Verify that state is structured as expected
4. **localStorage Inspection**: Check browser storage to ensure data is saved correctly
5. **Component Re-renders**: Make sure components are re-rendering when state changes

Good luck with your implementation!

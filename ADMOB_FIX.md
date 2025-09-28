# AdMob Initialization Crash Fix

## Problem
TestFlight builds were crashing on app startup with "React: 0x103a9c000 + 456868" error after AdMob integration.

## Root Cause
The original AdMob initialization code in `app/_layout.tsx` was:
1. Initializing AdMob too early in the React component lifecycle
2. Not properly handling async initialization failures
3. Rendering ad components before the SDK was fully initialized

## Solution
Created a proper AdMob context (`contexts/AdMobContext.tsx`) that:

### 1. Safe Initialization Timing
- Delays AdMob initialization by 500ms to ensure React Native is fully ready
- Uses proper React patterns with useCallback and useEffect
- Skips initialization in test environments

### 2. State Management
- Provides `isInitialized`, `isLoading`, and `error` states
- Prevents duplicate initialization attempts
- Handles both tracking permission and SDK initialization failures gracefully

### 3. Error Handling
- Wraps all AdMob operations in try-catch blocks
- Never throws errors that could crash the app
- Provides error information for debugging in development

### 4. Component Safety
- Ad components (GAMBannerAd) only render when `isInitialized === true`
- Shows debug information in development builds
- Falls back gracefully when AdMob fails

## Files Changed
- `contexts/AdMobContext.tsx` (new) - AdMob state management
- `app/_layout.tsx` - Removed direct initialization, added AdMobProvider
- `app/index.tsx` - Conditional ad rendering based on initialization state

## Testing
- TypeScript compilation passes
- No runtime errors in development
- Proper error boundaries prevent crashes

## Usage
```tsx
import { useAdMob } from '@/contexts/AdMobContext';

function MyComponent() {
  const { isInitialized, isLoading, error } = useAdMob();
  
  return (
    <>
      {isInitialized && !error && (
        <GAMBannerAd unitId="..." sizes={[...]} />
      )}
    </>
  );
}
```
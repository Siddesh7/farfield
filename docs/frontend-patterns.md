# Frontend Standardization Patterns

**Rule**: When we create a better pattern, we refactor ALL existing code to use it immediately. No mixing patterns.

## 🎯 **API State Management (STANDARDIZED)**

### ✅ ALWAYS Use This Pattern

```typescript
import { useApiState, useUserProfileApi } from "@/lib/hooks/use-api-state";

function MyComponent() {
  // For simple API calls
  const { data, loading, error, execute } = useApiState();

  // For pre-configured user profile operations
  const { profile, profileLoading, profileError, fetchProfile, updateProfile } =
    useUserProfileApi();

  const handleFetchData = () => {
    execute(() => fetch("/api/some-endpoint").then((r) => r.json()));
  };

  return (
    <LoadingState loading={loading}>
      <ErrorBoundary error={error}>{/* Your content */}</ErrorBoundary>
    </LoadingState>
  );
}
```

### ❌ NEVER Use These Anti-Patterns

```typescript
// ❌ DON'T: Manual state management for API calls
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

// ❌ DON'T: Manual try-catch everywhere
try {
  setLoading(true);
  const response = await fetch("/api/endpoint");
  const data = await response.json();
  setData(data);
} catch (err) {
  setError(err.message);
} finally {
  setLoading(false);
}

// ❌ DON'T: Mixed loading/error UI patterns
{
  loading && <div>Loading...</div>;
}
{
  error && <div className="text-red-500">{error}</div>;
}
```

## 🔄 **Loading States (STANDARDIZED)**

### Standard Loading Components

```typescript
import { LoadingSpinner, LoadingState } from "@/components/ui/loading-spinner";

// Simple spinner
<LoadingSpinner size="md" color="primary" />

// Wrapper component that shows loading state
<LoadingState loading={isLoading} text="Fetching data...">
  <YourContent />
</LoadingState>

// Page-level loading
if (!ready) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner className="mx-auto mb-4" />
        <p>Loading Privy...</p>
      </div>
    </div>
  );
}
```

### Loading Sizes and Colors

```typescript
// Sizes: "sm" | "md" | "lg"
<LoadingSpinner size="sm" />   // 16px
<LoadingSpinner size="md" />   // 32px
<LoadingSpinner size="lg" />   // 48px

// Colors: "primary" | "secondary" | "white"
<LoadingSpinner color="primary" />    // Blue
<LoadingSpinner color="secondary" />  // Gray
<LoadingSpinner color="white" />      // White (for dark backgrounds)
```

## ❌ **Error Handling (STANDARDIZED)**

### Standard Error Components

```typescript
import { ErrorDisplay, ErrorBoundary } from "@/components/ui/error-display";

// Inline error display
<ErrorDisplay
  error={error}
  onRetry={retryFunction}
  onDismiss={clearError}
  variant="banner" // "banner" | "card" | "inline"
/>

// Error boundary wrapper
<ErrorBoundary
  error={error}
  onRetry={retryFunction}
  onClear={clearError}
>
  <YourContent />
</ErrorBoundary>

// With custom fallback
<ErrorBoundary
  error={error}
  fallback={<CustomErrorComponent />}
>
  <YourContent />
</ErrorBoundary>
```

## 👤 **Profile Components (STANDARDIZED)**

### Reusable Profile Cards

```typescript
import { ProfileCard, CompactProfileCard, PublicProfileCard } from "@/components/ui/profile-card";

// Full profile card
<ProfileCard
  user={user}
  variant="full"
  showWallet={true}
  showEmail={true}
/>

// Compact version
<CompactProfileCard user={user} />

// Public version (no sensitive data)
<PublicProfileCard user={user} />
```

### ❌ DON'T Duplicate Profile JSX

```typescript
// ❌ DON'T: Repeat profile card structure
<div className="flex flex-col items-center gap-2 rounded-xl bg-gray-50...">
  <div className="w-16 h-16 rounded-full...">
    {/* 30+ lines of duplicated JSX */}
  </div>
</div>

// ✅ DO: Use reusable component
<ProfileCard user={user} />
```

## 🔧 **Hook Patterns (STANDARDIZED)**

### Custom Hook Structure

```typescript
// ✅ Standard hook pattern
export function useMyFeature() {
  const [state, setState] = useState(initialState);

  const someAction = useCallback(() => {
    // Action logic
  }, []);

  const anotherAction = useCallback((param: string) => {
    // Action logic with parameters
  }, []);

  return {
    // State (read-only)
    data: state.data,
    loading: state.loading,
    error: state.error,

    // Actions
    someAction,
    anotherAction,

    // Utilities
    reset: () => setState(initialState),
  };
}
```

### Hook Naming Conventions

```typescript
// ✅ State hooks
useApiState();
useUserProfileApi();
useFormState();

// ✅ Action hooks
useAuthenticatedAPI();
useFileUpload();

// ✅ Utility hooks
useDebounce();
useLocalStorage();
```

## 📱 **Component Patterns (STANDARDIZED)**

### Component File Structure

```typescript
// ✅ Standard component structure
interface ComponentProps {
  // Required props first
  data: SomeType;

  // Optional props with defaults
  variant?: "primary" | "secondary";
  className?: string;
  children?: React.ReactNode;
}

export function MyComponent({
  data,
  variant = "primary",
  className,
  children,
}: ComponentProps) {
  // Hooks at the top
  const { loading, error } = useApiState();

  // Event handlers
  const handleClick = useCallback(() => {
    // Handler logic
  }, []);

  // Early returns for loading/error states
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;

  // Main render
  return <div className={cn("base-classes", className)}>{children}</div>;
}

// Named export
export { MyComponent };
```

### Component Variants Pattern

```typescript
// ✅ Pre-configured variants for common use cases
export function PrimaryButton(props: Omit<ButtonProps, "variant">) {
  return <Button {...props} variant="primary" />;
}

export function SecondaryButton(props: Omit<ButtonProps, "variant">) {
  return <Button {...props} variant="secondary" />;
}
```

## 🎨 **Styling Patterns (STANDARDIZED)**

### Class Name Conventions

```typescript
import { cn } from "@/lib/utils";

// ✅ Use cn() for conditional classes
<div
  className={cn(
    "base-classes",
    variant === "primary" && "primary-classes",
    isActive && "active-classes",
    className
  )}
/>;

// ✅ Define variant mappings
const variantClasses = {
  primary: "bg-blue-500 text-white",
  secondary: "bg-gray-500 text-white",
  outline: "border border-gray-300 text-gray-700",
};

<div className={cn("base-classes", variantClasses[variant])} />;
```

## 🗂️ **File Organization (STANDARDIZED)**

### Directory Structure

```
components/
  ui/              # Reusable UI components
    button.tsx
    profile-card.tsx
    loading-spinner.tsx
    error-display.tsx
  layout/          # Layout components
    navigation.tsx
    header.tsx
    footer.tsx

lib/
  hooks/           # Custom hooks
    use-api-state.ts
    use-authenticated-fetch.ts
  utils/           # Utility functions
    cn.ts
    formatting.ts

modules/           # Feature-specific components
  login/
    login-page.tsx
    index.ts
  profile/
    profile-page.tsx
    index.ts
```

### Import/Export Patterns

```typescript
// ✅ Named exports for components
export { MyComponent };

// ✅ Barrel exports for modules
// modules/login/index.ts
export { LoginPage } from "./login-page";

// ✅ Import patterns
import { MyComponent } from "@/components/ui/my-component";
import { useApiState } from "@/lib/hooks/use-api-state";
```

## 🔄 **State Management (STANDARDIZED)**

### Global State Pattern

```typescript
// ✅ Context for global state
interface GlobalContextType {
  activeModule: ModulesType;
  setActiveModule: (module: ModulesType) => void;
}

export const GlobalContext = createContext<GlobalContextType | undefined>(
  undefined
);

export function useGlobalContext() {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error(
      "useGlobalContext must be used within GlobalContextProvider"
    );
  }
  return context;
}
```

### Local State Pattern

```typescript
// ✅ Local component state
function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

  // Use custom hooks for complex state
  const { data, loading, error } = useApiState();

  return (
    <LoadingState loading={loading}>
      <ErrorBoundary error={error}>{/* Component content */}</ErrorBoundary>
    </LoadingState>
  );
}
```

## 🚫 **Deprecated Frontend Patterns**

These patterns are deprecated and should not be used:

- Manual loading state management - Use `useApiState()` instead
- Duplicated profile card JSX - Use `<ProfileCard />` component
- Custom loading spinners - Use `<LoadingSpinner />` component
- Manual error handling UI - Use `<ErrorDisplay />` components
- Inline styling - Use Tailwind classes with `cn()` utility
- Default exports for components - Use named exports
- Mixed error/loading patterns - Use standardized components

## 🎯 **Benefits of Frontend Standardization**

1. **Consistency** - All components follow same patterns
2. **Maintainability** - Easy to understand and modify
3. **Reusability** - Components work across different contexts
4. **Developer Experience** - Clear patterns, less cognitive load
5. **Performance** - Optimized hooks and state management
6. **Type Safety** - Full TypeScript support throughout
7. **Testing** - Predictable patterns make testing easier

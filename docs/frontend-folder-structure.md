# Frontend Folder Structure Guide

## 📁 Recommended Structure

```
farfield/
├── app/                          # Next.js App Router (Pages & API)
│   ├── (auth)/                   # Route groups for auth pages
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (dashboard)/              # Route groups for main app
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   ├── api/                      # Backend API routes
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   └── test/                     # Development/testing pages
│       └── page.tsx
│
├── components/                   # All React components
│   ├── ui/                       # Base/primitive components (shadcn)
│   │   ├── button.tsx
│   │   ├── loading-spinner.tsx
│   │   ├── error-display.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── index.ts              # Barrel exports
│   ├── common/                   # Shared business components
│   │   ├── profile-card.tsx
│   │   ├── user-avatar.tsx
│   │   ├── wallet-display.tsx
│   │   └── index.ts
│   ├── forms/                    # Form-specific components
│   │   ├── login-form.tsx
│   │   ├── profile-form.tsx
│   │   ├── wallet-form.tsx
│   │   └── index.ts
│   ├── layout/                   # Layout-specific components
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   ├── sidebar.tsx
│   │   ├── bottom-navigation.tsx
│   │   └── index.ts
│   └── icons/                    # Icon components
│       ├── components/
│       │   ├── home-icon.tsx
│       │   ├── user-icon.tsx
│       │   └── plus-icon.tsx
│       ├── icon-wrapper.tsx
│       ├── icon.types.ts
│       └── index.ts
│
├── lib/                          # Utilities, hooks, and configurations
│   ├── hooks/                    # Custom React hooks
│   │   ├── use-api-state.ts
│   │   ├── use-authenticated-fetch.ts
│   │   ├── use-local-storage.ts
│   │   └── index.ts
│   ├── utils/                    # Utility functions
│   │   ├── api-response.ts
│   │   ├── validation.ts
│   │   ├── formatting.ts
│   │   └── index.ts
│   ├── constants/                # Application constants
│   │   ├── api-messages.ts
│   │   ├── routes.ts
│   │   ├── app-config.ts
│   │   └── index.ts
│   ├── auth/                     # Authentication utilities
│   │   ├── privy-auth.ts
│   │   └── index.ts
│   ├── types/                    # TypeScript type definitions
│   │   ├── api.ts
│   │   ├── user.ts
│   │   ├── product.ts
│   │   └── index.ts
│   └── utils.ts                  # General utilities (cn, etc.)
│
├── modules/                      # Feature-based modules (deprecated - migrate to app/)
│   ├── auth/                     # Authentication module
│   │   ├── components/
│   │   ├── hooks/
│   │   └── index.ts
│   └── profile/                  # Profile module
│       ├── components/
│       ├── hooks/
│       └── index.ts
│
├── providers/                    # React context providers
│   ├── auth-provider.tsx
│   ├── theme-provider.tsx
│   ├── global-provider.tsx
│   └── provider.tsx              # Main provider wrapper
│
├── types/                        # Global TypeScript types
│   ├── global.ts
│   ├── env.ts
│   └── index.ts
│
├── styles/                       # Additional styling
│   ├── components.css            # Component-specific styles
│   └── utilities.css             # Utility classes
│
└── public/                       # Static assets
    ├── icons/
    ├── images/
    └── favicon.ico
```

## 📋 Folder Structure Rules

### 1. **Components Organization**

#### `/components/ui/` - Base Components

- **Purpose**: Primitive, reusable UI components (shadcn/ui style)
- **Dependencies**: Should not depend on business logic
- **Examples**: Button, Input, Card, Dialog, Loading Spinner
- **Naming**: kebab-case files, PascalCase exports

```typescript
// ✅ Good: components/ui/loading-spinner.tsx
export const LoadingSpinner = ({ size = "md" }: LoadingSpinnerProps) => {
  // Primitive loading component
};
```

#### `/components/common/` - Business Components

- **Purpose**: Shared components with business logic
- **Dependencies**: Can use ui components and hooks
- **Examples**: ProfileCard, UserAvatar, WalletDisplay
- **Naming**: kebab-case files, descriptive names

```typescript
// ✅ Good: components/common/profile-card.tsx
export const ProfileCard = ({ user, variant }: ProfileCardProps) => {
  // Business logic component using ui components
};
```

#### `/components/forms/` - Form Components

- **Purpose**: Form-specific components and validation
- **Dependencies**: Can use ui components, validation hooks
- **Examples**: LoginForm, ProfileForm, WalletForm

#### `/components/layout/` - Layout Components

- **Purpose**: Layout and navigation components
- **Examples**: Header, Footer, Sidebar, BottomNavigation

### 2. **Lib Organization**

#### `/lib/hooks/` - Custom Hooks

- **Purpose**: Reusable React hooks
- **Naming**: use-\* pattern
- **Examples**: useApiState, useAuthenticatedFetch

```typescript
// ✅ Good: lib/hooks/use-api-state.ts
export const useApiState = <T>() => {
  // Custom hook implementation
};
```

#### `/lib/utils/` - Utility Functions

- **Purpose**: Pure functions, no React dependencies
- **Examples**: API helpers, validation, formatting

#### `/lib/types/` - Type Definitions

- **Purpose**: Shared TypeScript types
- **Organization**: By feature/domain

### 3. **App Router Organization**

#### Route Groups

Use Next.js route groups for better organization:

```
app/
├── (auth)/           # Authentication pages
│   ├── login/
│   └── register/
├── (dashboard)/      # Main application pages
│   ├── profile/
│   └── settings/
└── (admin)/          # Admin-only pages
    └── users/
```

### 4. **Migration Strategy**

#### Current → Recommended

```typescript
// Current: modules/login/login-page.tsx
// Migrate to: app/(auth)/login/page.tsx

// Current: components/bottom-navigation.tsx
// Move to: components/layout/bottom-navigation.tsx

// Current: common/icons/
// Move to: components/icons/
```

## 🎯 Implementation Guidelines

### 1. **Barrel Exports**

Create index.ts files for clean imports:

```typescript
// components/ui/index.ts
export { Button } from "./button";
export { LoadingSpinner } from "./loading-spinner";
export { ErrorDisplay } from "./error-display";

// Usage
import { Button, LoadingSpinner } from "@/components/ui";
```

### 2. **Consistent Naming**

- **Files**: kebab-case (profile-card.tsx)
- **Components**: PascalCase (ProfileCard)
- **Hooks**: camelCase with use prefix (useApiState)
- **Types**: PascalCase (UserProfile)

### 3. **Import Ordering**

```typescript
// 1. React imports
import { useState, useCallback } from "react";

// 2. Third-party imports
import { usePrivy } from "@privy-io/react-auth";

// 3. Internal imports (absolute paths)
import { Button } from "@/components/ui";
import { useApiState } from "@/lib/hooks";
import type { User } from "@/lib/types";

// 4. Relative imports
import { ProfileCard } from "./profile-card";
```

### 4. **File Templates**

#### Component Template

```typescript
import { ComponentPropsWithoutRef, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ComponentNameProps extends ComponentPropsWithoutRef<"div"> {
  variant?: "default" | "secondary";
}

const ComponentName = forwardRef<HTMLDivElement, ComponentNameProps>(
  ({ variant = "default", className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("base-classes", className)} {...props}>
        {children}
      </div>
    );
  }
);
ComponentName.displayName = "ComponentName";

export { ComponentName };
export type { ComponentNameProps };
```

#### Hook Template

```typescript
import { useState, useCallback } from "react";

export const useHookName = <T>() => {
  const [state, setState] = useState<T | null>(null);

  const action = useCallback(() => {
    // Hook logic
  }, []);

  return {
    state,
    action,
  };
};
```

## 🚀 Benefits of This Structure

1. **Scalability**: Clear separation of concerns
2. **Maintainability**: Easy to find and modify code
3. **Reusability**: Components organized by reuse level
4. **Type Safety**: Centralized type definitions
5. **Developer Experience**: Predictable file locations
6. **Performance**: Tree-shaking friendly barrel exports

## 📦 Migration Steps

1. **Phase 1**: Move components to new structure
2. **Phase 2**: Migrate modules to app router
3. **Phase 3**: Consolidate types and utilities
4. **Phase 4**: Add barrel exports and clean imports

This structure supports the standardized patterns we've established while providing room for growth and maintaining excellent developer experience.

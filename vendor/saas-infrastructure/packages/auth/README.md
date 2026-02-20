# @saas-infra/auth

Authentication package with Supabase integration, 2FA support, role management, and protected routes.

## Features

- **User Authentication** — Sign up, sign in, sign out, password reset, magic links
- **2FA Support** — Email OTP, TOTP (authenticator apps), SMS, backup codes
- **Role Management** — User roles (user, admin, owner, tester) with role-based access
- **Protected Routes** — Route guards for authenticated and public-only pages
- **User Impersonation** — Admin ability to impersonate users
- **Login Tracking** — Track user login events
- **Dependency Injection** — No hardcoded Supabase client; uses SupabaseProvider context

## Installation

```bash
pnpm add @saas-infra/auth
```

## Setup

### 1. Wrap your app with SupabaseProvider

The auth package uses dependency injection for the Supabase client. You must provide your Supabase client via the `SupabaseProvider`:

```tsx
import { SupabaseProvider, AuthProvider } from "@saas-infra/auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function App() {
  return (
    <SupabaseProvider value={supabase}>
      <AuthProvider>
        {/* Your app */}
      </AuthProvider>
    </SupabaseProvider>
  );
}
```

### 2. Add RoleContextProvider (optional)

If you need role-based UI:

```tsx
import { RoleContextProvider } from "@saas-infra/auth";

<AuthProvider>
  <RoleContextProvider>
    {/* Your app */}
  </RoleContextProvider>
</AuthProvider>
```

## Usage

### Basic Authentication

```tsx
import { useAuth } from "@saas-infra/auth";

function LoginPage() {
  const { signIn, isLoading, user } = useAuth();

  const handleLogin = async (email: string, password: string) => {
    const { error } = await signIn(email, password);
    if (error) {
      console.error("Login failed:", error);
    }
  };

  if (user) {
    return <div>Welcome, {user.email}!</div>;
  }

  return <LoginForm onSubmit={handleLogin} />;
}
```

### Protected Routes

```tsx
import { ProtectedRoute, PublicOnlyRoute } from "@saas-infra/auth";

function AppRoutes() {
  return (
    <Routes>
      {/* Public only - redirects authenticated users to /dashboard */}
      <Route path="/login" element={
        <PublicOnlyRoute>
          <LoginPage />
        </PublicOnlyRoute>
      } />

      {/* Protected - requires authentication */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />

      {/* Admin only */}
      <Route path="/admin" element={
        <ProtectedRoute requireRole="admin">
          <AdminPage />
        </ProtectedRoute>
      } />
    </Routes>
  );
}
```

### Two-Factor Authentication

```tsx
import { use2FA } from "@saas-infra/auth";
import { toast } from "sonner";

function TwoFactorSettings() {
  const {
    settings,
    isLoading,
    enableEmailOTP,
    enableTOTP,
    enableSMS,
    generateBackupCodes,
    disableMethod,
  } = use2FA({
    onSuccess: (title, desc) => toast.success(title, { description: desc }),
    onError: (title, desc) => toast.error(title, { description: desc }),
  });

  const handleEnableTOTP = async () => {
    const result = await enableTOTP();
    if (result) {
      // Show QR code and secret to user
      console.log("Secret:", result.secret);
      console.log("QR Code URL:", result.qrCodeUrl);
    }
  };

  return (
    <div>
      <h2>Two-Factor Authentication</h2>

      <button onClick={handleEnableTOTP}>
        Enable Authenticator App
      </button>

      <button onClick={() => enableEmailOTP()}>
        Enable Email OTP
      </button>

      <button onClick={() => generateBackupCodes()}>
        Generate Backup Codes
      </button>

      {settings?.email_enabled && (
        <button onClick={() => disableMethod("email")}>
          Disable Email 2FA
        </button>
      )}
    </div>
  );
}
```

### Role-Based UI

```tsx
import { useRoleContext } from "@saas-infra/auth";

function Dashboard() {
  const { isAdmin, isOwner, hasRole } = useRoleContext();

  return (
    <div>
      <h1>Dashboard</h1>

      {isAdmin && <AdminPanel />}

      {isOwner && <OwnerSettings />}

      {hasRole("tester") && <TestFeatures />}
    </div>
  );
}
```

### User Impersonation (Admin)

```tsx
import { useAuth } from "@saas-infra/auth";

function UserList() {
  const { startImpersonation, stopImpersonation, impersonatedUser } = useAuth();

  const handleImpersonate = async (userId: string) => {
    const success = await startImpersonation(userId);
    if (success) {
      console.log("Now viewing as:", impersonatedUser);
    }
  };

  return (
    <div>
      {impersonatedUser && (
        <div>
          Viewing as: {impersonatedUser.email}
          <button onClick={stopImpersonation}>Stop</button>
        </div>
      )}

      <UserTable onImpersonate={handleImpersonate} />
    </div>
  );
}
```

## API Reference

### `useAuth()`

Returns:
- `user` — Current user object
- `profile` — User profile data
- `isLoading` — Auth state loading
- `impersonatedUser` — Currently impersonated user (admin only)
- `signUp(email, password, metadata?)` — Create account
- `signIn(email, password)` — Sign in with credentials
- `signInWithGoogle()` — Sign in with Google OAuth
- `signOut()` — Sign out
- `resetPassword(email)` — Send password reset email
- `updatePassword(newPassword)` — Update password
- `updateProfile(updates)` — Update profile data
- `refreshProfile()` — Reload profile from database
- `startImpersonation(userId)` — Admin: impersonate user
- `stopImpersonation()` — Stop impersonating
- `isAdmin()` — Check if current user is admin
- `isOwner()` — Check if current user is owner

### `use2FA(options?)`

Options:
- `onSuccess?: (title, description) => void`
- `onError?: (title, description) => void`

Returns:
- `settings` — Current 2FA settings
- `isLoading` — Loading state
- `backupCodes` — Generated backup codes
- `enableEmailOTP()` — Enable email 2FA
- `enableTOTP()` — Enable authenticator app (returns secret + QR URL)
- `enableSMS(phoneNumber)` — Enable SMS 2FA
- `generateBackupCodes()` — Generate new backup codes
- `disableMethod(method)` — Disable a 2FA method
- `adminReset(userId)` — Admin: reset user's 2FA

### `useRoleContext()`

Returns:
- `role` — Current user role
- `isAdmin` — Boolean: is admin
- `isOwner` — Boolean: is owner
- `isTester` — Boolean: is tester
- `hasRole(role)` — Check specific role

## Database Schema

Required tables (see `templates/schemas/01_core_auth.sql`):

- `profiles` — User profile data
- `user_roles` — User role assignments
- `user_2fa_settings` — 2FA configuration
- `user_backup_codes` — Backup codes for 2FA
- `user_phone_numbers` — Phone verification for SMS 2FA
- `login_events` — Login audit trail

## TypeScript

All exports are fully typed. Import types as needed:

```tsx
import type { Profile, ImpersonatedUser } from "@saas-infra/auth";
```

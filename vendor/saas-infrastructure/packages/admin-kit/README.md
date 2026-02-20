# @saas-infra/admin-kit

Admin components and hooks for audit logging, data export, and feature toggles.

## Features

- **Audit Logging** — Track admin actions with `useAuditLog` hook
- **Feature Toggles** — Manage app-wide feature flags
- **Data Export** — Export data to CSV/JSON/Excel
- **Audit Trail Viewer** — Browse and filter audit logs
- **Dependency Injection** — Uses `useSupabase()` from @saas-infra/auth

## Installation

```bash
pnpm add @saas-infra/admin-kit @saas-infra/auth @saas-infra/ui @saas-infra/utils
```

## Usage

### Audit Logging

Track all admin actions:

```tsx
import { useAuditLog } from "@saas-infra/admin-kit";

function AdminUserManagement() {
  const { logAction } = useAuditLog();

  const handleDeleteUser = async (userId: string) => {
    await deleteUser(userId);

    // Log the action
    logAction({
      action: "DELETE_USER",
      details: { userId, reason: "Policy violation" },
    });
  };

  return <UserTable onDelete={handleDeleteUser} />;
}
```

**Available Actions:**
- `CREATE_USER`, `EDIT_USER`, `DELETE_USER`, `IMPERSONATE_USER`
- `CREATE_PLAN`, `EDIT_PLAN`, `DELETE_PLAN`
- `CREATE_TEMPLATE`, `EDIT_TEMPLATE`, `DELETE_TEMPLATE`
- `EDIT_EMAIL_BRANDING`, `EDIT_EMAIL_DOMAIN`
- `CREATE_COUPON`, `EXPIRE_COUPON`
- `UPDATE_FEATURE_FLAGS`, `UPDATE_APP_SETTINGS`
- And many more...

### Audit Trail Component

Display audit logs with filtering and search:

```tsx
import { AuditTrail } from "@saas-infra/admin-kit";

function AdminAuditPage() {
  return (
    <div className="container py-8">
      <h1>Audit Trail</h1>
      <AuditTrail />
    </div>
  );
}
```

Features:
- Filter by action type
- Filter by admin user
- Filter by date range
- Search in details
- Export to CSV
- Pagination
- Auto-refresh

### Feature Toggles Component

Manage feature flags:

```tsx
import { FeatureToggles } from "@saas-infra/admin-kit";

function AdminSettings() {
  return (
    <div>
      <h2>Feature Flags</h2>
      <FeatureToggles />
    </div>
  );
}
```

Manages:
- Blog system (`blog_enabled`)
- Referrals (`referrals_enabled`)
- SMS (`sms_enabled`)
- Organizations (`orgs_enabled`)
- Changelog (`changelog_enabled`)
- Guides (`guides_enabled`)
- Email branding (`email_branding_enabled`)

All changes are automatically logged to audit trail.

### Feature Flags Hook

Check feature status programmatically:

```tsx
import { useAppFeatures } from "@saas-infra/admin-kit";

function Navigation() {
  const { features, isLoading, updateFeature } = useAppFeatures();

  if (isLoading) return <div>Loading...</div>;

  return (
    <nav>
      <Link to="/">Home</Link>
      {features?.blog_enabled && <Link to="/blog">Blog</Link>}
      {features?.guides_enabled && <Link to="/guides">Guides</Link>}
      {features?.changelog_enabled && <Link to="/changelog">Changelog</Link>}
    </nav>
  );
}
```

### Data Export Button

Export any data to CSV/JSON/Excel:

```tsx
import { ExportButton } from "@saas-infra/admin-kit";

function UserList({ users }: { users: User[] }) {
  return (
    <div>
      <ExportButton
        data={users}
        filename="users"
        onError={(title, desc) => toast.error(title, { description: desc })}
        onSuccess={(title, desc) => toast.success(title, { description: desc })}
      />

      <UserTable data={users} />
    </div>
  );
}
```

Supports:
- CSV export
- JSON export
- Excel export (via `exportData` from @saas-infra/utils)

## API Reference

### `useAuditLog()`

Hook for logging admin actions.

**Returns:**
```tsx
{
  logAction: (params: {
    action: AuditAction;
    details?: Record<string, any>;
  }) => Promise<void>;
}
```

**AuditAction Type:**
Union of 30+ action strings like `"CREATE_USER"`, `"EDIT_PLAN"`, `"UPDATE_FEATURE_FLAGS"`, etc.

### `useAppFeatures(options?)`

Hook for managing feature flags.

**Options:**
```tsx
interface UseAppFeaturesOptions {
  onSuccess?: (title: string, description: string) => void;
  onError?: (title: string, description: string) => void;
}
```

**Returns:**
```tsx
{
  features: AppFeatures | null;
  isLoading: boolean;
  updateFeature: (key: FeatureKey, enabled: boolean) => Promise<void>;
}
```

**AppFeatures Type:**
```tsx
interface AppFeatures {
  id: string;
  name: string;
  blog_enabled: boolean;
  referrals_enabled: boolean;
  sms_enabled: boolean;
  orgs_enabled: boolean;
  changelog_enabled: boolean;
  guides_enabled: boolean;
  email_branding_enabled: boolean;
}
```

### `<ExportButton />`

Component for exporting data.

**Props:**
```tsx
interface ExportButtonProps<T> {
  data: T[];
  filename: string;
  onError?: (title: string, description: string) => void;
  onSuccess?: (title: string, description: string) => void;
}
```

### `<AuditTrail />`

Component displaying audit logs with filters.

No props required — fully self-contained.

### `<FeatureToggles />`

Component for managing feature flags.

No props required — uses `useAppFeatures` and `useAuditLog` internally.

## Database Schema

Required tables (see `templates/schemas/06_admin_platform.sql`):

- `admin_audit_logs` — Audit trail entries
- `apps` — App configuration with feature flags

## Examples

### Admin Dashboard with Audit Logging

```tsx
import { useAuditLog, AuditTrail } from "@saas-infra/admin-kit";
import { useAuth } from "@saas-infra/auth";

function AdminDashboard() {
  const { isAdmin } = useAuth();
  const { logAction } = useAuditLog();

  if (!isAdmin()) {
    return <div>Access denied</div>;
  }

  const handleBackup = async () => {
    await performBackup();
    logAction({
      action: "BACKUP_DATABASE",
      details: { timestamp: new Date().toISOString() },
    });
  };

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <button onClick={handleBackup}>Backup Database</button>
      <AuditTrail />
    </div>
  );
}
```

### Conditional Feature UI

```tsx
import { useAppFeatures } from "@saas-infra/admin-kit";

function AppShell() {
  const { features } = useAppFeatures();

  return (
    <div>
      <Sidebar>
        <NavLink to="/">Dashboard</NavLink>

        {features?.blog_enabled && (
          <>
            <NavLink to="/blog">Blog</NavLink>
            <NavLink to="/blog/new">New Post</NavLink>
          </>
        )}

        {features?.referrals_enabled && (
          <NavLink to="/referrals">Referrals</NavLink>
        )}

        {features?.orgs_enabled && (
          <NavLink to="/organizations">Organizations</NavLink>
        )}
      </Sidebar>
    </div>
  );
}
```

### Export with Custom Formatting

```tsx
import { ExportButton } from "@saas-infra/admin-kit";
import { format } from "date-fns";

function OrderList({ orders }: { orders: Order[] }) {
  // Transform data before export
  const exportData = orders.map(order => ({
    "Order ID": order.id,
    "Customer": order.customer_name,
    "Total": `$${order.total.toFixed(2)}`,
    "Status": order.status.toUpperCase(),
    "Date": format(new Date(order.created_at), "yyyy-MM-dd"),
  }));

  return (
    <div>
      <ExportButton
        data={exportData}
        filename={`orders_${format(new Date(), "yyyy-MM-dd")}`}
      />
      <OrderTable data={orders} />
    </div>
  );
}
```

# @saas-infra/utils

Framework-agnostic utility functions for SaaS applications.

## Features

- **Class Name Utilities** — `cn()` function for conditional classes
- **Data Export** — Export data to CSV, JSON, Excel
- **Sanitization** — HTML sanitization for safe rendering
- **Type-Safe** — Full TypeScript support
- **Zero Dependencies** — Except DOMPurify for sanitization

## Installation

```bash
pnpm add @saas-infra/utils
```

## Usage

### Class Name Utility

Combine and conditionally apply Tailwind classes:

```tsx
import { cn } from "@saas-infra/utils";

function Button({ variant, className, ...props }) {
  return (
    <button
      className={cn(
        "px-4 py-2 rounded font-medium",
        variant === "primary" && "bg-blue-500 text-white",
        variant === "secondary" && "bg-gray-200 text-gray-900",
        className
      )}
      {...props}
    />
  );
}
```

**How it works:**
- Merges multiple class strings
- Handles conditional classes
- Resolves Tailwind class conflicts (e.g., `px-4 px-2` → `px-2`)
- Removes falsy values

### Data Export

Export arrays of objects to various formats:

```tsx
import { exportData } from "@saas-infra/utils";

function UserList({ users }: { users: User[] }) {
  const handleExport = (format: "csv" | "json" | "xlsx") => {
    exportData(users, `users_${Date.now()}`, format);
  };

  return (
    <div>
      <button onClick={() => handleExport("csv")}>Export CSV</button>
      <button onClick={() => handleExport("json")}>Export JSON</button>
      <button onClick={() => handleExport("xlsx")}>Export Excel</button>

      <UserTable data={users} />
    </div>
  );
}
```

**Supported Formats:**
- `csv` — Comma-separated values
- `json` — JSON file
- `xlsx` — Excel spreadsheet

**Features:**
- Automatic file download
- Handles nested objects (flattens one level)
- Preserves column order
- UTF-8 encoding
- Proper escaping for CSV

### HTML Sanitization

Sanitize user-generated HTML to prevent XSS attacks:

```tsx
import { sanitize, sanitizeEmailPreview } from "@saas-infra/utils";

function UserComment({ html }: { html: string }) {
  return (
    <div
      dangerouslySetInnerHTML={{ __html: sanitize(html) }}
    />
  );
}

function EmailPreview({ template }: { template: string }) {
  return (
    <div
      dangerouslySetInnerHTML={{ __html: sanitizeEmailPreview(template) }}
    />
  );
}
```

**Two Sanitization Levels:**

1. **`sanitize(html)`** — Strict sanitization for user content
   - Allows: `p`, `br`, `strong`, `em`, `a`, `ul`, `ol`, `li`, `h1`-`h6`
   - Removes: `<script>`, `<style>`, event handlers, `javascript:` URLs
   - Use for: User comments, forum posts, any untrusted input

2. **`sanitizeEmailPreview(html)`** — Relaxed sanitization for email previews
   - Allows: All safe formatting tags plus `div`, `span`, `table`, `img`
   - Allows: `style` attributes (for email formatting)
   - Removes: `<script>`, event handlers, `javascript:` URLs
   - Use for: Email template previews, admin-controlled content

## API Reference

### `cn(...inputs: ClassValue[]): string`

Utility for merging class names with Tailwind CSS conflict resolution.

```tsx
cn("px-4 py-2", "px-2") // → "py-2 px-2"
cn("text-red-500", someCondition && "text-blue-500") // conditional
cn({ "font-bold": isActive }, className) // objects + spread
```

Built with `clsx` and `tailwind-merge`.

### `exportData<T>(data: T[], filename: string, format: "csv" | "json" | "xlsx"): void`

Export array of objects to file.

**Parameters:**
- `data` — Array of objects to export
- `filename` — Output filename (extension added automatically)
- `format` — Export format (`csv`, `json`, or `xlsx`)

**Example:**
```tsx
const users = [
  { id: 1, name: "Alice", email: "alice@example.com" },
  { id: 2, name: "Bob", email: "bob@example.com" },
];

exportData(users, "users", "csv");
// Downloads: users.csv
```

**CSV Output:**
```
id,name,email
1,Alice,alice@example.com
2,Bob,bob@example.com
```

### `sanitize(html: string): string`

Strict HTML sanitization for user-generated content.

**Allowed Tags:**
`a`, `b`, `br`, `code`, `em`, `h1`, `h2`, `h3`, `h4`, `h5`, `h6`, `i`, `li`, `ol`, `p`, `pre`, `strong`, `u`, `ul`

**Removed:**
- All `<script>` tags
- All event handlers (`onclick`, `onerror`, etc.)
- `javascript:` URLs
- `data:` URLs
- `<style>` tags
- `<iframe>`, `<object>`, `<embed>`

### `sanitizeEmailPreview(html: string): string`

Relaxed HTML sanitization for email template previews.

**Allowed Tags:**
All tags from `sanitize()` plus: `div`, `span`, `table`, `thead`, `tbody`, `tr`, `td`, `th`, `img`, `hr`, `blockquote`

**Allowed Attributes:**
- `style` (for inline email styles)
- `class`, `id`
- `href` (validated)
- `src` (for images, validated)
- `alt`, `title`
- `colspan`, `rowspan` (for tables)

**Still Removed:**
- `<script>` tags
- Event handlers
- `javascript:` and `data:` URLs

## Examples

### Complex Class Merging

```tsx
import { cn } from "@saas-infra/utils";

function Card({ size, elevated, className, children }) {
  return (
    <div
      className={cn(
        // Base styles
        "rounded-lg border bg-white",

        // Size variants
        size === "sm" && "p-2",
        size === "md" && "p-4",
        size === "lg" && "p-6",

        // Conditional styles
        elevated && "shadow-lg",

        // User overrides
        className
      )}
    >
      {children}
    </div>
  );
}

// Usage
<Card size="lg" elevated className="border-blue-500">
  Content
</Card>
```

### Export with Formatting

```tsx
import { exportData } from "@saas-infra/utils";
import { format } from "date-fns";

function OrderExport({ orders }: { orders: Order[] }) {
  const handleExport = () => {
    // Transform data before export
    const formatted = orders.map(order => ({
      "Order ID": order.id,
      "Customer": order.customer_name,
      "Total": `$${order.total.toFixed(2)}`,
      "Status": order.status.toUpperCase(),
      "Date": format(new Date(order.created_at), "yyyy-MM-dd"),
    }));

    exportData(formatted, `orders_${format(new Date(), "yyyy-MM-dd")}`, "xlsx");
  };

  return <button onClick={handleExport}>Export Orders</button>;
}
```

### Safe HTML Rendering

```tsx
import { sanitize } from "@saas-infra/utils";
import { useState } from "react";

function RichTextInput() {
  const [html, setHtml] = useState("");
  const [preview, setPreview] = useState("");

  const handleChange = (value: string) => {
    setHtml(value);
    setPreview(sanitize(value));
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h3>HTML Input</h3>
        <textarea
          value={html}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full h-64 p-2 border rounded"
        />
      </div>

      <div>
        <h3>Sanitized Preview</h3>
        <div
          className="w-full h-64 p-2 border rounded overflow-auto"
          dangerouslySetInnerHTML={{ __html: preview }}
        />
      </div>
    </div>
  );
}
```

### Email Template Preview

```tsx
import { sanitizeEmailPreview } from "@saas-infra/utils";

function EmailPreview({ template, variables }) {
  // Replace variables
  let html = template.body;
  Object.entries(variables).forEach(([key, value]) => {
    html = html.replace(new RegExp(`{{${key}}}`, "g"), value);
  });

  // Apply branding
  const fullEmail = `
    <div style="background: #f0f0f0; padding: 32px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 24px;">
        ${html}
      </div>
    </div>
  `;

  return (
    <div className="border rounded overflow-hidden">
      <div className="bg-gray-100 px-4 py-2 border-b">
        <p className="text-sm">Subject: {template.subject}</p>
      </div>
      <div
        dangerouslySetInnerHTML={{ __html: sanitizeEmailPreview(fullEmail) }}
      />
    </div>
  );
}
```

## TypeScript

All exports are fully typed:

```tsx
import type { ClassValue } from "clsx";

// cn() accepts ClassValue types
cn("base", { active: true }, ["more", "classes"]);

// exportData is generic
exportData<User>(users, "users", "csv");
```

## Browser Compatibility

- **`cn()`** — All modern browsers
- **`exportData()`** — Requires `Blob` and download attribute support (IE11+)
- **`sanitize()`** — Requires DOMPurify (all modern browsers)

## Performance

- **`cn()`** — Very fast, optimized for className merging
- **`exportData()`** — Handles large datasets (tested with 100k+ rows)
- **`sanitize()`** — Optimized for typical HTML sizes (< 1MB)

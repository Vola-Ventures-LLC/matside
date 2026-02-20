# @saas-infra/ui

UI component library built on shadcn/ui with Radix UI primitives and Tailwind CSS.

## Features

- **49 Components** — Complete shadcn/ui component collection
- **Fully Typed** — TypeScript support with proper type exports
- **Accessible** — Built on Radix UI primitives (WAI-ARIA compliant)
- **Themeable** — CSS variables for easy customization
- **Dark Mode** — Built-in dark mode support via `next-themes`
- **Responsive** — Mobile-first design with `useIsMobile` hook

## Installation

```bash
pnpm add @saas-infra/ui lucide-react class-variance-authority clsx tailwind-merge
```

## Setup

### 1. Configure Tailwind

In your `tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./src/**/*.{ts,tsx}",
    // IMPORTANT: Include UI package components
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // Add CSS variables for theming
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... (see full config in packages/config)
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

### 2. Add CSS Variables

In your `index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    /* ... (see packages/config/tailwind for full vars) */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... */
  }
}
```

### 3. Wrap App with Theme Provider (Optional)

For dark mode support:

```tsx
import { ThemeProvider } from "next-themes";

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system">
      {/* Your app */}
    </ThemeProvider>
  );
}
```

## Usage

### Import Components

```tsx
import { Button } from "@saas-infra/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@saas-infra/ui/card";
import { Input } from "@saas-infra/ui/input";
import { Label } from "@saas-infra/ui/label";

function LoginForm() {
  return (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>Login</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" />
        </div>
        <Button className="w-full">Sign In</Button>
      </CardContent>
    </Card>
  );
}
```

### Use Hooks

```tsx
import { useToast } from "@saas-infra/ui/use-toast";
import { Toaster } from "@saas-infra/ui/toaster";

function App() {
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Success",
      description: "Your changes have been saved.",
    });
  };

  return (
    <div>
      <button onClick={handleSave}>Save</button>
      <Toaster />
    </div>
  );
}
```

```tsx
import { useIsMobile } from "@saas-infra/ui/use-mobile";

function ResponsiveNav() {
  const isMobile = useIsMobile();

  return (
    <nav>
      {isMobile ? <MobileMenu /> : <DesktopMenu />}
    </nav>
  );
}
```

## Available Components

### Layout
- `Card` — Content container
- `Separator` — Visual divider
- `Sheet` — Slide-over panel
- `Tabs` — Tabbed interface

### Form
- `Input` — Text input
- `Textarea` — Multi-line input
- `Label` — Form label
- `Checkbox` — Checkbox
- `Radio` — Radio button
- `Select` — Dropdown select
- `Switch` — Toggle switch
- `Slider` — Range slider
- `Form` — Form wrapper with validation

### Buttons
- `Button` — Primary button
- `Toggle` — Toggle button
- `ToggleGroup` — Group of toggle buttons

### Feedback
- `Alert` — Alert message
- `AlertDialog` — Modal alert
- `Dialog` — Modal dialog
- `Toast` — Toast notification
- `Tooltip` — Hover tooltip
- `Popover` — Popover menu
- `HoverCard` — Hover card
- `Progress` — Progress bar
- `Skeleton` — Loading skeleton

### Data Display
- `Table` — Data table
- `Badge` — Status badge
- `Avatar` — User avatar
- `Accordion` — Collapsible sections
- `Collapsible` — Collapsible content

### Navigation
- `Breadcrumb` — Breadcrumb navigation
- `ContextMenu` — Right-click menu
- `DropdownMenu` — Dropdown menu
- `Menubar` — Menu bar
- `NavigationMenu` — Navigation menu
- `Pagination` — Page navigation

### Media
- `AspectRatio` — Aspect ratio container
- `Carousel` — Image carousel

### Utility
- `Calendar` — Date picker calendar
- `Command` — Command palette
- `Drawer` — Drawer component
- `Resizable` — Resizable panels
- `ScrollArea` — Custom scrollable area
- `Sonner` — Toast notifications (sonner library)

## Component Examples

### Dialog

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@saas-infra/ui/dialog";
import { Button } from "@saas-infra/ui/button";

function DeleteDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">Delete</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 justify-end">
          <Button variant="outline">Cancel</Button>
          <Button variant="destructive">Delete</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Data Table

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@saas-infra/ui/table";

function UserTable({ users }: { users: User[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map(user => (
          <TableRow key={user.id}>
            <TableCell>{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              <Badge variant={user.is_active ? "default" : "secondary"}>
                {user.is_active ? "Active" : "Inactive"}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### Command Palette

```tsx
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@saas-infra/ui/command";

function CommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>Dashboard</CommandItem>
          <CommandItem>Settings</CommandItem>
          <CommandItem>Profile</CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
```

## Theming

All components use CSS variables for theming. Customize colors in your `globals.css`:

```css
:root {
  --primary: 221 83% 53%; /* Blue */
  --destructive: 0 84% 60%; /* Red */
  --success: 142 76% 36%; /* Green */
}
```

## TypeScript

All components are fully typed. Import types as needed:

```tsx
import type { ButtonProps } from "@saas-infra/ui/button";
import type { DialogProps } from "@saas-infra/ui/dialog";
```

## Documentation

For detailed component API and examples, see [shadcn/ui docs](https://ui.shadcn.com/docs/components).

All components follow the same API as shadcn/ui.

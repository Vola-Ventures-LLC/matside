# @saas-infra/config

Shared TypeScript, ESLint, and Tailwind configurations for the SaaS Infrastructure monorepo.

## What's Included

- **TypeScript Configs**: Base, React Library, React App
- **ESLint Config**: Shared linting rules
- **Tailwind Config**: Design system tokens (colors, spacing, typography)

## Usage

### TypeScript

Extend the appropriate config in your package's `tsconfig.json`:

```json
{
  "extends": "@saas-infra/config/tsconfig/react-library.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src"]
}
```

Available configs:
- `tsconfig/base.json` - Base TypeScript config (strict mode, ES2020)
- `tsconfig/react-library.json` - For React component libraries
- `tsconfig/react-app.json` - For React applications (includes Vite types)

### ESLint

Extend in your `.eslintrc.js`:

```js
module.exports = {
  extends: ["@saas-infra/config/eslint"],
  // Add package-specific rules here
};
```

### Tailwind CSS

Extend in your `tailwind.config.ts`:

```ts
import baseConfig from "@saas-infra/config/tailwind";

export default {
  ...baseConfig,
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}", // Include shared UI
  ],
  // Add app-specific customizations
};
```

## Design Tokens

The Tailwind config includes a comprehensive design system:

- **Colors**: Primary, secondary, accent, destructive, muted
- **Typography**: Inter font family, responsive text scales
- **Spacing**: Consistent spacing scale
- **Animations**: Fade-in, slide-in, etc.

All tokens use CSS variables for theming support.

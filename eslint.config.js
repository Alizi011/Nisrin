import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    // Shared UI modules intentionally export style variants / context hooks
    // alongside components. Keep every other React/TypeScript lint rule on,
    // and keep Fast Refresh validation enabled throughout app code.
    files: [
      'src/components/ui/badge.tsx',
      'src/components/ui/button-group.tsx',
      'src/components/ui/button.tsx',
      'src/components/ui/form.tsx',
      'src/components/ui/navigation-menu.tsx',
      'src/components/ui/sidebar.tsx',
      'src/components/ui/toggle.tsx',
      'src/store/ShopContext.tsx',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])

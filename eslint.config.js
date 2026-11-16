import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-restricted-imports': ['error', { paths: [{
        name: 'react',
        importNames: ['useEffect', 'useLayoutEffect', 'useReducer', 'useRef', 'useMemo', 'useCallback', 'useContext', 'useSyncExternalStore', 'use', 'useId', 'useTransition', 'useDeferredValue', 'useImperativeHandle', 'useInsertionEffect', 'useActionState', 'useOptimistic'],
        message: 'Le brief autorise uniquement useState.',
      }] }],
    },
  },
  { files: ['tests/**/*.mjs'], languageOptions: { globals: globals.node } },
])

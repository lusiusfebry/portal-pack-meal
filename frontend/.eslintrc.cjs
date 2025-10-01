/** ESLint configuration for React + TypeScript (Vite) */
module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  plugins: [
    '@typescript-eslint',
    'react-refresh',
    'react-hooks',
    'prettier',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:prettier/recommended',
  ],
  ignorePatterns: ['node_modules/', 'dist/', 'build/', '.vite/'],
  rules: {
    // Prettier integration
    'prettier/prettier': 'warn',

    // React 17+ / Vite JSX runtime
    'react/react-in-jsx-scope': 'off',

    // Improve fast refresh reliability in Vite
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],

    // TypeScript best practices
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],

    // General modern JS rules
    'no-var': 'error',
    'prefer-const': 'warn',
  },
};
import importPlugin from "eslint-plugin-import";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    files: ["src/**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      import: importPlugin,
      "react-hooks": reactHooksPlugin, // <-- Добавили плагин React хуков
    },
    rules: {
      // Регистрируем правила хуков, чтобы линтер понимал комментарии в коде
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // Наши железобетонные правила архитектуры
      "import/no-restricted-paths": [
        "error",
        {
          "zones": [
            {
              "target": "./src/components/**",
              "from": "./src/lib/env.ts",
              "message": "Нельзя импортировать серверный env в клиентские компоненты."
            },
            {
              "target": "./src/components/**",
              "from": "./src/features/admin/actions/**",
              "message": "Серверные экшены не должны использоваться в общих компонентах."
            },
            {
              "target": "./src/features/**/components/**",
              "from": "./src/lib/env.ts",
              "message": "Нельзя импортировать серверный env в клиентские компоненты."
            },
            {
              "target": "./src/features/**/components/**",
              "from": "./src/lib/apb/client.ts",
              "message": "APB-клиент — только серверный код."
            },
            {
              "target": "./src/features/**/components/**",
              "from": "./src/features/admin/actions/**",
              "message": "Серверные экшены не должны использоваться в клиентских компонентах."
            },
            {
              "target": "./src/app/**/!(layout|page|error|loading).{ts,tsx}",
              "from": "./src/lib/env.ts",
              "message": "Нельзя импортировать серверный env в клиентский компонент."
            },
            {
              "target": "./src/app/**/!(layout|page|error|loading).{ts,tsx}",
              "from": "./src/lib/apb/client.ts",
              "message": "APB-клиент — только серверный код."
            }
          ]
        }
      ]
    }
  }
];
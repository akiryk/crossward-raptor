import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // The grid engine is headless: no React, Next, or database client.
  {
    files: ["src/engine/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["react", "react-*", "next", "next/*"],
              message:
                "The grid engine is headless: no React or Next imports in src/engine/.",
            },
            {
              group: ["prisma", "@prisma/*", ".prisma/*"],
              message:
                "The grid engine owns no persistence: no database client in src/engine/.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;

import nextPlugin from "eslint-config-next";

const eslintConfig = [
  nextPlugin,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      // Add any custom rules here
    },
  },
];

export default eslintConfig;

import { createConfigForNuxt } from "@nuxt/eslint-config/flat";

export default createConfigForNuxt({
  features: {
    stylistic: {
      semi: true,
      quotes: "double",
    },
    tooling: true,
  },
}).append({
  ignores: [
    "dist/**",
    ".output/**",
    "node_modules/**",
    "public/**",
    "content/**",
    "generated/**",
    ".nuxt/**",
  ],
});

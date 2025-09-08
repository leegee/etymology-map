import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";
import packageJson from './package.json';

export default defineConfig({
  base: `/${packageJson.name}/`,
  plugins: [solid()],
  resolve: {
    conditions: ["development", "browser"],
  },
});

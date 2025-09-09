import solid from "vite-plugin-solid";
import { defineConfig } from "vite";
import packageJson from "./package.json";

console.log('Name:', packageJson.name);

export default defineConfig({
  base: `/${packageJson.name}/`,
  plugins: [solid()],
  resolve: {
    conditions: ["development", "browser"],
  },
});

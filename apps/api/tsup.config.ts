import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node20",
  platform: "node",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  dts: false,
  // Bundle the workspace package; keep heavy/native deps external.
  noExternal: ["@app/shared"],
  external: ["mongoose", "pdfjs-dist", "openai", "pino", "pino-http"],
});

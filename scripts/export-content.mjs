import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createServer } from "vite";

const root = resolve(import.meta.dirname, "..");
const server = await createServer({
  root,
  configFile: resolve(root, "vite.config.ts"),
  server: { middlewareMode: true },
  appType: "custom",
});

try {
  const { defaultContent } = await server.ssrLoadModule("/src/data.ts");
  const content = normalizeAssetPaths(defaultContent);
  const outputPath = resolve(root, "public/content.json");
  await mkdir(resolve(root, "public"), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(content, null, 2)}\n`, "utf8");
  console.log(`Exported ${outputPath}`);
} finally {
  await server.close();
}

function normalizeAssetPaths(value) {
  if (typeof value === "string") return value.replace(/^\/assets\//, "./assets/");
  if (Array.isArray(value)) return value.map(normalizeAssetPaths);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeAssetPaths(item)]));
  }
  return value;
}

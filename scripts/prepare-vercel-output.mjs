import { copyFile, mkdir, rm } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const output = new URL("public/", root);
const files = ["index.html", "styles.css", "app.bundle.js"];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

await Promise.all(
  files.map((file) => copyFile(new URL(file, root), new URL(file, output))),
);

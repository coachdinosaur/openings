import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const vinextRoot = path.join(process.cwd(), "node_modules", "vinext");
const packagePath = path.join(vinextRoot, "package.json");
const cachePath = path.join(vinextRoot, "dist", "server", "static-file-cache.js");
const expectedVersion = "0.0.50";

const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
if (packageJson.version !== expectedVersion) {
  throw new Error(`Review the Vinext static-file compatibility patch before using version ${packageJson.version}.`);
}

let source = await readFile(cachePath, "utf8");
const replacements = [
  {
    original: '\t".rsc": "text/x-component"',
    patched: '\t".rsc": "text/x-component",\n\t".wasm": "application/wasm"',
  },
  {
    original: "relativePath: path.relative(base, batch[j]),",
    patched: 'relativePath: path.relative(base, batch[j]).split(path.sep).join("/"),',
  },
];

let changed = false;
for (const replacement of replacements) {
  if (source.includes(replacement.patched)) continue;
  if (!source.includes(replacement.original)) {
    throw new Error("Vinext static-file internals changed; the compatibility patch was not applied.");
  }
  source = source.replace(replacement.original, replacement.patched);
  changed = true;
}

if (changed) await writeFile(cachePath, source, "utf8");
console.log(changed ? "Patched Vinext static serving for Windows paths and WebAssembly MIME." : "Vinext static serving patch already applied.");

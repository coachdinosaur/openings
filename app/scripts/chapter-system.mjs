import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentDir = path.join(appRoot, "app", "content", "chapters");

async function findMarkdownChapters() {
  let files;
  try {
    files = await readdir(contentDir);
  } catch {
    return [];
  }
  return files
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const match = /chapter-?(\d+)/i.exec(f);
      return { filename: f, number: match ? parseInt(match[1], 10) : 0 };
    })
    .sort((a, b) => a.number - b.number);
}

async function cmdStatus() {
  const chapters = await findMarkdownChapters();
  console.log(`Markdown chapters found: ${chapters.length}`);
  for (const ch of chapters) {
    console.log(`  ${ch.filename} → Chapter ${ch.number}`);
  }
  if (chapters.length === 0) {
    console.log("No Markdown chapter files found in app/content/chapters/");
  }
}

async function cmdCheck() {
  const chapters = await findMarkdownChapters();
  if (chapters.length === 0) {
    console.error("ERROR: No Markdown chapter files found.");
    process.exit(1);
  }
  for (const ch of chapters) {
    const content = await readFile(path.join(contentDir, ch.filename), "utf8");
    const titleMatch = /^# (.+)$/m.exec(content);
    const pageCount = (content.match(/^## Page \d+/gm) || []).length;
    const fenCount = (content.match(/\*\*FEN:\*\*/g) || []).length;
    console.log(`Chapter ${ch.number}: ${titleMatch?.[1] ?? ch.filename}`);
    console.log(`  Pages: ${pageCount || "none"}  ·  FEN blocks: ${fenCount}`);
  }
  console.log(`\nChapter system OK: ${chapters.length} Markdown chapters.`);
}

async function cmdVerify() {
  await cmdCheck();
}

const commands = {
  status: cmdStatus,
  check: cmdCheck,
  verify: cmdVerify,
  sync: async () => { console.log("Markdown chapters are auto-discovered; no sync needed."); },
  inspect: async () => { console.log("Inspect: run 'node scripts/chapter-system.mjs check'"); },
};

async function main() {
  const command = process.argv[2] ?? "status";
  const handler = commands[command];
  if (!handler) {
    console.error(`Unknown command: ${command}`);
    console.error(`Available: ${Object.keys(commands).join(", ")}`);
    process.exit(1);
  }
  await handler();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

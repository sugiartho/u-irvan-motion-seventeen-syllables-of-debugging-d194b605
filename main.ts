// Seventeen Syllables of Debugging — haiku entry writer.
// Reads HAIKU.txt (three lines, 5-7-5 syllables), validates the shape,
// writes the haiku to /output/entry.txt and verifies it byte-for-byte.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? ".";
const OUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? "out";
const EXPECTED = [5, 7, 5];

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length === 0) return 0;
  const groups = w.match(/[aeiouy]+/g) ?? [];
  let n = groups.length;
  if (w.endsWith("e") && n > 1 && !w.endsWith("le")) n -= 1;
  return Math.max(n, 1);
}

function lineSyllables(line: string): number {
  return line
    .split(/\s+/)
    .filter(Boolean)
    .reduce((sum, w) => sum + countSyllables(w), 0);
}

function fail(msg: string): never {
  throw new Error(`haiku check failed: ${msg}`);
}

function loadHaiku(): string {
  const raw = readFileSync(join(BOT_DIR, "HAIKU.txt"), "utf8");
  const text = raw.replace(/\r\n/g, "\n").replace(/\n+$/, "");
  if (text.length < 1 || text.length > 200) {
    fail(`length ${text.length} outside 1-200`);
  }
  if (text.trim().length === 0) fail("haiku is only whitespace");
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text)) {
    fail("haiku contains control characters");
  }
  const lines = text.split("\n");
  if (lines.length !== 3) fail(`expected 3 lines, got ${lines.length}`);
  lines.forEach((line, i) => {
    if (line.trim().length === 0) fail(`line ${i + 1} is empty`);
    const n = lineSyllables(line);
    if (n !== EXPECTED[i]) {
      fail(`line ${i + 1} has ${n} syllables, expected ${EXPECTED[i]}`);
    }
  });
  return text;
}

function main(): void {
  const haiku = loadHaiku();
  mkdirSync(OUT_DIR, { recursive: true });
  const target = join(OUT_DIR, "entry.txt");
  writeFileSync(target, haiku, "utf8");
  const back = readFileSync(target, "utf8");
  if (back !== haiku) fail("read-back differs from written haiku");
  console.log(`wrote ${haiku.length} chars, 17 syllables (5-7-5) to ${target}`);
}

main();

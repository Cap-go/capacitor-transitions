#!/usr/bin/env node
// Fails when a path in package.json "exports" (or main, module, types) is missing after the build.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));

const targets = new Set([pkg.main, pkg.module, pkg.types].filter(Boolean));
const collect = (value) => {
  if (typeof value === 'string') targets.add(value);
  else if (value && typeof value === 'object') Object.values(value).forEach(collect);
};
collect(pkg.exports);

const missing = [...targets].filter((target) => !existsSync(resolve(root, target)));
if (missing.length > 0) {
  console.error(`package.json points at files the build did not produce:\n${missing.map((m) => `  ${m}`).join('\n')}`);
  process.exit(1);
}
console.log(`All ${targets.size} package.json export targets exist.`);

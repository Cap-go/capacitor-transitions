#!/usr/bin/env node
// Fails when a path in package.json "exports" (or main, module, types) is missing after the build.
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  collectExportTargets,
  findMissingExportTargets,
  loadPackageJson,
} from './lib/package-export-targets.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = loadPackageJson(root);

const missing = findMissingExportTargets(root, pkg);
if (missing.length > 0) {
  console.error(`package.json points at files the build did not produce:\n${missing.map((m) => `  ${m}`).join('\n')}`);
  process.exit(1);
}
console.log(`All ${collectExportTargets(pkg).size} package.json export targets exist (plus .d.mts companions).`);
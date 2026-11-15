import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { findMissingExportTargets, loadPackageJson } from './lib/package-export-targets.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

describe('package export targets', () => {
  it('includes every types path and .d.mts companion after build', () => {
    const pkg = loadPackageJson(root);
    const missing = findMissingExportTargets(root, pkg);
    expect(missing, `Missing: ${missing.join(', ')}`).toEqual([]);
  });
});

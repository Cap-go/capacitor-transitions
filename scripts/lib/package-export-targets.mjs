import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export function collectExportTargets(pkg) {
  const targets = new Set([pkg.main, pkg.module, pkg.types].filter(Boolean));
  const collect = (value) => {
    if (typeof value === 'string') targets.add(value);
    else if (value && typeof value === 'object') Object.values(value).forEach(collect);
  };
  collect(pkg.exports);
  return targets;
}

export function dtsCompanionPaths(target) {
  if (!target.endsWith('.d.ts')) return [];
  return [target.replace(/\.d\.ts$/, '.d.mts')];
}

export function findMissingExportTargets(root, pkg) {
  const targets = collectExportTargets(pkg);
  const required = new Set(targets);
  for (const target of targets) {
    for (const companion of dtsCompanionPaths(target)) {
      required.add(companion);
    }
  }
  return [...required].filter((target) => !existsSync(resolve(root, target)));
}

export function loadPackageJson(root) {
  return JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
}
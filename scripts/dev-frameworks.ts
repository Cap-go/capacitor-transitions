#!/usr/bin/env bun

import { existsSync } from 'node:fs';

type Framework =
  | 'angular'
  | 'nextjs'
  | 'nuxt'
  | 'react'
  | 'solid'
  | 'svelte'
  | 'sveltekit'
  | 'tanstack'
  | 'tanstack-start'
  | 'vue';

type FrameworkConfig = {
  cwd: string;
  port: number;
  bin: string;
  args: (port: number) => string[];
};

const FRAMEWORKS: Record<Framework, FrameworkConfig> = {
  angular: {
    cwd: 'examples/angular-app',
    port: 4300,
    bin: 'ng',
    args: (port) => ['run', 'dev', '--', '--host', '0.0.0.0', '--port', String(port)],
  },
  nextjs: {
    cwd: 'examples/nextjs-app',
    port: 3000,
    bin: 'next',
    args: (port) => ['run', 'dev', '--', '-H', '0.0.0.0', '-p', String(port)],
  },
  nuxt: {
    cwd: 'examples/nuxt-app',
    port: 3001,
    bin: 'nuxt',
    args: (port) => ['run', 'dev', '--', '--host', '0.0.0.0', '--port', String(port)],
  },
  react: {
    cwd: 'examples/react-app',
    port: 5173,
    bin: 'vite',
    args: (port) => ['run', 'dev', '--', '--host', '0.0.0.0', '--port', String(port)],
  },
  solid: {
    cwd: 'examples/solid-app',
    port: 5174,
    bin: 'vite',
    args: (port) => ['run', 'dev', '--', '--host', '0.0.0.0', '--port', String(port)],
  },
  svelte: {
    cwd: 'examples/svelte-app',
    port: 5175,
    bin: 'vite',
    args: (port) => ['run', 'dev', '--', '--host', '0.0.0.0', '--port', String(port)],
  },
  sveltekit: {
    cwd: 'examples/sveltekit-app',
    port: 5176,
    bin: 'vite',
    args: (port) => ['run', 'dev', '--', '--host', '0.0.0.0', '--port', String(port)],
  },
  tanstack: {
    cwd: 'examples/tanstack-app',
    port: 5177,
    bin: 'vite',
    args: (port) => ['run', 'dev', '--', '--host', '0.0.0.0', '--port', String(port)],
  },
  'tanstack-start': {
    cwd: 'examples/tanstack-start-app',
    port: 3002,
    bin: 'vinxi',
    args: (port) => ['run', 'dev', '--', '--host', '0.0.0.0', '--port', String(port)],
  },
  vue: {
    cwd: 'examples/vue-app',
    port: 5178,
    bin: 'vite',
    args: (port) => ['run', 'dev', '--', '--host', '0.0.0.0', '--port', String(port)],
  },
};

const ALIASES: Record<string, Framework> = {
  ng: 'angular',
  angular: 'angular',
  next: 'nextjs',
  nextjs: 'nextjs',
  nuxt: 'nuxt',
  react: 'react',
  solid: 'solid',
  svelte: 'svelte',
  sveltekit: 'sveltekit',
  tanstack: 'tanstack',
  tanstackstart: 'tanstack-start',
  'tanstack-start': 'tanstack-start',
  vue: 'vue',
};

const DEFAULT_FRAMEWORKS: Framework[] = ['react', 'vue', 'svelte'];
const INSTALL_HEARTBEAT_MS = 15000;
const DEFAULT_INSTALL_TIMEOUT_MS = 8 * 60 * 1000;

const rawArgs = process.argv.slice(2).map((arg) => arg.trim().toLowerCase());
const hasHelp = rawArgs.includes('--help') || rawArgs.includes('-h');
const wantsAll = rawArgs.includes('--all') || rawArgs.includes('all');
const installMissingEnv = ['1', 'true', 'yes'].includes(
  (process.env.CAP_TRANSITIONS_INSTALL_MISSING || '').toLowerCase(),
);
const installMissing = rawArgs.includes('--install') || installMissingEnv;
const requestedNames = rawArgs.filter((arg) => !arg.startsWith('-') && arg !== 'all');

if (hasHelp) {
  console.log('Start multiple example dev servers in parallel.');
  console.log('');
  console.log('Usage:');
  console.log('  bun run dev:examples');
  console.log('  bun run dev:examples -- react vue svelte');
  console.log('  bun run dev:examples -- --all');
  console.log('  bun run dev:examples -- --all --install');
  console.log('  CAP_TRANSITIONS_INSTALL_MISSING=1 bun run dev:examples:all');
  console.log('');
  console.log('Default frameworks: react, vue, svelte');
  console.log('By default, missing dependencies are skipped. Use --install to install them first.');
  console.log(`Available frameworks: ${Object.keys(FRAMEWORKS).join(', ')}`);
  process.exit(0);
}

const requestedFrameworks = wantsAll
  ? (Object.keys(FRAMEWORKS) as Framework[])
  : requestedNames.length > 0
    ? requestedNames.map((name) => ALIASES[name] || null)
    : DEFAULT_FRAMEWORKS;

const unknown = requestedNames.filter((name) => !ALIASES[name]);
if (unknown.length > 0) {
  console.error(`Unknown framework(s): ${unknown.join(', ')}`);
  console.error(`Available frameworks: ${Object.keys(FRAMEWORKS).join(', ')}`);
  process.exit(1);
}

const selected = [...new Set(requestedFrameworks)] as Framework[];
const running: { name: Framework; proc: Bun.Subprocess }[] = [];
let shuttingDown = false;
let activeCount = 0;
let hadServerFailures = false;
const skipped = new Set<Framework>();

async function runInstall(name: Framework): Promise<boolean> {
  const config = FRAMEWORKS[name];
  const timeoutMs = Number(process.env.CAP_TRANSITIONS_INSTALL_TIMEOUT_MS || DEFAULT_INSTALL_TIMEOUT_MS);
  const startedAt = Date.now();

  console.log(`[${name}] bun install (${config.cwd})`);
  const install = Bun.spawn({
    cmd: ['bun', 'install', '--no-progress'],
    cwd: config.cwd,
    stdout: 'inherit',
    stderr: 'inherit',
    stdin: 'ignore',
    env: {
      ...process.env,
      CI: '1',
    },
  });

  const heartbeat = setInterval(() => {
    const elapsed = Math.round((Date.now() - startedAt) / 1000);
    console.log(`[${name}] install still running (${elapsed}s elapsed)`);
  }, INSTALL_HEARTBEAT_MS);

  const timeout = setTimeout(() => {
    try {
      install.kill();
    } catch {
      // Ignore kill errors during timeout handling
    }
  }, timeoutMs);

  const code = await install.exited;
  clearInterval(heartbeat);
  clearTimeout(timeout);

  if (code !== 0) {
    const elapsed = Math.round((Date.now() - startedAt) / 1000);
    console.error(`[${name}] install failed with code ${code} after ${elapsed}s`);
    return false;
  }

  const elapsed = Math.round((Date.now() - startedAt) / 1000);
  console.log(`[${name}] install complete in ${elapsed}s`);
  return true;
}

function hasFrameworkDeps(name: Framework): boolean {
  const { cwd, bin } = FRAMEWORKS[name];
  return existsSync(`${cwd}/node_modules`) && existsSync(`${cwd}/node_modules/.bin/${bin}`);
}

const missing = selected.filter((name) => !hasFrameworkDeps(name));
if (missing.length > 0) {
  if (!installMissing) {
    console.warn(`Missing dependencies for: ${missing.join(', ')}.`);
    console.warn('Skipping missing frameworks (default behavior).');
    console.warn('Run again with --install to install missing dependencies first.');
    for (const name of missing) {
      skipped.add(name);
    }
  } else {
    console.log(`Installing missing dependencies for: ${missing.join(', ')}`);
    for (const name of missing) {
      const ok = await runInstall(name);
      if (!ok) {
        skipped.add(name);
      }
    }
  }
}

async function shutdown(exitCode: number): Promise<never> {
  if (!shuttingDown) {
    shuttingDown = true;
    for (const { proc } of running) {
      try {
        proc.kill();
      } catch {
        // Ignore subprocess kill errors during shutdown
      }
    }
  }
  process.exit(exitCode);
}

for (const name of selected) {
  if (skipped.has(name)) {
    console.warn(`[${name}] skipped (dependencies not installed)`);
    continue;
  }

  const config = FRAMEWORKS[name];
  const url = `http://localhost:${config.port}`;

  console.log(`[${name}] starting in ${config.cwd} -> ${url}`);
  const proc = Bun.spawn({
    cmd: ['bun', ...config.args(config.port)],
    cwd: config.cwd,
    stdout: 'inherit',
    stderr: 'inherit',
    stdin: 'inherit',
    env: {
      ...process.env,
      PORT: String(config.port),
      HOST: '0.0.0.0',
    },
  });

  activeCount += 1;
  proc.exited.then((code) => {
    activeCount -= 1;
    if (code !== 0) {
      hadServerFailures = true;
      console.error(`[${name}] exited with code ${code}`);
    } else {
      console.log(`[${name}] stopped`);
    }

    if (!shuttingDown && activeCount === 0) {
      process.exit(hadServerFailures ? 1 : 0);
    }
  });

  running.push({ name, proc });
}

if (running.length === 0) {
  if (skipped.size > 0) {
    console.error(`No frameworks started. Skipped: ${Array.from(skipped).join(', ')}`);
  } else {
    console.error('No frameworks selected.');
  }
  process.exit(1);
}

console.log('');
console.log('Running frameworks:');
for (const { name } of running) {
  console.log(`- ${name}: http://localhost:${FRAMEWORKS[name].port}`);
}
if (skipped.size > 0) {
  console.log(`Skipped: ${Array.from(skipped).join(', ')}`);
}
console.log('Press Ctrl+C to stop all.');

process.on('SIGINT', () => void shutdown(0));
process.on('SIGTERM', () => void shutdown(0));

await new Promise(() => {
  // Keep process alive until terminated by signal or a subprocess failure.
});

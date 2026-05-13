/**
 * Node ESM loader for the ROSTER test suite.
 *
 * Handles two things that Node's native module resolver doesn't do:
 *   1. Resolve the `@/` path alias → project root  (tsconfig paths)
 *   2. Add the `.ts` extension when a bare path resolves to a .ts file
 *
 * Usage (added automatically by the test scripts in package.json):
 *   node --experimental-strip-types \
 *        --experimental-test-module-mocks \
 *        --import 'data:text/javascript,...register(loader)...' \
 *        --test '__tests__/**\/*.test.ts'
 */
import { resolve as pathResolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';

const PROJECT_ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');

// Package sub-paths that Next.js's bundler resolves but plain Node ESM doesn't.
// Maps the bare specifier → actual file in node_modules.
const NEXT_SUBPATH_MAP = {
  'next/server':    `${PROJECT_ROOT}/node_modules/next/server.js`,
  'next/navigation':`${PROJECT_ROOT}/node_modules/next/dist/client/components/navigation.js`,
  'next/headers':   `${PROJECT_ROOT}/node_modules/next/dist/client/components/headers.js`,
};

export async function resolve(specifier, context, nextResolve) {
  // 0. Remap Next.js sub-paths that lack an `exports` entry
  if (specifier in NEXT_SUBPATH_MAP) {
    return { url: pathToFileURL(NEXT_SUBPATH_MAP[specifier]).href, shortCircuit: true };
  }

  // 1. Expand @/ alias → absolute path
  if (specifier.startsWith('@/')) {
    specifier = pathResolve(PROJECT_ROOT, specifier.slice(2));
  }

  // 2. Only intercept paths that are clearly local (absolute or relative).
  //    Bare package specifiers like "next/server" or "uuid" go straight to
  //    Node's default resolver unchanged.
  const isLocalPath = specifier.startsWith('/')
    || specifier.startsWith('./')
    || specifier.startsWith('../')
    || specifier.startsWith('file://');

  if (isLocalPath) {
    const base = context.parentURL
      ? fileURLToPath(context.parentURL)
      : PROJECT_ROOT + '/index.ts';
    const dir = base.slice(0, base.lastIndexOf('/') + 1);
    const abs = pathResolve(dir, specifier.startsWith('file://')
      ? fileURLToPath(specifier)
      : specifier);

    for (const suffix of ['.ts', '/index.ts']) {
      if (existsSync(abs + suffix)) {
        return { url: pathToFileURL(abs + suffix).href, shortCircuit: true };
      }
    }
    if (existsSync(abs)) {
      return { url: pathToFileURL(abs).href, shortCircuit: true };
    }
  }

  return nextResolve(specifier, context);
}

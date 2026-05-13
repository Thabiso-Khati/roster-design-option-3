/**
 * Test runner bootstrap — imported via --import flag.
 *
 * Registers the custom ESM loader so that:
 *   - @/ path aliases resolve to the project root
 *   - Bare .ts file paths get .ts extension added automatically
 *   - next/server and other bundler-only subpaths resolve correctly
 *
 * Using a real file for this (rather than a data: URL) means
 * import.meta.url is a proper file:// URL and pathToFileURL works correctly.
 */
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// __tests__/loader.mjs lives next to this file
register(new URL('./loader.mjs', import.meta.url));

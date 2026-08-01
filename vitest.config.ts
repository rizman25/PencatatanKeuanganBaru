import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/**
 * Deliberately not using the SvelteKit plugin. The seam is the `load` function
 * (spec 0001), which is plain TypeScript — it needs `$lib` resolved and nothing
 * else. Components are not tested here, so the whole Svelte toolchain would be
 * cost without cover.
 */
export default defineConfig({
  resolve: {
    alias: {
      $lib: fileURLToPath(new URL('./src/lib', import.meta.url))
    }
  },
  test: {
    include: ['tests/**/*.test.ts']
  }
});

import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
export default {
  preprocess: vitePreprocess(),
  kit: {
    /**
     * Node 22, not 20: Node 20 reached end of life in April 2026, and a runtime
     * Vercel no longer provisions produces a function that cannot boot — which
     * surfaces as a platform 500 rather than a build failure, because the
     * adapter happily writes whatever version it is given.
     *
     * The region is deliberately not set here. Function region is a project
     * setting on Vercel and is plan-limited, so pinning it in code either does
     * nothing or fails depending on the plan; setting it in the dashboard
     * (Settings → Functions) respects the limits and can be changed without a
     * commit. Singapore is the one to pick — it is where the database lives.
     */
    adapter: adapter({ runtime: 'nodejs22.x' })
  }
};

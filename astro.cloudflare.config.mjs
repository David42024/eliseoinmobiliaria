import { writeFile } from 'node:fs/promises';
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import { siteConfig } from './astro.config.mjs';

export const cloudflareConfig = {
  ...siteConfig,
  adapter: cloudflare({ imageService: 'compile', platformProxy: { enabled: false } }),
  session: { driver: 'memory' },
};

export default defineConfig({
  ...cloudflareConfig,
  outDir: './dist-worker',
  integrations: [{
    name: 'workers-assets-ignore',
    hooks: {
      'astro:build:done': ({ dir }) => writeFile(new URL('.assetsignore', dir), '_worker.js\n_routes.json\n'),
    },
  }],
});

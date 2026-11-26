import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import { siteConfig } from './astro.config.mjs';

export default defineConfig({
  ...siteConfig,
  outDir: './dist-worker',
  adapter: cloudflare({ imageService: 'compile', platformProxy: { enabled: false } }),
  session: { driver: 'memory' },
});

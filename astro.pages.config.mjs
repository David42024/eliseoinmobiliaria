import { defineConfig } from 'astro/config';
import { cloudflareConfig } from './astro.cloudflare.config.mjs';

export default defineConfig({
  ...cloudflareConfig,
  outDir: './dist-pages',
});

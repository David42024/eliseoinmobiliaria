import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import { loadEnv } from 'vite';

const { SITE_URL } = { ...loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), ''), ...process.env };

export default defineConfig({
  site: SITE_URL || undefined,
  adapter: node({ mode: 'standalone' }),
  devToolbar: { enabled: false },
});

import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import { loadEnv } from 'vite';

const { SITE_URL } = { ...loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), ''), ...process.env };

export const siteConfig = {
  site: SITE_URL || undefined,
  devToolbar: { enabled: false },
};

export default defineConfig({
  ...siteConfig,
  adapter: node({ mode: 'standalone' }),
});

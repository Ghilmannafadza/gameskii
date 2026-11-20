import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';

/**
 * Link previews need absolute URLs. Order: SITE_URL (set it in Vercel once you
 * have a custom domain) > Vercel production domain > Vercel deployment URL.
 */
function siteUrl(): string {
  const raw = process.env.SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || '';
  if (!raw) return '';
  return (raw.startsWith('http') ? raw : `https://${raw}`).replace(/\/$/, '');
}

const absoluteMeta = (): Plugin => ({
  name: 'absolute-meta-urls',
  transformIndexHtml(html) {
    return html.replaceAll('__SITE_URL__', siteUrl());
  },
});

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), absoluteMeta()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rolldownOptions: {
        output: {
          advancedChunks: {
            groups: [
              { name: 'supabase', test: /node_modules[\\/]@supabase/ },
              { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
              { name: 'vendor', test: /node_modules/ },
            ],
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

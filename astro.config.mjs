// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import icon from 'astro-icon';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  integrations: [react(), icon()],
  adapter: cloudflare()
});
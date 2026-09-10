// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://nenex.me',
  integrations: [react(), sitemap()],
  adapter: cloudflare({
    // Workers AI バインディングは常に実物のCloudflareへ接続する。既定(true)のままだと
    // `astro build` のプリレンダリング時にリモート接続を張ろうとし、Cloudflareの認証情報が無い
    // CI(.github/workflows/ci.yml)で "Failed to start the remote proxy session" によりビルドが落ちる。
    // 既定をローカルのみにして、実物のWorkers AIで試したいときだけ環境変数で有効化する：
    //   npx wrangler login && CLOUDFLARE_REMOTE_BINDINGS=true npm run dev
    // （ローカルからでも本物を呼ぶため無料枠 10,000 Neurons/日 を消費する）
    // デプロイ後の Worker は実物のバインディングを使うので、本番の挙動には影響しない。
    remoteBindings: process.env.CLOUDFLARE_REMOTE_BINDINGS === 'true',
  }),
});
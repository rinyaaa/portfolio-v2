/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** microCMS のサービスドメイン（https://xxxx.microcms.io の xxxx）。ビルド時のみ使用。 */
  readonly MICROCMS_SERVICE_DOMAIN: string;
  /** microCMS の API キー（GET 権限）。ビルド時のみ使用・クライアントへ送らない。 */
  readonly MICROCMS_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

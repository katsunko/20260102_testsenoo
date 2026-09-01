import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// TODO: 実際のドメイン/GitHub Pagesの公開URLに合わせて site / base を更新してください。
// GitHub Pagesの "https://<owner>.github.io/<repo>/" 形式で公開する場合の暫定値です。
export default defineConfig({
  site: 'https://katsunko.github.io',
  base: '/20260102_testsenoo',
  integrations: [sitemap()],
  vite: {
    // bot/config/affiliate-links.json (リポジトリルート配下、site/の外)を
    // CardCtaコンポーネントから読み込むためにアクセスを許可する
    server: { fs: { allow: ['..'] } },
  },
});

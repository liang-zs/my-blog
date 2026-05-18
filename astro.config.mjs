import { defineConfig } from 'astro/config';

export default defineConfig({
  // 你的 GitHub Pages 根域名
  site: 'https://liang-zs.github.io',
  // 仓库名，决定了访问路径是 /my-blog/...
  base: '/my-blog',
  markdown: {
    // Shiki 是 Astro 内置的代码高亮引擎，不需要额外安装
    shikiConfig: {
      theme: 'github-light',
      wrap: true,
    },
  },
});

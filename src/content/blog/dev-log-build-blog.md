---
title: "开发日志：我是如何从零搭建这个博客的"
date: 2026-05-19
description: "一份完整的记录：从安装第一个软件，到用 Astro 框架重构，再到通过 GitHub Actions 自动部署上线的全过程"
tags: ["开发日志", "技术"]
---

今天把搭建这个博客的全过程记录下来。从第一行代码到网站上线，中间经历了两个阶段：先用纯 HTML/CSS/JS 搭了一个原型，然后用 Astro 框架完整重构，最终通过 GitHub Actions 实现了自动化部署。

这是一个完全没有编程经验的人，一步一步把网站做出来的真实过程。

---

## 第一阶段：安装工具，搭建原型

### 安装了什么

开始之前只需要两个软件：

- **VS Code**：写代码用的编辑器，安装了 Live Server 插件，可以实时预览网页效果
- **Node.js**：后续运行 JavaScript 工具链的环境

### 第一版目录结构

```
my-blog/
├── index.html        ← 首页
├── about.html        ← 关于页面
├── post.html         ← 文章模板页
├── styles/
│   └── main.css      ← 所有样式
├── js/
│   └── post.js       ← 读取 Markdown 的脚本
└── posts/
    └── hello-world.md
```

### 技术实现思路

**首页**做了三件事：头像 + 简介的 Hero 区块、文章列表卡片、社交媒体链接。

**文章页**是最有挑战的部分。核心逻辑是：用 JavaScript 的 `fetch()` 读取 `.md` 文件，再用 `marked.js` 把 Markdown 转成 HTML，注入到页面里：

```javascript
async function loadPost(postName) {
  const response = await fetch(`posts/${postName}.md`);
  const markdown = await response.text();
  document.getElementById('post-content').innerHTML = marked.parse(markdown);
}
```

**目录导航**是自动生成的。JavaScript 扫描文章里所有的 `h2`、`h3` 标题，创建对应的锚点链接，用 `IntersectionObserver` 监听滚动位置，实时高亮当前所在章节。

**响应式设计**用 CSS Grid 实现，文章页桌面端是两栏布局（目录 + 正文），手机端隐藏目录、正文撑满屏幕。

### CSS 设计系统

用 CSS 变量集中管理颜色和间距，方便统一修改：

```css
:root {
  --color-bg: #fafaf8;
  --color-accent: #2563eb;
  --font-serif: 'Noto Serif SC', 'Georgia', serif;
  --spacing-md: 1.5rem;
}
```

导航栏做了毛玻璃效果（`backdrop-filter: blur`），滚动时半透明背景让页面有层次感。

---

## 第二阶段：迁移至 Astro 框架

原型跑通之后，决定用 Astro 重构。原因很直接：原来每篇文章都要手动在 `index.html` 里加卡片，维护成本太高；用 Astro 的 Content Collections，只需丢一个 `.md` 文件进去，其他全部自动处理。

### 什么是 Astro

Astro 是一个静态网站构建框架。它最大的特点是**默认零 JavaScript**：页面在构建时就渲染成 HTML，浏览器不需要跑任何框架代码，所以加载极快。

对博客来说，这是理想的选择。

### 新目录结构

```
my-blog/
├── src/
│   ├── content/
│   │   ├── config.ts          ← 定义文章的数据结构
│   │   └── blog/
│   │       └── *.md           ← 所有文章放这里
│   ├── layouts/
│   │   └── Layout.astro       ← 导航栏 + 页脚的公共模板
│   ├── pages/
│   │   ├── index.astro        ← 首页
│   │   ├── about.astro        ← 关于页
│   │   └── blog/
│   │       └── [slug].astro   ← 动态路由，自动生成每篇文章的页面
│   └── styles/
│       └── global.css
├── .github/workflows/
│   └── deploy.yml             ← 自动部署脚本
└── astro.config.mjs
```

### Content Collections

这是 Astro 最核心的功能。在 `src/content/config.ts` 里定义文章必须包含哪些字段：

```typescript
const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    description: z.string(),
    tags: z.array(z.string()).optional(),
  }),
});
```

每篇 Markdown 文章的开头加上对应的 frontmatter：

```markdown
---
title: "文章标题"
date: 2026-05-19
description: "一句话描述"
tags: ["标签"]
---

正文从这里开始……
```

然后在首页用一行代码读取全部文章：

```typescript
const posts = await getCollection('blog');
posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
```

### 动态路由：[slug].astro

文件名里的方括号 `[slug]` 是 Astro 的动态路由语法。`getStaticPaths()` 告诉 Astro 要生成哪些页面，构建时自动为每篇文章生成独立的 HTML 文件：

```typescript
export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map(post => ({
    params: { slug: post.slug },
    props: { post },
  }));
}
```

代码高亮也不再需要引入 `highlight.js`，Astro 内置了 Shiki 引擎，自动处理所有代码块。

目录导航也升级了：`post.render()` 直接返回文章里所有标题的结构化数据，不再需要 JavaScript 扫描 DOM：

```typescript
const { Content, headings } = await post.render();
// headings: [{ depth: 2, slug: 'section-id', text: '章节标题' }, ...]
```

---

## 第三阶段：部署到 GitHub Pages

### 用 GitHub Actions 自动化

每次手动构建再上传太麻烦。在 `.github/workflows/deploy.yml` 里写了一个自动化流程，只有两个 job：

```yaml
jobs:
  build:
    steps:
      - uses: actions/checkout@v4
      - uses: withastro/action@v3   # 自动完成 npm install + astro build

  deploy:
    needs: build
    steps:
      - uses: actions/deploy-pages@v4
```

**效果**：每次 `git push` 之后，GitHub 自动触发构建，约 2 分钟后网站更新完成。

### 踩过的坑

部署时遇到一个报错：

```
No lockfile found.
Please specify your preferred "package-manager" in the action configuration.
```

原因是 `package-lock.json` 没有提交到 Git 仓库。`withastro/action` 需要通过锁定文件来确定依赖版本，把 `package-lock.json` 加进去就解决了。

---

## 完整技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Astro 4 |
| 样式 | 原生 CSS（CSS 变量 + Grid + Flexbox） |
| 代码高亮 | Shiki（Astro 内置） |
| 字体 | Google Fonts（Inter + Noto Serif SC） |
| 部署 | GitHub Pages + GitHub Actions |
| 版本管理 | Git |

---

## 现在的发布流程

重构之后，写文章的流程极简：

```bash
# 1. 新建文章文件
# src/content/blog/my-new-post.md

# 2. 推送到 GitHub
git add src/content/blog/my-new-post.md
git commit -m "新文章：标题"
git push

# 等待约 2 分钟，网站自动更新
```

---

从第一行 HTML 到现在，整个过程大概花了半天时间。对一个从来没有写过代码的人来说，能把一个有代码高亮、目录导航、响应式布局、自动部署的博客做出来，还是挺有成就感的。

技术不神秘。动手做，就能学会。

---

*谷瑞，2026 年 5 月 19 日*

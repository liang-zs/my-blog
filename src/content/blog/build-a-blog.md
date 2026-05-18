---
title: "我是如何搭建这个博客的"
date: 2026-05-18
description: "从零开始，用纯 HTML、CSS 和 JavaScript 搭建一个支持 Markdown 的个人博客"
tags: ["技术"]
---

> 不需要框架，不需要数据库，只需要三个文件。

## 起点

我想要一个自己的博客，但不想用现成的平台（微信公众号、知乎……），我想完全控制它的样子。

于是我决定：从零开始，自己写代码搭建。

## 技术选型

| 技术 | 用途 |
|------|------|
| HTML | 页面结构 |
| CSS  | 视觉样式 |
| JavaScript | 交互逻辑 |
| Markdown | 写文章 |
| Astro | 构建框架 |

## 项目结构

```
my-blog/
├── src/
│   ├── content/blog/     ← 所有文章放这里（.md 文件）
│   ├── layouts/          ← 页面模板
│   ├── pages/            ← 每个页面
│   └── styles/           ← 样式文件
├── public/               ← 图片等静态资源
└── astro.config.mjs      ← 项目配置
```

## Astro 的核心魔法

只需在 `src/content/blog/` 放一个 `.md` 文件，Astro 会自动：

1. 生成对应的页面（`/blog/文件名`）
2. 渲染 Markdown 为 HTML
3. 应用代码高亮
4. 构建静态站点

核心代码只有几行：

```typescript
// 获取所有文章
import { getCollection } from 'astro:content';
const posts = await getCollection('blog');

// 按日期排序（最新的在前）
posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
```

## 部署到 GitHub Pages

用 GitHub Actions 自动化部署：每次 `git push`，网站自动更新。

```bash
# 写完文章后，只需这两步
git add src/content/blog/新文章.md
git commit -m "新文章：标题"
git push
```

等待约 2 分钟，网站自动更新。

## 收获

搭建这个博客让我学会了：

- Astro 框架的基本用法
- Content Collections 数据管理
- GitHub Actions 自动化部署
- CSS 响应式设计

最重要的是：**动手做比看教程学得快十倍**。

---

*谷瑞，2026 年 5 月 18 日*

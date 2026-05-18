# 我是如何搭建这个博客的

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
| marked.js | Markdown → HTML |
| highlight.js | 代码高亮 |

没有框架，没有数据库，没有服务器。纯静态文件。

## 项目结构

```
my-blog/
├── index.html          ← 首页
├── about.html          ← 关于页
├── post.html           ← 文章模板页
├── styles/
│   └── main.css        ← 所有样式
├── js/
│   └── post.js         ← 加载文章的逻辑
└── posts/
    ├── hello-world.md  ← 第一篇文章
    └── build-a-blog.md ← 这篇文章
```

## 最难的部分：Markdown 渲染

最开始我以为读取 Markdown 文件很复杂，但其实核心逻辑只有几行：

```javascript
const response = await fetch(`posts/${postName}.md`);
const text = await response.text();
document.getElementById('content').innerHTML = marked.parse(text);
```

1. `fetch` 读取文件内容（字符串）
2. `marked.parse()` 把 Markdown 字符串转成 HTML 字符串
3. 把 HTML 注入到页面里

就这三步。

## 目录导航是怎么实现的？

页面左侧的目录是自动生成的，不需要手动维护：

```javascript
// 找出文章里所有 h2、h3 标题
const headings = document.querySelectorAll('h2, h3');

headings.forEach((heading, index) => {
  heading.id = `section-${index}`;  // 给标题加 id

  const link = document.createElement('a');
  link.href = `#section-${index}`;   // 创建锚点链接
  link.textContent = heading.textContent;

  tocEl.appendChild(link);
});
```

每次文章加载完，JavaScript 自动扫描所有标题，生成对应的目录链接。

## 收获

搭建这个博客让我学会了：

- HTML 的语义化结构
- CSS Grid 实现两栏布局
- JavaScript 的异步操作（`async/await`）
- 如何用 `IntersectionObserver` 做滚动监听

最重要的是：**动手做比看教程学得快十倍**。

---

*谷瑞，2026 年 5 月 19 日*

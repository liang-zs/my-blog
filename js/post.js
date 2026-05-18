// 从 URL 中读取文章名称
// 例如：post.html?post=hello-world → postName = "hello-world"
const params = new URLSearchParams(window.location.search);
const postName = params.get('post');

// 配置 marked.js：开启 GitHub 风格 Markdown
marked.setOptions({
  gfm: true,       // GitHub Flavored Markdown（支持表格、任务列表等）
  breaks: true,    // 单个换行符也变成 <br>
});

// 主函数：加载并渲染文章
async function loadPost() {
  const contentEl = document.getElementById('post-content');
  const metaEl    = document.getElementById('post-meta');

  // 没有指定文章名，显示错误
  if (!postName) {
    contentEl.innerHTML = '<p class="error-msg">未指定文章，请从首页点击文章链接进入。</p>';
    return;
  }

  try {
    // 用 fetch 从服务器读取 .md 文件（Live Server 会把本地文件当服务器提供）
    const response = await fetch(`posts/${postName}.md`);

    if (!response.ok) {
      throw new Error('文章不存在');
    }

    const markdownText = await response.text();

    // 解析 Markdown → HTML
    contentEl.innerHTML = marked.parse(markdownText);

    // 对所有代码块应用语法高亮
    contentEl.querySelectorAll('pre code').forEach(block => {
      hljs.highlightElement(block);
    });

    // 更新页面标题（取文章第一个 h1）
    const firstH1 = contentEl.querySelector('h1');
    if (firstH1) {
      document.title = firstH1.textContent + ' · 谷瑞的博客';
    }

    // 生成目录导航
    generateTOC();

  } catch (err) {
    contentEl.innerHTML = `
      <div class="error-msg">
        <p>😕 文章加载失败：${err.message}</p>
        <a href="index.html">← 返回首页</a>
      </div>
    `;
  }
}

// 自动生成目录
function generateTOC() {
  const contentEl = document.getElementById('post-content');
  const tocEl     = document.getElementById('toc');

  // 找出文章里所有的 h2 和 h3 标题
  const headings = contentEl.querySelectorAll('h2, h3');

  if (headings.length === 0) {
    // 没有标题就隐藏目录栏
    document.querySelector('.toc-sidebar').style.display = 'none';
    return;
  }

  headings.forEach((heading, index) => {
    // 给每个标题加一个 id，方便锚点跳转
    const id = `section-${index}`;
    heading.id = id;

    // 创建目录链接
    const link = document.createElement('a');
    link.href        = `#${id}`;
    link.textContent = heading.textContent;
    link.className   = `toc-link toc-${heading.tagName.toLowerCase()}`;

    tocEl.appendChild(link);
  });

  // 滚动时高亮当前标题（阅读进度提示）
  observeHeadings(headings);
}

// 用 IntersectionObserver 监听滚动，高亮目录中的当前章节
function observeHeadings(headings) {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        const id   = entry.target.id;
        const link = document.querySelector(`.toc-link[href="#${id}"]`);
        if (!link) return;

        if (entry.isIntersecting) {
          document.querySelectorAll('.toc-link').forEach(l => l.classList.remove('active'));
          link.classList.add('active');
        }
      });
    },
    { rootMargin: '-10% 0px -80% 0px' }
  );

  headings.forEach(h => observer.observe(h));
}

// 页面加载后执行
loadPost();

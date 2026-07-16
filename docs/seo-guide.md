# 图片处理工具箱 — SEO 优化指南

> 让用户通过 Google/百度搜索到你的工具

---

## 已完成的 SEO 工作

### 页面层面（已修改 `index.html`）

| 优化项 | 内容 | 作用 |
|---|---|---|
| `<title>` | 「在线图片处理工具 — 免费图片编辑 | 灰度/滤镜/裁剪/缩放」 | 搜索结果标题 |
| `meta description` | 155 字描述，含核心关键词 | 搜索结果摘要 |
| `meta keywords` | 图片处理,在线图片编辑,免费图片处理… | 百度仍参考此标签 |
| `canonical` | 规范 URL，防止重复内容 | 避免搜索引擎降权 |
| Open Graph | og:title / og:description | 社交分享预览 |
| Twitter Card | summary_large_image | Twitter 分享大图卡片 |
| JSON-LD | WebApplication 结构化数据 | Google 富文本结果 |
| 页面底部关键词区块 | `<h2>` + `<p>` 含 20+ 关键词 | 增加关键词密度 |

### 文件层面（已创建）

| 文件 | 作用 |
|---|---|
| `public/sitemap.xml` | 告诉搜索引擎有哪些页面 |
| `public/robots.txt` | 允许所有爬虫 |
| `public/_headers` | Cloudflare 缓存加速（站点快 → 排名加分） |

### 性能层面（已有的优势）

- WASM 加载速度：首次 300KB gzip，二次 0KB（缓存）
- Cloudflare CDN 全球 300+ 节点，延迟低
- 纯静态站点，首次内容渲染 < 1s

---

## 部署后必须做的 4 件事

### 1. 提交到 Google Search Console（免费）

1. 打开 https://search.google.com/search-console
2. 添加资源 → 输入 `https://image-toolbox.pages.dev`
3. 验证方式：选 **URL 前缀** → 上传 HTML 文件到 `www/public/` 目录
4. 验证通过后 → **提交 sitemap**：粘贴 `https://image-toolbox.pages.dev/sitemap.xml`
5. 手动请求收录：顶部搜索栏粘贴 URL → 点击「请求编入索引」

> 提交后 Google 会在 **1-7 天** 内抓取你的页面。

### 2. 提交到百度搜索资源平台

百度需要额外操作：

1. 打开 https://ziyuan.baidu.com
2. 添加站点 → 验证所有权
3. 提交 sitemap
4. 使用「普通收录」→ 手动提交首页 URL

> 百度收录比 Google 慢，通常 **1-4 周**。

### 3. 提交到必应 Webmaster Tools

1. 打开 https://www.bing.com/webmasters
2. 导入 Google Search Console 数据（一键）
3. 无需单独验证

### 4. 更新 sitemap 中的域名

部署后，如果你改了项目名或绑定了自定义域名，需要更新 `public/sitemap.xml` 和 `public/robots.txt` 中的 URL。

---

## 关键词策略

### 当前覆盖的核心词（已嵌入标题和内容）

| 搜索词 | 月搜索量（估计） | 竞争度 |
|---|---|---|
| **在线图片处理** | 高 | 高 |
| **免费图片编辑** | 高 | 高 |
| **图片裁剪** | 中 | 低 |
| **图片缩放** | 中 | 低 |
| **图片滤镜** | 中 | 低 |
| **图片灰度转换** | 中低 | 低 |
| **图片旋转** | 中低 | 低 |
| **马赛克工具** | 中低 | 低 |
| **老照片效果** | 低 | 低 |

> 策略：先抢占**长尾低竞争词**（如"老照片效果在线工具"），慢慢辐射到高竞争词。

### 如何扩展关键词

在 `index.html` 底部的 `<footer>` SEO 区块中，用自然语句嵌入更多关键词：

```html
<p>支持 <strong>PNG转JPEG</strong>、<strong>图片压缩</strong>、<strong>在线抠图效果</strong>…</p>
```

---

## 外链建设（免费方法）

有了外链，排名才会起来。以下是零成本方案：

| 方法 | 操作 | 效果 |
|---|---|---|
| **Product Hunt 发布** | 英文标题 "Image Toolbox — Free browser-based image editor powered by WASM" | 获得 DA 90+ 的外链 |
| **GitHub 开源** | README 中放工具链接 | 获得 GitHub 外链 |
| **知乎/掘金 发文章** | 标题 "我用 Rust 写了个浏览器图片处理工具" | 中文社区曝光 |
| **V2EX 分享** | 发到「分享创造」节点 | 精准技术用户 |
| **Reddit** | r/rust, r/webdev, r/webassembly 社区 | 海外曝光 |
| **小众软件 / 异次元** | 投稿推荐 | 中文工具类大站外链 |

---

## 监控效果

### Google Search Console（免费）

- **效果** 标签 → 查看搜索词、点击量、排名
- **网址检查** → 输入 URL 查看是否被收录
- **索引** → 覆盖率 → 查看哪些页面被收录/未收录

### 百度统计（免费）

```html
<!-- 在 index.html <head> 中添加 -->
<script>
  var _hmt = _hmt || [];
  (function() {
    var hm = document.createElement("script");
    hm.src = "https://hm.baidu.com/hm.js?你的百度统计ID";
    var s = document.getElementsByTagName("script")[0];
    s.parentNode.insertBefore(hm, s);
  })();
</script>
```

---

## 常见问题

### Q: 多久能搜到？

| 搜索引擎 | 收录时间 |
|---|---|
| Google | 1-7 天 |
| 必应 | 3-10 天 |
| 百度 | 1-4 周 |
| 搜狗/360 | 不一定收录 |

### Q: 为什么搜不到我的工具？

1. 先确认页面已被收录：Google 搜 `site:image-toolbox.pages.dev`
2. 如果未收录：去 Search Console 手动提交
3. 如果已收录但排名低：内容太少，外链不够——参考「外链建设」章节

### Q: 单页工具站能排第一吗？

直接搜"图片处理"不可能排第一（前面是全站聚合类大站）。但长尾词"图片老照片效果在线工具"这种，单页可以排进第一页——关键是**关键词够精准** + **外链够多**。

---

## 速查卡

```
┌─────────────────────────────────────────────┐
│  上线后 SEO 必做清单                         │
│  ─────────────────────────────────────────  │
│  ☐ 1. Google Search Console 提交 sitemap    │
│  ☐ 2. 百度搜索资源平台 提交首页              │
│  ☐ 3. 必应 Webmaster 导入 GSC               │
│  ☐ 4. 把工具发到 V2EX / 知乎 / Reddit       │
│  ☐ 5. 1 周后检查 site:xxx.pages.dev 是否有结果│
│  ☐ 6. 2 周后看 Search Console 搜索词报告     │
└─────────────────────────────────────────────┘
```

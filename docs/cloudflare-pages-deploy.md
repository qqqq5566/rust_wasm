# 部署到 Cloudflare Pages — 完整操作指南

> 预计耗时：30 分钟（含 GitHub 推送 + Cloudflare 配置）  
> 费用：**$0**（Cloudflare Pages 免费额度：无限站点、无限请求、500 次构建/月）

---

## 目录

1. [前置准备](#1-前置准备)
2. [推送代码到 GitHub](#2-推送代码到-github)
3. [连接 Cloudflare Pages](#3-连接-cloudflare-pages)
4. [配置构建参数](#4-配置构建参数)
5. [首次部署 & 验证](#5-首次部署--验证)
6. [绑定自定义域名](#6-绑定自定义域名可选)
7. [接入广告 AdSense](#7-接入广告-adsense)
8. [缓存优化](#8-缓存优化)
9. [后续更新流程](#9-后续更新流程)
10. [常见问题](#10-常见问题)

---

## 1. 前置准备

| 账号/工具 | 用途 | 注册链接 |
|---|---|---|
| GitHub 账号 | 代码托管 | https://github.com |
| Cloudflare 账号 | 静态站点托管 | https://dash.cloudflare.com/sign-up |
| Git | 推送代码 | 已安装（`git --version` 确认） |
| 域名（可选） | 自定义域名 | 阿里云/腾讯云/Namecheap 等 |

---

## 2. 推送代码到 GitHub

### 2.1 创建 GitHub 仓库

1. 打开 https://github.com/new
2. Repository name: `image-toolbox`（或你喜欢的名字）
3. 选择 **Public**（免费私有仓库也支持 Cloudflare Pages）
4. **不要**勾选 "Add a README file"、"Add .gitignore"、"Choose a license"
5. 点击 **Create repository**

### 2.2 推送本地代码

```bash
# 在项目根目录执行
cd /d/app/rust/study/wasm

# 初始化 Git
git init
git add .
git commit -m "feat: 图片处理工具箱 — Rust + WASM + Vite"

# 关联远程仓库（替换为你的仓库 URL）
git remote add origin https://github.com/你的用户名/image-toolbox.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

推送完成后，刷新 GitHub 页面确认代码已上传。

---

## 3. 连接 Cloudflare Pages

### 3.1 进入 Cloudflare Dashboard

1. 登录 https://dash.cloudflare.com
2. 左侧菜单点击 **Workers & Pages**
3. 点击 **Pages** 标签
4. 点击 **连接到 Git** 按钮

### 3.2 授权 GitHub

1. 选择 **GitHub** 作为 Git 提供商
2. 点击 **连接 GitHub**
3. 授权 Cloudflare Pages 访问你的仓库：
   - 选择 **Only select repositories**
   - 搜索并勾选 `image-toolbox`
   - 点击 **Install & Authorize**

### 3.3 选择仓库

授权后回到 Cloudflare Pages 页面：
1. 在仓库列表中找到 `你的用户名/image-toolbox`
2. 点击 **开始设置**

---

## 4. 配置构建参数

到达 **Set up builds and deploys** 页面，填写以下配置：

### 构建配置

| 配置项 | 值 |
|---|---|
| **Project name** | `image-toolbox`（自动填充） |
| **Production branch** | `main`（默认） |

### 构建设置

| 配置项 | 值 |
|---|---|
| **Build command** | `bash cloudflare-build.sh` |
| **Build output directory** | `www/dist` |

### 环境变量（可选）

无需添加任何环境变量。Cloudflare Pages 默认提供 Node.js v18+ 环境。

### 配置截图对照

```
┌──────────────────────────────────────────────────────┐
│  Build settings                                      │
│                                                      │
│  Build command                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │ bash cloudflare-build.sh                         ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  Build output directory                             │
│  ┌──────────────────────────────────────────────────┐│
│  │ www/dist                                         ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  Root directory (advanced)                          │
│  ┌──────────────────────────────────────────────────┐│
│  │ /                                                ││
│  └──────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────┘
```

4. 点击 **Save and Deploy**

---

## 5. 首次部署 & 验证

### 5.1 等待构建

Cloudflare 会自动：
1. 克隆你的仓库
2. 安装 `wasm-pack`
3. 编译 `rust-wasm` → WASM
4. 复制 WASM 文件到 `www/src/wasm/`
5. 运行 `vite build`
6. 将 `www/dist/` 部署到全球 CDN

构建日志可实时查看，预计耗时 **2-3 分钟**。

### 5.2 验证部署

构建成功后，Cloudflare 会分配一个 `*.pages.dev` 域名：

```
✅ 部署成功！
   访问: https://image-toolbox.pages.dev
```

在浏览器打开这个 URL：
1. 拖入一张图片——确认上传和原图显示正常
2. 点击「灰度」「反色」等按钮——确认 WASM 加载成功
3. 拖动亮度/模糊滑块——确认实时处理正常
4. 用 Chrome DevTools → Network 标签，搜索 `.wasm`，确认 WASM 文件正常加载（200 OK）

---

## 6. 绑定自定义域名（可选）

### 6.1 在 Cloudflare 添加域名

1. Cloudflare Dash → **Websites** → **添加站点**
2. 输入你的域名（如 `imgtool.com`）
3. 选择 **Free** 计划
4. 按向导修改域名的 DNS 服务器（Nameserver）指向 Cloudflare

### 6.2 在 Cloudflare Pages 绑定

1. 进入你的 Pages 项目 → **Custom domains**
2. 点击 **设置自定义域**
3. 输入域名（如 `img.你的域名.com`）
4. Cloudflare 自动配置 DNS 和 SSL 证书（Let's Encrypt）

### 6.3 DNS 生效

- 如果域名 DNS 已在 Cloudflare 管理：**即时生效**
- 如果域名在其他平台：需要修改 NS 记录，等待 **24-48 小时**

---

## 7. 接入广告 AdSense

### 7.1 注册 Google AdSense

1. 打开 https://adsense.google.com
2. 点击 **开始使用**
3. 输入你的网站 URL（如 `https://image-toolbox.pages.dev`）
4. 等待审核（通常 **1-7 天**，工具类站点通过率高）

### 7.2 添加广告代码

审核通过后，将 AdSense 代码添加到 `www/index.html` 的 `<head>` 中：

```html
<head>
  <!-- Google AdSense -->
  <script async
    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-你的发布商ID"
    crossorigin="anonymous">
  </script>
  <!-- ... 原有 meta/css ... -->
</head>
```

在广告位显示位置插入：

```html
<!-- 适合放在工具操作区下方、不干扰使用的位置 -->
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-你的发布商ID"
     data-ad-slot="广告单元ID"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
```

> ⚠️ **注意**：工具类站点广告位不宜过多（1-2 个即可），否则影响用户体验和 SEO 排名。

---

## 8. 缓存优化

在项目根目录创建 `www/public/_headers` 文件（Cloudflare Pages 自动识别）：

```txt
# 设置 WASM 文件的缓存和正确的 MIME 类型
/assets/*.wasm
  Cache-Control: public, max-age=31536000, immutable
  Content-Type: application/wasm

# HTML 页面短缓存
/index.html
  Cache-Control: public, max-age=3600

# JS/CSS 带 hash 的长缓存
/assets/*.js
  Cache-Control: public, max-age=31536000, immutable
/assets/*.css
  Cache-Control: public, max-age=31536000, immutable
```

> `_headers` 文件会被 Cloudflare Pages 在部署时自动应用。

---

## 9. 后续更新流程

每次更新代码后：

```bash
# 1. 修改代码...

# 2. 本地测试
./build.ps1
cd www && npm run dev  # 确认功能正常

# 3. 提交推送
git add .
git commit -m "feat: 添加新滤镜 xxx"
git push origin main
```

推送后 Cloudflare Pages **自动触发重新构建和部署**，无需手动操作。3 分钟后访问网站即可看到更新。

---

## 10. 常见问题

### Q1: 构建失败：wasm-pack 安装超时

**原因**：Cloudflare 构建环境网络波动。

**解决**：在 `cloudflare-build.sh` 中 wasm-pack 安装行前加重试逻辑：

```bash
# 重试 3 次
for i in 1 2 3; do
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh && break
    echo "重试 $i..."
    sleep 5
done
```

### Q2: WASM 文件返回 404

**原因**：WASM 文件未被 Vite 打包进 dist。

**解决**：确认 `www/src/wasm/` 目录存在且包含 `.wasm` 文件。检查 `build.ps1` 的 Step 2 是否正确执行。

### Q3: 首次加载慢（WASM 文件 800KB+）

**解决**：这是正常的。Cloudflare CDN 会缓存 WASM 文件，加上 Brotli 压缩后实际传输约 **300KB**。第二次访问几乎秒开。如需进一步优化：
- 在 Rust `Cargo.toml` 中已启用 `opt-level = "s"` 和 `lto = true`
- 考虑 WASM 分包或懒加载

### Q4: AdSense 审核不通过

**原因**：网站内容不足或缺少必要页面。

**解决**：
1. 添加「关于」「隐私政策」「使用条款」页面
2. 确保网站有实质性内容和一定流量
3. 可以在审核通过后再申请

### Q5: 如何查看网站分析数据？

添加 Google Analytics：

```html
<!-- 在 index.html <head> 中添加 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-你的测量ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-你的测量ID');
</script>
```

---

## 附：项目文件结构（部署视角）

```
image-toolbox/
├── rust-wasm/                # Rust 源码
│   ├── Cargo.toml
│   └── src/lib.rs
├── www/                      # 前端（独立的 Vite 项目）
│   ├── index.html            # 入口 + AdSense 代码
│   ├── vite.config.js
│   ├── package.json
│   ├── public/
│   │   └── _headers           # Cloudflare 缓存配置
│   └── src/
│       ├── wasm/              # [构建时生成] WASM 产物
│       ├── main.js
│       ├── wasm-loader.js
│       └── style.css
├── cloudflare-build.sh       # Cloudflare Pages 构建脚本
├── build.ps1                  # Windows 本地构建脚本
├── .gitignore
└── README.md
```

---

## 速查卡

```
┌─────────────────────────────────────────────────┐
│  Cloudflare Pages 部署速查                       │
│  ──────────────────────────────────────────────  │
│  Build command:   bash cloudflare-build.sh       │
│  Output dir:      www/dist                       │
│  Root dir:        /                              │
│  Branch:          main                           │
│  ──────────────────────────────────────────────  │
│  部署后 URL:      https://xxx.pages.dev          │
│  自动部署:        git push → 自动触发            │
│  费用:            免费                            │
└─────────────────────────────────────────────────┘
```

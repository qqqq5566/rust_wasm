# 部署到 Cloudflare Pages — 完整操作指南

> 实际验证通过，2026-07 最新配置  
> 费用：**$0**（Cloudflare 免费额度）

---

## 目录

1. [前置准备](#1-前置准备)
2. [项目文件清单](#2-项目文件清单)
3. [推送代码到 GitHub](#3-推送代码到-github)
4. [Cloudflare 配置](#4-cloudflare-配置)
5. [部署 & 验证](#5-部署--验证)
6. [后续更新流程](#6-后续更新流程)
7. [常见踩坑与解决](#7-常见踩坑与解决)
8. [绑定自定义域名 - 可选](#8-绑定自定义域名可选)
9. [接入广告 AdSense](#9-接入广告-adsense)

---

## 1. 前置准备

| 账号/工具 | 用途 |
|---|---|
| GitHub 账号 | 代码托管 |
| Cloudflare 账号 | 部署 + CDN |
| Git | 推送代码 |
| 本地 Rust + wasm-pack | **仅**本地编译 WASM |

---

## 2. 项目文件清单

以下文件是部署必需的，确认均已创建：

```
项目根目录/
├── wrangler.toml              # Cloudflare 部署配置（必选）
├── cloudflare-build.sh        # Cloudflare 构建脚本
├── build.ps1                  # Windows 本地构建脚本
├── .gitignore
├── www/
│   ├── index.html             # 首页
│   ├── tools/                 # 各工具页面
│   ├── vite.config.js
│   ├── package.json
│   ├── public/
│   │   ├── _headers           # 缓存规则
│   │   ├── robots.txt
│   │   └── sitemap.xml
│   └── src/
│       ├── wasm/              # ⚠️ 预编译并提交到 Git
│       │   ├── rust_wasm.js
│       │   ├── rust_wasm_bg.wasm
│       │   └── ...
│       ├── wasm-loader.js
│       ├── style.css
│       └── tools/             # 各工具 JS
└── rust-wasm/
    └── src/                   # Rust 源码（Cloudflare 不编译它）
```

### 关键配置文件的正确内容

**wrangler.toml**（纯静态站点，不需要 Worker）：

```toml
name = "use-tools"
compatibility_date = "2025-07-15"

[assets]
directory = "./www/dist"
html_handling = "auto-trailing-slash"
```

> ⚠️ **不要**加 `main` 字段——加了 wrangler 会把 HTML 当成 JS Worker 代码执行而报错。

**cloudflare-build.sh**（只做前端构建，不编译 Rust）：

```bash
#!/bin/bash
set -e
echo "========================================="
echo "  图片处理工具箱 — Cloudflare 构建"
echo "========================================="
echo ""
echo "WASM 已预编译提交，跳过 Rust 编译"
echo ""

echo "[1/2] 安装前端依赖..."
cd www
npm install

echo "[2/2] 构建前端..."
npm run build
cd ..

echo ""
echo "✅ 构建完成！输出目录: www/dist/"
```

**.gitignore**（关键：不能忽略 `www/src/wasm/`）：

```gitignore
# Rust
rust-wasm/target/
rust-wasm/pkg/

# Node
node_modules/
www/dist/

# IDE
.vscode/
.idea/
```

---

## 3. 推送代码到 GitHub

### 3.1 本地构建 WASM（每次改 Rust 代码后）

```powershell
.\build.ps1     # 编译 Rust WASM + 复制到 www/src/wasm/ + npm install
```

> `build.ps1` 会自动删除 `www/src/wasm/.gitignore`（wasm-pack 生成的文件，内容为 `*`，会导致 Git 忽略所有 WASM 文件）。

### 3.2 提交并推送

```bash
git add .
git commit -m "feat: 工具箱 v1.0"
git branch -M main
git remote add origin https://github.com/你的用户名/项目名.git
git push -u origin main
```

推送后在 GitHub 仓库确认 `www/src/wasm/` 目录下的 `.wasm` 文件存在。

---

## 4. Cloudflare 配置

### 4.1 连接仓库

1. 登录 https://dash.cloudflare.com
2. 左侧 **Workers & Pages** → **Pages** → **连接到 Git**
3. 授权 GitHub，选择你的仓库

### 4.2 构建参数

| 配置项 | 值 |
|---|---|
| **构建命令** | `bash cloudflare-build.sh` |
| **构建输出目录** | `www/dist` |
| **根目录** | `/`（或留空） |
| **部署命令** | `npx wrangler deploy` |

```
┌──────────────────────────────────────────────────────┐
│  Build command                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │ bash cloudflare-build.sh                         ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  Deploy command                                     │
│  ┌──────────────────────────────────────────────────┐│
│  │ npx wrangler deploy                              ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  Build output directory                             │
│  ┌──────────────────────────────────────────────────┐│
│  │ www/dist                                         ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  Root directory                                     │
│  ┌──────────────────────────────────────────────────┐│
│  │ /                                                ││
│  └──────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────┘
```

> ⚠️ **根目录不能填 `www/dist`**——Cloudflare 会 cd 到该目录再执行构建命令，导致找不到脚本。

点击 **Save and Deploy**。

---

## 5. 部署 & 验证

Cloudflare 自动执行：

```
1. git clone 仓库
2. cd /                          ← 从项目根目录执行
3. bash cloudflare-build.sh      ← npm install + vite build（约 30 秒）
4. npx wrangler deploy           ← 部署 www/dist/ 到全球 CDN
                                 （wrangler.toml 指定了 assets 目录）
```

构建成功后，Cloudflare 分配 `*.pages.dev` 域名：

```
✅ 部署成功！
   https://你的项目名.pages.dev
```

打开浏览器验证：首页 8 个工具卡片 → 点进去功能正常 → WASM 文件 200 OK。

---

## 6. 后续更新流程

### 只改前端代码（HTML/CSS/JS）

```bash
git add . && git commit -m "fix: xxx" && git push
```

### 改了 Rust 代码

```bash
# 1. 本地重新编译 WASM
.\build.ps1

# 2. 提交新的 WASM 文件
git add www/src/wasm/
git commit -m "feat: 新增 Rust 功能 xxx"
git push
```

每次 `git push` 后 Cloudflare 自动重新构建部署。

---

## 7. 常见踩坑与解决

### ❌ 构建失败：wasm-pack 找不到 Rust

```
wasm-pack-init: failed to find Rust installation
```

**原因**：Cloudflare 构建环境没有 Rust 工具链。

**解决**：WASM 在本地预编译，`cloudflare-build.sh` 只做 `npm install && npm run build`，不碰 Rust。

---

### ❌ 构建失败：Could not resolve "./wasm"

```
Could not resolve "./wasm" from "src/wasm-loader.js"
```

**原因**：`www/src/wasm/` 没有提交到 Git（被 `.gitignore` 排除了）。

**解决**：
1. 确保 `.gitignore` **不包含** `www/src/wasm/`
2. 删除 `www/src/wasm/.gitignore`（wasm-pack 生成，内容为 `*` 会排除所有文件）
3. 手动 `git add www/src/wasm/ && git commit && git push`

`build.ps1` 已自动处理删除该文件。

---

### ❌ 部署失败：No loader is configured for ".html" files

```
No loader is configured for ".html" files: www/dist/index.html
```

**原因**：`wrangler.toml` 里有 `main` 字段，wrangler 把 HTML 当 Worker 入口了。

**解决**：删除 `main` 字段，只保留 `[assets]` 块。纯静态站点不需要 Worker。

---

### ❌ 构建失败：找不到 cloudflare-build.sh

**原因**：**根目录**设成了 `www/dist`，Cloudflare cd 进去后找不到脚本。

**解决**：根目录改成 `/`。

---

### ❌ 重试构建还是旧代码

"重试"按钮不会重新拉取仓库。代码有改动时直接 `git push`，Cloudflare 自动触发新构建。

---

## 8. 绑定自定义域名 - 可选

1. Cloudflare Dash → **Websites** → **添加站点** → 输入域名
2. 修改域名 NS 记录指向 Cloudflare
3. Pages 项目 → **Custom domains** → 绑定域名
4. Cloudflare 自动配置 DNS + SSL

---

## 9. 接入广告 AdSense

1. 注册 https://adsense.google.com
2. 网站 URL 填 `https://你的项目名.pages.dev`
3. 审核通过后在 `www/index.html` `<head>` 中添加 AdSense 代码
4. 每个工具页面底部可放 1 个广告位

> 工具类站点 1-2 个广告位即可，多了影响体验和 SEO。

---

## 速查卡

```
┌──────────────────────────────────────────────────┐
│  Cloudflare Pages 部署速查                        │
│  ─────────────────────────────────────────────── │
│  Build command:    bash cloudflare-build.sh       │
│  Deploy command:   npx wrangler deploy            │
│  Output dir:       www/dist                       │
│  Root dir:         /                              │
│  ─────────────────────────────────────────────── │
│  ⚠️ WASM 必须本地预编译并提交到 Git               │
│  ⚠️ wrangler.toml 不能有 main 字段                │
│  ⚠️ www/src/wasm/.gitignore 必须删除             │
│  ⚠️ 根目录不能填 www/dist                        │
│  ─────────────────────────────────────────────── │
│  部署 URL:  https://xxx.pages.dev                │
│  自动部署:  git push → 自动触发                   │
│  费用:      免费                                  │
└──────────────────────────────────────────────────┘
```

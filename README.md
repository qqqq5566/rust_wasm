# 🖼 图片处理工具箱 — Rust + WASM + JS

一个完全在浏览器本地运行的图片处理工具，核心算法由 Rust 编写编译为 WebAssembly，前端使用原生 JavaScript + Vite。

## 功能

- 🌫 **灰度转换** — 一键转为黑白
- ☀️ **亮度调整** — 滑块实时调节
- 🎯 **对比度** — 增强或减弱
- 🔍 **高斯模糊** — 可调模糊半径
- ↔ **水平/垂直翻转**
- ↻ **旋转** — 90°/180°/270°
- 💾 **下载结果** — 保存为 PNG

所有处理在浏览器本地完成，图片不会上传到任何服务器。

## 项目结构

```
├── rust-wasm/         # Rust 源码，编译为 WASM
│   ├── Cargo.toml
│   └── src/lib.rs     # 图片处理核心逻辑
├── www/               # 前端界面
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── main.js        # UI 交互逻辑
│       ├── wasm-loader.js  # WASM 异步加载封装
│       └── style.css
├── build.ps1           # Windows 一键构建脚本
└── README.md
```

## 快速开始

### 前置条件

- [Rust](https://rustup.rs) + `wasm32-unknown-unknown` target
- [wasm-pack](https://rustwasm.github.io/wasm-pack/)
- [Node.js](https://nodejs.org) >= 18

### 构建 & 运行

**Windows:**
```powershell
.\build.ps1
cd www
npm run dev
```

**手动步骤:**
```bash
# 1. 编译 Rust → WASM
cd rust-wasm
wasm-pack build --target web

# 2. 启动前端
cd ../www
npm install
npm run dev
```

浏览器打开 `http://localhost:3000`，拖入图片即可开始处理。

## 技术栈

| 层 | 技术 |
|---|---|
| 核心算法 | Rust (`image` crate) |
| 编译目标 | WebAssembly |
| JS ↔ WASM | `wasm-bindgen` |
| 打包工具 | Vite |
| UI | 原生 JS + CSS |

## 学习要点

1. **WASM 内存模型** — `Uint8Array` 与 Rust `&[u8]` 的零拷贝传递
2. **wasm-bindgen** — Rust 函数导出、`JsValue` 互操作
3. **wasm-pack** — `--target web` 模式，ES 模块直接导入
4. **异步加载** — `import()` 动态加载 WASM 避免阻塞
5. **图片处理** — `image` crate 的解码/处理/编码流水线

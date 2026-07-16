#!/bin/bash
# === Cloudflare Pages 构建脚本 ===
# 在 Cloudflare Pages 的 Ubuntu 构建环境中执行
set -e

echo "========================================="
echo "  图片处理工具箱 — Cloudflare 构建"
echo "========================================="

# 1. 安装 wasm-pack（预编译二进制，无需 Rust 工具链）
echo "[1/4] 安装 wasm-pack..."
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
source "$HOME/.cargo/env"
echo "wasm-pack $(wasm-pack --version) 安装完成"

# 2. 编译 Rust → WASM
echo "[2/4] 编译 Rust → WASM..."
cd rust-wasm
wasm-pack build --target web
cd ..

# 3. 复制 WASM 产物到前端
echo "[3/4] 复制 WASM 文件..."
rm -rf www/src/wasm
cp -r rust-wasm/pkg www/src/wasm
echo "WASM 已复制到 www/src/wasm/"

# 4. 构建前端
echo "[4/4] 构建前端..."
cd www
npm install
npm run build
cd ..

echo "✅ 构建完成！输出目录: www/dist/"

#!/bin/bash
# === Cloudflare Pages 构建脚本 ===
# WASM 二进制在本地预编译并提交到 Git，Cloudflare 只跑前端构建
set -e

echo "========================================="
echo "  图片处理工具箱 — Cloudflare 构建"
echo "========================================="
echo ""
echo "WASM 已预编译提交，跳过 Rust 编译步骤"
echo ""

echo "[1/2] 安装前端依赖..."
cd www
npm install

echo "[2/2] 构建前端..."
npm run build
cd ..

echo ""
echo "✅ 构建完成！输出目录: www/dist/"

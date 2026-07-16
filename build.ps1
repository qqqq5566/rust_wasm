# === 图片处理工具箱 — 一键构建脚本 ===
$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  图片处理工具箱 — 构建脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: 编译 Rust → WASM
Write-Host "[1/4] 编译 Rust → WASM..." -ForegroundColor Yellow
Set-Location $PSScriptRoot/rust-wasm
wasm-pack build --target web
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Rust 编译失败！" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Rust → WASM 编译完成" -ForegroundColor Green
Write-Host ""

# Step 2: 复制 WASM 产物到前端目录
Write-Host "[2/4] 复制 WASM 到前端目录..." -ForegroundColor Yellow
$src = "$PSScriptRoot/rust-wasm/pkg"
$dest = "$PSScriptRoot/www/src/wasm"
if (Test-Path $dest) { Remove-Item -Recurse -Force $dest }
Copy-Item -Recurse $src $dest
Write-Host "✅ WASM 已复制到 www/src/wasm/" -ForegroundColor Green
Write-Host ""

# Step 3: 安装前端依赖
Write-Host "[3/4] 安装前端依赖..." -ForegroundColor Yellow
Set-Location $PSScriptRoot/www
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install 失败！" -ForegroundColor Red
    exit 1
}
Write-Host "✅ 前端依赖安装完成" -ForegroundColor Green
Write-Host ""

# Step 4: 提示
Write-Host "[4/4] 准备就绪！" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  构建完成！" -ForegroundColor Cyan
Write-Host "  开发模式: cd www && npm run dev" -ForegroundColor White
Write-Host "  生产构建: cd www && npm run build" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan

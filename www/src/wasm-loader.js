/**
 * WASM 模块加载封装
 * 使用动态 import() 确保 WASM 初始化完成后再暴露函数
 */

let wasmModule = null;

/**
 * 异步加载 WASM 模块
 * wasm-pack build --target web 生成的包需要先调用 default export 初始化
 */
export async function loadWasm() {
  if (wasmModule) {
    return wasmModule;
  }

  try {
    // 动态导入 wasm-pack 生成的包（构建时从 rust-wasm/pkg 复制到 ./wasm/）
    const module = await import('./wasm');
    // 必须调用 default export（__wbg_init）初始化 WASM 实例
    await module.default();
    wasmModule = module;
    console.log('✅ WASM 模块加载成功');
    return module;
  } catch (err) {
    console.error('❌ WASM 模块加载失败:', err);
    throw new Error(`WASM 加载失败: ${err.message}。请先运行 build.ps1 编译 Rust 代码。`);
  }
}

/**
 * 获取已加载的模块（必须先调用 loadWasm）
 */
export function getWasm() {
  if (!wasmModule) {
    throw new Error('WASM 模块尚未加载，请先调用 loadWasm()');
  }
  return wasmModule;
}

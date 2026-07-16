import { applyI18n, currentLang } from './i18n.js';

// 应用 i18n 文本替换
applyI18n();
console.log(`🧰 在线工具箱 — 语言: ${currentLang() === 'zh' ? '中文' : 'English'}`);

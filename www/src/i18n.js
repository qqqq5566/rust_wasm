/**
 * 极简 i18n 模块
 * Cloudflare Worker 注入 window.__LANG__ = 'zh' | 'en'
 */

const LANG = (typeof window !== 'undefined' && window.__LANG__) || 'zh';

/** 根据当前语言返回对应文本 */
export function t(zh, en) {
  return LANG === 'en' && en ? en : zh;
}

/** 当前语言 */
export function currentLang() {
  return LANG;
}

/** 扫描页面上所有带 data-zh 属性的元素并替换文本 */
export function applyI18n() {
  document.querySelectorAll('[data-zh]').forEach((el) => {
    const zh = el.dataset.zh;
    const en = el.dataset.en;
    if (LANG === 'en' && en) {
      // 替换 textContent
      if (el.dataset.i18nTarget === 'text') {
        el.textContent = en;
      } else if (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'number')) {
        el.placeholder = en;
      } else {
        el.textContent = en;
      }
    }
    // 同步更新 data-en-placeholder
    if (el.dataset.enPlaceholder) {
      el.placeholder = LANG === 'en' ? el.dataset.enPlaceholder : el.dataset.zhPlaceholder || el.placeholder;
    }
  });
}

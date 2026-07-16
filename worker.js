/**
 * Cloudflare Worker — 国家识别 + 静态资源代理
 * 中国访客 → 中文界面，其他国家 → 英文界面
 */
export default {
  async fetch(request, env) {
    // Cloudflare 自动附加的国家代码（如 CN, US, JP...）
    const country = request.cf?.country || 'XX';
    const lang = country === 'CN' ? 'zh' : 'en';

    // 委托 Cloudflare Assets 处理静态文件
    const response = await env.ASSETS.fetch(request);
    const contentType = response.headers.get('content-type') || '';

    // 只在 HTML 页面注入语言标记
    if (contentType.includes('text/html')) {
      let html = await response.text();
      // 注入到 <head> 最前面，确保页面脚本能第一时间读取
      html = html.replace(
        '<head>',
        `<head><script>window.__LANG__='${lang}';window.__COUNTRY__='${country}';</script>`
      );
      return new Response(html, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    }

    return response;
  },
};

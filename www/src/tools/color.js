const el = (id) => document.getElementById(id);
const colorSwatch = el('colorSwatch');
const colorHex = el('colorHex');
const colorR = el('colorR'), colorG = el('colorG'), colorB = el('colorB');
const colorH = el('colorH'), colorS = el('colorS'), colorL = el('colorL');

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? ((g - b) / d + (g < b ? 6 : 0)) : max === g ? ((b - r) / d + 2) : ((r - g) / d + 4);
    h *= 60;
  }
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}
function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

function updateFromHex() {
  const hex = colorHex.value.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return;
  const r = parseInt(hex.substr(0, 2), 16), g = parseInt(hex.substr(2, 2), 16), b = parseInt(hex.substr(4, 2), 16);
  colorR.value = r; colorG.value = g; colorB.value = b;
  const [h, s, l] = rgbToHsl(r, g, b);
  colorH.value = h; colorS.value = s; colorL.value = l;
  updateSwatch(r, g, b);
}
function updateFromRgb() {
  const r = clamp(colorR.value, 0, 255), g = clamp(colorG.value, 0, 255), b = clamp(colorB.value, 0, 255);
  colorHex.value = rgbToHex(r, g, b);
  const [h, s, l] = rgbToHsl(r, g, b);
  colorH.value = h; colorS.value = s; colorL.value = l;
  updateSwatch(r, g, b);
}
function updateFromHsl() {
  const h = clamp(colorH.value, 0, 360), s = clamp(colorS.value, 0, 100), l = clamp(colorL.value, 0, 100);
  const [r, g, b] = hslToRgb(h, s, l);
  colorR.value = r; colorG.value = g; colorB.value = b;
  colorHex.value = rgbToHex(r, g, b);
  updateSwatch(r, g, b);
}
function clamp(v, min, max) { return Math.max(min, Math.min(max, parseInt(v) || 0)); }
function updateSwatch(r, g, b) {
  colorSwatch.style.background = `rgb(${r},${g},${b})`;
}

colorHex.addEventListener('input', updateFromHex);
colorR.addEventListener('input', updateFromRgb);
colorG.addEventListener('input', updateFromRgb);
colorB.addEventListener('input', updateFromRgb);
colorH.addEventListener('input', updateFromHsl);
colorS.addEventListener('input', updateFromHsl);
colorL.addEventListener('input', updateFromHsl);
el('colorCopyBtn').addEventListener('click', () => navigator.clipboard.writeText(colorHex.value));

// 初始显示
updateFromHex();

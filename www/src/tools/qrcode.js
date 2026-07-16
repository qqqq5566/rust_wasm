import { loadWasm, getWasm } from '../wasm-loader.js';

const qrInput = document.getElementById('qrInput');
const qrSize = document.getElementById('qrSize');
const qrSizeVal = document.getElementById('qrSizeVal');
const qrDark = document.getElementById('qrDark');
const qrLight = document.getElementById('qrLight');
const qrPreview = document.getElementById('qrPreview');
const qrDownloadBtn = document.getElementById('qrDownloadBtn');

let currentSvg = '';

function update() {
  const text = qrInput.value.trim();
  if (!text) { qrPreview.innerHTML = '<p style="color:var(--color-muted);text-align:center;padding:3rem">输入文本生成二维码</p>'; return; }
  try {
    const wasm = getWasm();
    const svg = wasm.qr_svg(text, parseInt(qrSize.value), qrDark.value, qrLight.value);
    currentSvg = svg;
    qrPreview.innerHTML = svg;
  } catch (e) { /* WASM not loaded */ }
}

qrInput.addEventListener('input', update);
qrSize.addEventListener('input', () => { qrSizeVal.textContent = qrSize.value + 'px'; update(); });
qrDark.addEventListener('input', update);
qrLight.addEventListener('input', update);

qrDownloadBtn.addEventListener('click', () => {
  if (!currentSvg) return;
  const blob = new Blob([currentSvg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'qrcode.svg'; a.click();
  URL.revokeObjectURL(url);
});

loadWasm().then(update);

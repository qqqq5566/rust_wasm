import { loadWasm, getWasm } from '../wasm-loader.js';

// --- 全局状态 ---
let originalBytes = null;
let currentBase64 = null;
let currentMime = 'image/png';
let currentDataUrl = null;

// --- DOM 元素 ---
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const uploadSection = document.getElementById('uploadSection');
const workspace = document.getElementById('workspace');
const originalImg = document.getElementById('originalImg');
const processedImg = document.getElementById('processedImg');
const processedPlaceholder = document.getElementById('processedPlaceholder');
const resultLabel = document.getElementById('resultLabel');

const infoWidth = document.getElementById('infoWidth');
const infoHeight = document.getElementById('infoHeight');
const infoFormat = document.getElementById('infoFormat');
const infoColor = document.getElementById('infoColor');
const infoSize = document.getElementById('infoSize');

// --- 工具函数 ---
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function setProcessedImage(base64, mime = 'image/png') {
  currentBase64 = base64;
  currentMime = mime;
  currentDataUrl = `data:${mime};base64,${base64}`;
  processedImg.src = currentDataUrl;
  processedPlaceholder.style.display = 'none';
  processedImg.style.display = 'block';
  const fmtLabel = mime === 'image/jpeg' ? 'JPEG' : mime === 'image/webp' ? 'WebP' : 'PNG';
  resultLabel.textContent = `处理后 (${fmtLabel})`;
}

// --- WASM 操作封装 ---
function callWasm(fnName, ...args) {
  const wasm = getWasm();
  return wasm[fnName](originalBytes, ...args);
}

function applyOperation(fnName, ...args) {
  if (!originalBytes) return;
  try {
    const base64 = callWasm(fnName, ...args);
    setProcessedImage(base64);
  } catch (err) {
    console.error('处理失败:', err);
    alert(`处理失败: ${err}`);
  }
}

// --- 导出操作（支持多格式）---
function applyExport() {
  if (!originalBytes) return;
  try {
    const wasm = getWasm();
    const format = parseInt(document.getElementById('exportFormat').value);
    const quality = parseInt(document.getElementById('exportQualitySlider').value);
    const resultJson = wasm.encode_as(originalBytes, format, quality);
    const { mime, base64 } = JSON.parse(resultJson);
    setProcessedImage(base64, mime);
  } catch (err) {
    console.error('导出失败:', err);
    alert(`导出失败: ${err}`);
  }
}

// --- 图片加载 ---
async function loadImage(file) {
  const buffer = await file.arrayBuffer();
  originalBytes = new Uint8Array(buffer);

  const blobUrl = URL.createObjectURL(new Blob([buffer], { type: file.type }));
  originalImg.src = blobUrl;
  processedImg.style.display = 'none';
  processedPlaceholder.style.display = 'flex';
  resultLabel.textContent = '处理后';

  try {
    const wasm = getWasm();
    const infoJson = wasm.get_info(originalBytes);
    const info = JSON.parse(infoJson);
    infoWidth.textContent = info.width;
    infoHeight.textContent = info.height;
    infoFormat.textContent = info.format;
    infoColor.textContent = info.colorMode;
    infoSize.textContent = formatSize(info.fileSize);
    document.getElementById('cropW').value = info.width;
    document.getElementById('cropH').value = info.height;
  } catch (err) {
    console.error('获取图片信息失败:', err);
  }

  uploadSection.style.display = 'none';
  workspace.style.display = 'block';
}

// --- 标签页切换 ---
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('tab--active'));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('tab-panel--active'));
    tab.classList.add('tab--active');
    document.getElementById(`panel-${tab.dataset.tab}`).classList.add('tab-panel--active');
  });
});

// --- 拖拽上传 ---
uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.classList.add('upload__zone--drag');
});
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('upload__zone--drag'));
uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('upload__zone--drag');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) loadImage(file);
});
uploadZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) loadImage(file);
});

// --- 按钮操作（data-action 属性的通用处理）---
document.querySelectorAll('.tool-btn[data-action]').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (!originalBytes) return;
    switch (btn.dataset.action) {
      case 'grayscale':     applyOperation('grayscale'); break;
      case 'invert':        applyOperation('invert'); break;
      case 'sepia':         applyOperation('sepia'); break;
      case 'emboss':        applyOperation('emboss'); break;
      case 'edgeDetect':    applyOperation('edge_detect'); break;
      case 'flipH':         applyOperation('flip_horizontal'); break;
      case 'flipV':         applyOperation('flip_vertical'); break;
      case 'rotate90':      applyOperation('rotate', 90); break;
      case 'rotate180':     applyOperation('rotate', 180); break;
      case 'rotate270':     applyOperation('rotate', 270); break;
      case 'thumbnail200':  applyOperation('thumbnail', 200); break;
      case 'thumbnail400':  applyOperation('thumbnail', 400); break;
      case 'thumbnail800':  applyOperation('thumbnail', 800); break;
    }
  });
});

// --- 缩放 ---
document.getElementById('resizeBtn').addEventListener('click', () => {
  if (!originalBytes) return;
  const w = parseInt(document.getElementById('resizeW').value) || 0;
  const h = parseInt(document.getElementById('resizeH').value) || 0;
  if (w === 0 && h === 0) { alert('请至少输入宽度或高度'); return; }
  const filter = parseInt(document.getElementById('resizeFilter').value);
  applyOperation('resize', w, h, filter);
});

// --- 裁剪 ---
document.getElementById('cropBtn').addEventListener('click', () => {
  if (!originalBytes) return;
  const x = parseInt(document.getElementById('cropX').value) || 0;
  const y = parseInt(document.getElementById('cropY').value) || 0;
  const w = parseInt(document.getElementById('cropW').value) || 100;
  const h = parseInt(document.getElementById('cropH').value) || 100;
  applyOperation('crop', x, y, w, h);
});

// --- 滤镜滑块 ---
document.getElementById('blurSlider').addEventListener('input', (e) => {
  const val = parseInt(e.target.value) / 10;
  document.getElementById('blurVal').textContent = val.toFixed(1);
  applyOperation('blur', val);
});

function applySharpen() {
  if (!originalBytes) return;
  const sigma = parseInt(document.getElementById('sharpenSigmaSlider').value) / 10;
  const thresh = parseInt(document.getElementById('sharpenThreshSlider').value);
  document.getElementById('sharpenSigmaVal').textContent = sigma.toFixed(1);
  document.getElementById('sharpenThreshVal').textContent = thresh;
  applyOperation('unsharpen', sigma, thresh);
}
document.getElementById('sharpenSigmaSlider').addEventListener('input', applySharpen);
document.getElementById('sharpenThreshSlider').addEventListener('input', applySharpen);

document.getElementById('hueSlider').addEventListener('input', (e) => {
  const val = parseInt(e.target.value);
  document.getElementById('hueVal').textContent = `${val}°`;
  applyOperation('huerotate', val);
});

// --- 马赛克 ---
document.getElementById('pixelateSlider').addEventListener('input', (e) => {
  const val = parseInt(e.target.value);
  document.getElementById('pixelateVal').textContent = val;
  applyOperation('pixelate', val);
});

// --- 调整滑块 ---
document.getElementById('brightnessSlider').addEventListener('input', (e) => {
  const val = parseInt(e.target.value);
  document.getElementById('brightnessVal').textContent = val;
  applyOperation('brighten', val);
});

document.getElementById('contrastSlider').addEventListener('input', (e) => {
  const val = parseInt(e.target.value) / 10;
  document.getElementById('contrastVal').textContent = val.toFixed(1);
  applyOperation('adjust_contrast', val);
});

// --- 导出面板 ---
document.getElementById('exportFormat').addEventListener('change', function () {
  document.getElementById('exportQualityGroup').style.display = this.value === '1' ? 'block' : 'none';
});

document.getElementById('exportQualitySlider').addEventListener('input', function () {
  document.getElementById('exportQualityVal').textContent = this.value;
});

document.getElementById('exportApplyBtn').addEventListener('click', applyExport);

document.getElementById('exportDownloadBtn').addEventListener('click', () => {
  applyExport();
  setTimeout(() => {
    if (!currentDataUrl) { alert('请先预览导出效果'); return; }
    const ext = document.getElementById('exportFormat').value === '1' ? 'jpg'
      : document.getElementById('exportFormat').value === '2' ? 'webp' : 'png';
    const link = document.createElement('a');
    link.download = `processed.${ext}`;
    link.href = currentDataUrl;
    link.click();
  }, 150);
});

// --- 重置 ---
document.getElementById('resetBtn').addEventListener('click', () => {
  processedImg.style.display = 'none';
  processedPlaceholder.style.display = 'flex';
  currentBase64 = null;
  currentDataUrl = null;
  currentMime = 'image/png';
  resultLabel.textContent = '处理后';
});

// --- 快速下载 PNG ---
document.getElementById('downloadBtn').addEventListener('click', () => {
  if (!currentBase64) { alert('请先进行图片处理'); return; }
  const link = document.createElement('a');
  link.download = 'processed.png';
  link.href = currentDataUrl || `data:${currentMime};base64,${currentBase64}`;
  link.click();
});

// --- 启动 ---
async function init() {
  try {
    await loadWasm();
    console.log('🚀 图片处理工具箱已就绪');
  } catch (err) {
    uploadZone.innerHTML = `
      <div class="upload__icon">⚠️</div>
      <p class="upload__text" style="color:#e74c3c;">${err.message}</p>
    `;
  }
}
init();

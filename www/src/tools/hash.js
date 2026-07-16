import { loadWasm, getWasm } from '../wasm-loader.js';

const algoSelect = document.getElementById('algoSelect');
const hashInput = document.getElementById('hashInput');
const hashOutput = document.getElementById('hashOutput');
const hashFileZone = document.getElementById('hashFileZone');
const hashFileDrop = document.getElementById('hashFileDrop');
const hashFileName = document.getElementById('hashFileName');
const hashCopyBtn = document.getElementById('hashCopyBtn');

let fileBuffer = null;
let mode = 'text';

// 文本/文件切换
document.querySelectorAll('.hash-mode-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    mode = btn.dataset.mode;
    document.querySelectorAll('.hash-mode-btn').forEach((b) => b.classList.remove('hash-mode-btn--active'));
    btn.classList.add('hash-mode-btn--active');
    hashInput.style.display = mode === 'text' ? 'block' : 'none';
    hashFileZone.style.display = mode === 'file' ? 'block' : 'none';
    computeHash();
  });
});

function computeHash() {
  try {
    const wasm = getWasm();
    const algo = algoSelect.value;
    let data;

    if (mode === 'file') {
      if (!fileBuffer) { hashOutput.textContent = '请先拖入文件'; return; }
      data = new Uint8Array(fileBuffer);
    } else {
      const text = hashInput.value;
      if (!text) { hashOutput.textContent = '—'; return; }
      data = new TextEncoder().encode(text);
    }

    const fnMap = { md5: 'hash_md5', sha256: 'hash_sha256', sha512: 'hash_sha512', blake3: 'hash_blake3' };
    const result = wasm[fnMap[algo]](data);
    hashOutput.textContent = result;
  } catch (e) { /* WASM not loaded yet */ }
}

hashInput.addEventListener('input', computeHash);
algoSelect.addEventListener('change', computeHash);

// 文件拖入
hashFileDrop.addEventListener('dragover', (e) => { e.preventDefault(); hashFileDrop.classList.add('upload__zone--drag'); });
hashFileDrop.addEventListener('dragleave', () => hashFileDrop.classList.remove('upload__zone--drag'));
hashFileDrop.addEventListener('drop', async (e) => {
  e.preventDefault();
  hashFileDrop.classList.remove('upload__zone--drag');
  const file = e.dataTransfer.files[0];
  if (file) {
    hashFileName.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    fileBuffer = await file.arrayBuffer();
    computeHash();
  }
});

hashCopyBtn.addEventListener('click', () => navigator.clipboard.writeText(hashOutput.textContent));

loadWasm().then(computeHash);

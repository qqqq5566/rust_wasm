const base64Input = document.getElementById('base64Input');
const base64Output = document.getElementById('base64Output');
const base64ImagePreview = document.getElementById('base64ImagePreview');
const base64PreviewImg = document.getElementById('base64PreviewImg');
const base64CopyBtn = document.getElementById('base64CopyBtn');

let direction = 'encode';

document.querySelectorAll('.base64-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    direction = btn.dataset.dir;
    document.querySelectorAll('.base64-btn').forEach((b) => b.classList.remove('base64-btn--active'));
    btn.classList.add('base64-btn--active');
    base64Input.placeholder = direction === 'encode' ? '输入文本进行 Base64 编码…' : '输入 Base64 字符串进行解码…';
    convert();
  });
});

function convert() {
  const input = base64Input.value;
  if (!input) { base64Output.value = ''; base64ImagePreview.style.display = 'none'; return; }
  try {
    if (direction === 'encode') {
      base64Output.value = btoa(unescape(encodeURIComponent(input)));
      base64ImagePreview.style.display = 'none';
    } else {
      const decoded = decodeURIComponent(escape(atob(input.trim())));
      base64Output.value = decoded;
      // 尝试作为图片预览
      if (input.trim().startsWith('iVBOR') || input.trim().startsWith('/9j/') || input.trim().startsWith('R0lG')) {
        base64PreviewImg.src = `data:image/png;base64,${input.trim()}`;
        base64ImagePreview.style.display = 'block';
      } else {
        base64ImagePreview.style.display = 'none';
      }
    }
  } catch (e) {
    base64Output.value = '解码失败，请检查输入是否为有效的 Base64';
    base64ImagePreview.style.display = 'none';
  }
}

base64Input.addEventListener('input', convert);
base64CopyBtn.addEventListener('click', () => navigator.clipboard.writeText(base64Output.value));

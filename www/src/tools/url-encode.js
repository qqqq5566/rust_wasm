const urlInput = document.getElementById('urlInput');
const urlOutput = document.getElementById('urlOutput');
const urlCopyBtn = document.getElementById('urlCopyBtn');

let direction = 'encode';

document.querySelectorAll('.url-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    direction = btn.dataset.dir;
    document.querySelectorAll('.url-btn').forEach((b) => b.classList.remove('url-btn--active'));
    btn.classList.add('url-btn--active');
    urlInput.placeholder = direction === 'encode' ? '输入文本进行 URL 编码…' : '输入编码后的字符串进行解码…';
    convert();
  });
});

function convert() {
  const input = urlInput.value;
  if (!input) { urlOutput.value = ''; return; }
  try {
    urlOutput.value = direction === 'encode' ? encodeURIComponent(input) : decodeURIComponent(input);
  } catch (e) {
    urlOutput.value = direction === 'encode' ? '编码失败' : '解码失败，请检查输入是否为有效的编码字符串';
  }
}

urlInput.addEventListener('input', convert);
urlCopyBtn.addEventListener('click', () => navigator.clipboard.writeText(urlOutput.value));

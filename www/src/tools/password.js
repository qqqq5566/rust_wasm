const pwLen = document.getElementById('pwLen');
const pwLenVal = document.getElementById('pwLenVal');
const pwUpper = document.getElementById('pwUpper');
const pwLower = document.getElementById('pwLower');
const pwDigits = document.getElementById('pwDigits');
const pwSymbols = document.getElementById('pwSymbols');
const pwOutput = document.getElementById('pwOutput');
const pwStrengthBar = document.getElementById('pwStrengthBar');
const pwGenBtn = document.getElementById('pwGenBtn');
const pwCopyBtn = document.getElementById('pwCopyBtn');

const CHARS = {
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower: 'abcdefghijklmnopqrstuvwxyz',
  digits: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

function generatePassword() {
  let pool = '';
  if (pwUpper.checked) pool += CHARS.upper;
  if (pwLower.checked) pool += CHARS.lower;
  if (pwDigits.checked) pool += CHARS.digits;
  if (pwSymbols.checked) pool += CHARS.symbols;
  if (!pool) { pwOutput.textContent = '请至少选择一个字符集'; return; }

  const len = parseInt(pwLen.value);
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  let pw = '';
  for (let i = 0; i < len; i++) pw += pool[arr[i] % pool.length];
  pwOutput.textContent = pw;
  updateStrength(len, pool.length);
}

function updateStrength(len, poolSize) {
  const bits = Math.log2(poolSize) * len;
  let color, label;
  if (bits < 40) { color = '#e74c3c'; label = '弱'; }
  else if (bits < 80) { color = '#f39c12'; label = '中'; }
  else if (bits < 128) { color = '#2ecc71'; label = '强'; }
  else { color = '#00cec9'; label = '非常强'; }
  pwStrengthBar.style.width = Math.min(bits / 160 * 100, 100) + '%';
  pwStrengthBar.style.background = color;
  pwStrengthBar.textContent = `${label} (${bits.toFixed(0)} bit)`;
}

pwGenBtn.addEventListener('click', generatePassword);
pwCopyBtn.addEventListener('click', () => navigator.clipboard.writeText(pwOutput.textContent));
pwLen.addEventListener('input', () => { pwLenVal.textContent = pwLen.value; generatePassword(); });
[pwUpper, pwLower, pwDigits, pwSymbols].forEach((cb) => cb.addEventListener('change', generatePassword));

generatePassword();

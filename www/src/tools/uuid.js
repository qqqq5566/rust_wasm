const uuidCount = document.getElementById('uuidCount');
const uuidOutput = document.getElementById('uuidOutput');
const uuidGenBtn = document.getElementById('uuidGenBtn');
const uuidCopyBtn = document.getElementById('uuidCopyBtn');

function generate() {
  const count = Math.min(Math.max(parseInt(uuidCount.value) || 1, 1), 100);
  const uuids = [];
  for (let i = 0; i < count; i++) {
    uuids.push(crypto.randomUUID());
  }
  uuidOutput.value = uuids.join('\n');
}

uuidGenBtn.addEventListener('click', generate);
uuidCopyBtn.addEventListener('click', () => navigator.clipboard.writeText(uuidOutput.value));

// 初始生成一个
generate();

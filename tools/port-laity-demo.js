// 랜딩(peera-landing)의 라이티 데모 CSS를 헤파스토시안 사이트용으로 기계 변환한다.
// 손으로 옮기면 원본과 어긋나므로(실제로 19개 셀렉터가 어긋났다) 스크립트로만 만든다.
const fs = require('fs');
const path = require('path');
const HERE = __dirname;

const LANDING = process.env.PEERA_LANDING || path.join(HERE, '../../peera-landing/index.html');  // 랜딩 레포 경로(환경변수로 덮어쓸 수 있다)
const lines = fs.readFileSync(LANDING, 'utf8').split('\n');

const start = lines.findIndex((l) => l.trim().startsWith('.demo-col {'));
const end = lines.findIndex((l, i) => i > start && l.includes('/* ── 공통 섹션 ── */'));
if (start < 0 || end < 0) throw new Error('데모 CSS 구간을 찾지 못했습니다');
let css = lines.slice(start, end).join('\n').replace(/\s+$/, '');

// 1) 키프레임 이름에 ld- 접두사 — Tailwind의 animate-pulse 등과 이름이 겹친다
const KF = ['pulse', 'bubIn', 'eq', 'caret', 'ring', 'dots'];
for (const n of KF) {
  css = css.replace(new RegExp(String.raw`@keyframes\s+${n}\b`, 'g'), `@keyframes ld-${n}`);
  css = css.replace(new RegExp(String.raw`animation:\s*${n}\b`, 'g'), `animation: ld-${n}`);
  css = css.replace(new RegExp(String.raw`animation:([^;]*?)\s${n}\b`, 'g'), `animation:$1 ld-${n}`);
}

// 2) 자산 경로 — 랜딩은 같은 폴더, 여기는 /assets/peera/
css = css.replace(/url\((['"]?)([\w.-]+\.(?:png|riv|wasm))\1\)/g, "url('/assets/peera/$2')");

// 3) 셀렉터를 .laity-demo 로 스코프 (블록 내부·@규칙은 건드리지 않는다)
let depth = 0;
css = css.split('\n').map((line) => {
  const before = depth;
  depth += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
  if (before > 0) return line;
  // @규칙(@keyframes·@media)은 스코프 대상이 아니다.
  // ★ ^(\s*) 만 쓰면 역추적으로 공백 한 칸만 잡고 나머지 공백을 셀렉터로 삼아
  //   "@keyframes" 앞에 스코프가 붙는다(애니메이션이 통째로 죽는다). 먼저 걸러낸다.
  if (line.trim().startsWith('@')) return line;
  const m = line.match(/^(\s*)([^{}@][^{}]*?)\s*\{/);
  if (!m) return line;
  const sels = m[2].split(',').map((x) => x.trim()).filter(Boolean)
    .map((x) => (x === '.demo-col' ? '.laity-demo' : '.laity-demo ' + x)).join(', ');
  return m[1] + sels + ' ' + line.slice(line.indexOf('{'));
}).join('\n');

// 4) 페이지 들여쓰기(8칸)에 맞춤
css = css.split('\n').map((l) => (l.trim() ? '        ' + l.replace(/^ {2}/, '') : l)).join('\n');



const unscoped = css.match(/^\s{8}\.(?!laity-demo)[a-z-]+[^{}]*\{/gmi) || [];
const badAt = css.match(/^[^\S\n]*\S[^\n]*?[^\S\n]@(keyframes|media)/gm) || [];
if (badAt.length) { console.error('!! @규칙에 스코프가 붙었습니다:', badAt); process.exit(1); }
const kf = css.match(/@keyframes [\w-]+/g) || [];
const anims = [...new Set(css.match(/animation:\s*[\w-]+/g) || [])];
console.log('줄수          :', css.split('\n').length);
console.log('스코프 미적용 :', unscoped.length, unscoped.join(' | '));
console.log('키프레임      :', kf.join(', '));
console.log('animation 참조:', anims.join(' | '));
console.log('남은 상대경로 :', (css.match(/url\((?!['"]?\/)[^)]*\)/g) || []).join(', ') || '없음');

// ── 조립: 껍데기(마크업·i18n) + 변환된 CSS + 원본 그대로의 데모 JS ──
const shell = fs.readFileSync(path.join(HERE, 'peera-shell.html'), 'utf8');
const demoJs = fs.readFileSync(path.join(HERE, 'demo-core.js'), 'utf8');
const outPath = path.join(HERE, '../products/peera.html');
fs.writeFileSync(outPath, shell.replace('/*__DEMO_CSS__*/', css).replace('/*__DEMO_JS__*/', demoJs));
console.log('생성 완료  :', path.relative(HERE, outPath));

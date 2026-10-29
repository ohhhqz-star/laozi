// 由 data/daodejing.json 生成 assets/js/data.js 与 道德经.md
// 用法：node scripts/build.mjs
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const chapters = JSON.parse(fs.readFileSync(path.join(root, 'data/daodejing.json'), 'utf8'));

const digits = '零一二三四五六七八九';
function cn(n) {
  if (n < 10) return digits[n];
  if (n === 10) return '十';
  if (n < 20) return '十' + digits[n % 10];
  const tens = Math.floor(n / 10);
  return digits[tens] + '十' + (n % 10 ? digits[n % 10] : '');
}

const banner = '// 此文件由 scripts/build.mjs 生成，请编辑 data/daodejing.json 后重新构建。\n';
const js =
  banner +
  'window.DAODEJING = ' +
  JSON.stringify(
    chapters.map((c) => ({ n: c.n, title: '第' + cn(c.n) + '章', text: c.text })),
    null,
    2
  ) +
  ';\n';
fs.writeFileSync(path.join(root, 'assets/js/data.js'), js);

const daojing = chapters.filter((c) => c.n <= 37);
const dejing = chapters.filter((c) => c.n >= 38);

const toc = chapters
  .map((c) => `[${cn(c.n)}](#第${cn(c.n)}章)`)
  .reduce((rows, item, i) => {
    const line = Math.floor(i / 9);
    rows[line] = (rows[line] ? rows[line] + '　' : '') + item;
    return rows;
  }, [])
  .join('  \n');

const body = (list) =>
  list
    .map((c) => `### 第${cn(c.n)}章\n\n${c.text}\n`)
    .join('\n');

const md = `# 道德经

> 道可道，非常道；名可名，非常名。
>
> —— 第一章

**底本**　王弼本，参校通行本，共八十一章。
**字数**　约六千四百字（含标点）。
**在线**　https://ohhhqz-star.github.io/laozi/

---

## 关于此本

《道德经》相传为春秋时老子所作，分《道经》三十七章、《德经》四十四章，合八十一章，五千余言。其言简，其意远，两千余年来注家蜂起，读法各异。

- **底本**　王弼《老子道德经注》本。
- **参校**　参以通行本；明显的讹字、异体字与羼入的重复句径改，不另出校记。
- **体例**　简体字，现代标点；每章独立成节，章次一仍其旧。
- **用途**　供阅读、引用与检索。网页版另有全文搜索，并可与「老子」对谈。

---

## 目录

${toc}

---

## 道经

${body(daojing)}

---

## 德经

${body(dejing)}

---

> 《道德经》文本属公有领域。本整理版的标点、网页与生成脚本以 MIT 许可证开源：https://github.com/ohhhqz-star/laozi
`;

fs.writeFileSync(path.join(root, '道德经.md'), md);
console.log('✓ assets/js/data.js');
console.log('✓ 道德经.md');

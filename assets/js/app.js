/* =========================================================
   社宅 SOP 知識庫 ‧ 主程式 v1.1
   ‧ 網址用 #/章節/子頁/文件 切換頁面（GitHub Pages、本機雙擊都能用）
   ‧ 目錄：data/catalog.js；文件內容：data/docs/<編號>.js；流程圖：data/flows.js
   ========================================================= */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const CAT = window.SOP_CATALOG, FLOWS = window.SOP_FLOWS || {}, FK = window.FormKit;
const app = $('#app');
const esc = FK.esc;
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (_) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} },
  del(k) { try { localStorage.removeItem(k); } catch (_) {} }
};

/* ---------- 圖示 ---------- */
const P = {
  flow: '<rect x="3" y="3" width="7" height="6" rx="1.5"/><rect x="14" y="15" width="7" height="6" rx="1.5"/><path d="M6.5 9v4a2 2 0 0 0 2 2H14"/>',
  plan: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  check: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="m8 9 1.5 1.5L12 8M8 15l1.5 1.5L12 14M14 9.5h2M14 15.5h2"/>',
  form: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  dl: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  left: '<path d="m15 6-6 6 6 6"/>', right: '<path d="m9 6 6 6-6 6"/>',
  alert: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>',
  pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  undo: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
  filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
  siren: '<path d="M7 18v-6a5 5 0 0 1 10 0v6"/><path d="M5 21h14M12 3v2M4.2 7.2l1.4 1.4M19.8 7.2l-1.4 1.4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>',
  fit: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  full: '<path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  save: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7M8 21v-7h8v7"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  ok: '<path d="M20 6 9 17l-5-5"/>'
};
const ic = (k, cls = 'i') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[k] || ''}</svg>`;

/* ---------- 吉祥物 ---------- */
const MASCOT = $('#dijia-svg').innerHTML.trim();
const mascot = (mod, size, face = 'happy', bubble = '') => `<div class="mo-mascot ${mod}" data-mo-look data-face="${face}" style="--mo-size:${size}">${bubble ? `<span class="mo-m-bubble">${bubble}</span>` : ''}${MASCOT}</div>`;
const buddy = $('#buddy');
buddy.innerHTML = mascot('mo-mascot--idle', '100%', 'happy', '嗨！');
/* 10 種表情，每種搭配符合情緒的提示 */
const BUDDY_TIPS = [
  ['happy', '嗨！我是抵家，今天也平安 🏠', 'mo-mascot--wave'],
  ['wink', '小撇步：填到一半會自動暫存在這台裝置喔', 'mo-mascot--wave'],
  ['surprised', '哇！右上角可以搜尋文件和檢查項目', 'mo-mascot--jump'],
  ['laugh', '表單填完就能下載 Word 檔，超方便～', 'mo-mascot--jump'],
  ['love', '謝謝你認真巡檢社宅 ❤', 'mo-mascot--idle'],
  ['sleep', 'Zzz…別擔心，資料只存在你的裝置裡', 'mo-mascot--idle'],
  ['worried', '颱風來之前，記得填重點檢核表(B)…', 'mo-mascot--idle'],
  ['confused', '找不到文件嗎？試試左側選單或搜尋', 'mo-mascot--blink'],
  ['cry', '清除瀏覽器資料的話，填寫內容會不見…', 'mo-mascot--idle'],
  ['angry', '簽章欄位要記得下載後親自簽喔！', 'mo-mascot--alert']
];
let buddyT, tipIdx = 0;
function say(msg, mod = 'mo-mascot--wave', face = 'wink', ms = 3400) {
  const m = $('.mo-mascot', buddy); m.className = 'mo-mascot ' + mod; m.dataset.face = face;
  $('.mo-m-bubble', m).textContent = msg; buddy.classList.add('is-say');
  clearTimeout(buddyT); buddyT = setTimeout(() => { buddy.classList.remove('is-say'); m.className = 'mo-mascot mo-mascot--idle'; m.dataset.face = 'happy'; }, ms);
}
buddy.addEventListener('click', () => { const [f, t, mod] = BUDDY_TIPS[tipIdx++ % BUDDY_TIPS.length]; say(t, mod, f); });
function toast(msg) { $('#toast').innerHTML = `<div class="mo-toast">${esc(msg)}</div>`; }

/* ---------- 資料載入（script 注入，本機雙擊也能用） ---------- */
const loaded = {};
function loadScript(src) {
  if (!loaded[src]) loaded[src] = new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => no(new Error('無法載入 ' + src)); document.head.appendChild(s); });
  return loaded[src];
}
const loadDoc = code => FLOWS[code] ? Promise.resolve() : loadScript(`data/docs/${code}.js`);

/* ---------- 目錄查詢 ---------- */
function find(chId, secId, code) {
  const ch = CAT.chapters.find(c => c.id === chId);
  const sec = ch && secId ? ch.sections.find(s => s.id === secId) : null;
  const doc = sec ? (code ? sec.docs.find(d => d.code === code) : sec.docs[0]) : null;
  return { ch, sec, doc };
}
const fileUrl = (ch, sec, doc) => encodeURI(`${ch.folder}/${sec.folder}/${doc.file}`).replace(/#/g, '%23');
const docRoute = (ch, sec, doc) => `#/${ch.id}/${sec.id}/${doc.code}`;
function docByCode(code) {
  for (const ch of CAT.chapters) for (const sec of ch.sections) for (const doc of sec.docs) if (doc.code === code) return { ch, sec, doc };
  return null;
}
const docTitle = doc => (FLOWS[doc.code] && FLOWS[doc.code].title) || (window.SOP_DOCS && SOP_DOCS[doc.code] && SOP_DOCS[doc.code].title) || doc.label;
const isFillable = doc => doc.type !== 'flow';
/* 下載連結：另開新分頁 */
const dlLink = (ch, sec, doc, cls, text) => `<a class="${cls}" href="${fileUrl(ch, sec, doc)}" target="_blank" rel="noopener">${text}</a>`;

/* ---------- 麵包屑 ---------- */
function crumb(items) {
  $('#crumb').innerHTML = `<div class="s-wrap"><nav aria-label="目前位置"><ol>${items.map((it, i) =>
    i === items.length - 1 ? `<li><span aria-current="page">${esc(it[0])}</span></li>` : `<li><a href="${it[1]}">${esc(it[0])}</a></li>`).join('')}</ol></nav></div>`;
}

/* ---------- 漢堡選單（手機） ---------- */
function drawerTree(cur = {}) {
  return `<a class="s-dlink${!cur.ch ? ' is-cur' : ''}" href="#/">首頁</a>` + CAT.chapters.map(ch => `
    <div class="s-dgroup"><a class="s-dlink s-dlink--ch${cur.ch === ch && !cur.sec ? ' is-cur' : ''}" href="#/${ch.id}"><small>${esc(ch.id)}</small>${esc(ch.title)}</a>
      ${ch.sections.map(sec => `<details ${cur.sec === sec ? 'open' : ''}><summary><small>${esc(sec.id)}</small>${esc(sec.title)}</summary>
        ${sec.docs.map(d => `<a class="s-dlink s-dlink--doc${cur.doc === d ? ' is-cur' : ''}" href="${docRoute(ch, sec, d)}">${ic(d.type)}${esc(d.label)}</a>`).join('')}</details>`).join('')}
    </div>`).join('');
}
const drawer = $('#drawer');
function openDrawer(cur) { $('#drawerNav').innerHTML = drawerTree(cur || ROUTE); drawer.hidden = false; requestAnimationFrame(() => drawer.classList.add('is-open')); $('#burger').setAttribute('aria-expanded', 'true'); const c = $('.is-cur', drawer); c && c.scrollIntoView({ block: 'center' }); }
function closeDrawer() { drawer.classList.remove('is-open'); $('#burger').setAttribute('aria-expanded', 'false'); setTimeout(() => { drawer.hidden = true; }, 250); }
$('#burger').addEventListener('click', () => drawer.hidden ? openDrawer() : closeDrawer());
drawer.addEventListener('click', e => { if (e.target === drawer || e.target.closest('[data-close]') || e.target.closest('a')) closeDrawer(); });
let ROUTE = {};

/* ---------- 主題圖示（動畫庫） ---------- */
function themeArt(theme, big) {
  const s = big ? 88 : 56;
  if (theme === 'typhoon') return `<div class="mo-rain" style="position:absolute;inset:0;background:#24384F;display:grid;place-items:center"><svg viewBox="0 0 24 24" width="${s * .5}" height="${s * .5}" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M7 15a4 4 0 1 1 1-7.9A5 5 0 0 1 17.6 9 3.5 3.5 0 0 1 17 16H7z"/></svg></div>`;
  if (theme === 'fire') return `<span class="mo-flame" style="--mo-size:${s * .62}px"></span>`;
  if (theme === 'quake') return `<svg class="mo-quake" viewBox="0 0 24 24" width="${s * .55}" height="${s * .55}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="10" height="18" rx="1.5"/><path d="M15 9h4v12h-4M8 7h1M11 7h1M8 11h1M11 11h1M8 15h1M11 15h1M9 21v-3h2v3"/></svg>`;
  if (theme === 'all') return `<svg class="mo-bell" viewBox="0 0 24 24" width="${s * .52}" height="${s * .52}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/></svg>`;
  return ic('siren');
}
/* 卡片懸浮照片（catalog 的 cover；圖檔不存在時自動略過） */
const coverStyle = c => c ? ` data-cover="${esc(c)}" style="--cover:url('${new URL(c, location.href).href}')"` : '';
function checkCovers(root) {
  $$('[data-cover]', root).forEach(el => { const im = new Image(); im.onload = () => el.classList.add('has-cover'); im.src = el.dataset.cover; });
}

/* =========================================================
   首頁
   ========================================================= */
function viewHome() {
  document.title = `${CAT.site.name}｜${CAT.site.org}`;
  crumb([['首頁', '#/']]);
  const fillable = [];
  CAT.chapters.forEach(ch => ch.sections.forEach(sec => sec.docs.forEach(doc => { if (isFillable(doc)) fillable.push({ ch, sec, doc }); })));
  const flip = (n, front, back) => `
    <div class="s-flip mo-flip-card" tabindex="0" data-mo-toggle role="button" aria-label="${esc(front)}：${esc(back)}">
      <div class="mo-flip-inner">
        <div class="mo-flip-face"><span class="s-flip-n">${n}</span><b>${esc(front)}</b><small>滑過或點一下翻面</small></div>
        <div class="mo-flip-face mo-flip-face--back"><b>${esc(front)}</b><p>${esc(back)}</p></div>
      </div>
    </div>`;
  app.innerHTML = `
  <section class="s-hero s-hero--photo" style="--hero:url('${new URL('assets/img/covers/hero.jpg', location.href).href}')">
    <div class="s-wrap">
      <div>
        <p class="s-eyebrow mo-fade-up">${esc(CAT.site.org)}</p>
        <h1 class="mo-fade-up" style="--mo-delay:.08s"><span class="mo-shine" style="--mo-color:#FFFFFF;--mo-dur:3.4s">社宅 SOP 知識庫</span></h1>
        <p class="s-lead mo-fade-up" style="--mo-delay:.16s">給中心同仁與物管單位的社宅線上手冊。可於網頁上填寫檢核表並下載檔案，檔案也可於後續繼續編輯，請注意線上填寫資料僅保存於裝置內，如清除瀏覽器記憶，填寫資料也將移除</p>
        <div class="s-flips mo-stagger" style="--mo-delay:.24s">
          ${flip('01', '看流程', '依時間點了解各階段事項')}
          ${flip('02', '線上填寫', '部分檢核表、報告表可直接編輯')}
          ${flip('03', '下載回傳', '下載格式與原始文件相同')}
        </div>
      </div>
      <div class="s-hero-art mo-pop-in" style="--mo-delay:.2s">${mascot('mo-mascot--wave', '210px', 'wink')}</div>
    </div>
    <div class="mo-wave" style="--mo-size:70px;--mo-color:var(--brand)"><svg viewBox="0 0 1200 60" preserveAspectRatio="none"><path d="M0 30 Q150 0 300 30 T600 30 T900 30 T1200 30 V60 H0Z"/></svg><svg viewBox="0 0 1200 60" preserveAspectRatio="none"><path d="M0 34 Q150 8 300 34 T600 34 T900 34 T1200 34 V60 H0Z"/></svg></div>
  </section>
  <section class="s-section">
    <div class="s-wrap">
      <h2 class="s-h2">章節</h2>
      <div class="s-cards mo-stagger">
        ${CAT.chapters.map(ch => `
          <a class="s-card s-card--cover mo-onview" href="#/${ch.id}"${coverStyle(ch.cover)}>
            <div class="s-card-ico">${ic(ch.icon || 'siren')}</div>
            <span class="s-code">${esc(ch.id)}</span>
            <h3>${esc(ch.title)}</h3>
            <p>${esc(ch.desc || '')}</p>
            <div class="s-meta">${ch.sections.map(s => `<span class="s-pill">${esc(s.title)}</span>`).join('')}</div>
            <span class="s-more">進入章節 ${ic('arrow')}</span>
          </a>`).join('')}
        <div class="s-card s-card--ghost mo-onview"><div class="s-card-ico" style="background:transparent;border:1.5px dashed var(--line2)">${ic('plan')}</div><span class="s-code" style="color:var(--sub)">NC-0X</span><h3>更多章節建置中</h3><p>其他作業 SOP 將陸續新增。</p></div>
      </div>
    </div>
  </section>
  <section class="s-section s-section--tint">
    <div class="s-wrap">
      <div class="s-hhead"><h2 class="s-h2" style="margin:0">可線上填寫的表單</h2>
        <div class="s-hbtns"><button class="s-iconbtn" type="button" data-hs="-1" aria-label="往左">${ic('left')}</button><button class="s-iconbtn" type="button" data-hs="1" aria-label="往右">${ic('right')}</button></div></div>
      <div class="s-hscroll" id="hs">
        ${fillable.map(({ ch, sec, doc }) => `
          <a class="s-card s-hcard" href="${docRoute(ch, sec, doc)}">
            <div class="s-card-ico">${ic(doc.type)}</div>
            <span class="s-code">${esc(doc.code)}</span>
            <h3 style="font-size:17px">${esc(doc.label)}</h3>
            <p>${esc(sec.id)} ${esc(sec.title)}</p>
            <span class="s-more">線上填寫 ${ic('arrow')}</span>
          </a>`).join('')}
      </div>
    </div>
  </section>`;
  const hs = $('#hs');
  $$('[data-hs]').forEach(b => b.onclick = () => hs.scrollBy({ left: +b.dataset.hs * hs.clientWidth * .8, behavior: 'smooth' }));
  checkCovers(app);
}

/* =========================================================
   章節
   ========================================================= */
function viewChapter(ch) {
  document.title = `${ch.id} ${ch.title}｜${CAT.site.name}`;
  crumb([['首頁', '#/'], [`${ch.id} ${ch.title}`, `#/${ch.id}`]]);
  app.innerHTML = `
  <header class="s-phead"><div class="s-wrap"><div>
    <p class="s-eyebrow">${esc(ch.id)}</p><h1 class="s-h1 mo-char-rise">${[...ch.title].map((c, i) => `<span style="--i:${i}">${esc(c)}</span>`).join('')}</h1>
    <p class="s-lead">${esc(ch.desc || '')}</p></div></div></header>
  <section class="s-section"><div class="s-wrap">
    <div class="s-cards mo-stagger">
      ${ch.sections.map(sec => `
        <a class="s-card s-card--cover" href="#/${ch.id}/${sec.id}"${coverStyle(sec.cover)}>
          <div class="s-card-ico">${themeArt(sec.theme)}</div>
          <span class="s-code">${esc(sec.id)}</span>
          <h3>${esc(sec.title)}</h3>
          <p>${sec.docs.length} 份文件</p>
          <div class="s-meta">${sec.docs.map(d => `<span class="s-pill">${esc(d.label)}</span>`).join('')}</div>
          <span class="s-more">查看 ${ic('arrow')}</span>
        </a>`).join('')}
    </div></div></section>`;
  checkCovers(app);
}

/* =========================================================
   子頁＋文件（左側文件選單）
   ========================================================= */
async function viewSection(ch, sec, doc) {
  document.title = `${doc.label}｜${sec.id} ${sec.title}｜${CAT.site.name}`;
  await Promise.all(sec.docs.map(d => loadDoc(d.code).catch(() => {})));
  const title = docTitle(doc);
  crumb([['首頁', '#/'], [`${ch.id} ${ch.title}`, `#/${ch.id}`], [`${sec.id} ${sec.title}`, `#/${ch.id}/${sec.id}`], [title, '']]);
  const fill = isFillable(doc);
  app.innerHTML = `
  <header class="s-phead s-phead--sm"><div class="s-wrap">
    <div><p class="s-eyebrow">${esc(ch.id)} › ${esc(sec.id)}</p><h1 class="s-h1">${esc(sec.title)}</h1></div>
    <div class="s-phead-ico" aria-hidden="true">${themeArt(sec.theme, true)}</div>
  </div></header>
  <div class="s-wrap s-docwrap">
    <aside class="s-side" aria-label="文件選單">
      <h2>本頁文件</h2>
      <nav>${sec.docs.map(d => `<a class="s-sidelink" href="${docRoute(ch, sec, d)}" ${d.code === doc.code ? 'aria-current="page"' : ''}><span class="s-tico">${ic(d.type)}</span><span><b>${esc(d.label)}</b><small>${esc(d.code)}</small></span></a>`).join('')}</nav>
      <h2>${esc(ch.id)} 其他子頁</h2>
      <nav>${ch.sections.filter(s => s !== sec).map(s => `<a class="s-sidelink s-sidelink--sec" href="#/${ch.id}/${s.id}"><small>${esc(s.id)}</small>${esc(s.title)}</a>`).join('')}</nav>
    </aside>
    <article class="s-doc">
      <button class="s-mbar" type="button" id="mbar">${ic('list')}<span><small>本頁文件 ${sec.docs.indexOf(doc) + 1}/${sec.docs.length}</small><b>${esc(doc.label)}</b></span><em>切換</em></button>
      <div class="s-doctitle mo-fade-up"><h2>${esc(title)}</h2><span class="s-docmeta"><code>${esc(doc.code)}</code>${dlLink(ch, sec, doc, 'mo-underline s-dllink', `${ic('dl')}下載原始文件`)}</span></div>
      <div id="docBody"></div>
      <div class="s-dlbar">
        <p>${ic('form')} 原始文件：<b>${esc(doc.file)}</b></p>
        <div class="s-btns">
          ${dlLink(ch, sec, doc, 's-btn' + (fill ? '' : ' s-btn--solid'), `${ic('dl')}下載原始文件`)}
          ${fill ? `<button class="s-btn s-btn--solid" data-fill-dl type="button">${ic('dl')}下載已填寫版本（.docx）</button>` : ''}
        </div>
      </div>
    </article>
  </div>`;
  $('#mbar').onclick = () => openDrawer({ ch, sec, doc });
  const body = $('#docBody');
  if (FLOWS[doc.code]) renderFlow(body, FLOWS[doc.code]);
  else {
    const d = window.SOP_DOCS && SOP_DOCS[doc.code];
    if (!d) { body.innerHTML = '<p class="s-empty">文件資料載入失敗，請直接下載原始文件。</p>'; return; }
    await ({ plan: renderPlan, check2: renderCheck2, checktext: renderCheckText, damage: renderDamage, event: renderEvent }[d.kind])(body, d, doc);
  }
  $$('[data-fill-dl]').forEach(b => b.addEventListener('click', () => downloadFilled(doc, b)));
}

/* 捲到畫面才播放 */
function reveal(rootEl) {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: 0, rootMargin: '0px 0px -6% 0px' });
  $$('.mo-onview:not(.is-in)', rootEl).forEach(el => io.observe(el));
}

/* =========================================================
   表單共用：欄位元件
   ========================================================= */
let FORM = null;
const notice = items => `<div class="s-notice mo-fade-up">${ic('alert')}<div><b>填寫表單後，即可下載修改後的檔案</b>${items.length ? `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>` : ''}</div></div>`;
const textField = (k, label, o = {}) => `<label class="s-field${o.wide ? ' s-field--wide' : ''}"><span>${esc(label)}</span>${o.area ? `<textarea data-k="${k}" rows="${o.rows || 3}" placeholder="${esc(o.ph || '')}"></textarea>` : `<input data-k="${k}" placeholder="${esc(o.ph || '')}" autocomplete="off">`}${o.help ? `<small>${esc(o.help)}</small>` : ''}<em class="s-warn" hidden></em></label>`;
const pickBtn = (k, type, ph) => `<button type="button" class="s-pick" data-picker="${type}" data-k="${k}">${ic(type === 'date' ? 'cal' : 'clock')}<span data-ph="${ph}">${ph}</span></button>`;
const dateField = (k, label) => `<div class="s-field"><span>${esc(label)}</span>${pickBtn(k, 'date', '選擇日期')}</div>`;
const timeField = (k, label) => `<div class="s-field"><span>${esc(label)}</span>${pickBtn(k, 'time', '選擇時間')}</div>`;
const dtField = (k, label) => `<div class="s-field"><span>${esc(label)}</span><div class="s-pickrow">${pickBtn(k + 'D', 'date', '選擇日期')}${pickBtn(k + 'T', 'time', '選擇時間')}</div></div>`;
const dtValue = (D, k) => [FK.rocDate(D[k + 'D']), FK.zhTime(D[k + 'T'])].filter(Boolean).join(' ');
/* 照片欄：一組文字（選用）＋一個照片區，最多 2 張；下載時依實際內容自動套用版型
   （2 張照片／2 張照片＋文字／1 張照片＋文字／1 張照片） */
const PHOTO_TIP = '每個欄位照片最多上傳兩張照片';
function photoField(key, label, o = {}) {
  return `<div class="s-photof" data-pf="${key}">
    <div class="s-photof-h"><b>${esc(label)}</b>${o.hint ? `<span class="s-photof-hint">${esc(o.hint)}</span>` : ''}<span class="s-photof-n" data-pn>0 / 2 張</span></div>
    ${o.text ? `<div class="s-photof-text"><textarea class="s-input" data-k="${o.text}" rows="2" placeholder="${esc(o.ph || '請輸入文字說明')}" aria-label="${esc(label)} 文字說明"></textarea><em class="s-warn" hidden></em></div>` : ''}
    <div class="s-pzone" data-zone></div>
    <p class="s-photof-tip">${PHOTO_TIP}</p>
  </div>`;
}

function bindForm(root, code, onChange) {
  const key = 'sop:' + code;
  FORM = { code, key, data: store.get(key) || {}, photos: {} };
  const D = FORM.data;
  const save = () => { store.set(key, D); onChange && onChange(); const s = $('#savedAt'); if (s) s.textContent = '已自動暫存在這台裝置'; };
  FORM.save = save;
  $$('[data-k]', root).forEach(el => {
    const k = el.dataset.k, v = D[k];
    if (el.type === 'radio') { el.checked = v != null && String(v) === el.value; el.addEventListener('change', () => { D[k] = el.value; save(); }); }
    else if (el.dataset.picker) {
      const show = () => { const sp = $('span', el); const val = D[k]; sp.textContent = val ? (el.dataset.picker === 'date' ? FK.rocDate(val) : FK.zhTime(val)) : sp.dataset.ph; el.classList.toggle('has-val', !!val); };
      show();
      el.addEventListener('click', () => (el.dataset.picker === 'date' ? FK.datePicker : FK.timePicker)(el, D[k], val => { D[k] = val; show(); save(); }));
    }
    else if (el.matches('button')) { el.setAttribute('aria-pressed', !!v); el.addEventListener('click', () => { D[k] = !D[k]; el.setAttribute('aria-pressed', !!D[k]); save(); }); }
    else {
      if (v != null) el.value = v;
      el.addEventListener('input', () => { D[k] = el.value; save(); });
      el.addEventListener('blur', () => {
        const r = FK.sanitize(el.value); const w = el.parentNode.querySelector('.s-warn') || el.nextElementSibling;
        if (r.changed) { el.value = r.value; D[k] = r.value; save(); if (w && w.classList.contains('s-warn')) { w.hidden = false; w.textContent = '已自動移除可能影響網站運作的符號或程式碼'; } }
        else if (w && w.classList && w.classList.contains('s-warn')) w.hidden = true;
      });
    }
  });
  $$('[data-pf]', root).forEach(pf => initPhotoField(pf, code));
  onChange && onChange();
}
/* 照片欄位：IndexedDB 存放，最多 2 張 */
async function initPhotoField(pf, code) {
  const key = pf.dataset.pf, meta = (FORM.data._ph = FORM.data._ph || {}), list = (meta[key] = meta[key] || []);
  const zone = $('[data-zone]', pf), MAX = 2;
  const draw = async () => {
    let h = '';
    for (let i = 0; i < list.length; i++) {
      const m = list[i];
      const rec = await FK.Photos.get(`${code}|${key}|${m.id}`).catch(() => null);
      if (!rec) { list.splice(i, 1); FORM.save(); return draw(); }
      h += `<div class="s-slot has-img"><img src="${URL.createObjectURL(rec.blob)}" alt="照片 ${i + 1}"><button type="button" class="s-slot-del" data-del="${i}" aria-label="移除照片 ${i + 1}">${ic('x')}</button>${m.c ? '<span class="s-slot-z">已壓縮</span>' : ''}</div>`;
    }
    if (list.length < MAX) h += `<div class="s-slot"><button type="button" class="s-slot-add" data-add>${ic('camera')}<span>${list.length ? '再加 1 張' : '上傳照片'}</span></button></div>`;
    zone.innerHTML = h;
    zone.dataset.n = list.length;
    $('[data-pn]', pf).textContent = `${list.length} / ${MAX} 張`;
  };
  pf.addEventListener('click', async e => {
    const del = e.target.closest('[data-del]');
    if (del) { const m = list.splice(+del.dataset.del, 1)[0]; await FK.Photos.del(`${code}|${key}|${m.id}`); FORM.save(); return draw(); }
    if (!e.target.closest('[data-add]') || list.length >= MAX) return;
    if (!(await FK.privacyNotice())) return;
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/jpeg,image/png,image/webp,image/*'; inp.multiple = MAX - list.length > 1;
    inp.onchange = async () => {
      const files = [...inp.files].slice(0, MAX - list.length);
      if (inp.files.length > files.length) toast('每個欄位照片最多上傳兩張照片，已略過多出的照片');
      for (const f of files) {
        try {
          const p = await FK.prepImage(f);
          const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
          await FK.Photos.put(`${code}|${key}|${id}`, { blob: p.blob, type: p.type, w: p.w, h: p.h });
          list.push({ id, w: p.w, h: p.h, c: p.compressed ? 1 : 0 });
          if (p.compressed) toast('照片超過 10MB，已自動壓縮');
        } catch (err) { toast(err.message || '照片讀取失敗'); }
      }
      FORM.save(); draw();
    };
    inp.click();
  });
  draw();
}
/* 下載時取出照片 */
async function photosOf(key) {
  const list = ((FORM.data._ph || {})[key] || []).slice(0, 2);
  const out = [];
  for (const m of list) {
    const rec = await FK.Photos.get(`${FORM.code}|${key}|${m.id}`).catch(() => null);
    if (rec) out.push({ data: await rec.blob.arrayBuffer(), ext: /png/.test(rec.type) ? 'png' : 'jpg', w: rec.w, h: rec.h });
  }
  return out;
}
const S = v => FK.sanitize(v || '').value.trim();
function resetBtn(root, code, rerender) {
  const b = $('[data-reset]', root); if (!b) return;
  b.onclick = async () => {
    if (!b.dataset.armed) { b.dataset.armed = '1'; b.innerHTML = `${ic('undo')}再按一次確認清除`; setTimeout(() => { if (b.isConnected) { delete b.dataset.armed; b.innerHTML = `${ic('undo')}清除填寫內容`; } }, 3500); return; }
    store.del('sop:' + code); await FK.Photos.clear(code + '|'); rerender(); toast('已清除填寫內容');
  };
}
const toolbar = (extra = '') => `<div class="s-toolbar">${extra}<div class="s-btns">
  <button class="s-btn s-btn--ghost" type="button" data-reset>${ic('undo')}清除填寫內容</button>
  <button class="s-btn s-btn--solid" type="button" data-fill-dl>${ic('dl')}下載已填寫版本</button></div><span class="s-saved" id="savedAt"></span></div>`;
const progress = () => `<div class="s-progress"><span id="prog">　</span><div class="mo-progress"><i id="progBar" style="width:0"></i></div></div>`;

/* =========================================================
   文件：整備作業與應變計畫（A）
   ========================================================= */
async function renderPlan(el, d, doc) {
  const items = d.groups.flatMap(g => g.items);
  el.innerHTML = `
    ${notice(['本表需提供圖示或文字說明或照片，請依序填寫。'])}
    <fieldset class="s-fieldset mo-fade-up"><legend>基本資料</legend><div class="s-grid">
      ${d.head.map((h, i) => textField('h' + i, h.label)).join('')}
      ${dateField('date', d.date.label)}
    </div><p class="s-help">${esc(d.dateNote.replace(/^[\s年月日]+/, ''))}</p></fieldset>
    ${toolbar(progress())}
    <div class="s-plan">
      ${d.groups.map(g => `
        <section class="s-plan-g mo-fade-up mo-onview">
          <header><b>${esc(g.no)}</b><h3>${esc(g.area)}</h3><span>${g.items.length} 個操作要項</span></header>
          ${g.items.map(it => `
            <div class="s-plan-i">
              <div class="s-plan-op">${it.sub ? `<span class="s-sub">${esc(it.sub)}</span>` : ''}${esc(it.op)}</div>
              ${photoField('p' + it.r, d.cols[3].replace(/\(.*$/, ''), { text: 't' + it.r, hint: it.hint, ph: '請輸入文字說明' })}
            </div>`).join('')}
        </section>`).join('')}
    </div>`;
  const update = () => {
    const D = FORM.data, ph = D._ph || {};
    const done = items.filter(it => S(D['t' + it.r]) || (ph['p' + it.r] || []).length).length;
    $('#prog', el).innerHTML = `已填寫 <b>${done}</b> / ${items.length} 個操作要項`;
    $('#progBar', el).style.width = (done / items.length * 100) + '%';
  };
  bindForm(el, doc.code, update);
  resetBtn(el, doc.code, () => renderPlan(el, d, doc));
  FORM.ops = async () => {
    const D = FORM.data, ops = d.head.map((h, i) => ({ op: 'cell', r: h.r, c: h.c, text: S(D['h' + i]) }));
    ops.push({ op: 'span', r: d.date.r, c: d.date.c, text: FK.rocDate(D.date), after: '', until: '日' });
    for (const it of items) {
      const t = S(D['t' + it.r]), imgs = await photosOf('p' + it.r);
      if (t || imgs.length) ops.push({ op: 'replace', r: it.r, c: it.c, text: t || ' ' });
      if (imgs.length) ops.push({ op: 'photos', r: it.r, c: it.c, imgs, maxH: imgs.length === 1 ? 4600 : 3400 });
    }
    return ops;
  };
}

/* =========================================================
   文件：二選一檢核表（B）
   ========================================================= */
async function renderCheck2(el, d, doc) {
  const okIdx = /正常/.test(d.options[0]) ? 0 : 1;      // 是(正常)／否(異常)；有／無 時「無」是正常
  const items = d.groups.flatMap(g => g.items);
  const lbl = s => s.replace(/：$/, '');
  el.innerHTML = `
    ${notice([`${esc(lbl(d.signer))}簽名請於下載後親自簽章`])}
    <fieldset class="s-fieldset mo-fade-up"><legend>基本資料</legend><div class="s-grid">
      ${textField('name', '社宅名稱', { ph: '例：○○', help: `會填入標題「${d.title}-＿＿${d.suffix}」` })}
      ${textField('f0', lbl(d.labels[0]))}
      ${dtField('f1', lbl(d.labels[1]))}
      ${textField('f2', lbl(d.labels[2]))}
    </div></fieldset>
    ${toolbar(`${progress()}<div class="s-seg s-seg--filter" role="group" aria-label="顯示方式"><label><input type="radio" name="flt" value="all" checked><span>全部顯示</span></label><label><input type="radio" name="flt" value="todo"><span>只看未完成或異常</span></label></div>`)}
    <div id="groups">
      ${d.groups.map(g => `
        <section class="s-group mo-fade-up mo-onview">
          <h3>${esc(g.name)}<span>${g.items.length} 項</span></h3>
          ${g.items.map(it => `
            <div class="s-item" data-r="${it.r}">
              <span class="s-item-no">${esc(it.no)}</span>
              <div class="s-item-main"><span class="s-item-text">${esc(it.text)}</span><div class="s-note" data-note="${it.r}"></div></div>
              <div class="s-seg" role="radiogroup" aria-label="${esc(it.no)} 檢查結果">
                ${d.options.map((o, oi) => `<label class="${oi === okIdx ? 'is-yes' : 'is-no'}"><input type="radio" name="r${it.r}" value="${oi}" data-k="i${it.r}"><span>${esc(o)}</span></label>`).join('')}
              </div>
            </div>`).join('')}
        </section>`).join('')}
    </div>
    <section class="s-group"><h3>${esc(d.photos.title)}<span>每欄最多 2 張</span></h3><div class="s-blk s-pgrid">
      ${d.photos.rows.map((p, i, a) => photoField('ph' + p.r, p.group + (a.filter(x => x.group === p.group).length > 1 ? `（${a.filter(x => x.group === p.group).indexOf(p) + 1}）` : ''))).join('')}
    </div></section>
    <div class="s-sign"><div>${esc(d.signer)}</div></div>`;
  /* 備註：保存後小字顯示在題目下方，可編輯、刪除 */
  const drawNote = r => {
    const box = $(`[data-note="${r}"]`, el), v = FORM.data['n' + r];
    if (box.dataset.edit) {
      box.innerHTML = `<textarea class="s-input" rows="2" maxlength="300" aria-label="備註">${esc(v || '')}</textarea><div class="s-note-btns"><button type="button" class="s-mini s-mini--pri" data-nsave>${ic('save')}保存</button><button type="button" class="s-mini" data-ncancel>取消</button></div>`;
      $('textarea', box).focus();
    } else if (v) box.innerHTML = `<p class="s-note-txt"><b>備註</b>${esc(v)}</p><div class="s-note-btns"><button type="button" class="s-mini" data-nedit>${ic('pen')}編輯</button><button type="button" class="s-mini" data-ndel>${ic('trash')}刪除</button></div>`;
    else box.innerHTML = `<button type="button" class="s-mini s-mini--add" data-nedit>${ic('plus')}新增備註</button>`;
  };
  el.addEventListener('click', e => {
    const box = e.target.closest('[data-note]'); if (!box) return; const r = box.dataset.note;
    if (e.target.closest('[data-nedit]')) { box.dataset.edit = 1; drawNote(r); }
    else if (e.target.closest('[data-ncancel]')) { delete box.dataset.edit; drawNote(r); }
    else if (e.target.closest('[data-nsave]')) { const res = FK.sanitize($('textarea', box).value); FORM.data['n' + r] = res.value.trim(); delete box.dataset.edit; FORM.save(); drawNote(r); if (res.changed) toast('已自動移除可能影響網站運作的符號或程式碼'); }
    else if (e.target.closest('[data-ndel]')) { delete FORM.data['n' + r]; FORM.save(); drawNote(r); }
  });
  const update = () => {
    let done = 0, ng = 0;
    items.forEach(it => {
      const v = FORM.data['i' + it.r], row = $(`.s-item[data-r="${it.r}"]`, el);
      row.classList.toggle('is-ok', v == okIdx); row.classList.toggle('is-ng', v != null && v != okIdx);
      if (v != null) { done++; if (v != okIdx) ng++; }
    });
    $('#prog', el).innerHTML = `已檢查 <b>${done}</b> / ${items.length} 項${ng ? `，<b style="color:var(--ng)">${esc(d.options[1 - okIdx])} ${ng} 項</b>` : ''}`;
    $('#progBar', el).style.width = (done / items.length * 100) + '%';
    if (done === items.length && !update.cheered && update.ready) { update.cheered = true; say('全部檢查完成！記得下載喔', 'mo-mascot--jump', 'laugh'); }
  };
  bindForm(el, doc.code, update); update.ready = true;
  items.forEach(it => drawNote(it.r));
  $$('input[name=flt]', el).forEach(r => r.onchange = () => $('#groups', el).classList.toggle('s-hide-ok', r.value === 'todo' && r.checked));
  resetBtn(el, doc.code, () => renderCheck2(el, d, doc));
  FORM.ops = async () => {
    const D = FORM.data, ops = [{ op: 'title', r: 0, c: 0, before: d.suffix, text: S(D.name) }];
    ops.push({ op: 'label', r: 1, c: 0, text: S(D.f0) }, { op: 'label', r: 1, c: 1, text: dtValue(D, 'f1') }, { op: 'label', r: 1, c: 2, text: S(D.f2) });
    items.forEach(it => {
      if (D['i' + it.r] != null) ops.push({ op: 'cell', r: it.r, c: 2 + Number(D['i' + it.r]), text: 'V' });
      ops.push({ op: 'cell', r: it.r, c: 4, text: S(D['n' + it.r]) });
    });
    for (const p of d.photos.rows) { const imgs = await photosOf('ph' + p.r); imgs.forEach((im, i) => ops.push({ op: 'photos', r: p.r, c: i, imgs: [im], inFirst: true })); }
    return ops;
  };
}

/* =========================================================
   文件：文字檢查表（C）
   ========================================================= */
async function renderCheckText(el, d, doc) {
  const f = d.fields;
  el.innerHTML = `
    ${notice([`${esc(d.signer.replace(/：$/, ''))}請於下載後親自簽章`])}
    <div class="s-notice s-notice--info">${ic('info')}<div>${d.note.map(esc).join('<br>')}</div></div>
    <fieldset class="s-fieldset mo-fade-up"><legend>基本資料</legend><div class="s-grid">
      ${textField('f0', f[0].label)}${textField('f1', f[1].label)}${textField('f2', f[2].label)}${dateField('f3', f[3].label)}${timeField('f4', f[4].label)}
    </div></fieldset>
    ${toolbar(progress())}
    <div class="s-ctable">
      ${d.items.map(it => `
        <div class="s-crow mo-fade-up mo-onview">
          <div><span class="s-lbl">${esc(d.head[0])}</span><h4>${esc(it.name)}</h4></div>
          <div><span class="s-lbl">${esc(d.head[1])}</span><p>${esc(it.std)}</p></div>
          <label><span class="s-lbl">${esc(d.head[2])}</span><textarea class="s-input" data-k="i${it.r}" aria-label="${esc(it.name)} ${esc(d.head[2])}"></textarea><em class="s-warn" hidden></em></label>
        </div>`).join('')}
    </div>
    <fieldset class="s-fieldset" style="margin-top:20px"><legend>${esc(d.recheck.label.replace(/：$/, ''))}</legend><textarea class="s-input" data-k="rc" aria-label="缺失複查結果"></textarea><em class="s-warn" hidden></em></fieldset>
    <div class="s-sign"><div>${esc(d.signer)}</div></div>`;
  const update = () => {
    const done = d.items.filter(it => S(FORM.data['i' + it.r])).length;
    $('#prog', el).innerHTML = `已填寫 <b>${done}</b> / ${d.items.length} 項檢查結果`;
    $('#progBar', el).style.width = (done / d.items.length * 100) + '%';
  };
  bindForm(el, doc.code, update);
  resetBtn(el, doc.code, () => renderCheckText(el, d, doc));
  FORM.ops = async () => {
    const D = FORM.data;
    const vals = [S(D.f0), S(D.f1), S(D.f2), FK.rocDate(D.f3), FK.zhTime(D.f4)];
    const ops = f.map((x, i) => ({ op: 'cell', r: x.r, c: x.c, text: vals[i] }));
    d.items.forEach(it => ops.push({ op: 'cell', r: it.r, c: 2, text: S(D['i' + it.r]) }));
    ops.push({ op: 'label', r: d.recheck.r, c: 0, text: S(D.rc) });
    return ops;
  };
}

/* =========================================================
   文件：災損報告表
   ========================================================= */
async function renderDamage(el, d, doc) {
  const line = (toks, li) => { let h = '';
    for (let i = 0; i < toks.length; i++) {
      const t = toks[i];
      if (t.box != null) {
        const nx = (toks[i + 1] && toks[i + 1].t) || ''; const m = nx.match(/^([^_]*)(.*)$/);
        const lab = m[1].trim(), rest = m[2].trim();
        h += `<button type="button" class="s-box${li === 0 && toks.length === 2 ? ' s-box--main' : ''}" data-k="b${t.box}" aria-pressed="false">${esc(lab || '勾選')}</button>${rest ? `<span class="s-txt">${esc(rest)}</span> ` : ''}`; i++;
      } else h += `<span class="s-txt">${esc(t.t)}</span>`;
    }
    return `<div class="s-boxline">${h}</div>`; };
  const F = d.fields2;
  el.innerHTML = `
    ${notice(['空白底線（範圍、深度、雨量、其他說明、傷亡與財損數字）請下載後填寫'])}
    <fieldset class="s-fieldset mo-fade-up"><legend>基本資料</legend><div class="s-grid">
      ${textField('h0', d.head[0].label)}${textField('h1', d.head[1].label)}${textField('h2', d.head[2].label)}${dateField('h3', d.head[3].label)}
    </div></fieldset>
    ${toolbar(`<div class="s-progress"><span id="prog">　</span></div>`)}
    <section class="s-group mo-fade-up"><h3>${esc(d.stage1)}<span>點選即勾選</span></h3>
      ${d.blocks.map(b => `<div class="s-blk">${b.map(line).join('')}</div>`).join('')}
      <div class="s-blk">${d.stats.map(s => `<div class="s-txt">${esc(s)}</div>`).join('')}</div>
    </section>
    <h3 class="s-h2" style="margin-top:36px;font-size:20px">${esc(d.title2)}</h3>
    <section class="s-group"><h3>${esc(d.sec1)}</h3><div class="s-blk"><div class="s-grid s-grid--1">
      ${textField('x0', F[0].label, { area: true })}${textField('x1', F[1].label, { area: true })}${dtField('x2', F[2].label)}</div>
      <div class="s-pgrid">${photoField('dp0', d.photoFields[0].label)}${photoField('dp1', d.photoFields[1].label)}</div></div></section>
    <section class="s-group"><h3>${esc(d.sec2)}</h3><div class="s-blk"><div class="s-grid s-grid--1">
      ${textField('x3', F[3].label, { area: true })}${dtField('x4', F[4].label)}</div>
      <div class="s-pgrid">${photoField('dp2', d.photoFields[2].label)}${photoField('dp3', d.photoFields[3].label)}</div></div></section>
    <fieldset class="s-fieldset"><legend>填表資訊</legend><div class="s-grid">${dateField('fd', '填表日期')}${textField('fp', '填表人')}</div></fieldset>`;
  const update = () => { const n = Object.keys(FORM.data).filter(k => /^b\d+$/.test(k) && FORM.data[k]).length; $('#prog', el).innerHTML = `已勾選 <b>${n}</b> 個項目`; };
  bindForm(el, doc.code, update);
  resetBtn(el, doc.code, () => renderDamage(el, d, doc));
  FORM.ops = async () => {
    const D = FORM.data, H = d.head;
    const ops = [0, 1, 2].map(i => ({ op: 'cell', t: H[i].t, r: H[i].r, c: H[i].c, text: S(D['h' + i]) }));
    ops.push({ op: 'cell', t: H[3].t, r: H[3].r, c: H[3].c, text: FK.rocDate(D.h3) });
    ops.push({ op: 'boxes', list: Object.keys(D).filter(k => /^b\d+$/.test(k) && D[k]).map(k => +k.slice(1)) });
    [S(D.x0), S(D.x1), dtValue(D, 'x2'), S(D.x3), dtValue(D, 'x4')].forEach((v, i) => ops.push({ op: 'cell', t: F[i].t, r: F[i].r, c: F[i].c, text: v }));
    for (let i = 0; i < 4; i++) {
      const imgs = await photosOf('dp' + i);
      imgs.forEach((im, k) => { const [t, r, c] = d.photoFields[i].slots[k]; ops.push({ op: 'photos', t, r, c, imgs: [im], labelAbove: true }); });
    }
    ops.push({ op: 'plabel', label: '填表日期：', text: FK.rocDate(D.fd) }, { op: 'plabel', label: '填表人：', text: S(D.fp) });
    return ops;
  };
}

/* =========================================================
   文件：緊急事故(通報紀錄)事件表
   ========================================================= */
async function renderEvent(el, d, doc) {
  const H = d.head, tl = d.times.map(t => t.split('：')[0]);
  el.innerHTML = `
    ${notice(d.signs.map(s => `${esc(s.unit)}：${s.roles.map(esc).join('、')}請於下載後親自簽章`))}
    <fieldset class="s-fieldset mo-fade-up"><legend>基本資料</legend><div class="s-grid">
      ${textField('h0', H[0].label)}${textField('h1', H[1].label)}${textField('h2', H[2].label)}${dateField('h3', H[3].label)}
    </div></fieldset>
    ${toolbar('')}
    <section class="s-group mo-fade-up"><h3>事件類型<span>可複選</span></h3><div class="s-blk"><div class="s-boxline">
      ${d.types.map((t, i) => `<button type="button" class="s-box" data-k="t${i}" aria-pressed="false">${esc(t.label)}</button>`).join('')}
    </div></div></section>
    <section class="s-group"><h3>${esc(d.history.label)}</h3><div class="s-blk">
      <div class="s-grid" style="margin-bottom:14px">${dtField('ts', tl[0])}${dtField('te', tl[1])}</div>
      ${textField('hist', d.history.hint, { area: true, rows: 4 })}
    </div></section>
    <section class="s-group"><h3>處理與檢討</h3><div class="s-blk"><div class="s-grid s-grid--1">${d.fields.map((f, i) => textField('f' + i, f.label, { area: true })).join('')}</div></div></section>
    ${d.signs.map(s => `<h3 class="s-signh">${esc(s.unit)}</h3><div class="s-sign">${s.roles.map(r => `<div>${esc(r)}</div>`).join('')}</div>`).join('')}`;
  bindForm(el, doc.code);
  resetBtn(el, doc.code, () => renderEvent(el, d, doc));
  FORM.ops = async () => {
    const D = FORM.data;
    const ops = [0, 1, 2].map(i => ({ op: 'cell', r: H[i].r, c: H[i].c, text: S(D['h' + i]) }));
    ops.push({ op: 'cell', r: H[3].r, c: H[3].c, text: FK.rocDate(D.h3) });
    const boxes = [];
    d.types.forEach((t, i) => { if (!D['t' + i]) return; if (t.box != null) boxes.push(t.box); else ops.push({ op: 'bullet', r: 2, c: 1, p: t.num }); });
    ops.push({ op: 'boxes', list: boxes });
    ops.push({ op: 'span', r: 3, c: 1, text: dtValue(D, 'ts'), after: tl[0] + '：', until: '日' });
    ops.push({ op: 'span', r: 3, c: 2, text: dtValue(D, 'te'), after: tl[1] + '：', until: '日' });
    ops.push({ op: 'append', r: d.history.r, c: d.history.c, text: S(D.hist) });
    d.fields.forEach((f, i) => ops.push({ op: 'cell', r: f.r, c: f.c, text: S(D['f' + i]) }));
    return ops;
  };
}

/* ---------- 下載已填寫版本 ----------
   電腦：另開新分頁下載。
   手機／平板：瀏覽器會擋掉「新分頁裡的下載」，所以改在原頁下載，
   並跳出「下載檔案」按鈕，萬一沒有自動開始，點一下就能存檔。 */
const IS_MOBILE = (() => { try { return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent)) || matchMedia('(pointer:coarse)').matches; } catch (_) { return false; } })();
function readyDialog(url, name) {
  const m = document.createElement('div');
  m.className = 'fk-modal';
  m.innerHTML = `<div class="fk-dialog mo-pop-in" role="dialog" aria-modal="true" aria-labelledby="dlReady">
    <h3 id="dlReady">檔案已準備好</h3>
    <p>如果沒有自動開始下載，請點下方按鈕存檔。<br><small>${esc(name)}</small></p>${/Line\/|FBAN|FBAV|Instagram|MicroMessenger/i.test(navigator.userAgent) ? '<p class="s-inapp">目前在 LINE／Facebook 等 App 內建瀏覽器，可能無法下載檔案。請點右上角選單，選「用預設瀏覽器開啟」（Safari 或 Chrome）後再下載。</p>' : ''}
    <div class="fk-pop-f"><a class="is-pri s-dlready" href="${url}" download="${esc(name)}">${ic('dl')}下載檔案</a><button type="button" data-no>關閉</button></div></div>`;
  document.body.appendChild(m);
  const close = () => m.remove();
  $('[data-no]', m).onclick = close;
  $('a', m).addEventListener('click', () => setTimeout(close, 600));
  m.addEventListener('click', e => { if (e.target === m) close(); });
}
async function downloadFilled(doc, btn) {
  if (!FORM || FORM.code !== doc.code || !FORM.ops) return;
  const name = doc.file.replace(/\.docx$/i, '') + '_已填寫.docx';
  let w = null;
  if (!IS_MOBILE) {
    try { w = window.open('', '_blank'); } catch (_) {}
    if (w) { try { w.document.write('<!doctype html><meta charset="utf-8"><title>下載中…</title><body style="font-family:system-ui,sans-serif;padding:48px;color:#333"><p>檔案產生中，請稍候…</p></body>'); w.document.close(); } catch (_) { w = null; } }
  }
  const btns = $$('[data-fill-dl]'), olds = btns.map(b => b.innerHTML);
  btns.forEach(b => { b.disabled = true; b.innerHTML = '<span class="mo-dots" style="font-size:8px"><i></i><i></i><i></i></span>產生中…'; });
  try {
    await loadScript(`data/templates/${doc.code}.js`);
    const ops = (await FORM.ops()).filter(o => o.op === 'boxes' || o.op === 'bullet' || o.op === 'photos' || o.text);
    const blob = await DocxFiller.fill(SOP_TPL[doc.code], ops);
    const url = URL.createObjectURL(blob);
    let done = false;
    if (w && !w.closed) {
      try {
        const a = w.document.createElement('a'); a.href = url; a.download = name; w.document.body.appendChild(a); a.click();
        w.document.body.innerHTML = `<p>✅ 已開始下載：<b>${esc(name)}</b></p><p>下載完成後可以關閉此分頁。</p>`; done = true;
      } catch (_) {}
    }
    if (!done) {
      if (w) try { w.close(); } catch (_) {}
      const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      if (IS_MOBILE) readyDialog(url, name);
    }
    setTimeout(() => URL.revokeObjectURL(url), 10 * 60000);
    toast(IS_MOBILE ? '檔案已產生' : '已下載：' + name); say('下載好了！請再確認一次內容，簽章記得補上喔', 'mo-mascot--jump', 'laugh', 4200);
  } catch (e) { console.error(e); if (w) try { w.close(); } catch (_) {} toast('產生失敗，請改用「下載原始文件」'); say('哎呀，出了點問題…', 'mo-mascot--alert', 'cry'); }
  btns.forEach((b, i) => { b.disabled = false; b.innerHTML = olds[i]; });
}

/* =========================================================
   作業流程：原始流程圖檢視器（縮放、拖曳、文件熱區）
   ========================================================= */
function renderFlow(el, f) {
  const [PW, PH] = f.page;
  const uniq = [...new Map(f.links.map(l => [l.code, l])).values()];
  el.innerHTML = `
    <div class="s-viewer" id="viewer">
      <div class="s-vtools" role="toolbar" aria-label="流程圖工具">
        <button type="button" class="s-iconbtn" data-z="-1" aria-label="縮小" title="縮小">${ic('minus')}</button>
        <output id="zv">100%</output>
        <button type="button" class="s-iconbtn" data-z="1" aria-label="放大" title="放大">${ic('plus')}</button>
        <button type="button" class="s-iconbtn" data-fit aria-label="符合畫面" title="符合畫面">${ic('fit')}</button>
        <button type="button" class="s-iconbtn" data-full aria-label="全螢幕" title="全螢幕">${ic('full')}</button>
        <span class="s-vhint">拖曳移動 ‧ Ctrl＋滾輪縮放 ‧ 雙擊放大 ‧ <i class="s-hotdot"></i> 可點擊前往文件</span>
      </div>
      <div class="s-vport" id="vport" tabindex="0" aria-label="${esc(f.title)}，可拖曳與縮放">
        <div class="s-vstage" id="vstage">
          <img src="${f.image}" alt="${esc(f.title)} 原始流程圖" draggable="false">
          ${f.links.map(l => { const [x0, y0, x1, y1] = l.box; return `<a class="s-hot" href="${(x => x ? docRoute(x.ch, x.sec, x.doc) : '#')(docByCode(l.code))}" style="left:${x0 / PW * 100}%;top:${y0 / PH * 100}%;width:${(x1 - x0) / PW * 100}%;height:${(y1 - y0) / PH * 100}%" title="前往：${esc(l.label)}"><span class="s-sr">前往：${esc(l.label)}</span></a>`; }).join('')}
        </div>
      </div>
    </div>
    <div class="s-related"><h3>${ic('link')}流程圖中的相關文件</h3><div>${uniq.map(l => { const x = docByCode(l.code); return x ? `<a class="s-pill s-pill--link" href="${docRoute(x.ch, x.sec, x.doc)}">${ic(x.doc.type)}${esc(x.doc.label)}<small>${esc(x.sec.title)}</small></a>` : ''; }).join('')}</div></div>`;
  const port = $('#vport', el), stage = $('#vstage', el), img = $('img', stage), zv = $('#zv', el);
  let s = 1, x = 0, y = 0, minS = .1, fitS = 1;
  const apply = () => { stage.style.transform = `translate(${x}px,${y}px) scale(${s})`; zv.textContent = Math.round(s / fitS * 100) + '%'; };
  const clamp = () => { const W = img.naturalWidth * s, H = img.naturalHeight * s, pw = port.clientWidth, ph = port.clientHeight;
    x = W < pw ? (pw - W) / 2 : Math.min(0, Math.max(pw - W, x)); y = H < ph ? (ph - H) / 2 : Math.min(0, Math.max(ph - H, y)); };
  const zoomAt = (ns, cx, cy) => { ns = Math.max(minS, Math.min(fitS * 6, ns)); x = cx - (cx - x) * ns / s; y = cy - (cy - y) * ns / s; s = ns; clamp(); apply(); };
  const fit = () => { fitS = Math.min(port.clientWidth / img.naturalWidth, (port.clientHeight) / img.naturalHeight); if (innerWidth < 760) fitS = port.clientWidth / img.naturalWidth; minS = fitS * .5; s = fitS; x = 0; y = 0; clamp(); apply(); };
  const ready = () => { stage.style.width = img.naturalWidth + 'px'; stage.style.height = img.naturalHeight + 'px'; fit(); };
  img.complete && img.naturalWidth ? ready() : img.addEventListener('load', ready);
  window.addEventListener('resize', () => { if (el.isConnected && img.naturalWidth) fit(); });
  $$('[data-z]', el).forEach(b => b.onclick = () => zoomAt(s * (+b.dataset.z > 0 ? 1.3 : 1 / 1.3), port.clientWidth / 2, port.clientHeight / 2));
  $('[data-fit]', el).onclick = fit;
  $('[data-full]', el).onclick = () => { const v = $('#viewer', el); document.fullscreenElement ? document.exitFullscreen() : (v.requestFullscreen && v.requestFullscreen().catch(() => {})); setTimeout(fit, 300); };
  document.addEventListener('fullscreenchange', () => setTimeout(() => el.isConnected && fit(), 100));
  port.addEventListener('wheel', e => { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); const r = port.getBoundingClientRect(); zoomAt(s * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX - r.left, e.clientY - r.top); }, { passive: false });
  port.addEventListener('dblclick', e => { const r = port.getBoundingClientRect(); zoomAt(s * 1.6, e.clientX - r.left, e.clientY - r.top); });
  port.addEventListener('keydown', e => { const k = { ArrowLeft: [40, 0], ArrowRight: [-40, 0], ArrowUp: [0, 40], ArrowDown: [0, -40] }[e.key]; if (k) { e.preventDefault(); x += k[0]; y += k[1]; clamp(); apply(); } if (e.key === '+' || e.key === '=') zoomAt(s * 1.2, port.clientWidth / 2, port.clientHeight / 2); if (e.key === '-') zoomAt(s / 1.2, port.clientWidth / 2, port.clientHeight / 2); });
  /* 拖曳與雙指縮放 */
  const pts = new Map(); let moved = 0, last = null, pinch = null;
  port.addEventListener('pointerdown', e => { pts.set(e.pointerId, [e.clientX, e.clientY]); moved = 0; last = [e.clientX, e.clientY]; if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), s }; } port.classList.add('is-drag'); });
  port.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2 && pinch) { const [a, b] = [...pts.values()]; const r = port.getBoundingClientRect(); zoomAt(pinch.s * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch.d, (a[0] + b[0]) / 2 - r.left, (a[1] + b[1]) / 2 - r.top); moved = 99; return; }
    const dx = e.clientX - last[0], dy = e.clientY - last[1]; last = [e.clientX, e.clientY]; moved += Math.abs(dx) + Math.abs(dy);
    if (moved > 4) { port.setPointerCapture && port.setPointerCapture(e.pointerId); x += dx; y += dy; clamp(); apply(); }
  });
  const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (!pts.size) port.classList.remove('is-drag'); };
  port.addEventListener('pointerup', up); port.addEventListener('pointercancel', up);
  port.addEventListener('click', e => { if (moved > 6 && e.target.closest('.s-hot')) e.preventDefault(); }, true);
}

/* =========================================================
   搜尋
   ========================================================= */
let IDX = null;
async function buildIndex() {
  if (IDX) return IDX;
  const list = [];
  for (const ch of CAT.chapters) for (const sec of ch.sections) for (const doc of sec.docs) {
    await loadDoc(doc.code).catch(() => {});
    const d = window.SOP_DOCS && SOP_DOCS[doc.code], f = FLOWS[doc.code];
    let text = [doc.label, doc.code, sec.title, ch.title, doc.file].join(' ');
    if (f) text += ' ' + f.title + ' ' + f.links.map(l => l.label).join(' ');
    if (d) text += ' ' + JSON.stringify(d).replace(/"(r|c|t|box|num|code)":\d+/g, '').replace(/[{}\[\]"]/g, ' ');
    list.push({ ch, sec, doc, title: docTitle(doc), text });
  }
  return (IDX = list);
}
function bindSearch(qIn, qOut) {
  let qT;
  qIn.addEventListener('focus', buildIndex);
  qIn.addEventListener('input', () => { clearTimeout(qT); qT = setTimeout(go, 150); });
  async function go() {
    const q = FK.sanitize(qIn.value).value.trim(); if (!q) { qOut.classList.remove('is-open'); return; }
    const idx = await buildIndex();
    const hits = idx.filter(x => x.text.toLowerCase().includes(q.toLowerCase())).slice(0, 12);
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const hl = s => esc(s).replace(re, m => `<mark>${m}</mark>`);
    qOut.innerHTML = hits.length ? hits.map(h => {
      const i = h.text.toLowerCase().indexOf(q.toLowerCase()); const snip = i >= 0 ? h.text.slice(Math.max(0, i - 14), i + q.length + 20).replace(/\s+/g, ' ') : '';
      return `<a href="${docRoute(h.ch, h.sec, h.doc)}">${hl(h.title)}<small>${esc(h.sec.id)} ${esc(h.sec.title)}${snip ? '｜…' + hl(snip) + '…' : ''}</small></a>`;
    }).join('') : '<p>找不到相關文件</p>';
    qOut.classList.add('is-open');
  }
  qOut.addEventListener('click', () => { qOut.classList.remove('is-open'); qIn.value = ''; document.body.classList.remove('s-searching'); });
}
bindSearch($('#q'), $('#qres'));
document.addEventListener('click', e => { if (!e.target.closest('.s-hsearch')) $('#qres').classList.remove('is-open'); });
$('#searchBtn').addEventListener('click', () => { document.body.classList.toggle('s-searching'); if (document.body.classList.contains('s-searching')) $('#q').focus(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { $('#qres').classList.remove('is-open'); document.body.classList.remove('s-searching'); if (!drawer.hidden) closeDrawer(); }
  if (e.key === '/' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); $('#q').focus(); }
});

/* =========================================================
   路由
   ========================================================= */
async function route() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  FORM = null; FK.closePop();
  const { ch, sec, doc } = find(parts[0], parts[1], parts[2]);
  ROUTE = { ch: parts.length ? ch : null, sec: parts[1] ? sec : null, doc: parts[1] ? doc : null };
  try {
    if (!parts.length) viewHome();
    else if (ch && !parts[1]) viewChapter(ch);
    else if (ch && sec && doc) await viewSection(ch, sec, doc);
    else { crumb([['首頁', '#/'], ['找不到頁面', '']]); app.innerHTML = `<div class="s-wrap s-empty"><div style="width:140px;margin:0 auto">${mascot('mo-mascot--idle', '140px', 'confused')}</div><p>找不到這個頁面。</p><a class="s-btn" href="#/">回首頁</a></div>`; }
  } catch (e) { console.error(e); app.innerHTML = '<p class="s-wrap s-empty">頁面載入失敗，請重新整理。</p>'; }
  reveal(app);
  if (!route.first) window.scrollTo(0, 0); route.first = false;
  app.focus({ preventScroll: true });
}
route.first = true;
window.addEventListener('hashchange', route);

/* ---------- 深色模式 ---------- */
const root = document.documentElement;
$$('[data-theme-btn]').forEach(b => b.addEventListener('click', () => { const t = root.dataset.theme === 'dark' ? 'light' : 'dark'; root.dataset.theme = t; try { localStorage.setItem('sop-theme', t); } catch (_) {} }));

route();
setTimeout(() => say('嗨！我是抵家，有問題可以點我～', 'mo-mascot--wave', 'wink'), 1200);

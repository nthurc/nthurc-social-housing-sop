/* =========================================================
   FormKit：表單共用元件
   ‧ 文字安全檢查（移除 HTML、程式碼、控制字元）
   ‧ 民國日期選擇器、時段時間選擇器（上午／下午／傍晚／凌晨）
   ‧ 照片欄位：每欄最多 2 張、超過 10MB 自動壓縮、存在本機 IndexedDB
   ========================================================= */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- 文字安全 ---------- */
  const MAX_LEN = 2000;
  function sanitize(s) {
    let v = String(s ?? '');
    const before = v;
    v = v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u2028\u2029\u202A-\u202E\u2060\uFEFF]/g, '');   // 控制字元、隱藏字元
    v = v.replace(/<\/?[a-z!][^>]*>/gi, '');                         // HTML 標籤
    v = v.replace(/\b(javascript|vbscript|data)\s*:/gi, '');          // 危險網址
    v = v.replace(/\bon[a-z]+\s*=\s*/gi, '');                          // onerror= 之類的事件
    v = v.replace(/(\{\{|\}\}|\$\{)/g, '');                            // 樣板語法
    if (v.length > MAX_LEN) v = v.slice(0, MAX_LEN);
    return { value: v, changed: v !== before };
  }

  /* ---------- 日期、時間格式 ---------- */
  const pad = n => String(n).padStart(2, '0');
  function rocDate(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-').map(Number);
    return `民國${y - 1911}年${m}月${d}日`;
  }
  function period(h) { return h >= 6 && h < 12 ? '上午' : h >= 12 && h < 18 ? '下午' : h >= 18 ? '傍晚' : '凌晨'; }
  function zhTime(hm) {
    if (!hm) return '';
    const [h, m] = hm.split(':').map(Number);
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${period(h)}${h12}點${m ? m + '分' : ''}`;
  }

  /* ---------- 浮動面板 ---------- */
  let openPop = null;
  function closePop() { if (openPop) { openPop.remove(); openPop = null; } }
  document.addEventListener('pointerdown', e => { if (openPop && !openPop.contains(e.target) && !e.target.closest('[data-picker]')) closePop(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePop(); });
  function popAt(anchor, html) {
    closePop();
    const p = document.createElement('div');
    p.className = 'fk-pop mo-pop-in'; p.style.setProperty('--mo-dur', '.25s');
    p.innerHTML = html; document.body.appendChild(p);
    const r = anchor.getBoundingClientRect();
    if (innerWidth < 640) p.classList.add('fk-sheet');
    else {
      const top = r.bottom + 8 + scrollY, left = Math.min(r.left + scrollX, scrollX + innerWidth - p.offsetWidth - 12);
      p.style.top = (r.bottom + p.offsetHeight + 8 > innerHeight ? r.top + scrollY - p.offsetHeight - 8 : top) + 'px';
      p.style.left = Math.max(12, left) + 'px';
    }
    openPop = p; return p;
  }

  /* ---------- 日期選擇器 ---------- */
  function datePicker(btn, value, onPick) {
    const today = new Date();
    let cur = value ? new Date(value + 'T00:00') : today;
    let y = cur.getFullYear(), m = cur.getMonth();
    const draw = () => {
      const first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
      let cells = '';
      for (let i = 0; i < first; i++) cells += '<span></span>';
      for (let d = 1; d <= days; d++) {
        const iso = `${y}-${pad(m + 1)}-${pad(d)}`;
        const isT = iso === `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
        cells += `<button type="button" data-d="${iso}" class="${iso === value ? 'is-sel' : ''}${isT ? ' is-today' : ''}">${d}</button>`;
      }
      pop.innerHTML = `
        <div class="fk-cal-h"><button type="button" data-nav="-1" aria-label="上個月">‹</button><b>民國 ${y - 1911} 年 ${m + 1} 月</b><button type="button" data-nav="1" aria-label="下個月">›</button></div>
        <div class="fk-cal-w"><span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span></div>
        <div class="fk-cal-g">${cells}</div>
        <div class="fk-pop-f"><button type="button" data-today>今天</button><button type="button" data-clear>清除</button></div>`;
    };
    const pop = popAt(btn, ''); draw();
    pop.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.nav) { m += +b.dataset.nav; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } draw(); }
      else if (b.dataset.d) { onPick(b.dataset.d); closePop(); }
      else if ('today' in b.dataset) { onPick(`${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`); closePop(); }
      else if ('clear' in b.dataset) { onPick(''); closePop(); }
    });
  }

  /* ---------- 時間選擇器（時段＋時＋分） ---------- */
  const PERIODS = [['凌晨', 0], ['上午', 6], ['下午', 12], ['傍晚', 18]];
  function timePicker(btn, value, onPick) {
    let [h, mi] = value ? value.split(':').map(Number) : [new Date().getHours(), 0];
    mi = Math.round(mi / 5) * 5 % 60;
    const draw = () => {
      const base = PERIODS.find(p => h >= p[1] && h < p[1] + 6)[1];
      pop.innerHTML = `
        <div class="fk-time-p">${PERIODS.map(p => `<button type="button" data-p="${p[1]}" class="${p[1] === base ? 'is-sel' : ''}">${p[0]}</button>`).join('')}</div>
        <div class="fk-time-l">時</div>
        <div class="fk-time-g">${[0, 1, 2, 3, 4, 5].map(i => { const hh = base + i, h12 = hh % 12 === 0 ? 12 : hh % 12; return `<button type="button" data-h="${hh}" class="${hh === h ? 'is-sel' : ''}">${h12}點</button>`; }).join('')}</div>
        <div class="fk-time-l">分</div>
        <div class="fk-time-g fk-time-m">${Array.from({ length: 12 }, (_, i) => i * 5).map(x => `<button type="button" data-m="${x}" class="${x === mi ? 'is-sel' : ''}">${x}分</button>`).join('')}</div>
        <div class="fk-time-adj"><button type="button" data-adj="-1" aria-label="減一分鐘">－1 分</button><output>${zhTime(`${h}:${mi}`)}</output><button type="button" data-adj="1" aria-label="加一分鐘">＋1 分</button></div>
        <div class="fk-pop-f"><button type="button" data-ok class="is-pri">確定</button><button type="button" data-clear>清除</button></div>`;
    };
    const pop = popAt(btn, ''); draw();
    pop.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.p) { h = +b.dataset.p + (h % 6); draw(); }
      else if (b.dataset.h) { h = +b.dataset.h; draw(); }
      else if (b.dataset.m) { mi = +b.dataset.m; draw(); }
      else if (b.dataset.adj) { mi += +b.dataset.adj; if (mi < 0) { mi = 59; h = (h + 23) % 24; } if (mi > 59) { mi = 0; h = (h + 1) % 24; } draw(); }
      else if ('ok' in b.dataset) { onPick(`${pad(h)}:${pad(mi)}`); closePop(); }
      else if ('clear' in b.dataset) { onPick(''); closePop(); }
    });
  }

  /* ---------- 照片儲存（IndexedDB，只在這台裝置） ---------- */
  let dbP = null;
  function db() {
    if (!dbP) dbP = new Promise((ok, no) => {
      const rq = indexedDB.open('sop-photos', 1);
      rq.onupgradeneeded = () => rq.result.createObjectStore('p');
      rq.onsuccess = () => ok(rq.result); rq.onerror = () => no(rq.error);
    });
    return dbP;
  }
  const tx = async (mode, fn) => { const d = await db(); return new Promise((ok, no) => { const t = d.transaction('p', mode); const r = fn(t.objectStore('p')); t.oncomplete = () => ok(r && r.result); t.onerror = () => no(t.error); }); };
  const Photos = {
    put: (k, v) => tx('readwrite', s => s.put(v, k)),
    get: k => tx('readonly', s => s.get(k)),
    del: k => tx('readwrite', s => s.delete(k)),
    async clear(prefix) { const d = await db(); return new Promise(ok => { const t = d.transaction('p', 'readwrite'); const st = t.objectStore('p'); const rq = st.openCursor(); rq.onsuccess = () => { const c = rq.result; if (!c) return; if (String(c.key).indexOf(prefix) === 0) c.delete(); c.continue(); }; t.oncomplete = ok; }); }
  };

  /* 讀取／壓縮照片：超過 10MB 自動壓縮；非 JPG/PNG 轉成 JPG（Word 才讀得到） */
  const LIMIT = 10 * 1024 * 1024;
  async function prepImage(file) {
    if (!/^image\//.test(file.type) && !/\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name)) throw new Error('只能上傳圖片檔');
    let bmp;
    try { bmp = await createImageBitmap(file); } catch (_) { throw new Error('這個圖片格式無法讀取，請改用 JPG 或 PNG'); }
    const okType = /image\/(jpeg|png)/.test(file.type);
    if (file.size <= LIMIT && okType) {
      return { blob: file, type: file.type, w: bmp.width, h: bmp.height, compressed: false };
    }
    let maxSide = file.size > LIMIT ? 2560 : Math.max(bmp.width, bmp.height);
    let q = .85, out, w, h;
    for (let i = 0; i < 6; i++) {
      const s = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
      w = Math.round(bmp.width * s); h = Math.round(bmp.height * s);
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, w, h); cx.drawImage(bmp, 0, 0, w, h);
      out = await new Promise(ok => cv.toBlob(ok, 'image/jpeg', q));
      if (out.size <= LIMIT * .5 || i === 5) break;
      maxSide *= .8; q -= .07;
    }
    return { blob: out, type: 'image/jpeg', w, h, compressed: file.size > LIMIT };
  }

  /* 上傳前的提醒（可勾選不再提醒） */
  function privacyNotice() {
    let off = false; try { off = localStorage.getItem('sop-photo-tip-off') === '1'; } catch (_) {}
    if (off) return Promise.resolve(true);
    return new Promise(ok => {
      const m = document.createElement('div');
      m.className = 'fk-modal';
      m.innerHTML = `<div class="fk-dialog mo-pop-in" role="dialog" aria-modal="true" aria-labelledby="fkTip">
        <h3 id="fkTip">上傳前請注意</h3>
        <p>上傳資料僅保留於您的個人裝置上，不會傳送到任何伺服器。清除瀏覽器資料後，照片與填寫內容也會一併移除。</p>
        <label class="fk-check"><input type="checkbox" id="fkOff"> 不再提醒</label>
        <div class="fk-pop-f"><button type="button" class="is-pri" data-ok>我知道了，選擇照片</button><button type="button" data-no>取消</button></div></div>`;
      document.body.appendChild(m);
      const done = v => { if (v && $('#fkOff', m).checked) { try { localStorage.setItem('sop-photo-tip-off', '1'); } catch (_) {} } m.remove(); ok(v); };
      $('[data-ok]', m).onclick = () => done(true);
      $('[data-no]', m).onclick = () => done(false);
      m.addEventListener('click', e => { if (e.target === m) done(false); });
      $('[data-ok]', m).focus();
    });
  }

  window.FormKit = { sanitize, rocDate, zhTime, datePicker, timePicker, Photos, prepImage, privacyNotice, closePop, esc };
})();

/* =========================================================
   DocxFiller：把網頁上填好的內容寫回「原始 .docx」
   只在原本的儲存格內加入文字／照片、把 □ 換成 ■、把占位空白換成日期，
   不新增、不刪除任何表格與欄位，因此格式與原始檔相同。
   需要 assets/js/vendor/jszip.min.js
   ========================================================= */
(function () {
  const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const XMLNS = 'http://www.w3.org/XML/1998/namespace';
  const NS = {
    w: W,
    wp: 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
    a: 'http://schemas.openxmlformats.org/drawingml/2006/main',
    pic: 'http://schemas.openxmlformats.org/drawingml/2006/picture',
    r: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
  };
  const kids = (el, name) => Array.from(el.childNodes).filter(n => n.nodeType === 1 && n.localName === name);
  const all = (el, name) => Array.from(el.getElementsByTagNameNS(W, name));
  const TW = 635;                       // 1 twip = 635 EMU

  function Doc(xml) {
    this.dom = new DOMParser().parseFromString(xml, 'application/xml');
    this.body = all(this.dom, 'body')[0];
    this.tbls = kids(this.body, 'tbl');
    this.images = []; this.imgSeq = 0;
  }
  Doc.prototype.tc = function (t, r, c) {
    const tr = kids(this.tbls[t], 'tr')[r];
    return { tr, tc: kids(tr, 'tc')[c] };
  };
  Doc.prototype.rPrOf = function (scope) {
    const r = all(scope, 'r').find(r => kids(r, 'rPr').length);
    return r ? kids(r, 'rPr')[0] : null;
  };
  Doc.prototype.run = function (text, rPr) {
    const d = this.dom, r = d.createElementNS(W, 'w:r');
    if (rPr) {
      const c = rPr.cloneNode(true);
      ['color', 'highlight', 'shd', 'vanish'].forEach(n => kids(c, n).forEach(x => c.removeChild(x)));   // 不沿用提示文字的灰色
      r.appendChild(c);
    }
    String(text).split('\n').forEach((line, i) => {
      if (i) r.appendChild(d.createElementNS(W, 'w:br'));
      const t = d.createElementNS(W, 'w:t');
      t.setAttributeNS(XMLNS, 'xml:space', 'preserve');
      t.textContent = line;
      r.appendChild(t);
    });
    return r;
  };
  /* 空白儲存格填入文字 */
  Doc.prototype.fillCell = function (t, r, c, text) {
    if (!text) return;
    const { tr, tc } = this.tc(t, r, c);
    kids(tc, 'p')[0].appendChild(this.run(text, this.rPrOf(tc) || this.rPrOf(tr)));
  };
  /* 取代儲存格原本的提示文字（例如「(請提供文字說明)」） */
  Doc.prototype.replaceCell = function (t, r, c, text) {
    if (!text) return;
    const { tr, tc } = this.tc(t, r, c);
    const rPr = this.rPrOf(tc) || this.rPrOf(tr);
    const ps = kids(tc, 'p');
    ps.forEach(p => kids(p, 'r').forEach(x => p.removeChild(x)));
    ps[0].appendChild(this.run(text, rPr));
  };
  /* 「標籤：」後面接上文字（scope 可為儲存格或段落） */
  Doc.prototype.afterLabel = function (scope, label, text) {
    const ts = all(scope, 't');
    const i = ts.findIndex(x => x.textContent.indexOf(label) >= 0);
    if (i < 0) return false;
    const t = ts[i], s = t.textContent, cut = s.indexOf(label) + label.length;
    const rest = s.slice(cut);
    const restTrim = rest.replace(/^[\s　]+/, '');
    t.textContent = s.slice(0, cut);
    for (let k = i + 1; k < ts.length && restTrim === ''; k++) {   // 吃掉後面只有空白的占位
      if (/^[\s　]*$/.test(ts[k].textContent)) ts[k].textContent = ''; else break;
    }
    const run = t.parentNode;
    const nr = this.run(text, kids(run, 'rPr')[0]);
    run.parentNode.insertBefore(nr, run.nextSibling);
    if (restTrim) nr.parentNode.insertBefore(this.run(' ' + restTrim, kids(run, 'rPr')[0]), nr.nextSibling);
    return true;
  };
  Doc.prototype.fillLabel = function (t, r, c, text, label) {
    if (!text) return;
    const { tc } = this.tc(t, r, c);
    if (label && this.afterLabel(tc, label, text)) return;
    const ts = all(tc, 't'); const last = [...ts].reverse().find(x => /：/.test(x.textContent));
    if (!last) return this.fillCell(t, r, c, text);
    last.textContent = last.textContent.replace(/[\s　]+$/, '');
    const run = last.parentNode;
    run.parentNode.insertBefore(this.run(text, kids(run, 'rPr')[0]), run.nextSibling);
  };
  /* 本文段落（表格外）的「標籤：」 */
  Doc.prototype.paraLabel = function (label, text) {
    if (!text) return;
    const p = kids(this.body, 'p').find(p => all(p, 't').some(t => t.textContent.indexOf(label) >= 0));
    if (p) this.afterLabel(p, label, text);
  };
  /* 把「    年     月     日」這類占位，從 after 之後到 until 字元為止換成文字 */
  Doc.prototype.replaceSpan = function (t, r, c, text, after, until) {
    if (!text) return;
    const { tc } = this.tc(t, r, c);
    const ts = all(tc, 't');
    const full = ts.map(x => x.textContent).join('');
    const start = after ? full.indexOf(after) + after.length : 0;
    const end = full.indexOf(until, start);
    if (start < 0 || end < 0) return this.fillCell(t, r, c, text);
    let pos = 0, put = false;
    ts.forEach(x => {
      const s = x.textContent, a = pos, b = pos + s.length; pos = b;
      if (b <= start || a > end) return;
      const keepHead = s.slice(0, Math.max(0, start - a));
      const keepTail = s.slice(Math.max(0, end + 1 - a));
      x.setAttributeNS(XMLNS, 'xml:space', 'preserve');
      x.textContent = keepHead + (put ? '' : text) + keepTail; put = true;
    });
  };
  Doc.prototype.fillTitleBlank = function (t, r, c, before, text) {
    if (!text) return;
    const { tc } = this.tc(t, r, c);
    const ts = all(tc, 't');
    const i = ts.findIndex((x, k) => /^\s+$/.test(x.textContent) && ts[k + 1] && ts[k + 1].textContent.indexOf(before) === 0);
    if (i >= 0) ts[i].textContent = text;
  };
  Doc.prototype.appendPara = function (t, r, c, text) {
    if (!text) return;
    const { tc } = this.tc(t, r, c);
    const p = this.newPara(tc);
    p.appendChild(this.run(text, this.rPrOf(tc)));
    tc.appendChild(p);
  };
  Doc.prototype.newPara = function (tc, center) {
    const ps = kids(tc, 'p'), lastP = ps[ps.length - 1];
    const p = this.dom.createElementNS(W, 'w:p');
    const pPr = kids(lastP, 'pPr')[0];
    let c2 = pPr ? pPr.cloneNode(true) : this.dom.createElementNS(W, 'w:pPr');
    kids(c2, 'numPr').forEach(n => c2.removeChild(n));
    if (center) { kids(c2, 'jc').forEach(n => c2.removeChild(n)); const jc = this.dom.createElementNS(W, 'w:jc'); jc.setAttributeNS(W, 'w:val', 'center'); c2.appendChild(jc); kids(c2, 'ind').forEach(n => c2.removeChild(n)); }
    p.appendChild(c2);
    return p;
  };
  Doc.prototype.checkBoxes = function (indexes) {
    const set = new Set(indexes); let n = 0;
    all(this.body, 't').forEach(t => {
      const s = t.textContent; if (s.indexOf('□') < 0) return;
      t.textContent = s.replace(/□/g, m => (set.has(n++) ? '■' : m));
    });
  };
  /* 照片：同一格內 1～2 張並排，寬度依儲存格自動縮放 */
  Doc.prototype.photos = function (t, r, c, imgs, opt) {
    if (!imgs || !imgs.length) return;
    const { tr, tc } = this.tc(t, r, c);
    const tcPr = kids(tc, 'tcPr')[0], tcWel = tcPr && kids(tcPr, 'tcW')[0];
    const tcW = (tcWel && +tcWel.getAttributeNS(W, 'w')) || 4000;
    const trH = (() => { const pr = kids(tr, 'trPr')[0]; const h = pr && kids(pr, 'trHeight')[0]; return h ? +h.getAttributeNS(W, 'val') : 0; })();
    const usable = (tcW - 260) * TW;
    const gap = 120 * TW;
    const maxW = imgs.length > 1 ? (usable - gap) / imgs.length : usable;
    const maxH = (opt && opt.maxH ? opt.maxH : (trH ? Math.max(trH - (opt && opt.labelAbove ? 520 : 220), 900) : 3600)) * TW;
    let p;
    if (opt && opt.inFirst && !all(tc, 't').some(x => x.textContent.trim())) {
      p = kids(tc, 'p')[0];
      kids(p, 'pPr').forEach(pp => { kids(pp, 'jc').forEach(n => pp.removeChild(n)); const jc = this.dom.createElementNS(W, 'w:jc'); jc.setAttributeNS(W, 'w:val', 'center'); pp.appendChild(jc); });
    } else { p = this.newPara(tc, true); tc.appendChild(p); }
    imgs.forEach((im, i) => {
      const s = Math.min(maxW / im.w, maxH / im.h);
      const cx = Math.round(im.w * s), cy = Math.round(im.h * s);
      if (i) p.appendChild(this.run('  ', null));
      p.appendChild(this.drawing(im, cx, cy));
    });
  };
  Doc.prototype.drawing = function (im, cx, cy) {
    const n = ++this.imgSeq, rid = 'rIdSop' + n, id = 9000 + n, ext = im.ext;
    this.images.push({ rid, file: `sop_photo_${n}.${ext}`, data: im.data, ext });
    const xml = `<w:r xmlns:w="${NS.w}"><w:drawing><wp:inline xmlns:wp="${NS.wp}" distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="${id}" name="照片 ${n}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="${NS.a}" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="${NS.a}"><a:graphicData uri="${NS.pic}"><pic:pic xmlns:pic="${NS.pic}"><pic:nvPicPr><pic:cNvPr id="${id}" name="sop_photo_${n}.${ext}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip xmlns:r="${NS.r}" r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
    const frag = new DOMParser().parseFromString(xml, 'application/xml').documentElement;
    return this.dom.importNode(frag, true);
  };
  Doc.prototype.xml = function () { return new XMLSerializer().serializeToString(this.dom); };

  function bulletChecked(numXml, paras) {
    if (!paras.length) return numXml;
    const nd = new DOMParser().parseFromString(numXml, 'application/xml');
    const root = nd.documentElement;
    const nums = kids(root, 'num'), abs = kids(root, 'abstractNum');
    const numIdEl = paras[0].getElementsByTagNameNS(W, 'numId')[0];
    const srcNumId = numIdEl ? numIdEl.getAttributeNS(W, 'val') : null;
    const srcNum = nums.find(n => n.getAttributeNS(W, 'numId') === srcNumId);
    if (!srcNum) return numXml;
    const srcAbsId = kids(srcNum, 'abstractNumId')[0].getAttributeNS(W, 'val');
    const srcAbs = abs.find(a => a.getAttributeNS(W, 'abstractNumId') === srcAbsId);
    const newAbsId = String(Math.max(...abs.map(a => +a.getAttributeNS(W, 'abstractNumId'))) + 1);
    const newNumId = String(Math.max(...nums.map(n => +n.getAttributeNS(W, 'numId'))) + 1);
    const a2 = srcAbs.cloneNode(true);
    a2.setAttributeNS(W, 'w:abstractNumId', newAbsId);
    kids(a2, 'nsid').forEach(n => n.setAttributeNS(W, 'w:val', 'ABCD' + newAbsId.padStart(4, '0')));
    kids(kids(a2, 'lvl')[0], 'lvlText')[0].setAttributeNS(W, 'w:val', '■');
    root.insertBefore(a2, abs[abs.length - 1].nextSibling);
    const n2 = nd.createElementNS(W, 'w:num'); n2.setAttributeNS(W, 'w:numId', newNumId);
    const ai = nd.createElementNS(W, 'w:abstractNumId'); ai.setAttributeNS(W, 'w:val', newAbsId); n2.appendChild(ai);
    root.appendChild(n2);
    paras.forEach(p => all(p, 'numId').forEach(x => x.setAttributeNS(W, 'w:val', newNumId)));
    return new XMLSerializer().serializeToString(nd);
  }

  async function addImages(zip, images) {
    if (!images.length) return;
    let rels = await zip.file('word/_rels/document.xml.rels').async('string');
    const add = images.map(i => `<Relationship Id="${i.rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${i.file}"/>`).join('');
    rels = rels.replace('</Relationships>', add + '</Relationships>');
    zip.file('word/_rels/document.xml.rels', rels);
    let ct = await zip.file('[Content_Types].xml').async('string');
    [['jpg', 'image/jpeg'], ['png', 'image/png']].forEach(([e, m]) => {
      if (images.some(i => i.ext === e) && !new RegExp(`Extension="${e}"`, 'i').test(ct)) ct = ct.replace('<Default ', `<Default Extension="${e}" ContentType="${m}"/><Default `);
    });
    zip.file('[Content_Types].xml', ct);
    images.forEach(i => zip.file('word/media/' + i.file, i.data));
  }

  /* ops：操作清單，見 app.js 各表單的 FORM.ops() */
  async function fill(base64, ops) {
    const zip = await JSZip.loadAsync(base64, { base64: true });
    const doc = new Doc(await zip.file('word/document.xml').async('string'));
    const bulletParas = [];
    ops.forEach(o => {
      const t = o.t || 0;
      if (o.op === 'cell') doc.fillCell(t, o.r, o.c, o.text);
      else if (o.op === 'replace') doc.replaceCell(t, o.r, o.c, o.text);
      else if (o.op === 'label') doc.fillLabel(t, o.r, o.c, o.text, o.label);
      else if (o.op === 'span') doc.replaceSpan(t, o.r, o.c, o.text, o.after, o.until);
      else if (o.op === 'plabel') doc.paraLabel(o.label, o.text);
      else if (o.op === 'title') doc.fillTitleBlank(t, o.r, o.c, o.before, o.text);
      else if (o.op === 'append') doc.appendPara(t, o.r, o.c, o.text);
      else if (o.op === 'boxes') doc.checkBoxes(o.list);
      else if (o.op === 'photos') doc.photos(t, o.r, o.c, o.imgs, o);
      else if (o.op === 'bullet') { const { tc } = doc.tc(t, o.r, o.c); bulletParas.push(kids(tc, 'p')[o.p]); }
    });
    if (bulletParas.length && zip.file('word/numbering.xml')) {
      zip.file('word/numbering.xml', bulletChecked(await zip.file('word/numbering.xml').async('string'), bulletParas));
    }
    zip.file('word/document.xml', doc.xml());
    await addImages(zip, doc.images);
    return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', compression: 'DEFLATE' });
  }
  window.DocxFiller = { fill };
})();

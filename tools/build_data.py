"""
社宅 SOP 知識庫：文件資料產生器
把 files/ 裡的 .docx 轉成網站讀取的 data/docs/*.js（文字逐字取自原檔，不改寫），
並把可填寫的表單轉成 data/templates/*.js（base64，供網站「下載已填寫版本」使用）。

用法（需要 Python 3 與 python-docx、lxml）：
    pip install python-docx lxml
    python tools/build_data.py

新增章節時：把檔案放進 files/，在下方 DOCS 清單加一筆（指定 kind），再執行一次。
kind：plan（整備作業與應變計畫 A）、check2（二選一檢核表 B）、checktext（文字檢查表 C）、
      damage（災損報告表）、event（事件表）。流程圖（PDF/JPG）由 data/flows.js 手工描述。
"""
import base64, json, re, sys
from pathlib import Path
from lxml import etree

ROOT = Path(__file__).resolve().parent.parent
W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
NC01 = 'files/NC-01(緊急事故通報相關)'

DOCS = [
    ('NC-010102-01-1', 'plan',      f'{NC01}/NC-01-01(颱風暨豪雨相關)/颱風及豪雨-整備作業與應變計畫(A)-NC-010102-01-1.docx'),
    ('NC-010102-02-1', 'check2',    f'{NC01}/NC-01-01(颱風暨豪雨相關)/颱風及豪雨(前)社宅重點檢核表(B)-NC-010102-02-1.docx'),
    ('NC-010102-03-1', 'checktext', f'{NC01}/NC-01-01(颱風暨豪雨相關)/颱風基地防災減災自主檢查表(C)-NC-010102-03-1.docx'),
    ('NC-010202-01-1', 'plan',      f'{NC01}/NC-01-02(消防相關)/火災整備作業與應變計畫(A)-NC-010202-01-1.docx'),
    ('NC-010302-01-1', 'plan',      f'{NC01}/NC-01-03(地震相關)/地震整備作業與應變計畫(A)-NC-010302-01-1.docx'),
    ('NC-010302-02-1', 'check2',    f'{NC01}/NC-01-03(地震相關)/地震後重點巡查檢核表(B)-NC-010302-02-1.docx'),
    ('NC-019902-01-1', 'plan',      f'{NC01}/NC-01-99(全)/防災整備作業與應變計畫(A)-NC-019902-01-1.docx'),
    ('NC-019902-02-1', 'damage',    f'{NC01}/NC-01-99(全)/災損報告表(全)-NC-019902-02-1.docx'),
    ('NC-019902-03-1', 'event',     f'{NC01}/NC-01-99(全)/緊急事故(通報紀錄)事件表(全)-NC-019902-03-1.docx'),
]

def txt(el):
    return ''.join(t.text or '' for t in el.iter(W + 't'))

def ptexts(tc):
    return [txt(p) for p in tc.findall(W + 'p')]

def clean(s):
    return re.sub(r'\s+', ' ', s).strip()

def ctitle(s):
    # 去掉文字方塊裡的文件代碼與定位數字，只留標題
    return re.sub(r'^[\s\S]*NC-\d{6}-\d{2}-\d+\s*', '', clean(s))

def load(path):
    import zipfile
    with zipfile.ZipFile(ROOT / path) as z:
        root = etree.fromstring(z.read('word/document.xml'))
    body = root.find(W + 'body')
    tbls = [e for e in body if e.tag == W + 'tbl']
    paras = [clean(txt(e)) for e in body if e.tag == W + 'p']
    return tbls, paras

def rows(tbl):
    return [tr.findall(W + 'tc') for tr in tbl.findall(W + 'tr')]

def vmerge_continue(tc):
    pr = tc.find(W + 'tcPr')
    if pr is None: return False
    vm = pr.find(W + 'vMerge')
    return vm is not None and vm.get(W + 'val') in (None, 'continue')

# ---------- A：整備作業與應變計畫 ----------
def parse_plan(path):
    tbls, paras = load(path)
    R = rows(tbls[0])
    title = ctitle(next(p for p in paras if p))
    date_note = clean(txt(R[1][1])) if len(R[1]) > 1 else ''
    start = next(i for i, r in enumerate(R) if clean(txt(r[0])) == '整備作業與應變計畫') + 1
    if clean(txt(R[start][0])) == '項次': start += 1
    groups, cur = [], None
    for ri, r in enumerate(R[start:], start=start):
        cells = [c for c in r]
        texts = [clean(txt(c)) for c in cells]
        # 合併儲存格（vMerge continue）沿用上一列的值
        no, area = texts[0], texts[1]
        if len(cells) == 5: sub, op, hint = texts[2], texts[3], texts[4]
        else: sub, op, hint = '', texts[2], texts[3]
        if not vmerge_continue(cells[0]) and no:
            cur = {'no': no, 'area': area, 'items': []}; groups.append(cur)
        cur['items'].append({'sub': sub if sub else None, 'op': op, 'hint': hint, 'r': ri, 'c': len(cells) - 1})
    # 子項（例如消防箱）若為合併儲存格，補上前一個值
    for g in groups:
        last = None
        for it in g['items']:
            if it['sub'] is None and last and any(i['sub'] for i in g['items']): it['sub'] = last
            if it['sub']: last = it['sub']
    head = [{'label': clean(txt(R[0][0])), 'r': 0, 'c': 1}, {'label': clean(txt(R[0][2])), 'r': 0, 'c': 3}]
    return {'kind': 'plan', 'title': title, 'dateNote': date_note, 'groups': groups, 'head': head, 'date': {'label': clean(txt(R[1][0])), 'r': 1, 'c': 1},
            'cols': ['項次', '作業要項', '操作要項', '操作要項過程說明(圖示、文字、照片)']}

# ---------- B：二選一檢核表 ----------
def parse_check2(path):
    tbls, paras = load(path)
    R = rows(tbls[0])
    title_raw = clean(txt(R[0][0]))
    m = re.search(r'([^\s]+\(B\))-\s*(青年社會住宅)', ctitle(title_raw))
    labels = [clean(txt(c)) for c in R[1]]
    options = [clean(txt(R[3][2])), clean(txt(R[3][3]))]
    groups, photos, in_photo = [], {'title': '', 'groups': []}, False
    for ri, r in enumerate(R[4:], start=4):
        t = [clean(txt(c)) for c in r]
        if len(r) == 1:
            if '照片紀錄' in t[0]: in_photo = True; photos['title'] = t[0]; continue
            if in_photo: photos['groups'].append(t[0])
            else: groups.append({'name': t[0], 'items': []})
        elif len(r) == 5 and not in_photo:
            groups[-1]['items'].append({'no': t[0], 'text': t[1], 'r': ri})
        elif len(r) == 2 and in_photo:
            photos.setdefault('rows', []).append({'group': photos['groups'][-1], 'r': ri})
    signer = next((p for p in paras if p.endswith('：')), '')
    return {'kind': 'check2', 'title': m.group(1), 'suffix': m.group(2), 'labels': labels,
            'options': options, 'groups': groups, 'photos': photos, 'signer': signer}

# ---------- C：文字檢查表 ----------
def parse_checktext(path):
    tbls, paras = load(path)
    R = rows(tbls[0])
    title = next(p for p in paras if '檢查表' in p)
    title = title[title.index('基地'):] if '基地' in title else title
    fields = [{'label': clean(txt(R[0][0])), 'r': 0, 'c': 1}, {'label': clean(txt(R[1][0])), 'r': 1, 'c': 1}]
    for c in (0, 2, 4): fields.append({'label': clean(txt(R[2][c])), 'r': 2, 'c': c + 1})
    head = [clean(txt(c)) for c in R[3]]
    items = []
    for ri in range(4, len(R)):
        if len(R[ri]) == 3:
            items.append({'name': clean(txt(R[ri][0])), 'std': clean(txt(R[ri][1])), 'r': ri})
    recheck_r = next(i for i, r in enumerate(R) if '缺失複查結果' in txt(r[0]))
    note = [clean(p) for p in ptexts(R[-1][0]) if clean(p)]
    signer = next((p for p in paras if '簽名' in p), '')
    return {'kind': 'checktext', 'title': title, 'fields': fields, 'head': head, 'items': items,
            'recheck': {'label': '缺失複查結果：', 'r': recheck_r}, 'note': note, 'signer': signer}

# ---------- 災損報告表 ----------
def parse_damage(path):
    tbls, paras = load(path)
    R0, R1 = rows(tbls[0]), rows(tbls[1])
    box = 0; blocks = []
    for ri in range(3, 8):
        lines = []
        for p in ptexts(R0[ri][0]):
            if not p.strip(): continue
            parts = re.split(r'(□)', p.rstrip())
            toks = []
            for s in parts:
                if s == '□': toks.append({'box': box}); box += 1
                elif s: toks.append({'t': s})
            lines.append(toks)
        blocks.append(lines)
    stats = [p for p in ptexts(R0[8][0]) if p.strip()]
    t1 = [{'label': clean(txt(R1[r][0])), 't': 1, 'r': r, 'c': 1} for r in (1, 2, 3, 7, 8)]
    return {'kind': 'damage', 'title': '災損報告表(全)', 'title2': ctitle(next(p for p in paras if '回報表單' in p)),
            'head': [{'label': '社宅名稱', 't': 0, 'r': 0, 'c': 1}, {'label': '物管單位', 't': 0, 'r': 0, 'c': 3},
                     {'label': '災害名稱', 't': 0, 'r': 2, 'c': 1}, {'label': '災害日期', 't': 0, 'r': 2, 'c': 3}],
            'stage1': clean(txt(R0[1][0])), 'blocks': blocks, 'boxes': box, 'stats': stats,
            'sec1': clean(txt(R1[0][0])), 'sec2': clean(txt(R1[6][0])), 'fields2': t1,
            'photos': [clean(txt(c)) for c in R1[4]] + [clean(txt(c)) for c in R1[9]],
            'photoFields': [{'label': clean(txt(R1[4][0])), 'slots': [[1, 4, 0], [1, 5, 0]]}, {'label': clean(txt(R1[4][1])), 'slots': [[1, 4, 1], [1, 5, 1]]},
                            {'label': clean(txt(R1[9][0])) + '（一）', 'slots': [[1, 9, 0], [1, 9, 1]]}, {'label': clean(txt(R1[10][0])) + '（二）', 'slots': [[1, 10, 0], [1, 10, 1]]}],
            'footer': next(p for p in paras if '填表日期' in p)}

# ---------- 事件表 ----------
def parse_event(path):
    tbls, paras = load(path)
    R = rows(tbls[0])
    return {'kind': 'event', 'title': '緊急事故(通報紀錄)-事件表(全)',
            'head': [{'label': '社宅名稱', 'r': 0, 'c': 1}, {'label': '物管單位', 'r': 0, 'c': 3},
                     {'label': '發生地點', 'r': 1, 'c': 1}, {'label': '發生日期', 'r': 1, 'c': 3}],
            'types': [{'label': '天然災害', 'num': 0}, {'label': '公共安全事件', 'box': 0},
                      {'label': '意外事件', 'num': 1}, {'label': '暴力衝突事件', 'box': 1}, {'label': '其他', 'num': 2}],
            'times': [clean(txt(R[3][1])), clean(txt(R[3][2]))],
            'history': {'label': '歷程記錄', 'hint': clean(txt(R[4][1])), 'r': 4, 'c': 1},
            'fields': [{'label': clean(txt(R[5][0])), 'r': 5, 'c': 1}, {'label': clean(txt(R[6][0])), 'r': 6, 'c': 1}],
            'signs': [{'unit': clean(txt(R[7][0])), 'roles': [clean(txt(c)) for c in R[8]]},
                      {'unit': clean(txt(R[9][0])), 'roles': [clean(txt(c)) for c in R[10]]}]}

PARSERS = {'plan': parse_plan, 'check2': parse_check2, 'checktext': parse_checktext, 'damage': parse_damage, 'event': parse_event}

def main():
    out = ROOT / 'data' / 'docs'; out.mkdir(parents=True, exist_ok=True)
    tpl = ROOT / 'data' / 'templates'; tpl.mkdir(parents=True, exist_ok=True)
    for code, kind, path in DOCS:
        d = PARSERS[kind](path); d['code'] = code
        js = 'window.SOP_DOCS=window.SOP_DOCS||{};SOP_DOCS[' + json.dumps(code) + ']=' + json.dumps(d, ensure_ascii=False, indent=1) + ';\n'
        (out / f'{code}.js').write_text(js, encoding='utf-8')
        if True:
            b64 = base64.b64encode((ROOT / path).read_bytes()).decode()
            (tpl / f'{code}.js').write_text('window.SOP_TPL=window.SOP_TPL||{};SOP_TPL[' + json.dumps(code) + ']="' + b64 + '";\n', encoding='utf-8')
        print('OK', code, kind)

if __name__ == '__main__':
    main()

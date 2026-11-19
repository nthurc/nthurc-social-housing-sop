/* =========================================================
   網站目錄（新增／刪除／修改章節只要改這個檔案）
   ‧ chapters：大章節（例如 NC-01）
   ‧ sections：子頁，對應 files/ 底下的資料夾
   ‧ docs：子頁裡的文件，一個文件一個切換按鈕
       code  文件編號（也是 data/docs/<code>.js 的檔名）
       type  flow 作業流程｜plan 整備計畫｜check 檢核表｜form 表單
       label 按鈕上的短名稱
       file  原始檔檔名（放在該子頁資料夾內）
   ‧ cover：卡片滑過時浮出的照片（放在 assets/img/covers/，檔案不存在就不顯示）
   ========================================================= */
window.SOP_CATALOG = {
  site: { name: '社宅 SOP 知識庫', org: '新北市住宅及都市更新中心' },
  chapters: [
    {
      id: 'NC-01',
      title: '緊急事故通報相關',
      folder: 'files/NC-01(緊急事故通報相關)',
      desc: '颱風豪雨、火災、地震等緊急事故的作業流程、整備計畫、檢核表與通報表單。',
      icon: 'siren', cover: 'assets/img/covers/NC-01.jpg',
      sections: [
        {
          id: 'NC-01-01', title: '颱風暨豪雨相關', folder: 'NC-01-01(颱風暨豪雨相關)', theme: 'typhoon', cover: 'assets/img/covers/NC-01-01.jpg',
          docs: [
            { code: 'NC-010101-01-1', type: 'flow',  label: '作業流程',     file: '颱風及豪雨-應變計劃之作業流程-NC-010101-01-1.pdf' },
            { code: 'NC-010102-01-1', type: 'plan',  label: '整備計畫(A)',  file: '颱風及豪雨-整備作業與應變計畫(A)-NC-010102-01-1.docx' },
            { code: 'NC-010102-02-1', type: 'check', label: '重點檢核表(B)', file: '颱風及豪雨(前)社宅重點檢核表(B)-NC-010102-02-1.docx' },
            { code: 'NC-010102-03-1', type: 'check', label: '自主檢查表(C)', file: '颱風基地防災減災自主檢查表(C)-NC-010102-03-1.docx' }
          ]
        },
        {
          id: 'NC-01-02', title: '消防相關', folder: 'NC-01-02(消防相關)', theme: 'fire', cover: 'assets/img/covers/NC-01-02.jpg',
          docs: [
            { code: 'NC-010202-01-1', type: 'plan', label: '整備計畫(A)', file: '火災整備作業與應變計畫(A)-NC-010202-01-1.docx' }
          ]
        },
        {
          id: 'NC-01-03', title: '地震相關', folder: 'NC-01-03(地震相關)', theme: 'quake', cover: 'assets/img/covers/NC-01-03.jpg',
          docs: [
            { code: 'NC-010301-01-1', type: 'flow',  label: '作業流程',       file: '地震-應變計劃之作業流程圖-NC-010301-01-1.pdf' },
            { code: 'NC-010302-01-1', type: 'plan',  label: '整備計畫(A)',    file: '地震整備作業與應變計畫(A)-NC-010302-01-1.docx' },
            { code: 'NC-010302-02-1', type: 'check', label: '重點巡查檢核表(B)', file: '地震後重點巡查檢核表(B)-NC-010302-02-1.docx' }
          ]
        },
        {
          id: 'NC-01-99', title: '全', folder: 'NC-01-99(全)', theme: 'all', cover: 'assets/img/covers/NC-01-99.jpg',
          docs: [
            { code: 'NC-019901-01-2', type: 'flow', label: '通報作業流程', file: '緊急事故通報之作業流程-NC-019901-01-2(1150501發布).jpg' },
            { code: 'NC-019902-01-1', type: 'plan', label: '防災整備計畫(A)', file: '防災整備作業與應變計畫(A)-NC-019902-01-1.docx' },
            { code: 'NC-019902-02-1', type: 'form', label: '災損報告表', file: '災損報告表(全)-NC-019902-02-1.docx' },
            { code: 'NC-019902-03-1', type: 'form', label: '事件表',     file: '緊急事故(通報紀錄)事件表(全)-NC-019902-03-1.docx' }
          ]
        }
      ]
    }
    /* 新增大章節範例：
    ,{ id: 'NC-02', title: '○○○相關', folder: 'files/NC-02(○○○相關)', desc: '…', icon: 'book', sections: [ … ] } */
  ]
};

// 見積書のお姉さん：全ページ共通（スマホのメニュー・アクセス解析）
(() => {
  const btn = document.querySelector('.menu-btn');
  if (btn) btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('nav-open', open);
  });
  document.querySelectorAll('.site-nav a').forEach(a => a.addEventListener('click', () => {
    document.body.classList.remove('nav-open');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }));
})();

// 動画の公開：assets/videos.json の公開の時刻を過ぎた回は、「近日公開」を YouTube の埋め込みに替える
// （毎日18時の公開に合わせて（10/19 までは20時）、見た人のブラウザで切り替える。HTML への書き込みは .github/scripts/publish_videos.py）
// 計算ページへの入り口（data-gate="NN" hidden）も、その回の公開と同時に出す
(() => {
  const src = document.currentScript && document.currentScript.src;
  if (!src || !document.querySelector('.vid, .ep, .video__frame, [data-gate]')) return;
  const iframe = (id, n) => {
    const f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + id;
    f.title = '第' + n + '回の動画';
    f.loading = 'lazy';
    f.allow = 'accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    f.allowFullscreen = true;
    f.style.cssText = 'display:block;width:100%;height:100%;border:0';
    return f;
  };
  // 見ている人に出す番号は上げた順（01〜06 のあと、_SNS投稿/投稿の順番.json の順に 第7回・第8回…。2026-10-14 丸藤さん・2026-10-16 23〜33 を足して並べ直し）
  // URL やファイルは作った番号のまま。順番が変わったら、ここと publish_videos.py の NO と各ページの番号・並びを直す
  const NO = { '07': 10, '08': 11, '09': 12, '10': 7, '11': 8, '12': 9, '13': 26, '14': 13, '15': 30, '16': 22, '17': 25, '18': 14, '19': 19, '20': 15, '21': 24, '22': 33, '23': 16, '24': 17, '25': 18, '26': 20, '27': 21, '28': 23, '29': 27, '30': 28, '31': 29, '32': 31, '33': 32 };
  const here = (location.pathname.match(/\/douga\/(\d{2})\/$/) || [])[1];
  fetch(new URL('videos.json', src), { cache: 'no-cache' }).then(r => r.json()).then(videos => {
    const now = Date.now();
    Object.entries(videos).forEach(([nn, v]) => {
      if (Date.parse(v.at) > now) return;
      const n = NO[nn] || Number(nn);
      // 計算ページへの入り口と、計算ページそのもの
      document.querySelectorAll('[data-gate="' + nn + '"]').forEach(el => {
        el.hidden = false;
        el.removeAttribute('data-soon');
      });
      // トップの並び
      const card = document.querySelector('.vid[href$="douga/' + nn + '/"] .tag');
      if (card) card.remove();
      // 動画の一覧
      const ep = document.getElementById('ep' + nn);
      if (ep) {
        const img = ep.querySelector('.ep__thumb img');
        if (img) img.replaceWith(iframe(v.id, n));
        const soon = ep.querySelector('.tag-soon');
        if (soon) soon.remove();
      }
      // 文字版のページ
      if (here === nn) {
        const frame = document.querySelector('.video__frame');
        const img = frame && frame.querySelector('img');
        if (img) {
          frame.querySelectorAll('img, .video__badge').forEach(el => el.remove());
          frame.appendChild(iframe(v.id, n));
          const cap = frame.parentElement.querySelector('figcaption');
          if (cap) cap.innerHTML = '<a href="https://youtu.be/' + v.id + '" target="_blank" rel="noopener">YouTube で見る</a>';
        }
      }
    });
    // トップの「新しい動画」：公開した新しい順に NEW 本を上、残りを「すべて見る」の中へ（publish_videos.py の arrange と同じ）
    const NEW = 3;
    const top = document.getElementById('vids-new'), fold = document.getElementById('vids-more');
    const more = fold && fold.querySelector('.vids--all');
    if (top && more) {
      const at = li => { const v = videos[(li.querySelector('a.vid').getAttribute('href').match(/douga\/(\d{2})\//) || [])[1]]; return v ? Date.parse(v.at) : NaN; };
      const cards = [...top.children, ...more.children];
      const pub = cards.filter(li => at(li) <= now).sort((a, b) => at(b) - at(a));
      pub.forEach((li, i) => { li.hidden = false; (i < NEW ? top : more).appendChild(li); });
      cards.filter(li => !pub.includes(li)).forEach(li => { li.hidden = true; more.appendChild(li); });
      const n = fold.querySelector('.fold__n');
      if (n) n.textContent = Math.max(0, pub.length - NEW);
      fold.hidden = pub.length <= NEW;
    }
    // 「計算する」の分類ごとの件数と名前（publish_videos.py の cats と同じ）
    document.querySelectorAll('.cat').forEach(cat => {
      const names = [...cat.querySelectorAll('.calc-list > li:not([hidden]) .calc__name')].map(el => el.textContent);
      const ex = cat.querySelector('.cat__ex'), n = cat.querySelector('.cat__n');
      if (ex) ex.textContent = names.join('／');
      if (n) n.innerHTML = '<b>' + names.length + '</b>件';
    });
  }).catch(() => {});
})();

// アクセス解析（Google アナリティクス 4）。測定ID（G-から始まる）をここに入れるまでは何も読み込まない
// ★計算の条件はURLの # の後ろに入れているので、アナリティクスには送られない。track() にも入力した値を渡さない
const GA_ID = '';
window.dataLayer = window.dataLayer || [];
function gtag() { window.dataLayer.push(arguments); }
window.track = (name, params) => { if (GA_ID) gtag('event', name, params || {}); };
if (GA_ID) {
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);
  gtag('js', new Date());
  // # の後ろ（計算の条件）は送らない。page_location を # 抜きで明示する
  gtag('config', GA_ID, { page_location: location.origin + location.pathname + location.search });
}

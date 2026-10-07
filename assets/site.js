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
// （毎日20時の公開に合わせて、見た人のブラウザで切り替える。HTML への書き込みは .github/scripts/publish_videos.py）
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
  const here = (location.pathname.match(/\/douga\/(\d{2})\/$/) || [])[1];
  fetch(new URL('videos.json', src), { cache: 'no-cache' }).then(r => r.json()).then(videos => {
    const now = Date.now();
    Object.entries(videos).forEach(([nn, v]) => {
      if (Date.parse(v.at) > now) return;
      const n = Number(nn);
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

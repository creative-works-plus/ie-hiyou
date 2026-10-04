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

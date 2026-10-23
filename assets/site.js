// Aureum site: Arabic / French / English. The page is written in Arabic; each page
// sets window.I18N = { fr: {...}, en: {...}, meta: { ar|fr|en: { title, description } } }.
// Elements carry data-i18n="key"; their Arabic text is read from the page itself.
(function () {
  var LANGS = ['ar', 'fr', 'en'];
  var dict = window.I18N || {};
  var nodes = Array.prototype.slice.call(document.querySelectorAll('[data-i18n]'));
  var ar = {};
  nodes.forEach(function (n) { ar[n.getAttribute('data-i18n')] = n.innerHTML; });
  dict.ar = ar;

  function saved() { try { return localStorage.getItem('aureum-lang'); } catch (e) { return null; } }
  function remember(l) { try { localStorage.setItem('aureum-lang', l); } catch (e) { /* private mode */ } }

  function pick() {
    var q = new URLSearchParams(location.search).get('lang');
    if (LANGS.indexOf(q) >= 0) return q;
    var s = saved();
    if (LANGS.indexOf(s) >= 0) return s;
    var nav = (navigator.language || '').slice(0, 2).toLowerCase();
    return nav === 'fr' ? 'fr' : 'ar';
  }

  function apply(l) {
    var table = dict[l] || {};
    document.documentElement.lang = l;
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
    nodes.forEach(function (n) {
      var t = l === 'ar' ? ar[n.getAttribute('data-i18n')] : table[n.getAttribute('data-i18n')];
      if (t != null) n.innerHTML = t;
    });
    var meta = (dict.meta || {})[l];
    if (meta) {
      document.title = meta.title;
      var d = document.querySelector('meta[name="description"]');
      if (d) d.setAttribute('content', meta.description);
    }
    document.querySelectorAll('[data-lang]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-lang') === l ? 'true' : 'false');
    });
    remember(l);
  }

  document.querySelectorAll('[data-lang]').forEach(function (b) {
    b.addEventListener('click', function () { apply(b.getAttribute('data-lang')); });
  });

  // Screenshot slots: a gold frame stays until the real image exists.
  document.querySelectorAll('.shot img').forEach(function (img) {
    function missing() { img.parentNode.classList.add('missing'); }
    if (img.complete && img.naturalWidth === 0) missing();
    img.addEventListener('error', missing);
  });

  // Video links: shown only once a link is filled in (window.SITE_VIDEOS).
  var videos = window.SITE_VIDEOS || {};
  document.querySelectorAll('[data-video]').forEach(function (a) {
    var url = videos[a.getAttribute('data-video')];
    if (url) { a.href = url; a.hidden = false; }
  });
  var anyVideo = Object.keys(videos).some(function (k) { return !!videos[k]; });
  document.querySelectorAll('[data-videos-block]').forEach(function (el) { el.hidden = !anyVideo; });

  apply(pick());
})();

// Tour pictures open full screen: arrows / swipe to move, ✕ / Escape / tap outside to close.
(function () {
  var box = document.getElementById('lightbox');
  if (!box) return;
  var img = box.querySelector('img');
  var cap = box.querySelector('.lb-cap');
  var figures = Array.prototype.slice.call(document.querySelectorAll('.tour figure'));
  var shown = [];
  var at = 0;
  var opener = null;

  function available() {
    return figures.filter(function (f) { var s = f.querySelector('.shot'); return s && !s.classList.contains('missing'); });
  }
  function show(i) {
    at = (i + shown.length) % shown.length;
    var f = shown[at];
    img.src = f.querySelector('img').src;
    img.alt = f.querySelector('figcaption b').textContent;
    cap.innerHTML = f.querySelector('figcaption').innerHTML;
  }
  function open(f) {
    shown = available();
    var i = shown.indexOf(f);
    if (i < 0) return;
    opener = document.activeElement;
    box.hidden = false;
    box.classList.add('open');
    document.body.style.overflow = 'hidden';
    show(i);
    box.querySelector('.lb-close').focus();
  }
  function close() {
    box.classList.remove('open');
    box.hidden = true;
    document.body.style.overflow = '';
    if (opener && opener.focus) opener.focus();
  }
  // Arrow keys and swipes follow the screen: in Arabic the next picture is to the left.
  function byScreen(towardRight) { var rtl = document.documentElement.dir === 'rtl'; show(at + (towardRight !== rtl ? 1 : -1)); }

  figures.forEach(function (f) {
    var frame = f.querySelector('.frame');
    frame.setAttribute('tabindex', '0');
    frame.setAttribute('role', 'button');
    frame.addEventListener('click', function () { open(f); });
    frame.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(f); } });
  });
  box.querySelector('.lb-close').addEventListener('click', close);
  box.querySelector('.lb-prev').addEventListener('click', function () { show(at - 1); });
  box.querySelector('.lb-next').addEventListener('click', function () { show(at + 1); });
  box.addEventListener('click', function (e) { if (e.target === box) close(); });
  document.addEventListener('keydown', function (e) {
    if (box.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') byScreen(true);
    else if (e.key === 'ArrowLeft') byScreen(false);
  });
  var startX = null;
  box.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', function (e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX;
    startX = null;
    if (Math.abs(dx) > 50) byScreen(dx < 0);   // a swipe to the left brings in what is on the right
  });
})();

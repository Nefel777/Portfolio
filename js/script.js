/* ==========================================================================
   Nefeli Xhaferaj – Portfolio  |  js/script.js
   Sections: 1 Setup · 2 Images · 3 Navigation · 4 Reveal/Counters · 5 Hero
             6 Projects · 7 Lightbox · 8 CV download · 9 Links · 10 Background
   GSAP and Lucide load from a CDN. If they are missing (offline), everything
   else still works.
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- 1. Setup ---------- */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  function initIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      try { window.lucide.createIcons(); } catch (e) { /* ignore */ }
    }
  }

  var toastTimer;
  function toast(msg) {
    var t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('is-show'); }, 3600);
  }

  /* ---------- 2. Image fallback system ----------
     Every <div class="media"> holds a placeholder (.ph) and an <img>.
     If the image loads -> "loaded" (placeholder is covered).
     If it fails (file not uploaded yet) -> "missing" (placeholder stays visible). */
  function initImages() {
    $$('.media').forEach(function (media) {
      var img = $('img', media);
      if (!img) return;
      function ok() { media.classList.add('loaded'); media.classList.remove('missing'); }
      function fail() { media.classList.add('missing'); media.classList.remove('loaded'); }
      img.addEventListener('load', ok);
      img.addEventListener('error', fail);
      if (img.complete) { img.naturalWidth > 0 ? ok() : fail(); }
    });
  }

  /* ---------- 3. Navigation ---------- */
  var nav = $('#nav');
  var burger = $('#burger');
  var menu = $('#navMenu');
  var indicator = $('#navIndicator');
  var navLinks = $$('#navList a');
  var currentNav = 'home';

  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  $$('#navMenu a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  window.addEventListener('resize', function () { if (window.innerWidth > 900) setMenu(false); moveIndicator(); });

  function moveIndicator() {
    if (!indicator) return;
    var active = navLinks.filter(function (a) { return a.dataset.link === currentNav; })[0];
    if (!active || window.innerWidth <= 900) { indicator.classList.remove('is-on'); return; }
    indicator.style.width = active.offsetWidth - 28 + 'px';
    indicator.style.transform = 'translateX(' + (active.offsetLeft + 14) + 'px)';
    indicator.classList.add('is-on');
  }

  var sections = $$('main section[data-nav]');
  var progressBar = $('.scroll-progress span');
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    nav.classList.toggle('is-scrolled', y > 24);

    // scroll progress
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (progressBar) progressBar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';

    // scroll spy: last section whose top passed 35% of the viewport
    var line = window.innerHeight * 0.35;
    var found = 'home';
    sections.forEach(function (s) { if (s.getBoundingClientRect().top <= line) found = s.dataset.nav; });
    if (max > 0 && y >= max - 4) found = 'contact';
    if (found !== currentNav) {
      currentNav = found;
      navLinks.forEach(function (a) { a.classList.toggle('is-active', a.dataset.link === found); });
      moveIndicator();
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });

  /* ---------- 4. Reveal on scroll + counters + language meters ---------- */
  function countUp(el) {
    var target = parseFloat(el.dataset.count);
    var decimals = parseInt(el.dataset.decimals || '0', 10);
    var suffix = el.dataset.suffix || '';
    if (reduceMotion || isNaN(target)) { el.textContent = target.toFixed(decimals) + suffix; return; }
    var start = null, dur = 1400;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(decimals) + (p === 1 ? suffix : '');
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function initReveal() {
    // language meters: light up the first N segments
    $$('.meter').forEach(function (m) {
      var level = parseInt(m.dataset.level || '0', 10);
      $$('i', m).forEach(function (seg, i) { if (i < level) seg.classList.add('on'); });
    });

    var items = $$('.reveal');
    function show(el) {
      el.classList.add('in');
      $$('.stat__num', el).forEach(countUp);
      var meter = $('.meter', el);
      if (meter) meter.classList.add('fill');
    }
    if (!('IntersectionObserver' in window)) { items.forEach(show); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { show(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 5. Hero: split-text reveal, ticker, GSAP extras ---------- */
  function initHero() {
    // split the name into characters
    var title = $('#heroTitle');
    var chars = [];
    if (title) {
      $$('.word', title).forEach(function (word) {
        var text = word.textContent.trim();
        word.textContent = '';
        word.setAttribute('aria-hidden', 'true');
        text.split('').forEach(function (ch) {
          var s = document.createElement('span');
          s.className = 'char';
          s.textContent = ch;
          word.appendChild(s);
          chars.push(s);
        });
      });
    }
    if (window.gsap && !reduceMotion && chars.length) {
      window.gsap.from(chars, { yPercent: 110, opacity: 0, duration: 0.9, ease: 'power4.out', stagger: 0.045, delay: 0.15, clearProps: 'transform,opacity' });
    }

    // "Building. Learning. Engineering." – words light up in sequence
    var ticks = $$('#ticker .tick');
    if (ticks.length) {
      if (reduceMotion) { ticks.forEach(function (t) { t.classList.add('on'); }); }
      else {
        var idx = 0;
        ticks[0].classList.add('on');
        setInterval(function () {
          ticks.forEach(function (t) { t.classList.remove('on'); });
          idx = (idx + 1) % ticks.length;
          ticks[idx].classList.add('on');
        }, 1500);
      }
    }

    // gentle parallax on the avatar (desktop pointers only)
    var visual = $('.hero__visual');
    if (window.gsap && !reduceMotion && visual && window.matchMedia('(pointer: fine)').matches) {
      var avatar = $('.avatar', visual);
      var chipsEls = $$('.chip', visual);
      window.addEventListener('pointermove', function (e) {
        var x = (e.clientX / window.innerWidth - 0.5);
        var y = (e.clientY / window.innerHeight - 0.5);
        chipsEls.forEach(function (c, i) {
          window.gsap.to(c, { x: x * (14 + i * 6), y: y * (10 + i * 4), duration: 1.2, ease: 'power2.out', overwrite: 'auto' });
        });
        window.gsap.to(avatar.querySelector('.avatar__ring--2'), { x: x * -10, y: y * -10, duration: 1.4, ease: 'power2.out', overwrite: 'auto' });
      }, { passive: true });
    }
  }

  /* ---------- 6. Projects filter ---------- */
  function initProjects() {
    var buttons = $$('.filter');
    var cards = $$('.project');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        var f = btn.dataset.filter;
        cards.forEach(function (c, i) {
          var match = f === 'all' || c.dataset.category === f;
          c.classList.toggle('is-hidden', !match);
          c.classList.remove('is-entering');
          if (match && !reduceMotion) {
            c.style.animationDelay = i * 70 + 'ms';
            // force reflow so the animation restarts
            void c.offsetWidth;
            c.classList.add('is-entering');
          }
        });
      });
    });
  }

  /* ---------- 7. Lightbox (certificates) ---------- */
  function initLightbox() {
    var lb = $('#lightbox');
    var img = $('#lbImg');
    var cap = $('#lbCaption');
    var pathEl = $('#lbPath');
    var triggers = $$('[data-lightbox]');
    var current = 0;
    var lastFocus = null;
    var closeTimer;

    function load(i) {
      current = (i + triggers.length) % triggers.length;
      var t = triggers[current];
      var src = t.dataset.full;
      cap.textContent = t.dataset.title || '';
      pathEl.textContent = src;
      lb.classList.remove('no-image');
      img.onload = function () { lb.classList.remove('no-image'); };
      img.onerror = function () { lb.classList.add('no-image'); };
      img.alt = t.dataset.title || '';
      img.src = src;
    }
    function open(i) {
      lastFocus = document.activeElement;
      clearTimeout(closeTimer);
      load(i);
      lb.hidden = false;
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(function () { requestAnimationFrame(function () { lb.classList.add('is-open'); }); });
      $('#lbClose').focus();
    }
    function close() {
      lb.classList.remove('is-open');
      document.body.style.overflow = '';
      closeTimer = setTimeout(function () { lb.hidden = true; img.removeAttribute('src'); }, reduceMotion ? 0 : 380);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    triggers.forEach(function (t, i) { t.addEventListener('click', function () { open(i); }); });
    $('#lbClose').addEventListener('click', close);
    $('#lbPrev').addEventListener('click', function () { load(current - 1); });
    $('#lbNext').addEventListener('click', function () { load(current + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lightbox__media')) close(); });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') load(current - 1);
      else if (e.key === 'ArrowRight') load(current + 1);
      else if (e.key === 'Tab') {
        // keep focus inside the dialog
        var f = $$('button', lb);
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---------- 8. CV download (graceful if the PDF is missing) ---------- */
  function initCV() {
    var modal = $('#cvModal');
    var closeBtn = $('#cvModalClose');
    var lastFocus = null;
    function openModal() {
      lastFocus = document.activeElement;
      modal.hidden = false;
      requestAnimationFrame(function () { requestAnimationFrame(function () { modal.classList.add('is-open'); }); });
      closeBtn.focus();
    }
    function closeModal() {
      modal.classList.remove('is-open');
      setTimeout(function () { modal.hidden = true; }, reduceMotion ? 0 : 300);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

    $$('[data-cv]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        // Opened as a plain file (not via Live Server): let the browser handle it.
        if (location.protocol === 'file:') return;
        e.preventDefault();
        var url = a.getAttribute('href');
        fetch(url, { method: 'HEAD', cache: 'no-store' }).then(function (res) {
          var type = res.headers.get('content-type') || '';
          // Some dev servers answer 200 with an HTML page for missing files – treat that as missing too.
          if (res.ok && type.indexOf('text/html') === -1) {
            var tmp = document.createElement('a');
            tmp.href = url;
            tmp.download = 'Nefeli_Xhaferaj_CV.pdf';
            document.body.appendChild(tmp);
            tmp.click();
            tmp.remove();
          } else { openModal(); }
        }).catch(openModal);
      });
    });
  }

  /* ---------- 9. Placeholder links (LinkedIn / GitHub not filled in yet) ---------- */
  function initLinks() {
    $$('[data-placeholder-link]').forEach(function (a) {
      var href = a.getAttribute('href') || '#';
      var isPlaceholder = href === '#' || /your-profile|your-username/.test(href);
      if (!isPlaceholder) return;
      a.classList.add('is-placeholder');
      a.addEventListener('click', function (e) {
        e.preventDefault();
        toast('Placeholder link – replace it with your real URL in index.html');
      });
    });
  }

  /* ---------- 10. Animated background: circuit traces + particles ---------- */
  function initBackground() {
    var canvas = $('#bg');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var w = 0, h = 0, dpr = 1;
    var traces = [], pulses = [], dots = [];
    var GRID = 56;
    var raf = null;

    function rand(a, b) { return a + Math.random() * (b - a); }

    function buildTrace() {
      var x = Math.round(rand(0, w) / GRID) * GRID;
      var y = Math.round(rand(0, h) / GRID) * GRID;
      var pts = [[x, y]];
      var horizontal = Math.random() > 0.5;
      var segs = 3 + Math.floor(Math.random() * 4);
      for (var i = 0; i < segs; i++) {
        var len = GRID * (1 + Math.floor(Math.random() * 4)) * (Math.random() > 0.5 ? 1 : -1);
        if (horizontal) x += len; else y += len;
        pts.push([x, y]);
        horizontal = !horizontal;
      }
      var total = 0, lens = [];
      for (var j = 1; j < pts.length; j++) {
        var d = Math.abs(pts[j][0] - pts[j - 1][0]) + Math.abs(pts[j][1] - pts[j - 1][1]);
        lens.push(d); total += d;
      }
      return { pts: pts, lens: lens, total: total };
    }

    function pointAt(t, dist) {
      for (var i = 0; i < t.lens.length; i++) {
        if (dist <= t.lens[i]) {
          var a = t.pts[i], b = t.pts[i + 1], k = t.lens[i] ? dist / t.lens[i] : 0;
          return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
        }
        dist -= t.lens[i];
      }
      return t.pts[t.pts.length - 1];
    }

    function build() {
      var small = w < 700;
      var traceCount = Math.round((w * h) / (small ? 140000 : 85000)) + 5;
      var dotCount = Math.min(small ? 26 : 56, Math.round((w * h) / 32000));
      traces = []; pulses = []; dots = [];
      for (var i = 0; i < traceCount; i++) {
        var t = buildTrace();
        traces.push(t);
        pulses.push({ t: t, p: Math.random(), speed: rand(0.00006, 0.00016) });
      }
      for (var k = 0; k < dotCount; k++) {
        dots.push({ x: rand(0, w), y: rand(0, h), vx: rand(-0.12, 0.12), vy: rand(-0.12, 0.12), r: rand(0.8, 1.8) });
      }
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
      draw(16, true);
    }

    function draw(dt, still) {
      ctx.clearRect(0, 0, w, h);

      // traces
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(47,107,255,0.13)';
      ctx.fillStyle = 'rgba(47,107,255,0.25)';
      traces.forEach(function (t) {
        ctx.beginPath();
        t.pts.forEach(function (p, i) { i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); });
        ctx.stroke();
        [t.pts[0], t.pts[t.pts.length - 1]].forEach(function (p) {
          ctx.beginPath(); ctx.arc(p[0], p[1], 2.4, 0, 6.283); ctx.fill();
        });
      });

      // glowing pulses travelling along the traces
      pulses.forEach(function (pu) {
        if (!still) { pu.p += pu.speed * dt; if (pu.p > 1) pu.p = 0; }
        var pos = pointAt(pu.t, pu.p * pu.t.total);
        ctx.fillStyle = 'rgba(34,211,238,0.12)';
        ctx.beginPath(); ctx.arc(pos[0], pos[1], 7, 0, 6.283); ctx.fill();
        ctx.fillStyle = 'rgba(34,211,238,0.9)';
        ctx.beginPath(); ctx.arc(pos[0], pos[1], 1.9, 0, 6.283); ctx.fill();
      });

      // particles + soft connections
      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        if (!still) {
          d.x += d.vx; d.y += d.vy;
          if (d.x < 0) d.x = w; else if (d.x > w) d.x = 0;
          if (d.y < 0) d.y = h; else if (d.y > h) d.y = 0;
        }
        ctx.fillStyle = 'rgba(160,190,255,0.45)';
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 6.283); ctx.fill();
        for (var j = i + 1; j < dots.length; j++) {
          var e = dots[j], dx = d.x - e.x, dy = d.y - e.y, dist = dx * dx + dy * dy;
          if (dist < 12100) {
            ctx.strokeStyle = 'rgba(80,140,255,' + (0.16 * (1 - dist / 12100)).toFixed(3) + ')';
            ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(e.x, e.y); ctx.stroke();
          }
        }
      }
    }

    var last = 0;
    function loop(ts) {
      var dt = Math.min(ts - last, 50);
      last = ts;
      draw(dt, false);
      raf = requestAnimationFrame(loop);
    }

    resize();
    var resizeTimer;
    window.addEventListener('resize', function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 200); });

    if (!reduceMotion) {
      raf = requestAnimationFrame(function (ts) { last = ts; loop(ts); });
      // save battery when the tab is hidden
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) { cancelAnimationFrame(raf); }
        else { raf = requestAnimationFrame(function (ts) { last = ts; loop(ts); }); }
      });
    }
  }

  /* ---------- Boot ---------- */
  function boot() {
    initIcons();
    initImages();
    initReveal();
    initHero();
    initProjects();
    initLightbox();
    initCV();
    initLinks();
    initBackground();
    onScroll();
    moveIndicator();
    // fonts/icons may change nav widths after load
    window.addEventListener('load', function () { initIcons(); moveIndicator(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
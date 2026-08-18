/* =========================================================
   NATH STUDIO — interactions.js
   Consolidated, deduplicated portfolio interactions.
   Includes zoom/resize re-centering so carousels stay
   perfectly aligned when the browser zooms in or out.
   ========================================================= */
let portfolioInitialized = false;

export function initPortfolio() {
  'use strict';
  // Guard against duplicate initialisation (React StrictMode double-invokes
  // effects in dev; the module may also be hot-reloaded).
  if (portfolioInitialized) return;
  portfolioInitialized = true;

  /* ---------- FONT READY / FOUT GUARD ---------- */
  (function () {
    document.documentElement.classList.add('fonts-loading');
    var done = false;
    function ready() {
      if (done) return;
      done = true;
      document.documentElement.classList.remove('fonts-loading');
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(ready);
    setTimeout(ready, 3500);
  })();

  /* ---------- LOADER ---------- */
  (function () {
    function fade() {
      var l = document.getElementById('loader');
      if (!l) return;
      l.style.transition = 'opacity .6s ease';
      l.style.opacity = '0';
      setTimeout(function () { l.style.display = 'none'; }, 650);
    }
    window.addEventListener('load', function () { setTimeout(fade, 2600); });
    if (document.readyState === 'complete') setTimeout(fade, 2600);
  })();

  /* ---------- SCROLL FILMSTRIP ---------- */
  (function () {
    var fs = document.querySelector('#filmstrip i');
    if (!fs) return;
    function upd() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var sc = max > 0 ? h.scrollTop / max : 0;
      fs.style.height = (sc * 100) + '%';
    }
    window.addEventListener('scroll', upd, { passive: true });
    upd();
  })();

  /* ---------- REVEAL ON SCROLL ---------- */
  (function () {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  })();

  /* ---------- PAGE SCROLL OVER CAROUSELS ---------- */
  // Let vertical mouse-wheel / trackpad scrolling always move the PAGE, even
  // when the pointer is hovering a horizontally-scrolling carousel or video.
  (function () {
    var stages = document.querySelectorAll(
      '.reels-scroll.reel-stage, .cinematic-stage, .modeling-stage, .portfolio-carousel'
    );
    stages.forEach(function (stage) {
      stage.addEventListener('wheel', function (e) {
        var dx = Math.abs(e.deltaX), dy = Math.abs(e.deltaY);
        // Clear horizontal intent → let the carousel handle it.
        if (dx > dy && dx > 4) return;
        // Otherwise scroll the page vertically instead of trapping the wheel.
        e.preventDefault();
        window.scrollBy({ top: e.deltaY, behavior: 'auto' });
      }, { passive: false });
    });
  })();

  /* ---------- GLOBAL: ONE VIDEO AT A TIME + SOUND TOGGLE ---------- */
  (function () {
    var soundOn = false;                 // sound is OFF until the user toggles it
    window.__portfolioSoundOn = false;
    window.__portfolioAudioUnlock = false;

    function stopOthers(active) {
      document.querySelectorAll('video').forEach(function (v) {
        if (v !== active) { v.pause(); v.muted = true; }
      });
    }
    // Play one video; every other video on the page is stopped/muted.
    function playVideo(v) {
      if (!v) return;
      stopOthers(v);
      v.loop = true; v.playsInline = true; v.volume = 1;
      v.muted = !soundOn;
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    }
    window.__activatePortfolioVideo = function (v) { stopOthers(v); };
    window.__portfolioPlayVideo = playVideo;
    window.__portfolioIsSoundOn = function () { return soundOn; };

    // Any <video> that starts playing anywhere pauses+mutes the rest.
    document.addEventListener('play', function (e) {
      var v = e.target;
      if (v && v.tagName === 'VIDEO') {
        if (!v.closest('.showreel-video')) v.muted = !soundOn;
        stopOthers(v);
      }
    }, true);

    /* ---- Floating SOUND ON/OFF toggle (fixed, works on every section) ---- */
    var btn = document.createElement('button');
    btn.id = 'audioToggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Toggle sound');
    btn.title = 'Toggle sound';
    btn.innerHTML = '<span class="at-ic">♪</span><span class="at-txt">SOUND OFF</span>';
    document.body.appendChild(btn);

    function render() {
      btn.classList.toggle('on', soundOn);
      var t = btn.querySelector('.at-txt'); if (t) t.textContent = soundOn ? 'SOUND ON' : 'SOUND OFF';
      var ic = btn.querySelector('.at-ic'); if (ic) ic.textContent = soundOn ? '♫' : '♪';
    }
    function applyToActive() {
      var v = document.querySelector(
        '.reel-stage .is-reel-center video,' +
        '.cinematic-stage .cin-center video,' +
        '.film-arc-card[data-pos="2"] video,' +
        '.grade-video-wrap video'
      );
      if (v) {
        v.muted = !soundOn;
        if (soundOn) { v.volume = 1; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      }
    }
    function toggle() {
      soundOn = !soundOn;
      window.__portfolioSoundOn = soundOn;
      window.__portfolioAudioUnlock = soundOn;
      render();
      applyToActive();
    }
    btn.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); toggle(); });
    render();

    /* ---- Single active video follows scroll: the most-visible carousel
           autoplays its centre card; all other sections stay silent. ---- */
    var stages = [];
    var ratios = {};
    function registerStage(el, selector) {
      if (!el) return;
      stages.push({ el: el, sel: selector });
      ratios[el] = 0;
    }
    function playMostVisible() {
      var best = null, bestR = 0;
      stages.forEach(function (s) {
        var r = ratios[s.el] || 0;
        if (r > bestR) { bestR = r; best = s; }
      });
      if (best) { var v = best.el.querySelector(best.sel); if (v) playVideo(v); }
    }
    var io = (typeof IntersectionObserver !== 'undefined')
      ? new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { ratios[en.target] = en.isIntersecting ? en.intersectionRatio : 0; });
        if (io._t) clearTimeout(io._t);
        io._t = setTimeout(playMostVisible, 180);
      }, { threshold: [0.05, 0.2, 0.4, 0.6, 0.8] })
      : null;
    function registerObserved(el, selector) {
      registerStage(el, selector);
      if (el && io) io.observe(el);
    }
    window.__registerVideoStage = registerObserved;
  })();

  /* ---------- GENERIC CENTER-STAGE HELPERS ---------- */
  // Debounced re-centring that fires on window resize, orientation change,
  // font load, AND on any ResizeObserver change to a carousel stage itself
  // (browser zoom-in/out resizes the stage and triggers this).
  var recenterables = [];
  var resizeTimer = null;
  function scheduleRecenter() {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      recenterables.forEach(function (fn) { try { fn(true); } catch (err) { /* non-fatal */ void err; } });
    }, 120);
  }
  window.addEventListener('resize', scheduleRecenter, { passive: true });
  window.addEventListener('orientationchange', scheduleRecenter, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleRecenter);
  // Re-centre right after mount so late layout/font/image shifts are caught.
  setTimeout(scheduleRecenter, 600);
  setTimeout(scheduleRecenter, 1600);
  function trackRecentering(stage, fn) {
    recenterables.push(fn);
    if (stage && typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(function () { scheduleRecenter(); }).observe(stage);
    }
  }

  /* ---------- CUSTOM CURSOR ---------- */
  (function () {
    var c = document.getElementById('customCursor');
    if (!c) return;
    document.addEventListener('pointermove', function (e) {
      c.style.left = e.clientX + 'px';
      c.style.top = e.clientY + 'px';
    }, { passive: true });
    var hoverTargets = '.reel.video-card,.cinematic-card,.poster,.film,.model-card,.film-arc-card,a,button,.playbtn,.tool,.faq-item summary';
    var playTargets = '.reel.video-card,.cinematic-card,.model-card,.film-arc-card';
    document.querySelectorAll(hoverTargets).forEach(function (el) {
      el.addEventListener('mouseenter', function () { c.classList.add('hover'); });
      el.addEventListener('mouseleave', function () {
        c.classList.remove('hover'); c.classList.remove('playing');
      });
    });
    document.querySelectorAll(playTargets).forEach(function (el) {
      el.addEventListener('mouseenter', function () { c.classList.add('playing'); });
      el.addEventListener('mouseleave', function () { c.classList.remove('playing'); });
    });
  })();

  /* =========================================================
     REELS — true infinite center-stage carousel
     ========================================================= */
  (function () {
    var stage = document.querySelector('#reels .reels-scroll');
    if (!stage) return;
    stage.classList.add('reel-stage');
    var originals = Array.from(stage.querySelectorAll(':scope > .reel'));
    if (!originals.length) return;

    var before = originals.map(function (c) { var x = c.cloneNode(true); x.dataset.loopClone = 'before'; return x; });
    var after = originals.map(function (c) { var x = c.cloneNode(true); x.dataset.loopClone = 'after'; return x; });
    stage.prepend.apply(stage, before);
    stage.append.apply(stage, after);

    var cards = Array.from(stage.querySelectorAll(':scope > .reel'));
    var N = originals.length;
    var current = N + Math.min(2, Math.floor(N / 2));
    var moving = false, hoverTimer = null;

    function paint(index) {
      cards.forEach(function (card, i) {
        card.classList.toggle('is-reel-center', i === index);
        var d = Math.abs(i - index);
        card.classList.toggle('is-reel-side-near', d === 1);
        card.classList.toggle('is-reel-far', d >= 2);
      });
    }
    function play(card) {
      var v = card.querySelector('video');
      if (!v) return;
      window.__portfolioPlayVideo(v, !!window.__portfolioAudioUnlock);
      card.classList.add('is-playing');
    }
    function normalize() {
      if (current < N) { current += N; stage.scrollLeft = targetLeft(cards[current]); paint(current); play(cards[current]); }
      else if (current >= 2 * N) { current -= N; stage.scrollLeft = targetLeft(cards[current]); paint(current); play(cards[current]); }
    }
    function targetLeft(card) {
      return card.offsetLeft - (stage.clientWidth - card.offsetWidth) / 2;
    }
    function go(index, animate) {
      if (index < 0 || index >= cards.length) return;
      if (moving && animate) return;
      if (index === current && animate) return;
      current = index; paint(current); moving = !!animate;
      stage.scrollTo({ left: targetLeft(cards[current]), behavior: animate ? 'smooth' : 'auto' });
      play(cards[current]);
      if (animate) {
        clearTimeout(go._t);
        go._t = setTimeout(function () { moving = false; normalize(); }, 760);
      } else { moving = false; normalize(); }
    }

    requestAnimationFrame(function () { go(current, false); });

    cards.forEach(function (card, index) {
      card.addEventListener('mouseenter', function () {
        if (moving || index === current) return;
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(function () { if (!moving && index !== current) go(index, true); }, 55);
      });
      card.addEventListener('mouseleave', function () { clearTimeout(hoverTimer); });
      card.addEventListener('click', function (e) {
        if (index !== current) {
          e.preventDefault(); e.stopImmediatePropagation();
          if (!moving) go(index, true);
        }
      }, true);
    });

    var downX = 0, drag = false;
    stage.addEventListener('pointerdown', function (e) { downX = e.clientX; drag = false; });
    stage.addEventListener('pointermove', function (e) { if (Math.abs(e.clientX - downX) > 10) drag = true; });
    stage.addEventListener('pointerup', function () {
      if (!drag) return;
      setTimeout(function () {
        var cx = stage.getBoundingClientRect().left + stage.clientWidth / 2;
        var best = current, dist = Infinity;
        cards.forEach(function (c, i) {
          var r = c.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - cx);
          if (d < dist) { dist = d; best = i; }
        });
        go(best, true);
      }, 30);
    });

    // ZOOM / RESIZE: keep the active reel centred.
    trackRecentering(stage, function () {
      go(current, false);
    });
    // Register for the global single-active-video (follows scroll).
    window.__registerVideoStage(stage, '.is-reel-center video');
  })();

  /* =========================================================
     CINEMATIC REELS — infinite center-stage carousel
     ========================================================= */
  (function () {
    var cs = document.querySelector('.cinematic-stage');
    if (!cs) return;
    var originals = Array.from(cs.querySelectorAll(':scope > .cinematic-card'));
    if (!originals.length) return;
    var N = originals.length;
    var before = originals.map(function (c) { var x = c.cloneNode(true); x.dataset.loopClone = 'before'; return x; });
    var after = originals.map(function (c) { var x = c.cloneNode(true); x.dataset.loopClone = 'after'; return x; });
    cs.prepend.apply(cs, before);
    cs.append.apply(cs, after);
    var cards = Array.from(cs.querySelectorAll(':scope > .cinematic-card'));
    var cur = N + Math.floor(N / 2), moving = false, timer;

    function target(card) { return card.offsetLeft - (cs.clientWidth - card.offsetWidth) / 2; }
    function paint() {
      cards.forEach(function (c, i) {
        var d = Math.abs(i - cur);
        c.classList.toggle('cin-center', i === cur);
        c.classList.toggle('cin-near', d === 1);
      });
    }
    function playCenter() {
      var v = cards[cur] && cards[cur].querySelector('video');
      if (!v) return;
      window.__portfolioPlayVideo(v, !!window.__portfolioAudioUnlock);
      cards.forEach(function (c, i) { if (i !== cur) c.classList.remove('is-playing'); });
      cards[cur].classList.add('is-playing');
    }
    function normalize() {
      if (cur < N) { cur += N; cs.scrollLeft = target(cards[cur]); }
      else if (cur >= 2 * N) { cur -= N; cs.scrollLeft = target(cards[cur]); }
      paint(); playCenter();
    }
    function go(i, animate) {
      if (moving && animate) return;
      cur = i; paint(); playCenter(); moving = !!animate;
      cs.scrollTo({ left: target(cards[cur]), behavior: animate ? 'smooth' : 'auto' });
      if (animate) { clearTimeout(timer); timer = setTimeout(function () { moving = false; normalize(); }, 680); }
      else { moving = false; normalize(); }
    }
    requestAnimationFrame(function () { go(cur, false); });

    cards.forEach(function (card, i) {
      card.addEventListener('mouseenter', function () {
        if (moving || i === cur) return;
        clearTimeout(timer);
        timer = setTimeout(function () { if (!moving && i !== cur) go(i, true); }, 80);
      });
      card.addEventListener('click', function (e) {
        if (i !== cur) { e.preventDefault(); e.stopImmediatePropagation(); if (!moving) go(i, true); }
        else {
          var v = card.querySelector('video');
          if (v) window.__portfolioPlayVideo(v);
        }
      }, true);
    });
    var downX = 0, drag = false;
    cs.addEventListener('pointerdown', function (e) { downX = e.clientX; drag = false; });
    cs.addEventListener('pointermove', function (e) { if (Math.abs(e.clientX - downX) > 10) drag = true; });
    cs.addEventListener('pointerup', function () {
      if (!drag) return;
      setTimeout(function () {
        var cx = cs.getBoundingClientRect().left + cs.clientWidth / 2, best = cur, dist = 1e9;
        cards.forEach(function (c, i) {
          var r = c.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - cx);
          if (d < dist) { dist = d; best = i; }
        });
        go(best, true);
      }, 25);
    });

    trackRecentering(cs, function () { go(cur, false); });
    window.__registerVideoStage(cs, '.cin-center video');
  })();

  /* =========================================================
     POSTER CAROUSELS (song / flyer / ad) — continuous marquee
     ========================================================= */
  (function () {
    document.querySelectorAll('.poster-carousel').forEach(function (stage) {
      var originals = Array.from(stage.querySelectorAll(':scope > .poster'));
      if (!originals.length) return;
      // Wrap posters in one animated track, duplicated for a seamless infinite loop.
      var track = document.createElement('div');
      track.className = 'poster-track';
      originals.forEach(function (p) { track.appendChild(p); });
      originals.forEach(function (p, j) {
        var c = p.cloneNode(true);
        c.dataset.marqueeClone = '1';
        c.dataset.ref = String(j);
        track.appendChild(c);
      });
      stage.appendChild(track);
      // Pause auto-scroll while the user hovers / touches.
      track.addEventListener('mouseenter', function () { track.style.animationPlayState = 'paused'; });
      track.addEventListener('mouseleave', function () { track.style.animationPlayState = 'running'; });
      track.addEventListener('touchstart', function () { track.style.animationPlayState = 'paused'; }, { passive: true });
      track.addEventListener('touchend', function () { track.style.animationPlayState = 'running'; }, { passive: true });
    });
  })();
  /* =========================================================
     POSTER FULLSCREEN VIEWER — click any poster, Esc closes
     ========================================================= */
  (function () {
    var v = document.getElementById('posterViewer');
    if (!v) return;
    var img = v.querySelector('.viewer-img');
    var meta = v.querySelector('.viewer-meta');
    var list = Array.prototype.slice.call(document.querySelectorAll('.poster-carousel .poster:not([data-marquee-clone])'));
    var cur = -1;

    function show(card) {
      var im = card.querySelector('img');
      img.src = (im && (im.currentSrc || im.src)) || card.dataset.src || '';
      var num = card.querySelector('.num');
      cur = (card.dataset.ref !== undefined) ? parseInt(card.dataset.ref, 10) : list.indexOf(card);
      if (cur < 0) cur = 0;
      if (meta) meta.textContent = (num ? num.textContent : '') + (list.length ? '  —  ' + (cur + 1) + ' / ' + list.length : '');
      v.classList.add('open');
      v.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
    function step(dir) {
      if (!list.length) return;
      cur = (cur + dir + list.length) % list.length;
      show(list[cur]);
    }
    function hide() {
      v.classList.remove('open');
      v.setAttribute('aria-hidden', 'true');
      if (img) img.src = '';
      document.body.style.overflow = '';
      cur = -1;
    }

    list.forEach(function (card) {
      card.addEventListener('click', function (e) { e.preventDefault(); e.stopImmediatePropagation(); show(card); });
    });
    document.querySelectorAll('.poster-carousel .poster[data-marquee-clone]').forEach(function (clone) {
      clone.addEventListener('click', function (e) { e.preventDefault(); e.stopImmediatePropagation(); show(clone); });
    });

    var prev = v.querySelector('.viewer-prev'), next = v.querySelector('.viewer-next'), close = v.querySelector('.viewer-close');
    if (prev) prev.addEventListener('click', function () { step(-1); });
    if (next) next.addEventListener('click', function () { step(1); });
    if (close) close.addEventListener('click', hide);
    v.addEventListener('click', function (e) { if (e.target === v) hide(); });
    document.addEventListener('keydown', function (e) {
      if (!v.classList.contains('open')) return;
      if (e.key === 'Escape') hide();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
  })();
  /* =========================================================
     3D MODELING — 16:9 category carousel
     ========================================================= */
  (function () {
    var ms = document.querySelector('.modeling-stage');
    if (!ms) return;
    var mc = Array.from(ms.querySelectorAll(':scope > .model-card'));
    if (!mc.length) return;
    var mcur = 0, mt;
    function mtarget(c) { return c.offsetLeft - (ms.clientWidth - c.offsetWidth) / 2; }
    function mpaint() { mc.forEach(function (c, i) { c.classList.toggle('is-model-center', i === mcur); }); }
    function mgo(i, animate) {
      mcur = (i + mc.length) % mc.length; mpaint();
      ms.scrollTo({ left: mtarget(mc[mcur]), behavior: animate === false ? 'auto' : 'smooth' });
    }
    requestAnimationFrame(function () { mpaint(); ms.scrollLeft = mtarget(mc[0]); });
    mc.forEach(function (c, i) {
      c.addEventListener('mouseenter', function () { if (i !== mcur) { clearTimeout(mt); mt = setTimeout(function () { mgo(i); }, 80); } });
      c.addEventListener('click', function () { mgo(i); });
    });
    trackRecentering(ms, function () { mgo(mcur, false); });
  })();

  /* =========================================================
     FILMS — arc / 3D stage carousel
     ========================================================= */
  (function () {
    var stage = document.querySelector('.films-arc-stage');
    if (!stage) return;
    var cards = Array.from(stage.querySelectorAll('.film-arc-card'));
    var n = cards.length; if (!n) return;
    var center = 0, locked = false;
    var prev = stage.querySelector('.films-prev'), next = stage.querySelector('.films-next');
    function paint() {
      cards.forEach(function (c, i) {
        var d = i - center;
        if (d > n / 2) d -= n;
        if (d < -n / 2) d += n;
        var p = Math.max(-2, Math.min(2, d));
        c.dataset.pos = p === 0 ? '2' : String(p === -2 ? 0 : p === -1 ? 1 : p === 1 ? 3 : 4);
      });
    }
    function play() {
      var c = cards[center], v = c && c.querySelector('video');
      if (!v) return;
      window.__portfolioPlayVideo(v, !!window.__portfolioAudioUnlock);
    }
    function move(step) {
      if (locked) return;
      locked = true;
      center = (center + step + n) % n;
      paint(); play();
      setTimeout(function () { locked = false; }, 720);
    }
    cards.forEach(function (c, i) {
      c.addEventListener('mouseenter', function () {
        if (locked || i === center) return;
        var d = i - center;
        if (d > n / 2) d -= n;
        if (d < -n / 2) d += n;
        move(d > 0 ? 1 : -1);
      });
      c.addEventListener('click', function () {
        if (i === center) { var v = c.querySelector('video'); if (v) window.__portfolioPlayVideo(v); return; }
        var d = i - center;
        if (d > n / 2) d -= n;
        if (d < -n / 2) d += n;
        move(d > 0 ? 1 : -1);
      });
    });
    if (prev) prev.addEventListener('click', function () { move(-1); });
    if (next) next.addEventListener('click', function () { move(1); });
    paint(); setTimeout(play, 500);
    window.__registerVideoStage(stage, '.film-arc-card[data-pos="2"] video');
    // films arc is CSS-transform based (no scroll), so nothing to recenter on zoom.
  })();

  /* =========================================================
     GRADE VIDEO
     ========================================================= */
  (function () {
    var gv = document.querySelector('.grade-video-wrap video');
    if (!gv) return;
    gv.addEventListener('mouseenter', function () { window.__portfolioPlayVideo(gv); });
    gv.addEventListener('click', function () { window.__portfolioPlayVideo(gv); });
    window.__registerVideoStage(document.querySelector('.grade-video-wrap'), 'video');
  })();

  /* =========================================================
     SHOWREEL — click to unmute + ensure it plays
     ========================================================= */
  (function () {
    var sr = document.querySelector('.showreel-video video');
    if (!sr) return;
    sr.addEventListener('click', function () {
      window.__portfolioAudioUnlock = true;
      sr.muted = false; sr.volume = 1; sr.play().catch(function () {});
    });
    sr.addEventListener('mouseenter', function () {
      sr.play().catch(function () {});
    });
  })();
}

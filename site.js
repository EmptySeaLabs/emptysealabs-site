(function () {
  // ---- Category filter. Without JavaScript the chips are plain links to each section.
  var chips = [].slice.call(document.querySelectorAll('.chip[data-filter]'));
  var sections = [].slice.call(document.querySelectorAll('.category[data-category]'));
  var ids = sections.map(function (s) { return s.dataset.category; });

  function show(filter, push) {
    if (filter !== 'all' && ids.indexOf(filter) < 0) filter = 'all';
    sections.forEach(function (s) {
      var on = filter === 'all' || s.dataset.category === filter;
      s.hidden = !on;
      if (on) { s.classList.remove('enter'); void s.offsetWidth; s.classList.add('enter'); }
    });
    chips.forEach(function (c) {
      if (c.dataset.filter === filter) c.setAttribute('aria-current', 'true');
      else c.removeAttribute('aria-current');
    });
    if (push) history.replaceState(null, '', filter === 'all' ? location.pathname : '#' + filter);
  }

  chips.forEach(function (c) {
    c.addEventListener('click', function (e) { e.preventDefault(); show(c.dataset.filter, true); });
  });
  function fromHash() { var h = location.hash.slice(1); if (ids.indexOf(h) >= 0) show(h, false); }
  window.addEventListener('hashchange', fromHash);
  fromHash();

  // ---- The sea: swells that lift under the pointer, a wake behind it, ripples where
  // you tap, every item in the catalog bobbing on top, and the gull from the logo.
  var band = document.querySelector('.sea-band');
  var canvas = band && band.querySelector('canvas');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var color = getComputedStyle(document.documentElement).getPropertyValue('--sea').trim() || '#5fd4c4';
  var waves = [
    { y: 0.44, amp: 7, len: 150, speed: 0.50, phase: 0.0, width: 2.5, alpha: 0.95 },
    { y: 0.58, amp: 9, len: 210, speed: -0.36, phase: 2.1, width: 2, alpha: 0.5 },
    { y: 0.72, amp: 10, len: 290, speed: 0.26, phase: 4.2, width: 1.5, alpha: 0.28 },
    { y: 0.86, amp: 11, len: 380, speed: -0.18, phase: 1.0, width: 1.2, alpha: 0.14 }
  ];
  var w = 0, h = 0, pointerX = null, lift = 0, ripples = [], lastWake = { x: -999, t: 0 };

  function waveY(i, x, t) {
    var wave = waves[i], depth = 1 - i * 0.24;
    var y = h * wave.y + wave.amp * Math.sin(x / wave.len * 6.283 + t * wave.speed * 6.283 + wave.phase);
    if (lift > 0.01) { var d = (x - pointerX) / 110; y -= 16 * depth * lift * Math.exp(-d * d); }
    for (var k = 0; k < ripples.length; k++) {
      var r = ripples[k], age = t - r.t, front = Math.abs(x - r.x) - age * 260, env = front / 70;
      y += 12 * r.a * depth * Math.sin(front / 16) * Math.exp(-env * env) * Math.exp(-age * 1.3);
    }
    return y;
  }

  // Floats: one per catalog item, built from its card, so new items appear on their own.
  var floats = [].slice.call(document.querySelectorAll('.item[id]')).map(function (card) {
    var a = document.createElement('a');
    a.className = 'float';
    a.href = '#' + card.id;
    a.setAttribute('aria-label', card.querySelector('h3').textContent);
    a.appendChild(card.querySelector('.item-mark').cloneNode(true));
    a.addEventListener('click', function (e) {
      e.preventDefault();
      if (card.closest('.category').hidden) show('all', true);
      card.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'center' });
      card.classList.remove('flash'); void card.offsetWidth; card.classList.add('flash');
    });
    band.appendChild(a);
    return { el: a, x: 0 };
  });

  var gull = band.querySelector('.gull-post'), gullX = 0;
  if (gull && !still) gull.addEventListener('click', function () {
    if (gull.classList.contains('away')) return;
    gull.classList.add('away');
    setTimeout(function () { gull.classList.remove('away'); }, 7000);
  });

  function layout() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var cw = Math.min(880, w - (w <= 600 ? 32 : 48)), left = (w - cw) / 2;
    var room = Math.max(1, Math.floor(cw * 0.6 / 64));
    floats.forEach(function (f, i) {
      f.el.hidden = i >= room;
      f.x = left + cw * (0.04 + 0.6 * (i + 0.5) / Math.min(floats.length, room));
    });
    gullX = left + cw * 0.88;
    if (gull) gull.style.transform = 'translate(' + (gullX - 28) + 'px,' + (h * waves[0].y - 54) + 'px)';
    if (still) draw(0);
  }

  function draw(ms) {
    var t = ms / 1000;
    lift += ((pointerX === null ? 0 : 1) - lift) * 0.08;
    ripples = ripples.filter(function (r) { return t - r.t < 3; });
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (var i = waves.length - 1; i >= 0; i--) {
      ctx.globalAlpha = waves[i].alpha; ctx.lineWidth = waves[i].width;
      ctx.beginPath();
      for (var x = -4; x <= w + 4; x += 4) {
        var y = waveY(i, x, t);
        if (x === -4) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    floats.forEach(function (f) {
      var y = waveY(0, f.x, t), slope = (waveY(0, f.x + 10, t) - waveY(0, f.x - 10, t)) / 20;
      f.el.style.transform = 'translate(' + (f.x - 22) + 'px,' + (y - 36) + 'px) rotate(' + (Math.atan(slope) * 0.7).toFixed(3) + 'rad)';
    });
    if (!still) requestAnimationFrame(draw);
  }

  function localX(e) { return e.clientX - band.getBoundingClientRect().left; }
  window.addEventListener('resize', layout);
  layout();
  band.classList.add('ready');
  if (still) return;
  band.addEventListener('pointermove', function (e) {
    var x = localX(e), now = performance.now() / 1000;
    pointerX = x;
    if (Math.abs(x - lastWake.x) > 46 && now - lastWake.t > 0.12) {
      ripples.push({ x: x, t: now, a: 0.3 });
      lastWake = { x: x, t: now };
    }
  });
  band.addEventListener('pointerleave', function () { pointerX = null; });
  band.addEventListener('pointerdown', function (e) { ripples.push({ x: localX(e), t: performance.now() / 1000, a: 1 }); });
  requestAnimationFrame(draw);
})();

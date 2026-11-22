// Category filter. Without JavaScript the chips are plain links to each section.
(function () {
  var chips = [].slice.call(document.querySelectorAll('.chip[data-filter]'));
  var sections = [].slice.call(document.querySelectorAll('.category[data-category]'));
  if (!chips.length) return;
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
})();

// The sea: three swells that lift under the pointer and ripple where you tap.
(function () {
  var canvas = document.querySelector('.sea-band canvas');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var color = getComputedStyle(document.documentElement).getPropertyValue('--sea').trim() || '#5fd4c4';
  var waves = [
    { y: 0.34, amp: 7, len: 150, speed: 0.50, phase: 0.0, width: 2.5, alpha: 0.95 },
    { y: 0.56, amp: 9, len: 210, speed: -0.36, phase: 2.1, width: 2, alpha: 0.5 },
    { y: 0.78, amp: 11, len: 290, speed: 0.26, phase: 4.2, width: 1.5, alpha: 0.25 }
  ];
  var w = 0, h = 0, pointerX = null, lift = 0, ripples = [];

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (still) draw(0);
  }

  function draw(ms) {
    var t = ms / 1000;
    lift += ((pointerX === null ? 0 : 1) - lift) * 0.08;
    ripples = ripples.filter(function (r) { return t - r.t < 3; });
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    waves.forEach(function (wave, i) {
      ctx.globalAlpha = wave.alpha; ctx.lineWidth = wave.width;
      ctx.beginPath();
      for (var x = -4; x <= w + 4; x += 4) {
        var y = h * wave.y + wave.amp * Math.sin(x / wave.len * 6.283 + t * wave.speed * 6.283 + wave.phase);
        if (lift > 0.01) { var d = (x - pointerX) / 110; y -= (16 - i * 4) * lift * Math.exp(-d * d); }
        for (var k = 0; k < ripples.length; k++) {
          var age = t - ripples[k].t, front = Math.abs(x - ripples[k].x) - age * 260, env = front / 70;
          y += (12 - i * 3) * Math.sin(front / 16) * Math.exp(-env * env) * Math.exp(-age * 1.3);
        }
        if (x === -4) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
    if (!still) requestAnimationFrame(draw);
  }

  function localX(e) { return e.clientX - canvas.getBoundingClientRect().left; }
  window.addEventListener('resize', resize);
  resize();
  if (still) return;
  canvas.addEventListener('pointermove', function (e) { pointerX = localX(e); });
  canvas.addEventListener('pointerleave', function () { pointerX = null; });
  canvas.addEventListener('pointerdown', function (e) { ripples.push({ x: localX(e), t: performance.now() / 1000 }); });
  requestAnimationFrame(draw);
})();

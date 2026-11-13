/* =====================================================================
   James Ramos — portfolio scripts
   ===================================================================== */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
};

/* ================= ALWAYS START AT THE TOP ON REFRESH =================
   Section links scroll smoothly without adding #hash to the URL, and the browser
   is told not to restore the old scroll position. */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
if (location.hash) history.replaceState(null, '', location.pathname + location.search);
window.scrollTo(0, 0);
$$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const target = a.hash === '#top' ? null : document.querySelector(a.hash);
  if (a.hash !== '#top' && !target) return;
  e.preventDefault();
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  else window.scrollTo({ top: 0, behavior: 'smooth' });
}));

/* ================= THEME (one button: system → light → dark) ================= */
(() => {
  const root = document.documentElement, btn = $('#themeBtn');
  const ICONS = { system: 'fa-circle-half-stroke', light: 'fa-sun', dark: 'fa-moon' };
  const ORDER = ['system', 'light', 'dark'];
  let mode = 'system';
  try { mode = localStorage.getItem('theme') || 'system'; } catch (e) {}
  const apply = m => {
    mode = m;
    if (m === 'system') delete root.dataset.theme; else root.dataset.theme = m;
    try { localStorage.setItem('theme', m); } catch (e) {}
    btn.dataset.label = 'theme: ' + m;
    $('i', btn).className = (m === 'system' ? 'fas ' : 'far ') + ICONS[m];
  };
  btn.addEventListener('click', () => apply(ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length]));
  apply(ORDER.includes(mode) ? mode : 'system');
})();

/* ================= DOCK: active section + phone menu ================= */
(() => {
  const dock = $('#dock'), pop = $('#dkPop'), menuBtn = $('#dkMenu');
  const setPop = open => { pop.hidden = !open; menuBtn.setAttribute('aria-expanded', open); menuBtn.classList.toggle('active', open); };
  menuBtn.addEventListener('click', e => { e.stopPropagation(); setPop(pop.hidden); });
  $$('a', pop).forEach(a => a.addEventListener('click', () => setPop(false)));
  document.addEventListener('click', e => { if (!pop.hidden && !dock.contains(e.target)) setPop(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape') setPop(false); });

  // highlight the section you're reading
  const links = $$('.dk-sec a, .dk-pop a');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) links.forEach(l => l.classList.toggle('active', l.hash === '#' + e.target.id));
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  [...new Set(links.map(l => l.hash))].forEach(h => { const s = $(h); if (s) io.observe(s); });
  // nothing highlighted while you're in the hero
  addEventListener('scroll', () => { if (scrollY < innerHeight * 0.4) links.forEach(l => l.classList.remove('active')); }, { passive: true });
})();

/* ================= SYSTEM CHECK PANEL =================
   Pixel "JR" monogram + a terminal-style readout that prints line by line
   the first time it scrolls into view. */
(() => {
  const panel = $('#sysinfo');
  if (!panel) return;

  // 5x7 pixel letters, 1 = solid, 2 = dithered (lighter) pixel
  const J = ['00111', '00010', '00010', '00010', '20010', '10010', '01100'];
  const R = ['11110', '10001', '10001', '11110', '10200', '10010', '10001'];
  const rows = J.map((r, i) => r + '0' + R[i]);
  const S = 9, G = 1.5;   // pixel size + gap
  let rects = '';
  rows.forEach((row, y) => [...row].forEach((c, x) => {
    if (c === '0') return;
    rects += `<rect x="${x * (S + G)}" y="${y * (S + G)}" width="${S}" height="${S}" rx="1.5" class="${c === '2' ? 'dim' : ''}" style="--d:${(x + y) * 45}ms"/>`;
  }));
  const W = rows[0].length * (S + G) - G, H = rows.length * (S + G) - G;
  $('#siLogo').innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${rects}</svg><span>james.ramos</span>`;

  const countUp = el => {
    const to = +el.dataset.to, start = performance.now(), dur = 900;
    (function tick() {
      const now = performance.now();
      const p = Math.min(1, Math.max(0, (now - start) / dur));
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) setTimeout(tick, 16);
    })(start);
  };
  const io = new IntersectionObserver(entries => {
    if (!entries.some(e => e.isIntersecting)) return;
    panel.classList.add('run');
    setTimeout(() => $$('.si-num', panel).forEach(countUp), 500);
    io.disconnect();
  }, { threshold: 0.35 });
  io.observe(panel);
})();

/* ================= CAMERA FEED READOUT + GIT LOG REVEAL ================= */
(() => {
  // live "eyes →" coordinates under the photo
  const out = $('#eyeXY');
  if (out) {
    let last = 0, idleT = null;
    addEventListener('pointermove', e => {
      const now = performance.now();
      if (now - last > 60) {
        last = now;
        const x = String(Math.round(e.clientX)).padStart(4, '0'), y = String(Math.round(e.clientY)).padStart(4, '0');
        out.textContent = 'eyes → x ' + x + ' · y ' + y;
        out.classList.add('on');
      }
      clearTimeout(idleT);
      idleT = setTimeout(() => { out.textContent = 'eyes: wandering…'; out.classList.remove('on'); }, 4000);
    }, { passive: true });
  }

  // commits slide in as you scroll to them
  const commits = $$('.gitlog .commit');
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }), { threshold: 0.25 });
  commits.forEach(c => io.observe(c));
})();

/* ================= DITHERED PHOTO + EYES THAT FOLLOW THE CURSOR =================
   1. Draw the colour photo to an offscreen canvas.
   2. Paint new eyeballs over the real eyes, with the iris shifted toward the cursor.
   3. Convert everything to 1-bit black & white with an 8x8 Bayer ordered dither.
   Eye coordinates are in ORIGINAL james.png pixel space (1254x1254).            */
(() => {
  const wrap = $('#photo'), canvas = $('#face');
  if (!wrap || !canvas || !window.PHOTO_SRC) return;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const col = document.createElement('canvas');
  const cctx = col.getContext('2d', { willReadFrequently: true });

  const CROP = { x: 287, y: 50, size: 680 };   // matches photo.js
  const EYES = [
    { a: [498, 399], b: [561, 401], top: [525, 375], bot: [528, 412], iris: [527, 396], r: 14.5 },
    { a: [662, 396], b: [725, 391], top: [692, 372], bot: [694, 409], iris: [695, 392], r: 14 },
  ];
  const MAX_X = 13, MAX_Y = 4.2;
  EYES.forEach(e => { e.off = [0, 0]; e.target = [0, 0]; });

  // 8x8 Bayer threshold map
  const BAYER = (() => {
    let m = [[0]];
    for (let n = 1; n < 8; n *= 2) {
      const next = [];
      for (let y = 0; y < n * 2; y++) next.push(new Array(n * 2));
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const v = m[y][x] * 4;
        next[y][x] = v; next[y][x + n] = v + 2; next[y + n][x] = v + 3; next[y + n][x + n] = v + 1;
      }
      m = next;
    }
    return Float32Array.from(m.flat(), v => (v + 0.5) / 64);
  })();

  const img = new Image();
  img.src = window.PHOTO_SRC;

  let N = 300, scale = 1;
  function size() {
    const dpr = window.devicePixelRatio || 1;
    const cell = Math.max(1, Math.floor(dpr));
    N = Math.max(120, Math.round(wrap.clientWidth * dpr / cell));
    canvas.width = canvas.height = col.width = col.height = N;
    scale = N / CROP.size;
    lastKey = '';
  }

  const almond = (c, e) => {
    c.beginPath();
    c.moveTo(e.a[0], e.a[1]);
    c.quadraticCurveTo(e.top[0], e.top[1], e.b[0], e.b[1]);
    c.quadraticCurveTo(e.bot[0], e.bot[1], e.a[0], e.a[1]);
    c.closePath();
  };

  function drawEye(c, e, blink) {
    const ix = e.iris[0] + e.off[0], iy = e.iris[1] + e.off[1];
    const cx = (e.a[0] + e.b[0]) / 2, cy = (e.a[1] + e.b[1]) / 2;
    const w = Math.abs(e.b[0] - e.a[0]);
    const topY = (e.a[1] + 2 * e.top[1] + e.b[1]) / 4;
    c.save();
    almond(c, e); c.clip();

    let g = c.createRadialGradient(cx, cy + 2, 2, cx, cy, w * 0.55);   // sclera
    g.addColorStop(0, '#dedbe2'); g.addColorStop(0.6, '#c2bec8'); g.addColorStop(1, '#7a7078');
    c.fillStyle = g; c.fillRect(cx - w, cy - w, w * 2, w * 2);

    g = c.createRadialGradient(ix, iy, 0, ix, iy, e.r);                  // iris
    g.addColorStop(0, '#000'); g.addColorStop(0.8, '#0c0a0c'); g.addColorStop(1, '#2a2226');
    c.fillStyle = g; c.beginPath(); c.arc(ix, iy, e.r, 0, Math.PI * 2); c.fill();

    c.fillStyle = '#fff';                                                 // catchlights
    c.beginPath(); c.arc(ix - 5, iy - 4, 2.6, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(ix + 4, iy - 4, 1.8, 0, Math.PI * 2); c.fill();

    g = c.createLinearGradient(0, topY - 1, 0, topY + 8);                // upper-lid shadow
    g.addColorStop(0, 'rgba(0,0,0,.8)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(cx - w, topY - 4, w * 2, 14);

    if (blink > 0.01) {                                                   // eyelid
      const lidY = e.top[1] + (e.bot[1] + 4 - e.top[1]) * blink;
      c.beginPath();
      c.moveTo(e.a[0] - 2, e.a[1]);
      c.quadraticCurveTo(e.top[0], e.top[1] - 6, e.b[0] + 2, e.b[1]);
      c.quadraticCurveTo(e.top[0], lidY, e.a[0] - 2, e.a[1]);
      c.fillStyle = '#8a6a64'; c.fill();
      c.beginPath(); c.moveTo(e.a[0] - 2, e.a[1]); c.quadraticCurveTo(e.top[0], lidY, e.b[0] + 2, e.b[1]);
      c.strokeStyle = '#0a0406'; c.lineWidth = 3; c.stroke();
    }
    c.restore();
  }

  function dither() {
    const id = cctx.getImageData(0, 0, N, N), d = id.data;
    for (let y = 0, i = 0; y < N; y++) {
      const row = (y & 7) * 8;
      for (let x = 0; x < N; x++, i += 4) {
        let L = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
        L = Math.min(1, Math.max(0, (L - 0.04) / 0.9));
        L = Math.pow(L, 0.8);
        L = (L - 0.5) * 1.45 + 0.56;
        const v = L > BAYER[row + (x & 7)] ? 255 : 17;
        d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
      }
    }
    ctx.putImageData(id, 0, 0);
  }

  let blink = 0, nextBlink = performance.now() + 2200, lastKey = '';
  function render() {
    const key = N + '|' + EYES.map(e => e.off.map(v => v.toFixed(1)).join(',')).join('|') + '|' + blink.toFixed(2);
    if (key === lastKey) return;
    lastKey = key;
    cctx.setTransform(scale, 0, 0, scale, -CROP.x * scale, -CROP.y * scale);
    cctx.imageSmoothingQuality = 'high';
    cctx.drawImage(img, CROP.x, CROP.y, CROP.size, CROP.size);
    EYES.forEach(e => drawEye(cctx, e, blink));
    dither();
  }

  // pointer tracking
  let pointer = null, lastMove = 0, wander = [0, 0], nextWander = 0;
  const onMove = (x, y) => { pointer = [x, y]; lastMove = performance.now(); };
  window.addEventListener('pointermove', ev => onMove(ev.clientX, ev.clientY), { passive: true });
  window.addEventListener('touchstart', ev => { const t = ev.touches[0]; if (t) onMove(t.clientX, t.clientY); }, { passive: true });
  document.addEventListener('mouseleave', () => { lastMove = 0; });
  wrap.addEventListener('click', () => { nextBlink = performance.now(); });

  function updateTargets(now) {
    const idle = !pointer || now - lastMove > 4000;
    const r = canvas.getBoundingClientRect(), s = r.width / CROP.size;
    if (idle && now > nextWander) {
      const ang = Math.random() * Math.PI * 2, mag = Math.random() < 0.3 ? 0 : 0.4 + Math.random() * 0.5;
      wander = [Math.cos(ang) * mag, Math.sin(ang) * mag];
      nextWander = now + 1200 + Math.random() * 2200;
    }
    EYES.forEach(e => {
      if (idle) { e.target = [wander[0] * MAX_X, wander[1] * MAX_Y]; return; }
      const ex = r.left + (e.iris[0] - CROP.x) * s, ey = r.top + (e.iris[1] - CROP.y) * s;
      const dx = pointer[0] - ex, dy = pointer[1] - ey, d = Math.hypot(dx, dy) || 1;
      const reach = Math.min(1, d / 260);
      e.target = [(dx / d) * reach * MAX_X, (dy / d) * reach * MAX_Y];
    });
  }
  function updateBlink(now) {
    if (now < nextBlink) { blink = 0; return; }
    const t = now - nextBlink, dur = 170;
    blink = t < dur ? Math.sin((t / dur) * Math.PI) : 0;
    if (t >= dur) nextBlink = now + (Math.random() < 0.15 ? 120 : 2500 + Math.random() * 3500);
  }
  function tick(now) {
    updateTargets(now);
    updateBlink(now);
    EYES.forEach(e => {
      e.off[0] += (e.target[0] - e.off[0]) * 0.2;
      e.off[1] += (e.target[1] - e.off[1]) * 0.2;
    });
    render();
    requestAnimationFrame(tick);
  }

  img.onload = () => {
    size();
    new ResizeObserver(size).observe(wrap);
    requestAnimationFrame(tick);
  };
})();

/* ================= PROJECT CONSOLE =================
   File list on the left, a browser window on the right with a tiny live
   "demo" of each app. Auto-advances every 8s; pauses while hovered. */
(() => {
  const root = $('#console');
  if (!root) return;
  const PROJECTS = [
    {
      slug: 'qr-ordering', title: 'Mini QR Ordering System', type: 'full-stack web app',
      problem: 'Waiting for a waiter just to see the menu or place an order slows everyone down.',
      built: ['A QR code on each table opens the menu instantly', 'Customers browse and order straight from their phone', 'No app to install — everything runs in the browser'],
      stack: ['PHP', 'MySQL', 'JavaScript', 'HTML/CSS'],
    },
    {
      slug: 'nihongo', title: 'Nihongo Learning Platform', type: 'learning platform',
      problem: 'Learning Japanese on your own is hard to stay consistent with.',
      built: ['Structured lessons that build on each other', 'Quizzes to check what you actually remember', 'Progress tracking to keep learners motivated'],
      stack: ['JavaScript', 'HTML/CSS', 'UI/UX'],
    },
    {
      slug: 'e-commerce', title: 'E-Commerce App', type: 'online store',
      problem: 'Every online store needs the same solid core: products, a cart, and a checkout that just works.',
      built: ['Product catalog', 'Shopping cart and user accounts', 'A complete checkout flow, built from scratch'],
      stack: ['Frontend', 'Backend', 'MySQL'],
    },
    {
      slug: 'hotel-booking', title: 'Hotel Book Management', type: 'management system',
      problem: 'Tracking rooms and reservations by hand leads to mistakes and double bookings.',
      built: ['Real-time room availability', 'Reservation management', 'An admin dashboard for day-to-day operations'],
      stack: ['PHP', 'MySQL', 'CRUD'],
    },
  ];
  const items = $$('.pitem', root), scenes = $$('.scene', root);
  const el = id => document.getElementById(id);
  let active = -1, timer = null, paused = false;
  const DURATION = 8000;

  function select(i, user) {
    i = (i + PROJECTS.length) % PROJECTS.length;
    if (i === active) return;
    active = i;
    const p = PROJECTS[i];
    items.forEach((b, j) => { b.classList.toggle('on', j === i); b.setAttribute('aria-selected', j === i); });
    scenes.forEach((s, j) => s.classList.toggle('on', j === i));
    el('pUrl').textContent = p.slug;
    el('pTitle').textContent = p.title;
    el('pType').textContent = p.type;
    el('pProblem').textContent = p.problem;
    el('pBuilt').innerHTML = '';
    p.built.forEach(t => { const li = document.createElement('li'); li.textContent = t; el('pBuilt').appendChild(li); });
    el('pStack').innerHTML = '';
    p.stack.forEach(t => { const s = document.createElement('span'); s.textContent = t; el('pStack').appendChild(s); });
    const info = $('.pinfo', root);
    info.classList.remove('swap'); void info.offsetWidth; info.classList.add('swap');
    sceneStart[i]();
    restart();
  }
  function restart() {
    clearTimeout(timer);
    items.forEach(b => { const bar = $('.pbar', b); bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; });
    if (!paused) timer = setTimeout(() => select(active + 1), DURATION);
  }
  items.forEach((b, i) => b.addEventListener('click', () => select(i, true)));
  root.addEventListener('mouseenter', () => { paused = true; root.classList.add('paused'); clearTimeout(timer); });
  root.addEventListener('mouseleave', () => { paused = false; root.classList.remove('paused'); restart(); });

  /* ---------- scene 1: QR code ---------- */
  (() => {
    const N = 21, grid = el('qrGrid');
    const finder = (x, y) => {
      for (const [fx, fy] of [[0, 0], [N - 7, 0], [0, N - 7]]) {
        const dx = x - fx, dy = y - fy;
        if (dx >= 0 && dx < 7 && dy >= 0 && dy < 7)
          return dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4) ? 1 : 0;
      }
      return -1;
    };
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const f = finder(x, y), c = document.createElement('i');
      if (f === 1 || (f === -1 && !(x === 7 || y === 7 || x === N - 8 || y === N - 8) && rnd() > 0.52)) c.className = 'on';
      grid.appendChild(c);
    }
  })();
  const sQR = () => { const s = $('.s-qr', root); s.classList.remove('play'); void s.offsetWidth; s.classList.add('play'); };

  /* ---------- scene 2: kana flashcards ---------- */
  const KANA = [['あ', 'a'], ['か', 'ka'], ['さ', 'sa'], ['た', 'ta'], ['な', 'na']];
  let kanaTimer = null;
  const sJP = () => {
    clearInterval(kanaTimer);
    let k = 0;
    const card = el('kanaCard'), dots = $$('#kanaQuiz i');
    const step = () => {
      const [f, b] = KANA[k % KANA.length];
      card.classList.remove('flip');
      el('kanaFront').textContent = f; el('kanaBack').textContent = b;
      setTimeout(() => card.classList.add('flip'), 700);
      el('kanaBar').style.width = ((k % KANA.length) + 1) / KANA.length * 100 + '%';
      dots.forEach((d, j) => d.className = j < (k % KANA.length) + 1 ? (j === 2 && k % KANA.length >= 2 ? 'miss' : 'hit') : '');
      k++;
    };
    step();
    kanaTimer = setInterval(step, 1600);
  };

  /* ---------- scene 3: add to cart ---------- */
  let shopTimer = null;
  const sShop = () => {
    clearInterval(shopTimer);
    const prods = $$('#shelf .prod'), prices = [450, 320, 280];
    let n = 0, total = 0;
    el('cartCount').textContent = '0'; el('cartTotal').textContent = '₱0';
    const label = (p, on) => { p.classList.toggle('added', on); $('.add', p).textContent = on ? '✓ added' : '+ add'; };
    prods.forEach(p => label(p, false));
    shopTimer = setInterval(() => {
      if (n >= 3) { n = 0; total = 0; prods.forEach(p => label(p, false)); el('cartCount').textContent = '0'; el('cartTotal').textContent = '₱0'; return; }
      label(prods[n], true);
      total += prices[n]; n++;
      el('cartCount').textContent = n; el('cartTotal').textContent = '₱' + total;
      const c = $('.cart', root); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump');
    }, 1300);
  };

  /* ---------- scene 4: booking calendar ---------- */
  let calTimer = null;
  const calGrid = el('calGrid');
  ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(d => { const h = document.createElement('b'); h.textContent = d; calGrid.appendChild(h); });
  const days = [];
  for (let i = 0; i < 30; i++) { const c = document.createElement('i'); c.textContent = i + 1; calGrid.appendChild(c); days.push(c); }
  const sHotel = () => {
    clearInterval(calTimer);
    const preset = [2, 3, 9, 10, 11, 16, 23, 24];
    days.forEach((d, i) => d.className = preset.includes(i) ? 'booked' : '');
    const free = () => { el('calFree').textContent = days.filter(d => !d.classList.contains('booked')).length; };
    free();
    calTimer = setInterval(() => {
      const open = days.filter(d => !d.classList.contains('booked'));
      if (open.length < 12) { days.forEach((d, i) => d.className = preset.includes(i) ? 'booked' : ''); free(); return; }
      const pick = open[Math.floor(Math.random() * open.length)];
      pick.className = 'booked new';
      free();
    }, 900);
  };

  const sceneStart = [sQR, sJP, sShop, sHotel];
  select(0);
})();

/* ================= MODALS ================= */
const modals = {
  open(id) {
    $$('dialog[open]').forEach(d => d.close());
    const d = document.getElementById(id);
    if (!d) return;
    d.showModal();
    d.dispatchEvent(new Event('opened'));
  },
};
$$('[data-open]').forEach(b => b.addEventListener('click', () => modals.open(b.dataset.open)));
$$('dialog').forEach(d => {
  $$('[data-close]', d).forEach(b => b.addEventListener('click', () => d.close()));
  d.addEventListener('click', e => { if (e.target === d) d.close(); });   // click backdrop
});

function addMsg(log, { text, who, me, when }) {
  const m = document.createElement('div');
  m.className = 'msg ' + (me ? 'me' : 'bot');
  if (who) {
    const w = document.createElement('span');
    w.className = 'who'; w.textContent = who;
    if (when) { const t = document.createElement('span'); t.className = 'when'; t.textContent = when; w.appendChild(t); }
    m.appendChild(w);
  }
  m.appendChild(document.createTextNode(text));
  log.appendChild(m);
  log.scrollTop = log.scrollHeight;
  return m;
}

/* ================= CERTIFICATE VIEWER ================= */
(() => {
  const dlg = $('#certView');
  if (!dlg) return;
  const CERTS = [
    {
      file: 'cert_01.jpg', img: 'certs/web/cash3-2026.jpg',
      title: 'CASH 3.0 — International Bitcoin Cash Conference',
      theme: 'The Future of Money, Adoption & Real-World Usage of Cryptocurrency, and the Advent of the AI Economy',
      issuer: 'Paytaca, Inc.', date: 'August 1–2, 2026', venue: 'Summit Hotel, Cebu City',
    },
    {
      file: 'cert_02.jpg', img: 'certs/web/psite7-2026.jpg',
      title: 'Cebu ICT Student Congress 2026',
      theme: 'IT Education in the Exponential Era: Cultivating Minds for Cognitive Future',
      issuer: 'PSITE Central Visayas (PSITE 7), in cooperation with the University of Cebu', date: 'April 30, 2026', venue: 'UC New Cebu Coliseum, Cebu City',
    },
    {
      file: 'cert_03.jpg', img: 'certs/web/ict-congress-2026.jpg',
      title: '12th UC CCS ICT Congress 2026',
      theme: 'Innovating the Future: Empowering Society Through Intelligent Technologies',
      issuer: 'University of Cebu — College of Computer Studies', date: 'April 22, 2026', venue: 'New Cebu Coliseum, Cebu City',
    },
    {
      file: 'cert_04.jpg', img: 'certs/web/ibm-data-fundamentals-2025.jpg',
      title: 'Data Fundamentals — IBM SkillsBuild',
      theme: 'Data analytics concepts, data science methods, and cleaning, refining & visualizing data with IBM Watson Studio',
      issuer: 'IBM SkillsBuild', date: 'November 26, 2025', venue: 'Online · intermediate level',
      titleLabel: 'credential', venueLabel: 'format', themeLabel: 'covers', status: 'verified digital badge',
    },
  ];
  let cur = 0;
  const img = $('#cvImg');
  function show(i) {
    cur = (i + CERTS.length) % CERTS.length;
    const c = CERTS[cur];
    img.classList.remove('in'); void img.offsetWidth;
    img.src = c.img;
    img.alt = 'Certificate of participation — ' + c.title;
    img.classList.add('in');
    $('#cvFile').textContent = c.file;
    $('#cvCount').textContent = (cur + 1) + ' / ' + CERTS.length;
    $('#cvTitle').textContent = c.title;
    $('#cvTheme').textContent = c.themeLabel ? c.theme : '“' + c.theme + '”';
    $('#cvIssuer').textContent = c.issuer;
    $('#cvDate').textContent = c.date;
    $('#cvVenue').textContent = c.venue;
    // labels differ for badges vs. event certificates
    $('#cvTitle').previousElementSibling.textContent = c.titleLabel || 'event';
    $('#cvTheme').previousElementSibling.textContent = c.themeLabel || 'theme';
    $('#cvVenue').previousElementSibling.textContent = c.venueLabel || 'venue';
    $('#cvStatus').textContent = c.status || 'certificate of participation';
  }
  $$('.cert[data-i]').forEach(b => b.addEventListener('click', () => {
    show(+b.dataset.i);
    $$('dialog[open]').forEach(d => d.close());
    dlg.showModal();
  }));
  $('#cvPrev').addEventListener('click', () => show(cur - 1));
  $('#cvNext').addEventListener('click', () => show(cur + 1));
  dlg.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(cur - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(cur + 1); }
  });
  // swipe on phones
  let sx = null;
  const stage = $('.cv-stage', dlg);
  stage.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', e => {
    if (sx == null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1));
    sx = null;
  });
})();

/* ================= ASK ANYTHING (local knowledge base) ================= */
(() => {
  const log = $('#askLog'), form = $('#askForm'), input = $('#askInput');
  const KB = [
    { k: /\b(hi|hello|hey|yo|kumusta|musta)\b/, a: "Hey! 👋 I'm James's portfolio assistant. Ask me about his projects, stack, certifications, or how to reach him." },
    { k: /experience|blueberry|immersion|senior high|shs|worked|work exp/, a: "Experience so far:\n• Work immersion at Blueberry Digital Labs (senior high school) — worked on interlinking & design\n• 4 years of BSIT at UCLM, building 4 full projects\n• Now looking for a Software Development OJT / internship" },
    { k: /stack|tech|language|skill|tool|know|use/, a: "James works across the stack:\n• Frontend — HTML, CSS, JavaScript, React, Bootstrap, Tailwind\n• Backend — PHP, Node.js, REST APIs\n• Database & tools — MySQL, Git/GitHub, VS Code, Figma" },
    { k: /project|built|build|portfolio|work on|made/, a: "He's built 4 main projects:\n• Mini QR Ordering System — scan a table QR & order from your phone\n• Nihongo Learning Platform — Japanese lessons, quizzes & progress tracking\n• E-Commerce App — catalog, cart, accounts & checkout\n• Hotel Book Management — availability, reservations & admin dashboard" },
    { k: /qr|order|restaurant|menu/, a: "The Mini QR Ordering System lets diners scan a QR code at their table, browse the menu and order straight from their phone — no app install. Built with PHP, MySQL and JavaScript." },
    { k: /nihongo|japan|日本/, a: "The Nihongo Learning Platform is an interactive way to learn Japanese — structured lessons, quizzes and progress tracking. James is learning 日本語 himself!" },
    { k: /hotel|booking|reserv/, a: "Hotel Book Management handles real-time room availability, reservations, and an admin dashboard for operations. PHP + MySQL CRUD system." },
    { k: /e-?commerce|shop|store|cart/, a: "The E-Commerce App is a full online store: product catalog, shopping cart, user accounts and a complete checkout flow, built from scratch." },
    { k: /cert|psite|ict|congress|ibm|skillsbuild|bitcoin|bch|cash/, a: "Certificates & events:\n• CASH 3.0 — International Bitcoin Cash Conference (Aug 1–2, 2026, Summit Hotel Cebu)\n• Cebu ICT Student Congress 2026 — PSITE Central Visayas (Apr 30, 2026)\n• 12th UC CCS ICT Congress 2026 (Apr 22, 2026)\n• IBM SkillsBuild — Data Fundamentals badge (Nov 26, 2025): data analytics, data science and visualizing data with IBM Watson Studio\nYou can view all of them in the certifications section." },
    { k: /ojt|intern|hire|hiring|available|job|work with|opportunit/, a: "Yes! James is actively looking for a Software Development internship / OJT. Best way to reach him: jamesramos101604@gmail.com" },
    { k: /school|study|college|universit|uclm|bsit|year|student|educat/, a: "He's a 4th-year BS Information Technology student at the University of Cebu Lapu-Lapu and Mandaue (UCLM)." },
    { k: /contact|email|reach|mail|linkedin|github|social/, a: "📧 jamesramos101604@gmail.com\n🐙 github.com/jamesramos1899-dot\n💼 linkedin.com/in/james-stephen-ramos" },
    { k: /where|location|live|from|based|cebu/, a: "James is based in Cebu, Philippines 🇵🇭" },
    { k: /who|about|yourself|james/, a: "James Stephen Ramos is a 4th-year BSIT student at UCLM working toward becoming a full-stack developer. He learns by building — HTML, CSS, JavaScript, PHP and MySQL so far — and is now learning React, Node.js and REST APIs." },
    { k: /hobb|fun|free time|interest|beyond/, a: "Outside of code: studying Japanese, solving problems, and turning coffee into side projects ☕" },
  ];
  const answer = q => {
    const s = q.toLowerCase();
    const hit = KB.find(x => x.k.test(s));
    return hit ? hit.a : "Good question! I don't have that one yet — email James at jamesramos101604@gmail.com and he'll answer personally. You can also ask about his projects, stack, certifications or OJT availability.";
  };
  function ask(q) {
    q = q.trim(); if (!q) return;
    addMsg(log, { text: q, me: true });
    const t = addMsg(log, { text: '•••' }); t.classList.add('typing');
    setTimeout(() => { t.remove(); addMsg(log, { text: answer(q) }); }, 450 + Math.random() * 400);
  }
  /* ---------- "what your browser already shared" reveal ----------
     Everything below is read from the visitor's own browser (plus one public IP lookup)
     and is only displayed to them. Nothing is stored or sent to James. */
  const PH_REGIONS = {
    'ilocos': 'Region I', 'cagayan valley': 'Region II', 'central luzon': 'Region III', 'calabarzon': 'Region IV-A',
    'mimaropa': 'MIMAROPA', 'bicol': 'Region V', 'western visayas': 'Region VI', 'central visayas': 'Region VII',
    'eastern visayas': 'Region VIII', 'zamboanga': 'Region IX', 'northern mindanao': 'Region X', 'davao': 'Region XI',
    'soccsksargen': 'Region XII', 'caraga': 'Region XIII', 'metro manila': 'NCR', 'national capital': 'NCR',
    'cordillera': 'CAR', 'bangsamoro': 'BARMM', 'muslim mindanao': 'BARMM',
  };
  const phRegion = r => { const s = (r || '').toLowerCase(); const k = Object.keys(PH_REGIONS).find(k => s.includes(k)); return k ? PH_REGIONS[k] : ''; };

  const getJSON = (url, ms = 5000) => {
    const c = new AbortController(), t = setTimeout(() => c.abort(), ms);
    return fetch(url, { signal: c.signal, cache: 'no-store' })
      .then(r => { clearTimeout(t); if (!r.ok) throw new Error(r.status); return r.json(); });
  };
  // turn long ISP / ASN names into the names people actually know
  const ISPS = [[/pldt|philippine long distance/i, 'PLDT'], [/smart comm/i, 'Smart'], [/globe/i, 'Globe'],
    [/converge/i, 'Converge'], [/dito/i, 'DITO'], [/sky ?cable|skybroadband/i, 'SKY'], [/eastern telecom/i, 'Eastern Communications']];
  const niceISP = s => {
    s = (s || '').replace(/^AS\d+\s*/, '').trim();
    const hit = ISPS.find(([re]) => re.test(s));
    return hit ? hit[1] : s;
  };
  async function lookupIP() {
    try {
      const d = await getJSON('https://ipapi.co/json/'); if (d.error) throw 0;
      return { ip: d.ip, city: d.city, region: d.region, country: d.country_name, isp: niceISP(d.org) };
    } catch (e) {}
    try {
      const d = await getJSON('https://ipwho.is/'); if (d.success === false) throw 0;
      return { ip: d.ip, city: d.city, region: d.region, country: d.country, isp: niceISP(d.connection && (d.connection.isp || d.connection.org)) };
    } catch (e) {}
    return null;
  }

  const BRANDS = [
    [/^SM-|samsung|galaxy/i, 'Samsung'], [/^V\d{4}|vivo/i, 'vivo'], [/^I\d{4}|iqoo/i, 'vivo iQOO'], [/^CPH|oppo/i, 'OPPO'], [/^RMX|realme/i, 'realme'],
    [/redmi|poco|xiaomi|^M\d{4}|^2\d{5,}/i, 'Xiaomi'], [/infinix/i, 'Infinix'], [/tecno/i, 'TECNO'], [/pixel/i, 'Google'],
    [/huawei|honor/i, 'Huawei'], [/oneplus/i, 'OnePlus'], [/nokia/i, 'Nokia'], [/iphone|ipad/i, 'Apple'],
  ];
  async function readDevice() {
    const ua = navigator.userAgent, uad = navigator.userAgentData;
    const d = { model: '', os: '', browser: '', arch: '', mobile: /Mobi|Android|iPhone|iPad/i.test(ua) };
    if (uad) {
      d.mobile = uad.mobile || d.mobile;
      try {
        const h = await uad.getHighEntropyValues(['model', 'platform', 'platformVersion', 'architecture', 'bitness', 'fullVersionList']);
        d.model = h.model || '';
        const major = parseInt(h.platformVersion || '0', 10);
        if (h.platform === 'Windows') d.os = major >= 13 ? 'Windows 11' : major > 0 ? 'Windows 10' : 'Windows';
        else if (h.platform === 'Android') d.os = 'Android ' + (h.platformVersion || '').split('.')[0];
        else if (h.platform === 'macOS') d.os = 'macOS';
        else d.os = h.platform || '';
        if (h.architecture) d.arch = h.architecture + (h.bitness ? ' ' + h.bitness + '-bit' : '');
        const list = h.fullVersionList || [];
        const b = list.find(x => !/Not.?A.?Brand|Chromium/i.test(x.brand)) || list[0];
        if (b) d.browser = b.brand.replace(/^Google |^Microsoft /, '') + ' ' + b.version.split('.')[0];
      } catch (e) {}
    }
    let m;
    if (!d.os) {
      if ((m = ua.match(/Android ([\d.]+)/))) d.os = 'Android ' + m[1].split('.')[0];
      else if ((m = ua.match(/(?:iPhone|CPU) OS (\d+)/))) d.os = 'iOS ' + m[1];
      else if (/Windows NT 10/.test(ua)) d.os = 'Windows 10/11';
      else if (/Mac OS X/.test(ua)) d.os = 'macOS';
      else if (/Linux/.test(ua)) d.os = 'Linux';
    }
    if (!d.browser) {
      const B = [[/Edg\/(\d+)/, 'Edge'], [/OPR\/(\d+)/, 'Opera'], [/SamsungBrowser\/(\d+)/, 'Samsung Internet'],
                 [/Firefox\/(\d+)/, 'Firefox'], [/CriOS\/(\d+)|Chrome\/(\d+)/, 'Chrome'], [/Version\/(\d+).*Safari/, 'Safari']];
      for (const [re, name] of B) if ((m = ua.match(re))) { d.browser = name + ' ' + (m[1] || m[2]); break; }
    }
    if (!d.model) {
      if (/iPhone/.test(ua)) d.model = 'iPhone';
      else if (/iPad/.test(ua)) d.model = 'iPad';
      else if ((m = ua.match(/Android [\d.]+; ([^;)]+)/)) && m[1].trim() !== 'K') d.model = m[1].replace(/ Build.*/, '').trim();
    }
    d.brand = (BRANDS.find(([re]) => re.test(d.model)) || [])[1] || '';
    try {
      const gl = document.createElement('canvas').getContext('webgl');
      const ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
      let gpu = gl ? gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) : '';
      if (/^ANGLE \(/.test(gpu)) { const parts = gpu.slice(7, -1).split(', '); gpu = parts[1] || parts[0]; }
      d.gpu = gpu.replace(/\s*\(0x[0-9a-f]+\)/i, '').replace(/\s+(Direct3D|OpenGL|Vulkan|vs_\d).*$/i, '').trim();
    } catch (e) { d.gpu = ''; }
    d.cores = navigator.hardwareConcurrency || 0;
    d.mem = navigator.deviceMemory || 0;
    d.screen = screen.width + '×' + screen.height;
    d.dpr = Math.round((window.devicePixelRatio || 1) * 100) / 100;
    const c = navigator.connection;
    d.net = c ? { type: c.type, eff: c.effectiveType, down: c.downlink } : null;
    try { const bat = navigator.getBattery && await navigator.getBattery(); if (bat) d.battery = { level: Math.round(bat.level * 100), charging: bat.charging }; } catch (e) {}
    return d;
  }

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const scrollDown = () => { log.scrollTop = log.scrollHeight; };

  // "scanning…" status line with a spinner, shown before each result
  async function scan(label) {
    const s = document.createElement('div');
    s.className = 'msg sys scan';
    s.innerHTML = '<span class="spin"></span><span></span><span class="dots"></span>';
    s.children[1].textContent = label;
    log.appendChild(s); scrollDown();
    await sleep(750 + Math.random() * 650);
    s.remove();
  }

  // pops a line in and types it out; text inside [[ ]] is highlighted
  async function typeSys(text, label) {
    if (label) await scan(label);
    const m = document.createElement('div');
    m.className = 'msg sys pop';
    log.appendChild(m);
    const parts = text.split(/(\[\[.*?\]\])/).filter(Boolean).map(p => {
      const hl = p.startsWith('[[');
      const el = document.createElement(hl ? 'b' : 'span');
      if (hl) el.className = 'hl';
      m.appendChild(el);
      return { el, chars: [...(hl ? p.slice(2, -2) : p)] };
    });
    for (const p of parts) {
      for (let i = 1; i <= p.chars.length; i++) {
        p.el.textContent = p.chars.slice(0, i).join('');
        scrollDown();
        await sleep(p.el.tagName === 'B' ? 30 : 16);   // values type a little slower
      }
    }
    await sleep(500);
    return m;
  }

  let revealing = false, clockTimer = null;
  async function reveal() {
    if (revealing) return;
    revealing = true;
    input.disabled = true; input.placeholder = 'reading your browser…';
    $('#askSuggest').hidden = true;
    const ipP = lookupIP(), devP = readDevice();

    await typeSys('here is what your browser already shared the moment you opened this site', 'connecting');

    const ip = await ipP;
    if (ip && ip.city) {
      const reg = ip.country === 'Philippines' ? phRegion(ip.region) : '';
      await typeSys(`you are currently in [[${ip.city}, ${ip.region}${reg ? ` (${reg})` : ''}]], [[${ip.country}]]`, 'locating you');
    }
    if (ip && ip.ip) await typeSys(`your public ip address is [[${ip.ip}]]${ip.isp ? `, and your internet comes from [[${ip.isp}]]` : ''}`, 'tracing your ip address');
    if (!ip) await typeSys("your network blocked the location lookup — nice, that's more private than most", 'locating you');

    const d = await devP;
    const net = d.net;
    if (net && (net.type || net.eff)) {
      const kind = net.type === 'wifi' ? 'wi-fi' : net.type === 'cellular' ? 'mobile data' : net.type && net.type !== 'unknown' ? net.type : '';
      // browsers only give a rough speed class + an estimate capped at 10 mbps (for privacy)
      const label = { 'slow-2g': 'very slow', '2g': 'slow', '3g': 'okay', '4g': 'fast' }[net.eff] || '';
      const speed = net.down ? (net.down >= 10 ? '10+ mbps' : `~${net.down} mbps`) : '';
      if (label || kind) await typeSys(`${kind ? `you're on [[${kind}]], and ` : ''}your browser rates your connection as [[${label || 'working'}]]${speed ? ` (${speed})` : ''}`, 'testing your connection');
    }
    const name = d.mobile
      ? [d.brand && !d.model.toLowerCase().startsWith(d.brand.toLowerCase()) ? d.brand : '', d.model].filter(Boolean).join(' ') || 'a phone'
      : `a ${d.os || 'computer'} ${/mac/i.test(d.os) ? 'mac' : 'pc'}`;
    await typeSys(`you're using [[${name}]]${d.mobile && d.os ? ` running [[${d.os}]]` : ''}${d.browser ? `, browsing with [[${d.browser}]]` : ''}${!d.mobile && d.arch ? ` (${d.arch})` : ''}`, 'identifying your device');

    const specs = [];
    if (d.cores) specs.push(`[[${d.cores} cpu cores]]`);
    if (d.mem) specs.push(`[[${d.mem >= 8 ? 'at least 8' : 'about ' + d.mem} gb of ram]]`);
    if (d.gpu) specs.push(`a [[${d.gpu}]] graphics chip`);
    if (specs.length) await typeSys(`it has ${specs.length > 1 ? specs.slice(0, -1).join(', ') + ' and ' + specs.slice(-1) : specs[0]}`, 'reading your hardware');
    await typeSys(`your screen is [[${d.screen}]] pixels${d.dpr !== 1 ? ` at ${d.dpr}x scaling` : ''}`, 'measuring your screen');
    // desktops without a battery report 100% + charging — skip those
    if (d.battery && !(d.battery.level === 100 && d.battery.charging && !d.mobile)) {
      await typeSys(`your battery is at [[${d.battery.level}%]]${d.battery.charging ? ' and charging' : ''}`, 'checking your battery');
    }

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const off = -new Date().getTimezoneOffset() / 60;
    const utc = 'utc' + (off >= 0 ? '+' : '') + off;
    const now = () => new Date().toLocaleString('en-US', { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' });
    const clock = await typeSys(`right now it's [[${now()}]] where you are (${tz ? tz + ', ' : ''}${utc})`, 'syncing your clock');
    clearInterval(clockTimer);
    clockTimer = setInterval(() => { const b = $('.hl', clock); if (b) b.textContent = now(); }, 1000);

    await sleep(400);
    await typeSys("relax — none of this is saved or sent to me. it's just what any website can see 🙂");
    await sleep(300);
    addMsg(log, { text: "Now, ask me anything about James 👋 — his projects, stack, certifications, experience, or whether he's open for OJT." });

    input.disabled = false; input.placeholder = 'Ask me something…';
    $('#askSuggest').hidden = false;
    scrollDown();
    input.focus();
    revealing = false;
  }

  form.addEventListener('submit', e => { e.preventDefault(); if (revealing) return; ask(input.value); input.value = ''; });
  $$('#askSuggest button').forEach(b => b.addEventListener('click', () => b.hasAttribute('data-reveal') ? reveal() : ask(b.textContent)));
  $('#ask').addEventListener('opened', () => {
    if (!log.children.length) reveal();
    else setTimeout(() => input.focus(), 50);
  });
})();

/* ================= TYPING TEST ================= */
(() => {
  const TEXTS = [
    'Clean code reads like a story where every function has one job and every name explains why it exists.',
    'I turn coffee into code and rough ideas into systems that people actually use every single day.',
    'A well designed database schema saves you from a hundred bugs you will never have to write.',
    'Ship small, test often, and always leave the codebase a little better than you found it.',
    'From QR menus to hotel bookings, every big project starts with a single line of code.',
  ];
  const box = $('#ttText'), input = $('#ttInput');
  const wpmEl = $('#ttWpm'), accEl = $('#ttAcc'), timeEl = $('#ttTime'), hint = $('#ttHint');
  let text = '', start = 0, done = false, keystrokes = 0, mistakes = 0, timer = null, ti = -1;

  function load() {
    ti = (ti + 1 + Math.floor(Math.random() * (TEXTS.length - 1))) % TEXTS.length;
    text = TEXTS[ti]; input.value = ''; start = 0; done = false; keystrokes = 0; mistakes = 0;
    clearInterval(timer);
    wpmEl.textContent = '0'; accEl.textContent = '100%'; timeEl.textContent = '0.0s';
    hint.textContent = 'Start typing to begin';
    draw();
  }
  function draw() {
    const v = input.value;
    box.innerHTML = '';
    for (let i = 0; i < text.length; i++) {
      const s = document.createElement('span');
      s.textContent = text[i];
      if (i < v.length) s.className = v[i] === text[i] ? 'ok' : 'bad';
      else if (i === v.length && !done) s.className = 'cur';
      box.appendChild(s);
    }
  }
  function stats() {
    const secs = start ? (performance.now() - start) / 1000 : 0;
    const v = input.value;
    let correct = 0; for (let i = 0; i < v.length; i++) if (v[i] === text[i]) correct++;
    const wpm = secs > 0.5 ? Math.round((correct / 5) / (secs / 60)) : 0;
    const acc = keystrokes ? Math.max(0, Math.round(((keystrokes - mistakes) / keystrokes) * 100)) : 100;
    wpmEl.textContent = wpm; accEl.textContent = acc + '%'; timeEl.textContent = secs.toFixed(1) + 's';
    return { wpm, acc };
  }
  input.addEventListener('input', e => {
    if (done) return;
    if (input.value.length > text.length) input.value = input.value.slice(0, text.length);
    if (!start) { start = performance.now(); hint.textContent = 'Go go go…'; timer = setInterval(stats, 100); }
    if (e.inputType && e.inputType.startsWith('insert')) {
      keystrokes++;
      const i = input.value.length - 1;
      if (input.value[i] !== text[i]) mistakes++;
    }
    draw();
    if (input.value === text) {
      done = true; clearInterval(timer);
      const { wpm, acc } = stats();
      const best = store.get('tt-best', 0);
      if (wpm > best) store.set('tt-best', wpm);
      hint.textContent = wpm > best ? `🏆 New best: ${wpm} WPM!` : `Done! ${wpm} WPM · ${acc}% · best ${best} WPM`;
      draw();
    }
  });
  box.addEventListener('click', () => input.focus());
  $('#ttRestart').addEventListener('click', () => { load(); input.focus(); });
  $('#typing').addEventListener('opened', () => { load(); setTimeout(() => input.focus(), 50); });
  $('#typing').addEventListener('close', () => clearInterval(timer));
})();

/* ================= COMMUNITY CHAT + VIEWER COUNT =================
   Without a server these work per-browser: messages are saved in localStorage and
   synced live between open tabs. Hook up a backend (e.g. Firebase) to make them global. */
(() => {
  const log = $('#chatLog'), form = $('#chatForm'), input = $('#chatInput'), nameIn = $('#chatName');
  const KEY = 'community-chat';
  const bc = 'BroadcastChannel' in window ? new BroadcastChannel('jr-portfolio') : null;
  nameIn.value = store.get('chat-name', '');

  const fmt = t => new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  function renderAll() {
    log.innerHTML = '';
    addMsg(log, { who: 'James', text: "Welcome to the community chat! 👋 Leave a message, say hi, or drop a suggestion." });
    store.get(KEY, []).forEach(m => addMsg(log, { who: m.name, text: m.text, when: fmt(m.t), me: m.mine }));
  }
  form.addEventListener('submit', e => {
    e.preventDefault();
    const text = input.value.trim(); if (!text) return;
    const name = nameIn.value.trim() || 'Guest';
    store.set('chat-name', nameIn.value.trim());
    const msg = { name, text, t: Date.now() };
    const all = store.get(KEY, []); all.push({ ...msg, mine: true }); store.set(KEY, all.slice(-100));
    addMsg(log, { who: name, text, when: fmt(msg.t), me: true });
    if (bc) bc.postMessage({ type: 'chat' });
    input.value = '';
  });
  $('#chat').addEventListener('opened', () => { renderAll(); setTimeout(() => input.focus(), 50); });

  // presence: count open tabs of this page
  const me = Math.random().toString(36).slice(2), seen = new Map();
  const countEl = $('#viewerCount'), labelEl = $('#viewerLabel');
  function updateCount() {
    const now = Date.now();
    for (const [id, t] of seen) if (now - t > 5000) seen.delete(id);
    const n = 1 + seen.size;
    countEl.textContent = n;
    labelEl.textContent = n === 1 ? 'person viewing now' : 'people viewing now';
    $('#viewers').dataset.label = n + ' ' + labelEl.textContent;
  }
  if (bc) {
    bc.onmessage = ({ data }) => {
      if (data.type === 'ping' && data.id !== me) { seen.set(data.id, Date.now()); updateCount(); }
      if (data.type === 'bye') { seen.delete(data.id); updateCount(); }
      if (data.type === 'chat' && $('#chat').open) renderAll();
    };
    const ping = () => bc.postMessage({ type: 'ping', id: me });
    ping(); setInterval(() => { ping(); updateCount(); }, 2000);
    window.addEventListener('pagehide', () => bc.postMessage({ type: 'bye', id: me }));
  }
  updateCount();
})();

/* ================= GUIDE CURSOR (auto tour) =================
   A pixel-art cursor that explains the page. On load it plays a full tour:
   it introduces the top of the page, then scrolls through every section.
   The moment the visitor scrolls / clicks / types themselves, the tour stops
   auto-scrolling and the cursor just follows whatever section they're reading. */
(() => {
  const DESKTOP = () => innerWidth > 900;
  const STEPS = [
    { sel: '.intro h1', ax: 1, ay: 0.55, dx: 10, text: "Hey, I'm James 👋 Let me show you around." },
    // ---- dock walkthrough ----
    { sel: ['.dk-sec', '#dkMenu'], ax: 0.5, ay: 0.3, quick: true, text: 'This is my dock — jump to any section from here: about, projects, experience, stack and certifications.' },
    { sel: '.dock [data-open="ask"]', ax: 0.5, ay: 0.3, quick: true, text: 'Ask me anything — it also shows what your browser reveals about you 👀' },
    { sel: '.dock [data-open="typing"]', ax: 0.5, ay: 0.3, quick: true, text: 'Think you type faster than me? Try the typing test ⌨️' },
    { sel: '#tourBtn', ax: 0.5, ay: 0.3, quick: true, text: 'Missed something? Tap here to replay this tour anytime.' },
    { sel: '.dock [data-open="chat"]', ax: 0.5, ay: 0.3, quick: true, text: 'Leave me a message or say hi in the community chat 💬' },
    { sel: '#themeBtn', ax: 0.5, ay: 0.3, quick: true, text: 'Switch between system, light and dark mode 🌗' },
    { sel: '#viewers', ax: 0.5, ay: 0.3, quick: true, text: "The live dot shows how many people are on my site right now 👋" },
    { sel: '#photo', ax: 0.72, ay: 0.62, text: "Move your mouse anywhere — my eyes follow you 👀 Click my face and I'll blink." },
    { sel: '.intro .now', ax: 1, ay: 0.5, dx: 4, text: "I'm a 4th-year BSIT student at UCLM, working toward becoming a full-stack developer." },
    { sel: '.si-bar', ax: 0.55, ay: 0.5, text: 'A quick system check on me — school, year, projects, what I am learning, and my status.' },
    { sel: '#about .block-head', ax: 0.25, ay: 0.5, scroll: '#about', text: "Here's my story — where I study, what I'm learning, and what I'm aiming for." },
    { sel: '.plist', ax: 0.7, ay: 0.3, scroll: '#projects', text: 'Four projects so far — pick one from the list and watch a mini demo of it play in the window 🖥️' },
    { sel: '#experience .block-head', ax: 0.34, ay: 0.5, scroll: '#experience', text: 'My journey — from interlinking & design work at Blueberry Digital Labs in senior high to building full-stack projects at UCLM.' },
    { sel: '#stack .block-head', ax: 0.22, ay: 0.5, scroll: '#stack', text: "Tools I use — the ones tagged 'learning' are what I'm leveling up in right now." },
    { sel: '#certifications .block-head', ax: 0.4, ay: 0.5, scroll: '#certifications', text: 'My certificates — hover one to develop it in color, click to see it full size 🎞️' },
    { sel: '.foot', ax: 0.62, ay: 0.2, scroll: 'bottom', text: 'Looking for an OJT intern? Email me or say hi in the community chat 📬' },
    { sel: '.intro h1', ax: 1, ay: 0.55, dx: 10, scroll: 'top', text: "That's the tour! Tap the guided tour button in the dock to replay it. Thanks for visiting 🙌" },
  ];
  // steps used when the visitor is scrolling on their own
  const FOLLOW = STEPS.filter(s => s.scroll && s.scroll !== 'top');

  // pixel arrow: X = outline, # = fill
  const MAP = [
    'X..........', 'XX.........', 'X#X........', 'X##X.......', 'X###X......', 'X####X.....',
    'X#####X....', 'X######X...', 'X#######X..', 'X########X.', 'X#####XXXXX', 'X##X##X....',
    'X#X.X##X...', 'XX...X##X..', 'X....X##X..', '......X##X.', '.......XX..',
  ];
  let rects = '';
  MAP.forEach((row, y) => [...row].forEach((c, x) => {
    if (c !== '.') rects += `<rect x="${x}" y="${y}" width="1" height="1" class="${c === 'X' ? 'o' : 'f'}"/>`;
  }));

  const g = document.createElement('div');
  g.className = 'guide';
  g.innerHTML = `
    <svg class="g-cursor" viewBox="0 0 11 17" width="17" height="26" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>
    <span class="g-ring" aria-hidden="true"></span>
    <div class="g-bubble" role="status" aria-live="polite">
      <div class="g-head"><span>~/james <b class="g-count"></b></span><button class="g-x" aria-label="Hide guide">✕</button></div>
      <p class="g-text"></p>
    </div>`;
  document.body.appendChild(g);
  const cur = $('.g-cursor', g), ring = $('.g-ring', g), bubble = $('.g-bubble', g);
  const textEl = $('.g-text', g), countEl = $('.g-count', g);

  // ✕ hides the guide for this visit only — it comes back on the next refresh
  let off = (() => { try { return sessionStorage.getItem('guide-off') === '1'; } catch (e) { return false; } })();
  try { localStorage.removeItem('guide-off'); } catch (e) {}
  let mode = 'tour';            // 'tour' = auto-playing, 'follow' = visitor is in control
  let step = null, idx = 0, tourTimer = null, typeTimer = null, autoScrolling = false;
  let pos = [innerWidth * 0.6, -40], arrived = false;

  const visibleSteps = () => STEPS.filter(s => !s.desktop || DESKTOP());

  // sel can be a list — the first one that's actually visible wins (e.g. dock icons vs. ☰ on phones)
  function point(s) {
    for (const sel of [].concat(s.sel)) {
      const el = $(sel);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height) continue;
      return [r.left + r.width * s.ax + (s.dx || 0), r.top + r.height * s.ay + (s.dy || 0)];
    }
    return null;
  }

  function show(s) {
    if (s === step) return;
    step = s; arrived = false;
    clearInterval(typeTimer);
    const list = visibleSteps();
    countEl.textContent = String(list.indexOf(s) + 1).padStart(2, '0') + '/' + String(list.length).padStart(2, '0');
    let i = 0;
    const chars = [...s.text];
    textEl.textContent = '';
    textEl.classList.add('typing');
    typeTimer = setInterval(() => {
      textEl.textContent = chars.slice(0, ++i).join('');
      if (i >= chars.length) { clearInterval(typeTimer); textEl.classList.remove('typing'); }
    }, 22);
  }

  function smoothTo(top) {
    autoScrolling = true;
    window.scrollTo({ top, behavior: 'smooth' });
    clearTimeout(smoothTo.t);
    smoothTo.t = setTimeout(() => { autoScrolling = false; }, 1200);
  }

  function scrollFor(s) {
    if (!s.scroll) return false;
    let top;
    if (s.scroll === 'top') top = 0;
    else if (s.scroll === 'bottom') top = document.documentElement.scrollHeight;
    else { const el = $(s.scroll); if (!el) return false; top = el.getBoundingClientRect().top + scrollY - 90; }
    smoothTo(top);
    return true;
  }

  function nextStep() {
    clearTimeout(tourTimer);
    const list = visibleSteps();
    if (idx >= list.length) { mode = 'follow'; return; }
    const s = list[idx++];
    const scrolled = scrollFor(s);
    // let the page glide into place before the cursor starts talking
    tourTimer = setTimeout(() => {
      if (mode !== 'tour') return;
      show(s);
      tourTimer = setTimeout(nextStep, (s.quick ? 1100 : 1700) + s.text.length * (s.quick ? 35 : 45));
    }, scrolled ? 750 : 0);
  }

  function follow() {
    let best = null;
    FOLLOW.forEach(s => {
      const el = $(s.sel); if (!el) return;
      if (el.getBoundingClientRect().top < innerHeight * 0.6) best = s;
    });
    show(best || STEPS[1]);   // back at the top -> eyes hint
  }

  // visitor takes over -> stop auto-scrolling, just follow along
  const takeOver = () => {
    if (mode !== 'tour' || off) return;
    mode = 'follow'; clearTimeout(tourTimer);
    follow();
  };
  ['wheel', 'touchmove'].forEach(ev => addEventListener(ev, takeOver, { passive: true }));
  addEventListener('keydown', e => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(e.key)) takeOver();
  });
  addEventListener('pointerdown', e => { if (!g.contains(e.target) && !e.target.closest('#tourBtn')) takeOver(); });
  addEventListener('scroll', () => { if (!off && mode === 'follow' && !autoScrolling) follow(); }, { passive: true });

  let lastT = 0, lastFollow = 0;
  function frame(t) {
    const dt = Math.min(100, t - (lastT || t)); lastT = t;
    if (!off && mode === 'follow' && !autoScrolling && t - lastFollow > 400) { lastFollow = t; follow(); }
    if (!off && step) {
      const p = point(step);
      if (p) {
        const tx = Math.min(innerWidth - 24, Math.max(8, p[0])) + Math.sin(t / 700) * 1.5;
        const ty = Math.min(innerHeight - 30, Math.max(8, p[1])) + Math.cos(t / 900) * 1.5;
        const k = 1 - Math.exp(-dt / 140);   // frame-rate independent glide
        pos[0] += (tx - pos[0]) * k;
        pos[1] += (ty - pos[1]) * k;
        if (!arrived && Math.hypot(tx - pos[0], ty - pos[1]) < 3) {
          arrived = true;
          ring.classList.remove('tap'); void ring.offsetWidth; ring.classList.add('tap');
        }
      }
      cur.style.transform = `translate(${pos[0]}px, ${pos[1]}px)`;
      ring.style.transform = `translate(${pos[0] - 9}px, ${pos[1] - 9}px)`;
      const bw = bubble.offsetWidth, bh = bubble.offsetHeight;
      let bx = pos[0] + 20, by = pos[1] + 24;
      if (bx + bw > innerWidth - 12) bx = pos[0] - bw - 8;
      if (by + bh > innerHeight - 12) by = pos[1] - bh - 10;
      bubble.style.transform = `translate(${Math.max(12, bx)}px, ${Math.max(12, by)}px)`;
    }
    requestAnimationFrame(frame);
  }

  function setOff(v) {
    off = v; try { sessionStorage.setItem('guide-off', v ? '1' : '0'); } catch (e) {}
    g.classList.toggle('hidden', v);
    clearTimeout(tourTimer); clearInterval(typeTimer);
  }
  function startTour() {
    setOff(false);
    step = null; idx = 0; mode = 'tour';
    const atTop = scrollY < 10;
    if (!atTop) smoothTo(0);
    tourTimer = setTimeout(nextStep, atTop ? 0 : 800);
  }

  $('.g-x', g).addEventListener('click', () => setOff(true));
  $('#tourBtn').addEventListener('click', startTour);

  g.classList.toggle('hidden', off);
  requestAnimationFrame(frame);
  if (!off) setTimeout(startTour, 700);
})();

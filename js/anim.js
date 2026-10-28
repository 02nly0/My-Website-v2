(() => {
  const doc = document.documentElement;
  const hero = document.querySelector('[data-hero]');
  const sub = document.querySelector('[data-sub]');
  const icons = [...document.querySelectorAll('[data-icon]')];
  const aboutItems = [...document.querySelectorAll('.about [data-m]')];
  const footer = document.querySelector('[data-footer]');
  const tabs = [...document.querySelectorAll('[data-tab]')];
  const panels = [...document.querySelectorAll('[data-panel]')];
  let current = 0;
  const panelItems = (i) => [...panels[i].querySelectorAll('.entries > li')];

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EASE = 'cubic-bezier(.2,.65,.3,.9)';

  /* =====================================================
     OTHER ELEMENTS (everything except the 0nly0 hero)
     All times in milliseconds. They start the moment
     the hero finishes.
     ===================================================== */
  const OTHERS = {
    // WHEN each group appears, measured on the 0nly0 animation itself:
    //   0 = the moment it starts,  1 = the moment it reaches its final font.
    //   0.98 ≈ the instant it visually lands (default)
    //   lower  = appears while 0nly0 is still finishing
    //   1      = right when it reaches the end
    appear: {
      sub: 0.98,     // "ot9h"
      icons: 0.98,   // GitHub / Instagram
      about: 0.98,   // paragraph
      footer: 0.98,  // footer
      tabs: 0.98,    // projects / work tabs
      panel: 0.98    // entries under the tabs
    },
    // gap between items of the same group (ms)
    gap: { icons: 60, about: 60, letters: 50, tabs: 60, panel: 80 },

    // HOW FAST each one animates once it has appeared: ms per fade.
    speed: {
      sub: 600,      // each "ot9h" letter
      icons: 700,
      about: 700,
      footer: 700,
      tabs: 700,
      panel: 700
    },

    // look of the motion
    ease: EASE,
    rise: 8,         // px travelled upward
    blur: 4          // px of starting blur
  };

  // Hero typeface steps (last one = final site font) and matching scale.
  const STEPS = [
    { f: 'Redaction 50', w: 700 },
    { f: 'Redaction 10', w: 400 },
    { f: 'Redaction 70', w: 700 },
    { f: 'Redaction', w: 400 },
    { f: 'Redaction 35', w: 700 },
    { f: 'Redaction 100', w: 400 },
    { f: 'Redaction 20', w: 400 },
    null
  ];
  const SIZES = [30, 20, 10, 8, 6.5, 4.5, 3, 1];
  const LAST = STEPS.length - 1;
  const MIN_PX = 24;

  let revealed = false;
  let currentStep = -1;

  const clamp = (n, lo, hi) => Math.max(lo, Math.min(n, hi));

  /* ---------- Fade-in helper ---------- */
  const enter = (el, duration = 700) => {
    if (reduce) {
      el.removeAttribute('data-m');
      return;
    }
    const anim = el.animate(
      [
        { opacity: 0, transform: `translateY(${OTHERS.rise}px)`, filter: `blur(${OTHERS.blur}px)` },
        { opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' }
      ],
      { duration, easing: OTHERS.ease, fill: 'both' }
    );
    anim.onfinish = () => {
      el.removeAttribute('data-m');
      anim.cancel();
    };
  };

  /* ---------- Letter-by-letter reveal ---------- */
  const prepLetters = (el) => {
    const words = [];
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    [...el.childNodes].forEach((node) => {
      if (node.nodeType !== Node.TEXT_NODE) return;
      const parts = node.textContent.split(/\s+/).filter(Boolean);
      if (!parts.length) return;
      const frag = document.createDocumentFragment();
      parts.forEach((word) => {
        const w = document.createElement('span');
        w.className = 'rw'
        w.setAttribute('aria-hidden', 'true');
        words.push(
          [...word].map((ch) => {
            const c = document.createElement('span');
            c.className = 'rc';
            c.textContent = ch;
            w.appendChild(c);
            return c;
          })
        );
        frag.appendChild(w);
      });
      node.replaceWith(frag);
    });
    el._words = words;
  };

  const playLetters = (el) => {
    el.removeAttribute('data-m');
    if (reduce || !el._words) return;
    el._words.forEach((chars, wi) => {
      chars.forEach((c, i) => {
        const anim = c.animate(
          [
            { opacity: 0, transform: `translateY(${OTHERS.rise}px)` },
            { opacity: 1, transform: 'translateY(0)' }
          ],
          {
            duration: OTHERS.speed.sub,
            delay: OTHERS.gap.letters * wi + OTHERS.gap.letters * i,
            easing: OTHERS.ease,
            fill: 'both'
          }
        );
        anim.onfinish = () => anim.cancel();
      });
    });
  };  

/* ---------- Hero ---------- */
  const textWidth = (el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    return range.getBoundingClientRect().width;
  };

  const setFont = (i) => {
    const step = STEPS[i];
    if (step) {
      hero.style.setProperty('font-family', `"${step.f}"`, 'important');
      hero.style.setProperty('font-weight', String(step.w), 'important');
    } else {
      hero.removeAttribute('data-hero');
      hero.style.removeProperty('font-family');
      hero.style.removeProperty('font-weight');
    }
  };

  const applyHero = (e) => {
    const i = clamp(Math.round(e), 0, LAST);
    if (i !== currentStep) {
      currentStep = i;
      setFont(i);
    }
    const ec = clamp(e, 0, LAST);
    const lo = Math.floor(ec);
    const hi = Math.min(lo + 1, LAST);
    const r = SIZES[lo] + (SIZES[hi] - SIZES[lo]) * (ec - lo);
    let px = Math.max(r * 4.8, Math.min(r * 16, 2.8 * r * (innerWidth / 100)));
    px = Math.max(px, MIN_PX);
    hero.style.setProperty('font-size', px + 'px', 'important');

    // Never let the hero overflow the viewport.
    if (px > MIN_PX + 1) {
      const avail = innerWidth - hero.getBoundingClientRect().left - 24;
      const w = textWidth(hero);
      if (w > avail && w > 0) {
        hero.style.setProperty('font-size', Math.max(MIN_PX, px * (avail / w)) + 'px', 'important');
      }
    }
  };

  const finishHero = () => {
    hero.removeAttribute('data-hero');
    hero.style.removeProperty('font-family');
    hero.style.removeProperty('font-weight');
    hero.style.removeProperty('font-size');
  };

  /* ---------- Sequence ---------- */
  const fired = { sub: false, icons: false, about: false, tabs: false, panel: false, footer: false };
  const groups = {
    sub: () => sub && playLetters(sub),
    icons: () => icons.forEach((el, i) =>
      setTimeout(() => enter(el, OTHERS.speed.icons), OTHERS.gap.icons * i)),
    about: () => aboutItems.forEach((el, i) =>
      setTimeout(() => enter(el, OTHERS.speed.about), OTHERS.gap.about * i)),
    tabs: () => tabs.forEach((el, i) =>
      setTimeout(() => enter(el, OTHERS.speed.tabs), OTHERS.gap.tabs * i)),
    panel: () => panelItems(current).forEach((el, i) =>
      setTimeout(() => enter(el, OTHERS.speed.panel), OTHERS.gap.panel * i)),
    footer: () => footer && enter(footer, OTHERS.speed.footer)
  };

  // Fires every group whose "appear" point has been reached by the hero.
  const reveal = (progress = 1) => {
    doc.classList.remove('intro-lock');
    Object.keys(groups).forEach((g) => {
      if (!fired[g] && progress >= OTHERS.appear[g]) {
        fired[g] = true;
        groups[g]();
      }
    });
    revealed = Object.values(fired).every(Boolean);
  };

  // Spring simulation driving the hero through STEPS.
  const runHero = () => {
    const k = 30; // stiffness
    const c = 15; // damping
    const m = 3; // mass
    let x = 0;
    let v = 0;
    let last = performance.now();

    applyHero(0);
    doc.classList.add('ready');

    const frame = (t) => {
      const dt = Math.min((t - last) / 1000, 0.05);
      last = t;
      const n = Math.max(1, Math.ceil(dt / (1 / 240)));
      const h = dt / n;
      for (let i = 0; i < n; i++) {
        v += ((-k * (x - LAST) - c * v) / m) * h;
        x += v * h;
      }
      applyHero(x);
      reveal(x / LAST);
      if (Math.abs(v) < 0.05 && Math.abs(x - LAST) < 0.01) {
        finishHero();
        reveal(Infinity);
        return;
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };

  const start = () => {
    if (reduce || !hero) {
      if (hero) finishHero();
      doc.classList.remove('intro-lock');
      doc.classList.add('ready');
      revealed = true;
      document.querySelectorAll('[data-m]').forEach((el) => el.removeAttribute('data-m'));
      return;
    }
    runHero();
  };

  /* ---------- Tabs (projects / work) ---------- */
  const show = (i) => {
    if (i === current || !panels[i]) return;
    current = i;
    tabs.forEach((a, n) => {
      if (n === i) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    panels.forEach((p, n) => { p.hidden = n !== i; });
    panelItems(i).forEach((el, n) => {
      el.setAttribute('data-m', '');
      if (reduce) el.removeAttribute('data-m');
      else setTimeout(() => enter(el, OTHERS.speed.panel), OTHERS.gap.panel * n);
    });
  };
  tabs.forEach((a, i) => a.addEventListener('click', (e) => { e.preventDefault(); show(i); }));

  // Sliding hover pill behind the entries.
  const makePill = (ul) => {
    ul.classList.add('pillable');
    const el = document.createElement('div');
    el.className = 'pill';
    ul.prepend(el);
    const keys = ['x', 'y', 'w', 'h'];
    const s = { x: 0, y: 0, w: 0, h: 0 };
    const v = { x: 0, y: 0, w: 0, h: 0 };
    const t = { x: 0, y: 0, w: 0, h: 0 };
    let shown = false, raf = 0, last = 0;
    const paint = () => {
      el.style.width = s.w + 'px';
      el.style.height = s.h + 'px';
      el.style.transform = `translate(${s.x}px,${s.y}px)`;
    };
    const step = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const n = Math.max(1, Math.ceil(dt / (1 / 240)));
      const h = dt / n;
      let moving = false;
      for (let i = 0; i < n; i++) {
        keys.forEach((k) => {
          v[k] += (-400 * (s[k] - t[k]) - 30 * v[k]) * h;
          s[k] += v[k] * h;
        });
      }
      keys.forEach((k) => {
        if (Math.abs(v[k]) > 0.05 || Math.abs(s[k] - t[k]) > 0.05) moving = true;
      });
      if (!moving) keys.forEach((k) => { s[k] = t[k]; v[k] = 0; });
      paint();
      raf = moving ? requestAnimationFrame(step) : 0;
    };
    const to = (a) => {
      const ur = ul.getBoundingClientRect();
      const r = a.getBoundingClientRect();
      t.x = r.left - ur.left; t.y = r.top - ur.top; t.w = r.width; t.h = r.height;
      if (!shown) {
        keys.forEach((k) => { s[k] = t[k]; v[k] = 0; });
        paint();
        shown = true;
        el.style.opacity = '1';
        return;
      }
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); }
    };
    ul.addEventListener('mouseover', (e) => {
      const a = e.target.closest('a');
      if (a && ul.contains(a)) to(a);
    });
    ul.addEventListener('mouseleave', () => { shown = false; el.style.opacity = '0'; });
  };
  document.querySelectorAll('.entries').forEach(makePill);

  if (sub) prepLetters(sub);

  // Wait (max 1.5s) for the intro fonts so the animation doesn't start with a fallback face.
  const loads = STEPS.filter(Boolean).map((s) => document.fonts.load(`${s.w} 32px "${s.f}"`, '0nly0'));
  Promise.race([Promise.all(loads), new Promise((resolve) => setTimeout(resolve, 1500))]).then(start, start);
})();

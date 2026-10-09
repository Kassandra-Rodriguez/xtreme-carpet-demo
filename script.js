(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── EN / ES toggle: swap text nodes from data-en / data-es ── */
  const toggle = document.getElementById('langToggle');
  const nodes = [...document.querySelectorAll('[data-en]')];
  function applyLang(lang){
    document.documentElement.lang = lang;
    nodes.forEach(el => {
      const txt = el.getAttribute('data-' + lang);
      if (txt == null) return;
      const t = [...el.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
      if (t) t.textContent = txt; else if (!el.children.length) el.textContent = txt;
    });
    toggle.setAttribute('aria-label', lang === 'es' ? 'Switch to English' : 'Cambiar a español');
    try { localStorage.setItem('xtreme-lang', lang); } catch(e){}
  }
  toggle.addEventListener('click', () => applyLang(document.documentElement.lang === 'es' ? 'en' : 'es'));
  try { if (localStorage.getItem('xtreme-lang') === 'es') applyLang('es'); } catch(e){}

  /* ── scroll reveal ── */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: .12, rootMargin: '0px 0px -6% 0px' }) : null;
  document.querySelectorAll('.reveal').forEach(el => io ? io.observe(el) : el.classList.add('in'));

  /* ── parallax: floating cut-outs drift at their own speed ── */
  const movers = [...document.querySelectorAll('[data-speed]')];
  const hero = document.getElementById('hero');
  let ticking = false;
  function paint(){
    ticking = false;
    const y = Math.min(window.scrollY, hero.offsetHeight + 200);
    movers.forEach(el => {
      const s = parseFloat(el.dataset.speed);
      el.style.transform = `translate3d(0, ${(-y * s).toFixed(1)}px, 0)`;
    });
  }
  if (!reduce){
    addEventListener('scroll', () => { if (!ticking){ ticking = true; requestAnimationFrame(paint); } }, { passive: true });
    paint();
  }

  /* ── desktop work carousel (autoplay, arrows, dots, drag) ── */
  const carousel = document.getElementById('workCarousel');
  if (carousel){
    const viewport = document.getElementById('carouselViewport');
    const track = document.getElementById('carouselTrack');
    const dotsWrap = document.getElementById('carouselDots');
    const slides = [...track.children];
    const count = slides.length;
    let index = 0, timer = null;
    const dots = slides.map((_, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role','tab'); b.setAttribute('aria-label','Photo ' + (i + 1));
      b.addEventListener('click', () => go(i, true));
      dotsWrap.appendChild(b);
      return b;
    });
    function render(){
      track.style.transform = 'translateX(' + (-index * 100) + '%)';
      dots.forEach((d, i) => d.setAttribute('aria-selected', i === index ? 'true' : 'false'));
    }
    function go(i, user){ index = (i + count) % count; render(); if (user) restart(); }
    function start(){ if (reduce || timer) return; timer = setInterval(() => go(index + 1), 4800); }
    function stop(){ clearInterval(timer); timer = null; }
    function restart(){ stop(); start(); }
    carousel.querySelector('.carousel-next').addEventListener('click', () => go(index + 1, true));
    carousel.querySelector('.carousel-prev').addEventListener('click', () => go(index - 1, true));
    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', start);
    carousel.addEventListener('focusin', stop);
    carousel.addEventListener('focusout', start);
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
    carousel.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight'){ go(index + 1, true); e.preventDefault(); }
      else if (e.key === 'ArrowLeft'){ go(index - 1, true); e.preventDefault(); }
    });
    let x0 = 0, dragging = false;
    viewport.addEventListener('pointerdown', e => { dragging = true; x0 = e.clientX; stop(); track.classList.add('no-anim'); viewport.classList.add('is-grabbing'); try { viewport.setPointerCapture(e.pointerId); } catch(_){} });
    viewport.addEventListener('pointermove', e => { if (!dragging) return; const dx = (e.clientX - x0) / viewport.offsetWidth * 100; track.style.transform = 'translateX(' + (-index * 100 + dx) + '%)'; });
    function endDrag(e){
      if (!dragging) return; dragging = false;
      track.classList.remove('no-anim'); viewport.classList.remove('is-grabbing');
      const dx = e.clientX - x0;
      if (dx <= -45) go(index + 1, true); else if (dx >= 45) go(index - 1, true); else { render(); start(); }
    }
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    render(); start();
  }

  /* ── mobile menu ── */
  const menuBtn = document.getElementById('menuBtn'), mnav = document.getElementById('mobileNav');
  function setMenu(open){
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mnav.classList.toggle('open', open);
  }
  menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  mnav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  document.addEventListener('click', e => { if (!e.target.closest('.site-header')) setMenu(false); });
  matchMedia('(min-width:981px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

  /* ── reviews: duplicate cards so the phone marquee loops seamlessly ── */
  const grid = document.getElementById('reviewGrid');
  [...grid.children].forEach(card => {
    const c = card.cloneNode(true);
    c.classList.remove('reveal'); c.classList.add('in', 'review-clone'); c.setAttribute('aria-hidden', 'true');
    grid.appendChild(c);
  });

  /* ── quote form: validate, then show a demo confirmation ── */
  const form = document.getElementById('quoteForm'), msg = document.getElementById('formMsg');
  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    form.querySelectorAll('[required]').forEach(f => {
      const bad = !f.value.trim(); f.classList.toggle('invalid', bad); if (bad) ok = false;
    });
    const es = document.documentElement.lang === 'es';
    msg.style.color = ok ? '' : '#c0392b';
    msg.textContent = ok
      ? (es ? 'Gracias. (Demo: el formulario no envía todavía.)' : 'Thanks! (Demo: this form doesn’t send yet.)')
      : (es ? 'Completa los campos marcados.' : 'Please fill in the highlighted fields.');
    if (ok) form.reset();
  });
  form.addEventListener('input', e => e.target.classList.remove('invalid'));
})();

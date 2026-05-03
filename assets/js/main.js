/* ============================================================
   KARINA PETELIN — main.js
   Mayo 2026 · jArismendi®
   ============================================================ */

(function () {
  'use strict';

  /* ── NAVBAR: opaco al scroll ─────────────────────────── */
  const nav = document.getElementById('main-nav');

  function handleNavScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 80);
  }

  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();

  /* ── HAMBURGER / MOBILE OVERLAY ──────────────────────── */
  const hamburger = document.getElementById('nav-hamburger');
  const overlay   = document.getElementById('nav-overlay');
  const closeBtn  = document.getElementById('nav-close');
  const overlayLinks = overlay ? overlay.querySelectorAll('.nav-overlay-link, .nav-overlay-actions a') : [];

  function openMenu() {
    hamburger.classList.add('open');
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    hamburger.classList.remove('open');
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (hamburger) hamburger.addEventListener('click', openMenu);
  if (closeBtn)  closeBtn.addEventListener('click', closeMenu);

  overlayLinks.forEach(link => link.addEventListener('click', closeMenu));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeMenu();
  });

  /* ── HERO CARRUSEL ───────────────────────────────────── */
  const slides    = document.querySelectorAll('.hero-slide');
  const dots      = document.querySelectorAll('.hero-dot');
  let   current   = 0;
  let   autoTimer = null;

  function goToSlide(index) {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    dots[current].setAttribute('aria-selected', 'false');

    current = (index + slides.length) % slides.length;

    slides[current].classList.add('active');
    dots[current].classList.add('active');
    dots[current].setAttribute('aria-selected', 'true');
  }

  function startAuto() {
    autoTimer = setInterval(() => goToSlide(current + 1), 5000);
  }

  function stopAuto() {
    clearInterval(autoTimer);
  }

  if (slides.length > 1) {
    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        stopAuto();
        goToSlide(i);
        startAuto();
      });
    });

    const heroEl = document.getElementById('hero');
    if (heroEl) {
      heroEl.addEventListener('mouseenter', stopAuto);
      heroEl.addEventListener('mouseleave', startAuto);
    }

    startAuto();
  }

  /* ── REVEAL ON SCROLL ────────────────────────────────── */
  const revealEls = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => revealObserver.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('revealed'));
  }

  /* ── SCROLL TO TOP ───────────────────────────────────── */
  const scrollTopBtn = document.getElementById('scroll-top');

  if (scrollTopBtn) {
    window.addEventListener('scroll', () => {
      scrollTopBtn.classList.toggle('visible', window.scrollY > 500);
    }, { passive: true });

    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── WHATSAPP TOOLTIP ───────────────────────────────── */
  const waBtn = document.querySelector('.whatsapp-float');

  if (waBtn) {
    const waTooltip = document.createElement('div');
    waTooltip.className = 'wa-tooltip';
    waTooltip.textContent = 'Hablemos por WApp';
    document.body.appendChild(waTooltip);

    waBtn.addEventListener('mouseenter', () => waTooltip.classList.add('visible'));
    waBtn.addEventListener('mouseleave', () => waTooltip.classList.remove('visible'));
  }

  /* ── SMOOTH SCROLL para links internos ───────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

})();

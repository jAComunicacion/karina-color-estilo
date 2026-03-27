/* ═══════════════════════════════════════════════
   KARINA PETELÍN — main.js
   Micro-interacciones y lógica de UI
════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── 1. SIDENAV — hamburger toggle ── */
  const sidenav = document.getElementById('sidenav');
  const hamburger = document.getElementById('navHamburger');
  const overlay = document.getElementById('navOverlay');
  // Nav siempre transparente — sin cambio de fondo al scrollear (cerini style)

  function openNav() {
    sidenav.classList.remove('hidden'); // Remover oculto
    sidenav.classList.add('open'); // Agregar visible
    hamburger.classList.add('open');
    overlay.classList.add('show');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeNav() {
    sidenav.classList.add('hidden'); // Volver a ocultar
    sidenav.classList.remove('open'); // Remover visible
    hamburger.classList.remove('open');
    overlay.classList.remove('show');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', () => {
    sidenav.classList.contains('open') ? closeNav() : openNav();
  });
  overlay.addEventListener('click', closeNav);

  // Cerrar nav al hacer click en cualquier link del sidenav (mobile)
  sidenav.querySelectorAll('a, button.btn-ingresar').forEach(el => {
    el.addEventListener('click', () => {
      if (window.innerWidth < 992) closeNav();
    });
  });


  /* ── 2. NAV ACTIVE STATE — resaltar sección activa ── */
  const navLinks = document.querySelectorAll('.nav-item-link');
  const sections = document.querySelectorAll('section[id]');

  function setActiveNav() {
    let current = '';
    sections.forEach(sec => {
      const top = sec.getBoundingClientRect().top;
      if (top <= window.innerHeight * 0.4) current = sec.id;
    });
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', setActiveNav, { passive: true });
  setActiveNav();


  /* ── 3. HERO CAROUSEL ── */
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.hero-dot');
  let current = 0;

  function goToSlide(n) {
    // Pausar todos los videos excepto el que vamos a activar
    slides.forEach((slide, idx) => {
      const video = slide.querySelector('video');
      if (video && idx !== n) {
        video.pause();
        video.currentTime = 0;
      }
    });

    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    dots[current].setAttribute('aria-selected', 'false');

    current = (n + slides.length) % slides.length;

    slides[current].classList.add('active');
    dots[current].classList.add('active');
    dots[current].setAttribute('aria-selected', 'true');

    // Reproducir SOLO el video del slide activo
    const activeVideo = slides[current].querySelector('video');
    if (activeVideo) {
      activeVideo.currentTime = 0;
      activeVideo.play().catch(() => { });
    }
  }

  function nextSlide() { goToSlide(current + 1); }

  // Avanzar al siguiente video al terminar el actual (loop continuo)
  slides.forEach((slide) => {
    const video = slide.querySelector('video');
    if (video) {
      video.addEventListener('ended', nextSlide);
    }
  });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      goToSlide(i);
    });
  });


  /* ── 4. SCROLL REVEAL ── */
  const reveals = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  reveals.forEach((el, i) => {
    // Staggered delay para elementos dentro de grids
    const parent = el.parentElement;
    if (parent) {
      const siblings = Array.from(parent.querySelectorAll('.reveal'));
      const idx = siblings.indexOf(el);
      if (idx > 0) {
        el.style.transitionDelay = `${idx * 0.1}s`;
      }
    }
    revealObserver.observe(el);
  });

  // Hero — reveal inmediato al cargar
  window.addEventListener('load', () => {
    document.querySelectorAll('#hero .hero-eyebrow, #hero .hero-title, #hero .hero-actions').forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity .8s ease, transform .8s ease';
      el.style.transitionDelay = `${0.2 + i * 0.18}s`;
      setTimeout(() => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      }, 50);
    });
  });


  /* ── 5. ACORDION DE PREGUNTAS FRECUENTES ── */
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');

      // Cerrar todos
      document.querySelectorAll('.faq-item.open').forEach(el => {
        el.classList.remove('open');
        el.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
      });

      // Abrir el clickar si estaba cerrado
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });


  /* ── 6. SCROLL SUAVE para links internos ── */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = window.innerWidth >= 992 ? 0 : 0;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });


  /* ── 7. SCROLL TO TOP ── */
  const scrollTopBtn = document.getElementById('scrollTop');
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }


  /* ── 8. BTN INGRESAR — placeholder (funcionalidad futura) ── */
  document.querySelectorAll('#btnIngresar, #btnIngresarEscuela').forEach(btn => {
    btn.addEventListener('click', () => {
      // Funcionalidad pendiente — por ahora solo feedback visual
      btn.textContent = 'PRÓXIMAMENTE';
      btn.style.opacity = '.6';
      setTimeout(() => {
        btn.textContent = btn.id === 'btnIngresar' ? 'INGRESAR' : 'INGRESAR AL ESPACIO PROFESIONALES';
        btn.style.opacity = '1';
      }, 2000);
    });
  });


  /* ── 9. PARALLAX sutil en hero ── */
  const heroContent = document.querySelector('.hero-content');
  if (heroContent) {
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      if (scrollY < window.innerHeight) {
        heroContent.style.transform = `translateY(${scrollY * 0.18}px)`;
        heroContent.style.opacity = `${1 - scrollY / (window.innerHeight * 0.7)}`;
      }
    }, { passive: true });
  }


  /* ── 10. TRUST STRIP — ticker en mobile ── */
  const trustInner = document.querySelector('.trust-inner');
  if (trustInner && window.innerWidth < 768) {
    trustInner.style.animation = 'none';
  }

  /* ── 6. SUSTITUIR NAVBAR POR MENÚ HAMBURGUESA ── */
  const trustStrip = document.querySelector('.trust-strip');
  const navbar = document.getElementById('sidenav');

  function toggleNavbarOnScroll() {
    const trustStripTop = trustStrip.getBoundingClientRect().top;

    if (trustStripTop <= 0) {
      navbar.classList.add('hidden');
      hamburger.classList.add('show');
    } else {
      navbar.classList.remove('hidden');
      hamburger.classList.remove('show');
    }
  }

  window.addEventListener('scroll', toggleNavbarOnScroll, { passive: true });

  // Ejecutar una vez al cargar para aplicar estado inicial basado en scroll
  toggleNavbarOnScroll();

});

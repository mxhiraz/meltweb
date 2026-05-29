// =========================================
// Footer year
// =========================================
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// =========================================
// Mobile nav drawer
// =========================================
const nav = document.querySelector('.nav');
const toggle = document.getElementById('navToggle');

function setNav(open) {
  if (!nav || !toggle) return;
  nav.classList.toggle('is-open', open);
  toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  document.body.style.overflow = open ? 'hidden' : '';
}

toggle?.addEventListener('click', (e) => {
  e.stopPropagation();
  setNav(!nav.classList.contains('is-open'));
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') setNav(false);
});
document.addEventListener('click', (e) => {
  if (!nav?.classList.contains('is-open')) return;
  if (nav.contains(e.target)) return;
  setNav(false);
});
const mq = window.matchMedia('(min-width: 901px)');
mq.addEventListener?.('change', (e) => { if (e.matches) setNav(false); });

// =========================================
// Smooth scroll via Lenis (with native fallback)
// =========================================
let lenis = null;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (typeof Lenis !== 'undefined' && !prefersReducedMotion) {
  lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    smoothTouch: false,
    wheelMultiplier: 1,
    touchMultiplier: 1.4,
  });

  const raf = (time) => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
}

// Anchor links — route through Lenis (or fall back to native smooth)
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const href = a.getAttribute('href');
    if (!href || href === '#' || href.length < 2) return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    setNav(false); // close mobile drawer if open
    if (lenis) {
      lenis.scrollTo(target, { offset: -10, duration: 1.2 });
    } else {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// =========================================
// Contact form (no backend — show success)
// =========================================
const form = document.getElementById('quoteForm');
form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const success = form.querySelector('.contact__success');
  if (success) {
    success.hidden = false;
    if (lenis) lenis.scrollTo(success, { offset: -40, duration: 1 });
    else success.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  form.reset();
});

// =========================================
// Scroll reveals (IntersectionObserver)
// =========================================
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

  document.querySelectorAll('section').forEach((s) => {
    s.classList.add('reveal');
    io.observe(s);
  });
}

// =========================================
// Subtle hero parallax (driven by Lenis scroll)
// =========================================
if (lenis) {
  const heroImg = document.querySelector('.hero__media img');
  const wordmark = document.querySelector('.hero__wordmark');
  lenis.on('scroll', ({ scroll }) => {
    if (scroll < 1000) {
      if (heroImg) heroImg.style.transform = `translateY(${scroll * 0.18}px) scale(1.05)`;
      if (wordmark) wordmark.style.transform = `translateY(${scroll * 0.06}px)`;
    }
  });
}

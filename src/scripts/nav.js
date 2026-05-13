/**
 * Shared navigation — works on every page.
 * Imports translations and wires up: navbar scroll, mobile menu,
 * active link highlighting, language toggle.
 */

import translations from './translations.js';

export function initNav() {
  const navbar   = document.getElementById('navbar');
  const toggle   = document.getElementById('navToggle');
  const mobileNav = document.getElementById('mobileNav');
  const langBtn  = document.getElementById('langBtn');
  const langLabel = document.getElementById('langLabel');

  // ── Scroll effect ─────────────────────────────────────────
  window.addEventListener('scroll', () => {
    navbar?.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });

  // ── Mobile menu ───────────────────────────────────────────
  toggle?.addEventListener('click', () => {
    const open = toggle.classList.toggle('open');
    mobileNav?.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  // Close mobile nav when a link is clicked
  mobileNav?.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      toggle?.classList.remove('open');
      mobileNav?.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // ── Active link ───────────────────────────────────────────
  const currentPath = location.pathname.replace(/\/$/, '') || '/index.html';
  document.querySelectorAll('.nav-link[data-page]').forEach(link => {
    const page = link.getAttribute('data-page');
    const isHome = (page === 'home' && (currentPath.endsWith('index.html') || currentPath === '' || currentPath === '/'));
    const matches = !isHome && currentPath.endsWith(page + '.html');
    if (isHome || matches) link.classList.add('active');
  });

  // ── Language ──────────────────────────────────────────────
  let lang = localStorage.getItem('lang') || 'en';
  applyLang(lang);

  langBtn?.addEventListener('click', () => {
    lang = lang === 'en' ? 'ar' : 'en';
    localStorage.setItem('lang', lang);
    applyLang(lang);
  });

  function applyLang(l) {
    document.documentElement.lang = l;
    document.documentElement.dir  = l === 'ar' ? 'rtl' : 'ltr';
    if (langLabel) langLabel.textContent = l === 'en' ? 'EN' : 'AR';
    const t = translations[l];
    if (!t) return;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (t[key] !== undefined) el.innerHTML = t[key];
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const key = el.getAttribute('data-i18n-ph');
      if (t[key] !== undefined) el.placeholder = t[key];
    });
  }

  return { getLang: () => lang };
}

/** Scroll-reveal via IntersectionObserver */
export function initReveal() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal, .reveal-scale').forEach(el => io.observe(el));
}

/** Counter animation */
export function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      const target = parseInt(e.target.getAttribute('data-count'));
      let current  = 0;
      const step   = Math.ceil(target / 40);
      const timer  = setInterval(() => {
        current = Math.min(current + step, target);
        e.target.textContent = current;
        if (current >= target) clearInterval(timer);
      }, 40);
    });
  }, { threshold: 0.5 });

  counters.forEach(c => io.observe(c));
}

/** Typing effect */
export function initTyping(elementId, roles) {
  const el = document.getElementById(elementId);
  if (!el) return;

  let rIdx = 0, cIdx = 0, deleting = false, speed = 80;

  function type() {
    const word = roles[rIdx];
    el.textContent = deleting ? word.slice(0, cIdx - 1) : word.slice(0, cIdx + 1);
    deleting ? cIdx-- : cIdx++;
    if (!deleting && cIdx === word.length) { speed = 2000; deleting = true; }
    else if (deleting && cIdx === 0) { deleting = false; rIdx = (rIdx + 1) % roles.length; speed = 500; }
    else { speed = deleting ? 40 : 80; }
    setTimeout(type, speed);
  }
  setTimeout(type, 600);
}

/** Page-transition fade out before navigation */
export function initPageLinks() {
  document.querySelectorAll('a[href]:not([target]):not([href^="#"]):not([href^="mailto"]):not([href^="tel"])').forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('http')) return;
      e.preventDefault();
      document.body.style.opacity = '0';
      document.body.style.transition = 'opacity 0.2s ease';
      setTimeout(() => { window.location.href = href; }, 200);
    });
  });
}

/** Toast notifications */
export function showToast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const icons = { success: 'check-circle', error: 'alert-circle', info: 'info', warning: 'alert-triangle' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-${icons[type]}"></svg><span>${msg}</span>`;
  container.appendChild(toast);
  if (typeof lucide !== 'undefined') lucide.createIcons({ nodes: [toast] });
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => toast.remove());
  }, 4000);
}

/** Loader */
export function initLoader(onDone) {
  const loader = document.getElementById('loader');
  const bar    = document.getElementById('loaderBar');
  if (!loader || !bar) { onDone?.(); return; }

  let progress = 0;
  const iv = setInterval(() => {
    progress += Math.random() * 20 + 5;
    if (progress >= 100) {
      progress = 100;
      clearInterval(iv);
      setTimeout(() => {
        loader.classList.add('hidden');
        document.body.style.overflow = 'auto';
        onDone?.();
      }, 350);
    }
    bar.style.width = progress + '%';
  }, 120);
}

/** Navbar HTML generator — call once per page */
export function renderNavbar(activePage) {
  const links = [
    { page: 'home',       href: '/',             label: 'navHome' },
    { page: 'about',      href: '/about.html',   label: 'navAbout' },
    { page: 'projects',   href: '/projects.html',label: 'navProjects' },
    { page: 'services',   href: '/services.html',label: 'navServices' },
    { page: 'experience', href: '/experience.html', label: 'navExperience' },
    { page: 'contact',    href: '/contact.html', label: 'navContact' },
  ];
  return links.map(l =>
    `<a href="${l.href}" class="nav-link${l.page === activePage ? ' active' : ''}" data-page="${l.page}" data-i18n="${l.label}">${translations.en[l.label]}</a>`
  ).join('');
}

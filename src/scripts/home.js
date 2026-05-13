import { initNav, initReveal, initCounters, initTyping, initLoader } from './nav.js';
import { fetchActiveOrdered, fetchSiteSettings } from './firebase-config.js';
import translations from './translations.js';

let currentLang = 'en';
let cachedProjects = [];

document.addEventListener('DOMContentLoaded', () => {
  const nav = initNav();
  currentLang = nav.getLang();

  initLoader(() => {
    const staggerEls = document.querySelectorAll('.hero-stagger');
    staggerEls.forEach((el, i) => {
      setTimeout(() => el.classList.add('animate'), i * 120);
    });
    initReveal();
    initCounters();
  });

  initTyping('typedRole', ['AI Engineer', 'ML Developer', 'Deep Learning', 'Computer Vision', 'NLP Specialist', 'MLOps Engineer']);

  window.addEventListener('scroll', () => {
    const wrap = document.querySelector('.hero-img-wrap');
    if (wrap) wrap.style.transform = `translateY(${window.scrollY * 0.06}px)`;
  }, { passive: true });

  document.getElementById('scrollIndicator')?.addEventListener('click', () => {
    document.getElementById('featuredWork')?.scrollIntoView({ behavior: 'smooth' });
  });

  const langBtn   = document.getElementById('langBtn');
  const langMob   = document.getElementById('langBtnMobile');
  const labMob    = document.getElementById('langLabelMobile');
  langMob?.addEventListener('click', () => langBtn?.click());
  langBtn?.addEventListener('click', () => {
    if (labMob) labMob.textContent = document.getElementById('langLabel')?.textContent || 'EN';
  });

  loadFeaturedProjects();

  // Re-render when language changes
  window.addEventListener('langchange', (e) => {
    currentLang = e.detail.lang;
    if (cachedProjects.length > 0) renderFeaturedProjects(cachedProjects);
  });
});

function t(item, field) {
  if (currentLang === 'ar' && item[field + 'Ar']) return item[field + 'Ar'];
  return item[field] || '';
}

async function loadFeaturedProjects() {
  try {
    const [settings, projects] = await Promise.all([
      fetchSiteSettings(),
      fetchActiveOrdered('projects')
    ]);

    if (settings?.heroTitle) {
      const el = document.querySelector('.hero-name');
      if (el) el.textContent = settings.heroTitle;
    }
    if (settings?.heroRole) {
      const el = document.getElementById('typedRole');
      if (el) el.setAttribute('data-firestore-role', settings.heroRole);
    }

    if (Array.isArray(projects) && projects.length > 0) {
      cachedProjects = projects.slice(0, 3);
      renderFeaturedProjects(cachedProjects);
    }
  } catch (_) {}
}

function renderFeaturedProjects(projects) {
  const grid = document.querySelector('.home-projects-grid');
  if (!grid) return;

  const liveLabel = translations[currentLang]?.projStatusLive || 'Live';
  const doneLabel = translations[currentLang]?.projStatusDone || 'Completed';
  const delays = ['', 'reveal-delay-1', 'reveal-delay-2'];

  grid.innerHTML = projects.map((p, i) => `
    <div class="project-card reveal visible ${delays[i] || ''}">
      <div class="project-card-header">
        <div class="project-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        </div>
        <span class="badge ${p.isFeatured ? 'badge-live' : 'badge-done'}">
          ${p.isFeatured ? `<span class="badge-dot"></span>${liveLabel}` : doneLabel}
        </span>
      </div>
      <h3 class="project-title" dir="auto">${t(p, 'title')}</h3>
      <p class="project-desc" dir="auto">${t(p, 'description')}</p>
      <div class="project-tags">
        ${(p.tags || []).slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
      </div>
    </div>
  `).join('');

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
  }, { threshold: 0.1 });
  grid.querySelectorAll('.reveal:not(.visible)').forEach(el => io.observe(el));

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

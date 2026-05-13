import { initNav, initReveal } from './nav.js';
import { fetchActiveOrdered } from './firebase-config.js';
import translations from './translations.js';

let cachedProjects = [];

document.addEventListener('DOMContentLoaded', async () => {
  const nav = initNav();
  initReveal();
  if (typeof lucide !== 'undefined') lucide.createIcons();

  try {
    const projects = await fetchActiveOrdered('projects');
    cachedProjects = Array.isArray(projects) ? projects : [];
    const lang = nav.getLang();
    if (cachedProjects.length > 0) renderProjects(cachedProjects, lang);
  } catch (_) {}

  window.addEventListener('langchange', (e) => {
    if (cachedProjects.length > 0) renderProjects(cachedProjects, e.detail.lang);
  });
});

function t(item, field, lang) {
  if (lang === 'ar' && item[field + 'Ar']) return item[field + 'Ar'];
  return item[field] || '';
}

function normalizeUrl(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  const withProto = /^[a-z][a-z\d+.-]*:/i.test(s) ? s : `https://${s}`;
  try { const u = new URL(withProto); return ['http:', 'https:'].includes(u.protocol) ? u.toString() : ''; }
  catch { return ''; }
}

function renderProjects(projects, lang) {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;

  const delays = ['', 'reveal-delay-1', 'reveal-delay-2'];
  const liveLabel = translations[lang]?.projStatusLive || 'Live';
  const doneLabel = translations[lang]?.projStatusDone || 'Completed';

  grid.innerHTML = projects.map((p, i) => {
    const title = t(p, 'title', lang);
    const desc = t(p, 'description', lang);
    const date = t(p, 'date', lang);
    const github = normalizeUrl(p.githubUrl);
    const live   = normalizeUrl(p.liveUrl);
    const tags   = (p.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('');
    const feats  = (p.features || []).map((f, fi) => {
      const fAr = p.featuresAr?.[fi];
      const text = (lang === 'ar' && fAr) ? fAr : f;
      return `
      <div class="project-feature" dir="auto">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        <span>${text}</span>
      </div>`;
    }).join('');
    const links = [
      github ? `<a href="${github}" target="_blank" rel="noopener" class="project-link" aria-label="GitHub"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg></a>` : '',
      live   ? `<a href="${live}" target="_blank" rel="noopener" class="project-link" aria-label="Live"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>` : ''
    ].join('');

    const imgHtml = p.imageUrl
      ? `<img src="${p.imageUrl}" alt="${title}" class="project-image" loading="lazy">`
      : '';

    return `
      <div class="project-card reveal visible ${delays[i % 3] || ''}">
        ${imgHtml}
        <div class="project-card-header">
          <div class="project-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          </div>
          <div class="project-status-wrap">
            <span class="badge ${p.isFeatured ? 'badge-live' : 'badge-done'}">
              ${p.isFeatured ? `<span class="badge-dot"></span>${liveLabel}` : doneLabel}
            </span>
            <div class="project-links-row">${links}</div>
          </div>
        </div>
        <h3 class="project-title" dir="auto">${title}</h3>
        ${date ? `<p class="project-date" dir="auto">${date}</p>` : ''}
        <p class="project-desc" dir="auto">${desc}</p>
        ${tags ? `<div class="project-tags">${tags}</div>` : ''}
        ${feats ? `<div class="project-features">${feats}</div>` : ''}
      </div>`;
  }).join('');

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
  }, { threshold: 0.1 });
  grid.querySelectorAll('.reveal:not(.visible)').forEach(el => io.observe(el));

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

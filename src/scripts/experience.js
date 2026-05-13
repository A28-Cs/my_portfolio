import { initNav, initReveal } from './nav.js';
import { fetchActiveOrdered } from './firebase-config.js';
import translations from './translations.js';

document.addEventListener('DOMContentLoaded', async () => {
  const nav = initNav();
  initReveal();
  if (typeof lucide !== 'undefined') lucide.createIcons();

  try {
    const [experiences, educations, certs] = await Promise.all([
      fetchActiveOrdered('experience'),
      fetchActiveOrdered('education'),
      fetchActiveOrdered('certificates'),
    ]);
    const lang = nav.getLang();
    if (Array.isArray(experiences) && experiences.length > 0) renderTimeline('experienceTimeline', experiences, lang);
    if (Array.isArray(educations) && educations.length > 0) renderTimeline('educationTimeline', educations, lang);
    if (Array.isArray(certs) && certs.length > 0) renderCerts(certs, lang);
  } catch (_) {}
});

function t(item, field, lang) {
  if (lang === 'ar' && item[field + 'Ar']) return item[field + 'Ar'];
  return item[field] || '';
}

function renderTimeline(containerId, items, lang) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const delays = ['', 'reveal-delay-1', 'reveal-delay-2'];
  container.innerHTML = items.map((item, i) => {
    const title = t(item, 'role', lang) || t(item, 'degree', lang) || t(item, 'title', lang);
    const org = t(item, 'company', lang) || t(item, 'school', lang) || t(item, 'institution', lang);
    const date = t(item, 'date', lang) || t(item, 'period', lang);
    const desc = t(item, 'description', lang);
    const tags = (item.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('');
    return `
      <div class="timeline-item reveal ${delays[i % 3]}">
        <div class="timeline-dot"></div>
        <div class="timeline-card">
          <div class="timeline-header">
            <div>
              <h3 class="timeline-title" dir="auto">${title}</h3>
              <p class="timeline-company" dir="auto">${org}</p>
            </div>
            <span class="timeline-date" dir="auto">${date}</span>
          </div>
          ${desc ? `<p class="timeline-desc" dir="auto">${desc}</p>` : ''}
          ${tags ? `<div class="timeline-tags">${tags}</div>` : ''}
        </div>
      </div>`;
  }).join('');

  attachReveal(container);
}

function renderCerts(certs, lang) {
  const grid = document.getElementById('certsGrid');
  if (!grid) return;

  const delays = ['', 'reveal-delay-1', 'reveal-delay-2'];
  grid.innerHTML = certs.map((c, i) => `
    <div class="cert-card reveal ${delays[i % 3]}">
      <div class="cert-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
      </div>
      <div class="cert-body">
        <h4 class="cert-title" dir="auto">${t(c, 'title', lang)}</h4>
        <p class="cert-issuer" dir="auto">${t(c, 'issuer', lang)}</p>
        ${c.date ? `<span class="cert-date">${c.date}</span>` : ''}
      </div>
    </div>`).join('');

  attachReveal(grid);
}

function attachReveal(container) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
  }, { threshold: 0.1 });
  container.querySelectorAll('.reveal').forEach(el => io.observe(el));
}

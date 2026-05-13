import { initNav, initReveal } from './nav.js';
import { fetchActiveOrdered } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', async () => {
  initNav();
  initReveal();
  if (typeof lucide !== 'undefined') lucide.createIcons();

  try {
    const [experiences, educations, certs] = await Promise.all([
      fetchActiveOrdered('experience'),
      fetchActiveOrdered('education'),
      fetchActiveOrdered('certificates'),
    ]);
    if (Array.isArray(experiences) && experiences.length > 0) renderTimeline('experienceTimeline', experiences);
    if (Array.isArray(educations) && educations.length > 0) renderTimeline('educationTimeline', educations);
    if (Array.isArray(certs) && certs.length > 0) renderCerts(certs);
  } catch (_) {}
});

function renderTimeline(containerId, items) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const delays = ['', 'reveal-delay-1', 'reveal-delay-2'];
  container.innerHTML = items.map((item, i) => {
    const tags = (item.tags || []).map(t => `<span class="tag">${t}</span>`).join('');
    return `
      <div class="timeline-item reveal ${delays[i % 3]}">
        <div class="timeline-dot"></div>
        <div class="timeline-card">
          <div class="timeline-header">
            <div>
              <h3 class="timeline-title">${item.role || item.degree || item.title || ''}</h3>
              <p class="timeline-company">${item.company || item.school || item.institution || ''}</p>
            </div>
            <span class="timeline-date">${item.date || item.period || ''}</span>
          </div>
          ${item.description ? `<p class="timeline-desc">${item.description}</p>` : ''}
          ${tags ? `<div class="timeline-tags">${tags}</div>` : ''}
        </div>
      </div>`;
  }).join('');

  attachReveal(container);
}

function renderCerts(certs) {
  const grid = document.getElementById('certsGrid');
  if (!grid) return;

  const delays = ['', 'reveal-delay-1', 'reveal-delay-2'];
  grid.innerHTML = certs.map((c, i) => `
    <div class="cert-card reveal ${delays[i % 3]}">
      <div class="cert-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
      </div>
      <div class="cert-body">
        <h4 class="cert-title">${c.title || ''}</h4>
        <p class="cert-issuer">${c.issuer || ''}</p>
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

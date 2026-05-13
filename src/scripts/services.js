import { initNav, initReveal, showToast } from './nav.js';
import { fetchActiveOrdered } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', async () => {
  initNav();
  initReveal();
  if (typeof lucide !== 'undefined') lucide.createIcons();

  document.querySelectorAll('.btn-request').forEach(btn => {
    btn.addEventListener('click', () => {
      const title = btn.dataset.title || '';
      const subject = encodeURIComponent(`Service Inquiry: ${title}`);
      window.location.href = `/contact.html?subject=${subject}`;
    });
  });

  try {
    const services = await fetchActiveOrdered('services');
    if (Array.isArray(services) && services.length > 0) renderServices(services);
  } catch (_) {}
});

function renderServices(services) {
  const grid = document.getElementById('servicesGrid');
  if (!grid) return;

  const delays = ['', 'reveal-delay-1', 'reveal-delay-2'];
  grid.innerHTML = services.map((s, i) => {
    const features = (s.features || []).map(f => `<li>${f}</li>`).join('');
    const isFeatured = s.isFeatured;
    const priceLabel = s.priceRange || '';
    const btnClass = isFeatured ? 'btn btn-primary btn-request' : 'btn btn-secondary btn-request';

    return `
      <div class="service-card ${isFeatured ? 'service-card-featured' : ''} reveal ${delays[i % 3]}">
        ${isFeatured ? '<div class="service-featured-label">Most Requested</div>' : ''}
        <div class="service-card-header">
          <div class="service-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 8 12 12 14 14"/></svg>
          </div>
          <span class="service-price">${priceLabel}</span>
        </div>
        <h3 class="service-title">${s.title}</h3>
        <p class="service-desc">${s.description || ''}</p>
        ${features ? `<ul class="service-features">${features}</ul>` : ''}
        <button class="${btnClass}" data-title="${s.title}">Request Service</button>
      </div>`;
  }).join('');

  grid.querySelectorAll('.btn-request').forEach(btn => {
    btn.addEventListener('click', () => {
      const title = btn.dataset.title || '';
      const subject = encodeURIComponent(`Service Inquiry: ${title}`);
      window.location.href = `/contact.html?subject=${subject}`;
    });
  });

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
  }, { threshold: 0.1 });
  grid.querySelectorAll('.reveal').forEach(el => io.observe(el));

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

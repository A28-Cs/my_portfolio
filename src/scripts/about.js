import { initNav, initReveal } from './nav.js';
import { fetchActiveOrdered } from './firebase-config.js';
import translations from './translations.js';

let currentLang = 'en';

document.addEventListener('DOMContentLoaded', async () => {
  const nav = initNav();
  currentLang = nav.getLang();
  initReveal();
  if (typeof lucide !== 'undefined') lucide.createIcons();

  try {
    const skills = await fetchActiveOrdered('skills');
    if (Array.isArray(skills) && skills.length > 0) renderSkills(skills);
  } catch (_) {}
});

function t(item, field) {
  if (currentLang === 'ar' && item[field + 'Ar']) return item[field + 'Ar'];
  return item[field] || '';
}

function renderSkills(skills) {
  const grid = document.getElementById('skillsGrid');
  if (!grid) return;

  const grouped = {};
  skills.forEach(s => {
    const cat = currentLang === 'ar' && s.categoryAr ? s.categoryAr : (s.category || 'Other');
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(s);
  });

  const iconMap = {
    'Programming': '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    'Machine Learning': '<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.04z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.04z"/>',
    'Deep Learning': '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    'Cloud': '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',
  };
  const defaultIcon = '<circle cx="12" cy="12" r="10"/>';

  grid.innerHTML = Object.entries(grouped).map(([cat, catSkills], i) => `
    <div class="skill-category reveal${i % 3 !== 0 ? ` reveal-delay-${i % 3}` : ''}">
      <div class="skill-cat-header">
        <div class="skill-cat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconMap[cat] || defaultIcon}</svg>
        </div>
        <span class="skill-cat-name" dir="auto">${cat}</span>
      </div>
      <div class="skill-chips">
        ${catSkills.map(s => {
          const name = t(s, 'name');
          const icon = s.iconType === 'image' && s.iconValue
            ? `<img src="${s.iconValue}" alt="${name}" width="18">`
            : '';
          return `<span class="skill-chip" dir="auto">${icon}${name}</span>`;
        }).join('')}
      </div>
    </div>
  `).join('');

  initReveal();
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

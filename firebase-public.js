/**
 * Firebase Public Integration
 * Loads dynamic content from Firestore into the public portfolio.
 * Replaces hardcoded skills, services, projects, certificates with Firestore data.
 * Handles contact form submission to Firestore messages collection.
 */

import {
    db,
    addDoc,
    collection,
    serverTimestamp,
    fetchActiveOrdered,
    fetchSiteSettings
} from './firebase-config.js';

// ---- Toast notification system ----
function showToast(message, type = 'success', duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const iconMap = {
        success: 'check-circle-2',
        error: 'alert-circle',
        info: 'info',
        warning: 'alert-triangle'
    };

    toast.innerHTML = `
        <i data-lucide="${iconMap[type] || 'info'}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Trigger Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons({ nodes: [toast] });
    }

    // Animate in
    requestAnimationFrame(() => toast.classList.add('show'));

    // Auto dismiss
    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }, duration);
}

// Expose globally for use by script.js contact form
window.showToast = showToast;

// ---- Wait for DOM ----
document.addEventListener('DOMContentLoaded', async () => {
    // Load all Firestore data in parallel
    const [settings, skills, services, projects, certificates, education, experience] = await Promise.all([
        fetchSiteSettings(),
        fetchActiveOrdered('skills'),
        fetchActiveOrdered('services'),
        fetchActiveOrdered('projects'),
        fetchActiveOrdered('certificates'),
        fetchActiveOrdered('education'),
        fetchActiveOrdered('experience')
    ]);

    // Apply site settings to hero section
    if (settings) {
        applySiteSettings(settings);
    }

    // Render Firestore-managed sections even when empty so dashboard deletes are reflected.
    renderSkills(asList(skills));
    renderServices(asList(services));
    renderExperience(asList(experience));
    renderProjects(asList(projects));
    renderEducation(asList(education));
    renderCertificates(asList(certificates));

    // Override contact form to write to Firestore
    overrideContactForm();
});

function asList(value) {
    return Array.isArray(value) ? value : [];
}

function normalizeExternalUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';

    const withProtocol = /^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : `https://${raw}`;
    try {
        const url = new URL(withProtocol);
        return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
    } catch (_) {
        return '';
    }
}

function getContactPhoneValue(form) {
    const phoneInput = form.querySelector('#contactPhone');
    const rawPhone = phoneInput?.value?.trim() || '';
    const iti = window.phoneItiInstance;
    const formattedPhone = iti?.getNumber?.()?.trim() || '';
    if (formattedPhone) return formattedPhone;
    if (!rawPhone) return '';

    const countryDialCode = iti?.getSelectedCountryData?.()?.dialCode;
    if (countryDialCode && !rawPhone.startsWith('+')) {
        return `+${countryDialCode} ${rawPhone}`;
    }

    return rawPhone;
}

function setSectionEmpty(section, isEmpty) {
    section?.classList.toggle('section-empty', isEmpty);
    if (!section?.id) return;
    const navLink = document.querySelector(`.nav-link[data-section="${section.id}"]`);
    const navItem = navLink?.closest('li') || navLink;
    if (navItem) navItem.style.display = isEmpty ? 'none' : '';
}

// ---- Apply Site Settings (Hero + Contact) ----
function applySiteSettings(settings) {
    // Hero title / role (only override if Firestore values exist)
    if (settings.heroTitle) {
        const nameEl = document.querySelector('.name-word');
        if (nameEl) nameEl.textContent = settings.heroTitle;
    }

    if (settings.heroRole) {
        const roleEl = document.getElementById('typedRole');
        if (roleEl) roleEl.setAttribute('data-firestore-role', settings.heroRole);
    }

    // Contact info
    if (settings.contactEmail) {
        const emailLinks = document.querySelectorAll('a[href^="mailto:"]');
        emailLinks.forEach(link => {
            link.href = `mailto:${settings.contactEmail}`;
            if (link.classList.contains('contact-card-value')) {
                link.textContent = settings.contactEmail;
            }
        });
        // Also update the about section email
        const aboutEmail = document.querySelector('.about-info-grid .info-item:last-child .info-value');
        if (aboutEmail) aboutEmail.textContent = settings.contactEmail;
    }

    if (settings.contactPhone) {
        const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
        phoneLinks.forEach(link => {
            link.href = `tel:${settings.contactPhone.replace(/\s/g, '')}`;
            if (link.classList.contains('contact-card-value')) {
                link.textContent = settings.contactPhone;
            }
        });
    }
}

// ---- Render Skills ----
function renderSkills(skills) {
    const container = document.querySelector('.skills-categories');
    if (!container) return;

    // Group skills by category
    const grouped = {};
    skills.forEach(skill => {
        const cat = skill.category || 'Other';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(skill);
    });

    // Category icon mapping (matching existing design)
    const categoryIcons = {
        'Programming': 'code-2',
        'Machine Learning': 'brain',
        'Deep Learning': 'layers',
        'Data Science': 'database',
        'MLOps': 'rocket',
        'Cloud': 'cloud',
        'Web Development': 'globe',
        'DevOps': 'settings',
        'Other': 'star'
    };

    container.innerHTML = '';

    Object.entries(grouped).forEach(([category, categorySkills]) => {
        const iconName = categoryIcons[category] || 'star';

        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'skill-category animate-on-scroll';

        let chipsHTML = '';
        categorySkills.forEach(skill => {
            let iconHTML = '';
            if (skill.iconType === 'image' && skill.iconValue) {
                iconHTML = `<img src="${skill.iconValue}" alt="${skill.name}" width="20">`;
            } else if (skill.iconType === 'icon' && skill.iconValue) {
                iconHTML = `<i data-lucide="${skill.iconValue}" class="chip-icon"></i>`;
            }

            chipsHTML += `
                <div class="skill-chip" data-level="${skill.level || 0}">
                    ${iconHTML}
                    <span>${skill.name}</span>
                    <div class="chip-glow"></div>
                </div>
            `;
        });

        categoryDiv.innerHTML = `
            <div class="category-header">
                <div class="category-icon">
                    <i data-lucide="${iconName}"></i>
                </div>
                <h3>${category}</h3>
            </div>
            <div class="skill-items">
                ${chipsHTML}
            </div>
        `;

        container.appendChild(categoryDiv);
    });

    // Re-init icons and scroll observer
    reinitIcons();
    reinitScrollObserver(container);
}

// ---- Render Experience ----
function renderExperience(experienceItems) {
    const section = document.getElementById('experience');
    const container = section?.querySelector('.timeline');
    if (!container) return;

    container.innerHTML = '';
    setSectionEmpty(section, experienceItems.length === 0);
    if (!experienceItems.length) return;

    experienceItems.forEach(item => {
        const details = Array.isArray(item.details)
            ? item.details
            : (item.description ? [item.description] : []);
        const tags = Array.isArray(item.tags) ? item.tags : [];

        const detailsHTML = details.map(detail => `<li>${detail}</li>`).join('');
        const tagsHTML = tags.map(tag => `<span class="tag">${tag}</span>`).join('');

        const timelineItem = document.createElement('div');
        timelineItem.className = 'timeline-item animate-on-scroll';
        timelineItem.innerHTML = `
            <div class="timeline-marker">
                <div class="marker-dot"></div>
            </div>
            <div class="timeline-content">
                <div class="timeline-header">
                    <div class="timeline-title-group">
                        <h3>${item.role || ''}</h3>
                        <span class="timeline-company">${item.company || ''}</span>
                    </div>
                    ${item.date ? `
                        <span class="timeline-date">
                            <i data-lucide="calendar"></i>
                            <span>${item.date}</span>
                        </span>
                    ` : ''}
                </div>
                ${detailsHTML ? `<ul class="timeline-details">${detailsHTML}</ul>` : ''}
                ${tagsHTML ? `<div class="timeline-tags">${tagsHTML}</div>` : ''}
            </div>
        `;

        container.appendChild(timelineItem);
    });

    reinitIcons();
    reinitScrollObserver(container);
}

// ---- Render Education ----
function renderEducation(educationItems) {
    const section = document.getElementById('education');
    const container = section?.querySelector('.container');
    if (!container) return;

    container.querySelectorAll('.education-card').forEach(card => card.remove());
    setSectionEmpty(section, educationItems.length === 0);
    if (!educationItems.length) return;

    educationItems.forEach(item => {
        const highlights = Array.isArray(item.highlights) ? item.highlights : [];
        const highlightsHTML = highlights.map(highlight => `<span>${highlight}</span>`).join('');

        const card = document.createElement('div');
        card.className = 'education-card animate-on-scroll';
        card.innerHTML = `
            <div class="edu-icon">
                <i data-lucide="${item.icon || 'graduation-cap'}"></i>
            </div>
            <div class="edu-content">
                <h3>${item.title || ''}</h3>
                ${item.institution ? `
                    <span class="edu-school">
                        <i data-lucide="building-2"></i>
                        <span>${item.institution}</span>
                    </span>
                ` : ''}
                ${item.date ? `
                    <span class="edu-date">
                        <i data-lucide="calendar"></i>
                        <span>${item.date}</span>
                    </span>
                ` : ''}
                ${item.description ? `<p class="edu-description">${item.description}</p>` : ''}
                ${highlightsHTML ? `<div class="edu-highlights">${highlightsHTML}</div>` : ''}
            </div>
        `;

        container.appendChild(card);
    });

    reinitIcons();
    reinitScrollObserver(container);
}

// ---- Render Services ----
function renderServices(services) {
    const container = document.querySelector('.services-grid');
    if (!container) return;

    container.innerHTML = '';

    services.forEach((service, index) => {
        const card = document.createElement('div');
        card.className = 'service-card animate-on-scroll';
        card.id = `service-fb-${service.id}`;

        // Build features HTML
        const featuresHTML = (service.features || []).map(feat =>
            `<span class="service-capability"><i data-lucide="check"></i><span>${feat}</span></span>`
        ).join('');

        // Build price display
        const priceHTML = service.priceMin != null && service.priceMax != null
            ? `$${service.priceMin}<span class="pricing-sep">–</span>$${service.priceMax}`
            : '';

        card.innerHTML = `
            <div class="service-glow"></div>
            <div class="service-card-top">
                <div class="service-index">${String(index + 1).padStart(2, '0')}</div>
                <span class="service-chip">${service.category || ''}</span>
            </div>
            <div class="service-header">
                <div class="service-icon-wrapper">
                    <div class="service-icon">
                        <i data-lucide="${service.icon || 'box'}"></i>
                    </div>
                    <div class="service-icon-ring"></div>
                </div>
                <h3 class="service-title">${service.title}</h3>
            </div>
            <p class="service-description">${service.description || ''}</p>
            ${featuresHTML ? `<div class="service-capabilities">${featuresHTML}</div>` : ''}
            ${priceHTML ? `
                <div class="service-pricing">
                    <div class="pricing-tier">
                        <div class="pricing-tier-head">
                            <span class="pricing-tier-label" data-i18n="srvPriceLabel">Price</span>
                            <span class="pricing-tier-price">${priceHTML}</span>
                        </div>
                    </div>
                </div>
            ` : ''}
            <div class="service-cta-group">
                <button class="btn-service-primary" data-action="request">
                    <span data-i18n="btnRequestService">Request Service</span>
                    <i data-lucide="arrow-right"></i>
                </button>
            </div>
        `;

        container.appendChild(card);
    });

    reinitIcons();
    reinitScrollObserver(container);

    // Re-bind service request buttons
    container.querySelectorAll('[data-action="request"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = btn.closest('.service-card');
            const title = card.querySelector('.service-title')?.textContent || '';
            scrollToContactWithSubject(title);
        });
    });

    // Reapply tilt effect
    reinitTilt(container);
}

// ---- Render Projects ----
function renderProjects(projects) {
    const container = document.querySelector('.projects-grid');
    if (!container) return;

    container.innerHTML = '';

    projects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'project-card animate-on-scroll';
        card.setAttribute('data-tilt', '');

        // Tags
        const tagsHTML = (project.tags || []).map(tag =>
            `<span>${tag}</span>`
        ).join('');

        // Features
        const featuresHTML = (project.features || []).map(feat =>
            `<div class="feature"><i data-lucide="check-circle-2"></i><span>${feat}</span></div>`
        ).join('');

        // Links
        let linksHTML = '';
        const githubUrl = normalizeExternalUrl(project.githubUrl);
        const liveUrl = normalizeExternalUrl(project.liveUrl);
        if (githubUrl) {
            linksHTML += `<a href="${githubUrl}" target="_blank" rel="noopener noreferrer" class="project-link-icon project-link-github" aria-label="GitHub" title="GitHub">${getGitHubIcon()}</a>`;
        }
        if (liveUrl) {
            linksHTML += `<a href="${liveUrl}" target="_blank" rel="noopener noreferrer" class="project-link-icon" aria-label="Live Demo" title="Live Demo"><i data-lucide="external-link"></i></a>`;
        }
        const actionsHTML = linksHTML ? `<div class="project-action-links">${linksHTML}</div>` : '';

        // Image
        const projectImageUrl = project.imageUrl ? optimizeProjectImageUrl(project.imageUrl) : '';
        const imageHTML = project.imageUrl
            ? `<div class="project-image-wrapper"><img src="${projectImageUrl}" alt="${project.title}" loading="lazy" decoding="async"></div>`
            : '';

        // Status badge
        const statusClass = project.isFeatured ? 'live' : 'completed';
        const statusText = project.isFeatured ? 'Featured' : 'Project';

        card.innerHTML = `
            <div class="project-glow"></div>
            ${imageHTML}
            <div class="project-header">
                <div class="project-icon">
                    <i data-lucide="folder-open"></i>
                </div>
                <div class="project-links">
                    <span class="project-status ${statusClass}">
                        <span class="status-dot"></span>
                        <span>${statusText}</span>
                    </span>
                    ${actionsHTML}
                </div>
            </div>
            <h3 class="project-title">${project.title}</h3>
            <p class="project-description">${project.description || ''}</p>
            ${tagsHTML ? `<div class="project-tech">${tagsHTML}</div>` : ''}
            ${featuresHTML ? `<div class="project-features">${featuresHTML}</div>` : ''}
        `;

        container.appendChild(card);
    });

    reinitIcons();
    reinitScrollObserver(container);
    reinitTilt(container);
}

function optimizeProjectImageUrl(imageUrl) {
    try {
        const url = new URL(imageUrl);
        if (url.hostname.includes('images.unsplash.com')) {
            url.searchParams.set('auto', 'format');
            url.searchParams.set('fit', 'crop');
            url.searchParams.set('w', '900');
            url.searchParams.set('q', '90');
            return url.toString();
        }
    } catch (error) {
        return imageUrl;
    }

    return imageUrl;
}

function getGitHubIcon() {
    return `<svg class="project-brand-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.39.6.11.82-.26.82-.58v-2.04c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.66-.31-5.46-1.34-5.46-5.93 0-1.31.47-2.38 1.24-3.22-.13-.31-.54-1.53.11-3.18 0 0 1.01-.32 3.3 1.23A11.43 11.43 0 0 1 12 5.8c1.02 0 2.05.14 3.01.4 2.29-1.55 3.3-1.23 3.3-1.23.65 1.65.24 2.87.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.6-2.81 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.58A12.01 12.01 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>`;
}

// ---- Render Certificates ----
function renderCertificates(certificates) {
    const grid = document.getElementById('certificatesGrid');
    if (!grid) return;

    const isAr = (localStorage.getItem('lang') || 'en') === 'ar';
    const statusVerified = isAr ? 'موثق' : 'Verified';
    const btnText = isAr ? 'عرض الشهادة' : 'View Credential';

    grid.innerHTML = '';

    certificates.forEach(cert => {
        const card = document.createElement('div');
        card.className = 'certificate-card visible';

        const imageHTML = cert.imageUrl
            ? `<img src="${cert.imageUrl}" alt="${cert.title}" loading="lazy">`
            : `<div class="certificate-image-placeholder"><i data-lucide="award"></i></div>`;

        card.innerHTML = `
            <div class="certificate-image-wrapper">
                ${imageHTML}
            </div>
            <div class="certificate-body">
                <span class="certificate-badge">
                    <i data-lucide="shield-check"></i>
                    ${statusVerified}
                </span>
                <h3 class="certificate-title">${cert.title}</h3>
                <div class="certificate-issuer">
                    <i data-lucide="building-2"></i>
                    ${cert.issuer || ''}
                </div>
                ${cert.issueDate ? `<div class="certificate-date"><i data-lucide="calendar"></i>${cert.issueDate}</div>` : ''}
                <div class="certificate-credential">
                    <i data-lucide="key"></i>
                    ${cert.credentialId || ''}
                </div>
                <a href="${cert.verifyUrl || '#'}" target="_blank" rel="noopener noreferrer" class="btn-credential">
                    <i data-lucide="external-link"></i>
                    <span>${btnText}</span>
                </a>
            </div>
        `;

        grid.appendChild(card);
    });

    reinitIcons();
}

// ---- Override Contact Form to write to Firestore ----
function overrideContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    // Remove any existing listeners by cloning the form
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    newForm.classList.add('visible');

    // Re-init phone input after clone
    const phoneInput = newForm.querySelector('#contactPhone');
    if (phoneInput && window.intlTelInput) {
        if (window.phoneItiInstance) {
            try { window.phoneItiInstance.destroy(); } catch (e) { /* ignore */ }
        }
        window.phoneItiInstance = window.intlTelInput(phoneInput, {
            initialCountry: "auto",
            geoIpLookup: function (callback) {
                fetch("https://ipapi.co/json")
                    .then(res => res.json())
                    .then(data => callback(data.country_code))
                    .catch(() => callback("eg"));
            },
            separateDialCode: true,
            countrySearch: true,
            utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@25.3.1/build/js/utils.js"
        });

        if (phoneInput) {
            phoneInput.addEventListener("input", function () {
                if (this.value.startsWith("0")) {
                    this.value = this.value.substring(1);
                }
            });
        }
    }

    // Re-init Lucide icons inside cloned form
    reinitIcons();

    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn = newForm.querySelector('.btn-submit');
        const originalContent = btn.innerHTML;
        const isAr = (localStorage.getItem('lang') || 'en') === 'ar';

        const txtSending = isAr ? 'جاري الإرسال...' : 'Sending...';
        const txtSuccess = isAr ? '✓ تم إرسال الرسالة بنجاح!' : '✓ Message Sent Successfully!';
        const txtError = isAr ? '❌ حدث خطأ، حاول مجدداً.' : '❌ Error. Please try again.';

        const name = newForm.querySelector('#contactName')?.value?.trim();
        const email = newForm.querySelector('#contactEmail')?.value?.trim();
        const phone = getContactPhoneValue(newForm);
        const subject = newForm.querySelector('#contactSubject')?.value?.trim();
        const message = newForm.querySelector('#contactMessage')?.value?.trim();

        // Client-side validation
        if (!name || !email || !phone || !message) {
            showToast(isAr ? 'يرجى ملء جميع الحقول المطلوبة.' : 'Please fill in all required fields.', 'warning');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showToast(isAr ? 'يرجى إدخال بريد إلكتروني صالح.' : 'Please enter a valid email address.', 'warning');
            return;
        }

        // Loading state
        btn.innerHTML = `<span>${txtSending}</span>`;
        btn.disabled = true;
        btn.style.opacity = '0.7';

        try {
            await addDoc(collection(db, 'messages'), {
                name,
                email,
                phone: phone || '',
                subject: subject || '',
                message,
                isRead: false,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            // Success
            btn.innerHTML = `<span>${txtSuccess}</span>`;
            btn.style.background = 'linear-gradient(135deg, #00f5a0, #00d2ff)';
            showToast(isAr ? 'تم إرسال رسالتك بنجاح! سأتواصل معك قريباً.' : 'Your message has been sent! I\'ll get back to you soon.', 'success');

            setTimeout(() => {
                btn.innerHTML = originalContent;
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.background = '';
                newForm.reset();
                reinitIcons();
            }, 3000);

        } catch (error) {
            console.error('Firestore message error:', error);
            btn.innerHTML = `<span>${txtError}</span>`;
            btn.style.background = 'linear-gradient(135deg, #ff416c, #ff4b2b)';
            showToast(isAr ? 'فشل في إرسال الرسالة. يرجى المحاولة مرة أخرى.' : 'Failed to send message. Please try again.', 'error');

            setTimeout(() => {
                btn.innerHTML = originalContent;
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.background = '';
                reinitIcons();
            }, 4000);
        }
    });
}

// ---- Utility helpers ----
function reinitIcons() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function reinitScrollObserver(container) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    container.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });
}

function reinitTilt(container) {
    container.querySelectorAll('[data-tilt], .service-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 55;
            const rotateY = (centerX - x) / 55;
            card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
            const glow = card.querySelector('.project-glow') || card.querySelector('.service-glow');
            if (glow) {
                glow.style.left = x - rect.width + 'px';
                glow.style.top = y - rect.height + 'px';
            }
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
        });
    });
}

function scrollToContactWithSubject(serviceTitle) {
    const contactSection = document.getElementById('contact');
    const subjectInput = document.getElementById('contactSubject');
    if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
    }
    if (subjectInput) {
        setTimeout(() => {
            subjectInput.value = `Service Inquiry: ${serviceTitle}`;
            subjectInput.focus();
            subjectInput.dispatchEvent(new Event('input'));
        }, 600);
    }
}

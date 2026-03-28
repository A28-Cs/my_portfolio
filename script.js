/* ===== AHMED ISMAIL - PORTFOLIO SCRIPTS ===== */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize everything
    initLoader();
    initCustomCursor();
    initParticles();
    initNavigation();
    initTypingEffect();
    initScrollAnimations();
    initCounterAnimation();
    initTiltEffect();
    initContactForm();
    initCertificates();
    initServiceModals();
    initLucideIcons();
    initLanguageSupport();
});

let currentLang = localStorage.getItem('lang') || 'en';

function initLanguageSupport() {
    const langToggle = document.getElementById('langToggle');
    if (!langToggle) return;

    // Apply initial language
    applyLanguage(currentLang);

    langToggle.addEventListener('click', () => {
        currentLang = currentLang === 'en' ? 'ar' : 'en';
        localStorage.setItem('lang', currentLang);
        applyLanguage(currentLang);
    });
}

function applyLanguage(lang) {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    const langLabel = document.getElementById('currentLang');
    if (langLabel) langLabel.textContent = lang === 'en' ? 'EN' : 'AR';

    if (window.i18nTranslations && window.i18nTranslations[lang]) {
        const t = window.i18nTranslations[lang];
        
        // Update all data-i18n elements
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (t[key]) {
                el.innerHTML = t[key];
            }
        });

        // Update placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (t[key]) {
                el.placeholder = t[key];
            }
        });
    }

    // Re-render certificates grid
    const certGrid = document.getElementById('certificatesGrid');
    if (certGrid) {
        certGrid.innerHTML = '';
        initCertificates();
    }
}

/* ===== LOADER ===== */
function initLoader() {
    const loader = document.getElementById('loader');
    const bar = document.getElementById('loaderBar');
    let progress = 0;

    const interval = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
                loader.classList.add('hidden');
                document.body.style.overflow = 'auto';
                triggerHeroAnimations();
            }, 400);
        }
        bar.style.width = progress + '%';
    }, 150);
}

function triggerHeroAnimations() {
    const heroElements = document.querySelectorAll('.hero .animate-on-scroll');
    heroElements.forEach((el, i) => {
        setTimeout(() => {
            el.classList.add('visible');
        }, i * 150);
    });
}

/* ===== CUSTOM CURSOR ===== */
function initCustomCursor() {
    const dot = document.getElementById('cursorDot');
    const outline = document.getElementById('cursorOutline');

    if (!dot || !outline) return;

    // Check if touch device
    if ('ontouchstart' in window) {
        dot.style.display = 'none';
        outline.style.display = 'none';
        return;
    }

    let mouseX = 0, mouseY = 0;
    let outlineX = 0, outlineY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        dot.style.left = mouseX - 4 + 'px';
        dot.style.top = mouseY - 4 + 'px';
    });

    function animateOutline() {
        outlineX += (mouseX - outlineX) * 0.15;
        outlineY += (mouseY - outlineY) * 0.15;
        outline.style.left = outlineX - 18 + 'px';
        outline.style.top = outlineY - 18 + 'px';
        requestAnimationFrame(animateOutline);
    }
    animateOutline();

    // Hover effects
    const hoverElements = document.querySelectorAll('a, button, .skill-chip, .project-card, .service-card, .certificate-card, .btn-credential, .nav-link');
    hoverElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            dot.classList.add('hover');
            outline.classList.add('hover');
        });
        el.addEventListener('mouseleave', () => {
            dot.classList.remove('hover');
            outline.classList.remove('hover');
        });
    });
}

/* ===== PARTICLE SYSTEM ===== */
function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let mouse = { x: null, y: null, radius: 150 };

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    document.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 0.5;
            this.speedX = (Math.random() - 0.5) * 0.5;
            this.speedY = (Math.random() - 0.5) * 0.5;
            this.opacity = Math.random() * 0.5 + 0.1;
            this.color = this.getColor();
        }

        getColor() {
            const colors = [
                '108, 92, 231',   // Purple
                '162, 155, 254',  // Light purple
                '0, 210, 255',    // Cyan
                '116, 185, 255',  // Light blue
            ];
            return colors[Math.floor(Math.random() * colors.length)];
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            // Mouse interaction
            if (mouse.x !== null) {
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < mouse.radius) {
                    const force = (mouse.radius - dist) / mouse.radius;
                    this.x -= dx * force * 0.02;
                    this.y -= dy * force * 0.02;
                }
            }

            // Wrap around edges
            if (this.x > canvas.width) this.x = 0;
            if (this.x < 0) this.x = canvas.width;
            if (this.y > canvas.height) this.y = 0;
            if (this.y < 0) this.y = canvas.height;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.color}, ${this.opacity})`;
            ctx.fill();
        }
    }

    // Create particles
    const particleCount = Math.min(80, Math.floor((canvas.width * canvas.height) / 15000));
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    function connectParticles() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(108, 92, 231, ${0.08 * (1 - dist / 150)})`;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        connectParticles();
        requestAnimationFrame(animate);
    }
    animate();
}

/* ===== NAVIGATION ===== */
function initNavigation() {
    const navbar = document.getElementById('navbar');
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');
    const navLinkItems = document.querySelectorAll('.nav-link');

    // Scroll effect
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const current = window.scrollY;
        if (current > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        lastScroll = current;

        // Update active link
        updateActiveLink();
    });

    // Mobile toggle
    toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        links.classList.toggle('active');
    });

    // Close mobile on link click
    navLinkItems.forEach(link => {
        link.addEventListener('click', () => {
            toggle.classList.remove('active');
            links.classList.remove('active');
        });
    });

    // Smooth scroll
    navLinkItems.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

function updateActiveLink() {
    const sections = document.querySelectorAll('.section, .hero');
    const links = document.querySelectorAll('.nav-link');

    let currentSection = '';

    sections.forEach(section => {
        const top = section.offsetTop - 150;
        if (window.scrollY >= top) {
            currentSection = section.getAttribute('id');
        }
    });

    links.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === currentSection) {
            link.classList.add('active');
        }
    });
}

/* ===== TYPING EFFECT ===== */
function initTypingEffect() {
    const element = document.getElementById('typedRole');
    if (!element) return;

    const roles = [
        'AI Engineer',
        'ML Developer',
        'Deep Learning',
        'Computer Vision',
        'NLP Specialist',
        'MLOps Engineer'
    ];

    let roleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 80;

    function type() {
        const current = roles[roleIndex];

        if (isDeleting) {
            element.textContent = current.substring(0, charIndex - 1);
            charIndex--;
            typingSpeed = 40;
        } else {
            element.textContent = current.substring(0, charIndex + 1);
            charIndex++;
            typingSpeed = 80;
        }

        if (!isDeleting && charIndex === current.length) {
            typingSpeed = 2000;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            roleIndex = (roleIndex + 1) % roles.length;
            typingSpeed = 500;
        }

        setTimeout(type, typingSpeed);
    }

    // Start after loader
    setTimeout(type, 2000);
}

/* ===== SCROLL ANIMATIONS ===== */
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    // Skip hero elements (handled by loader)
    document.querySelectorAll('.section .animate-on-scroll').forEach(el => {
        observer.observe(el);
    });
}

/* ===== COUNTER ANIMATION ===== */
function initCounterAnimation() {
    const counters = document.querySelectorAll('.stat-number');
    let started = false;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !started) {
                started = true;
                counters.forEach(counter => {
                    const target = parseInt(counter.getAttribute('data-count'));
                    animateCounter(counter, target);
                });
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(c => observer.observe(c));
}

function animateCounter(element, target) {
    let current = 0;
    const duration = 2000;
    const stepTime = Math.floor(duration / target);

    const timer = setInterval(() => {
        current++;
        element.textContent = current;
        if (current >= target) {
            clearInterval(timer);
        }
    }, stepTime);
}

/* ===== TILT EFFECT (for project cards) ===== */
function initTiltEffect() {
    const cards = document.querySelectorAll('[data-tilt], .service-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;

            // Move glow
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

/* ===== CONTACT FORM ===== */
function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const phoneInput = document.getElementById("contactPhone");
    let iti = null;
    if (phoneInput && window.intlTelInput) {
        iti = window.intlTelInput(phoneInput, {
            initialCountry: "auto",
            geoIpLookup: function(callback) {
                fetch("https://ipapi.co/json")
                    .then(res => res.json())
                    .then(data => callback(data.country_code))
                    .catch(() => callback("eg"));
            },
            separateDialCode: true,
            countrySearch: true,
            utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@25.3.1/build/js/utils.js"
        });

        // Prevent leading zero as requested
        phoneInput.addEventListener("input", function() {
            if (this.value.startsWith("0")) {
                this.value = this.value.substring(1);
            }
        });
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const btn = form.querySelector('.btn-submit');
        const originalContent = btn.innerHTML;
        
        const isAr = currentLang === 'ar';
        const txtSending = isAr ? 'جاري الإرسال...' : 'Sending...';
        const txtSuccess = isAr ? '✓ تم إرسال الرسالة!' : '✓ Message Sent!';
        const txtError = isAr ? '❌ حدث خطأ، حاول مجدداً.' : '❌ Error. Try Again.';

        const name = document.getElementById('contactName').value;
        const email = document.getElementById('contactEmail').value;
        const phone = iti ? iti.getNumber() : document.getElementById('contactPhone').value;
        const subject = document.getElementById('contactSubject').value;
        const message = document.getElementById('contactMessage').value;

        // Visual feedback
        btn.innerHTML = `<span>${txtSending}</span>`;
        btn.disabled = true;
        btn.style.opacity = '0.7';

        fetch('https://formsubmit.co/ajax/ahmed28cs@gmail.com', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                email: email,
                phone: phone,
                subject: subject,
                message: message
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success === 'true' || data.success === true) {
                btn.innerHTML = `<span>${txtSuccess}</span>`;
                btn.style.background = 'linear-gradient(135deg, #00f5a0, #00d2ff)';
            } else {
                throw new Error(data.message || 'Form submission returned false');
            }

            setTimeout(() => {
                btn.innerHTML = originalContent;
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.background = '';
                form.reset();
            }, 3000);
        })
        .catch(error => {
            console.error('FormSubmit Error:', error);
            
            // Helpful alert for local development
            if (window.location.protocol === 'file:') {
                alert("Error: FormSubmit does not work when opening HTML files directly (file://). Please use a local web server (like VS Code Live Server) or deploy your site.");
            } else if (error.message) {
                // Show the specific error message returned by FormSubmit API
                alert("Message from FormSubmit:\n\n" + error.message);
            }
            
            btn.innerHTML = `<span>${txtError}</span>`;
            btn.style.background = 'linear-gradient(135deg, #ff416c, #ff4b2b)';
            
            setTimeout(() => {
                btn.innerHTML = originalContent;
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.background = '';
            }, 4000);
        });
    });
}

/* ===== LUCIDE ICONS ===== */
function initLucideIcons() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    } else {
        // Retry if not loaded yet
        setTimeout(initLucideIcons, 200);
    }
}

/* ===== CERTIFICATES ===== */
function initCertificates() {
    const grid = document.getElementById('certificatesGrid');
    if (!grid) return;

    // Translate statuses dynamically
    const isAr = currentLang === 'ar';
    const statusVerified = isAr ? 'موثق' : 'Verified';
    const statusReady = isAr ? 'متاح كشهادة' : 'Credential Available';
    const btnText = isAr ? 'عرض الشهادة' : 'View Credential';

    // ---- CERTIFICATE DATA ----
    // To add, remove, or edit certificates, simply modify this array.
    const certificates = [
        {
            title: 'Data Science Libraries in Python',
            issuer: 'almentor',
            credentialId: 'w64gtl4y72',
            image: './assets/مكتبات علوم البيانات فى لغة البايثون-certificate.jpg',
            verifyUrl: 'https://www.almentor.net/certificate/w64gtl4y72',
            status: 'Verified'
        },
        {
            title: 'professional data analyst',
            issuer: 'almentor',
            credentialId: '1456qc76nrpgxbk28gd6q',
            image: './assets/محلل بيانات محترف-certificate.jpg',
            verifyUrl: 'https://www.almentor.net/certificate/programs/l1456qc76nrpgxbk28gd6q',
            status: 'Verified'
        },
        {
            title: 'Data Science Python for Data Analysis',
            issuer: 'almentor',
            credentialId: 'dpypavjm7g',
            image: './assets/لغة بايثون لعلوم البيانات-certificate (1).jpg',
            verifyUrl: 'https://www.almentor.net/certificate/dpypavjm7g',
            status: 'Verified'
        },
        {
            title: 'Applications of Data Science',
            issuer: 'almentor',
            credentialId: 'g18kaer7jp',
            image: './assets/تطبيقات علم البيانات-certificate (1).jpg',
            verifyUrl: 'https://www.almentor.net/certificate/g18kaer7jp',
            status: 'Verified'
        },
        {
            title: 'introduction to data science ',
            issuer: 'almentor',
            credentialId: 'n7k1a7rply',
            image: './assets/مقدمة في علم البيانات-certificate (1).jpg',
            verifyUrl: 'https://www.almentor.net/certificate/n7k1a7rply',
            status: 'Verified'
        },
        {
            title: 'Machine Learning and Deep Neural Networks in Python Programming (DNN)',
            issuer: 'almentor',
            credentialId: '1lg4ckl4n1',
            image: './assets/Screenshot 2026-03-26 204852.png',
            verifyUrl: 'https://www.almentor.net/certificate/1lg4ckl4n1',
            status: 'Verified'
        },
        {
            title: 'Machine Learning and Deep Neural Networks in Python Programming (DNN)',
            issuer: 'almentor',
            credentialId: 'w1wmfl4y72',
            image: './assets/دورة تعلم الآلة-certificate (1).jpg',
            verifyUrl: 'https://www.almentor.net/certificate/w1wmfl4y72',
            status: statusVerified
        },
        {
            title: 'Machine Learning and Deep Neural Networks in Python Programming (DNN)',
            issuer: 'DeepLearning.AI / Coursera',
            credentialId: 'El Qahwa Planet',
            image: './assets/NASA.png',
            verifyUrl: 'https://www.spaceappschallenge.org/2025/find-a-team/el-qahwa-planet/?tab=members',
            status: statusReady
        }
    ];

    certificates.forEach((cert, index) => {
        const card = document.createElement('div');

        // شيل animate-on-scroll أو أضف visible مباشرة
        card.className = 'certificate-card visible';
        // أو:
        // card.className = 'certificate-card animate-on-scroll visible';

        const imageHTML = cert.image
            ? `<img src="${cert.image}" alt="${cert.title}" loading="lazy">`
            : `<div class="certificate-image-placeholder"><i data-lucide="award"></i></div>`;

        card.innerHTML = `
            <div class="certificate-image-wrapper">
                ${imageHTML}
            </div>
            <div class="certificate-body">
                <span class="certificate-badge">
                    <i data-lucide="shield-check"></i>
                    ${cert.status}
                </span>
                <h3 class="certificate-title">${cert.title}</h3>
                <div class="certificate-issuer">
                    <i data-lucide="building-2"></i>
                    ${cert.issuer}
                </div>
                <div class="certificate-credential">
                    <i data-lucide="key"></i>
                    ${cert.credentialId}
                </div>
                <a href="${cert.verifyUrl}" target="_blank" rel="noopener noreferrer" class="btn-credential">
                    <i data-lucide="external-link"></i>
                    <span>${btnText}</span>
                </a>
            </div>
        `;

        grid.appendChild(card);
    });
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

/* ===== MAGNETIC BUTTON EFFECT ===== */
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    });

    btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
    });
});

/* ===== SMOOTH SCROLL FOR SCROLL INDICATOR ===== */
const scrollIndicator = document.getElementById('scrollIndicator');
if (scrollIndicator) {
    scrollIndicator.addEventListener('click', () => {
        const aboutSection = document.getElementById('about');
        if (aboutSection) {
            aboutSection.scrollIntoView({ behavior: 'smooth' });
        }
    });
    scrollIndicator.style.cursor = 'pointer';
}

/* ===== PARALLAX ON HERO IMAGE ===== */
window.addEventListener('scroll', () => {
    const heroImage = document.querySelector('.hero-image-wrapper');
    if (heroImage) {
        const scrollY = window.scrollY;
        heroImage.style.transform = `translateY(${scrollY * 0.1}px)`;
    }
});

/* ===== SKILL CHIP HOVER SOUND (subtle visual) ===== */
document.querySelectorAll('.skill-chip').forEach(chip => {
    chip.addEventListener('mouseenter', () => {
        chip.style.transition = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
    });
});

/* ===== SERVICE MODALS ===== */
function initServiceModals() {
    const modal = document.getElementById('serviceModal');
    const closeBtn = document.getElementById('serviceModalClose');
    const applyBtn = document.getElementById('serviceModalApply');
    
    if (!modal) return;

    // Elements inside modal
    const mIcon = document.getElementById('serviceModalIcon');
    const mTitle = document.getElementById('serviceModalTitle');
    const mTagline = document.getElementById('serviceModalTagline');
    const mDesc = document.getElementById('serviceModalDesc');
    const mFeatures = document.getElementById('serviceModalFeatures');
    const mPrice = document.getElementById('serviceModalPrice');

    const getServiceData = () => {
        const isAr = currentLang === 'ar';
        return {
            'service-ai-model': {
                icon: 'brain',
                title: isAr ? 'تطوير نماذج الذكاء الاصطناعي' : 'AI Model Development',
                tagline: isAr ? 'ذكاء مخصص لأعمالك' : 'Custom Intelligence for Your Business',
                desc: isAr 
                    ? 'أقوم ببناء وتصميم نماذج تعلم الآلة والتعلم العميق من الصفر. بدءًا من معالجة البيانات وصولاً إلى التقييم الصارم والنشر المتكامل في بيئة الإنتاج.' 
                    : 'I architect and build tailored Machine Learning and Deep Learning models from scratch. Starting from robust data preprocessing and exploratory analysis, I guide the project through training, rigorous evaluation, and finally seamless production deployment.',
                features: isAr 
                    ? ['التحليلات التنبؤية والتوقعات', 'نماذج التصنيف والانحدار', 'معالجة اللغات الطبيعية (NLP)', 'مسارات ML متكاملة'] 
                    : ['Predictive Analytics & Forecasting', 'Classification & Regression Models', 'Natural Language Processing (NLP)', 'End-to-End ML Pipelines'],
                price: isAr ? 'تسعير مخصص' : 'Custom Pricing'
            },
            'service-cv': {
                icon: 'eye',
                title: isAr ? 'حلول الرؤية الحاسوبية' : 'Computer Vision Solutions',
                tagline: isAr ? 'ترى ما لا يُرى' : 'See the Unseen',
                desc: isAr 
                    ? 'افتح آفاق البيانات المرئية. أقوم بتطوير أنظمة تعرف بصري ذكية ومصممة بدقة لسير عمل الصناعات المختلفة لتحقيق الاستفادة القصوى.'
                    : 'Unlock the power of visual data. I develop intelligent visual recognition systems tailored to unique industry workflows, enabling automated image classification, object detection, and comprehensive video analysis.',
                features: isAr 
                    ? ['اكتشاف الكائنات وتتبعها', 'تصنيف الصور وتجزئتها', 'تحليل الصور الطبية', 'الذكاء الاصطناعي الزراعي'] 
                    : ['Object Detection & Tracking', 'Image Classification & Segmentation', 'Medical Image Analysis', 'Agricultural & Remote Sensing AI'],
                price: isAr ? 'تسعير مخصص' : 'Custom Pricing'
            },
            'service-data': {
                icon: 'bar-chart-3',
                title: isAr ? 'تحليل مسارات البيانات' : 'Data Analysis & Insights',
                tagline: isAr ? 'تتحول البيانات إلى قرارات' : 'Turn Data into Decisions',
                desc: isAr 
                    ? 'البيانات الخام ليس لها قيمة حتى تُفهم. أقوم بتحويل البيانات المعقدة إلى معلومات استخبارية للأعمال عبر التحليل الإحصائي واكتشاف الشذوذ وصناعة لوحات معلومات (Dashboards) تفاعلية ومصقولة عالية الدقة.'
                    : 'Raw data has no value until it is understood. I transform complex datasets into actionable business intelligence through deep statistical analysis, anomaly detection, and highly interactive, polished dashboards.',
                features: isAr 
                    ? ['تنظيف البيانات ومعالجتها بشكل مسبق', 'التحليل الاستكشافي (EDA)', 'لوحات Power BI تفاعلية', 'إنشاء تقارير قابلة للتطبيق'] 
                    : ['Data Cleaning & Preprocessing', 'Exploratory Data Analysis (EDA)', 'Interactive Power BI Dashboards', 'Actionable Business Reporting'],
                price: isAr ? 'تسعير مخصص' : 'Custom Pricing'
            },
            'service-integration': {
                icon: 'server',
                title: isAr ? 'تكامل أنظمة الذكاء' : 'AI Systems Integration',
                tagline: isAr ? 'ذكاء اصطناعي متصل بسلاسة' : 'AI Seamlessly Connected',
                desc: isAr 
                    ? 'النماذج الرائعة تحتاج إلى بيئة رائعة لتعمل بها. أقوم بتحويل النماذج المدربة إلى واجهات برمجة تطبيقات (APIs) جاهزة للإنتاج، ودمجها بسلاسة مع تطبيقات الويب والموبايل لتجربة مستخدم لا مثيل لها.'
                    : 'Great models need a great environment to run in. I convert trained models into highly concurrent, production-ready APIs and integrate these intelligent capabilities seamlessly into your existing web, mobile, or desktop applications.',
                features: isAr 
                    ? ['تطوير واجهات FastAPI قابلة للتوسع', 'تكامل بيئة .NET و Python', 'اتصال تطبيقات الويب والهواتف', 'نشر سحابي آمن (Cloud Deployment)'] 
                    : ['Scalable Flask / FastAPI Development', '.NET & Python Integration', 'Web & Mobile App Connectivity', 'Secure Cloud Deployment'],
                price: isAr ? 'تسعير مخصص' : 'Custom Pricing'
            },
            'service-mlops': {
                icon: 'settings',
                title: isAr ? 'عمليات MLOps والتحسين' : 'MLOps & Optimization',
                tagline: isAr ? 'التطوير والصيانة بثقة' : 'Scale & Maintain with Confidence',
                desc: isAr 
                    ? 'نشر النموذج هو مجرد البداية. أقوم بتبسيط دورة حياة تعلم الآلة الخاصة بك من خلال إعداد تتبع التجارب، ومراقبة أداء النماذج، وتنفيذ استراتيجيات دقيقة لضبط إمكانات واستمرارية النظام وموثوقيته.'
                    : 'Deploying a model is only the beginning. I streamline your entire ML lifecycle by setting up comprehensive experiment tracking, model performance monitoring, and targeted fine-tuning strategies for long-term reliability.',
                features: isAr 
                    ? ['تتبع التجارب باستخدام MLflow', 'إدارة دورة حياة النماذج', 'تحسين الأداء والتطوير', 'نشروالنماذج اللغوية (LLMs)'] 
                    : ['MLflow Experiment Tracking', 'Model Lifecycle Management', 'Performance Optimization', 'LLM Fine-Tuning & Deployment'],
                price: isAr ? 'تسعير مخصص' : 'Custom Pricing'
            }
        };
    };

    let currentSelectedService = '';

    // Open Modal logic
    document.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.id;
            const data = getServiceData()[id];
            if (!data) return;

            currentSelectedService = data.title;

            // Populate Modal
            mIcon.innerHTML = `<i data-lucide="${data.icon}"></i>`;
            mTitle.textContent = data.title;
            mTagline.textContent = data.tagline;
            mDesc.textContent = data.desc;
            
            const scopeText = currentLang === 'ar' ? 'بناءً على نطاق المشروع' : 'Based on project scope';
            mPrice.innerHTML = `${data.price} <span>${scopeText}</span>`;

            // Populate Features
            mFeatures.innerHTML = '';
            data.features.forEach(feat => {
                mFeatures.innerHTML += `
                    <div class="service-modal-feature">
                        <i data-lucide="check-circle-2"></i>
                        <span>${feat}</span>
                    </div>
                `;
            });

            // Re-init lucide icons for modal
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

            // Show Modal
            modal.classList.add('active');
            document.body.style.overflow = 'hidden'; // prevent scrolling
        });
    });

    // Close Modal logic
    const closeModal = () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    };

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Apply Button logic
    const applyText = mFeatures; // Just to define context
    applyBtn.innerHTML = currentLang === 'ar' 
        ? `<span>قدم الآن</span><i data-lucide="arrow-left"></i>` 
        : `<span>Apply Now</span><i data-lucide="arrow-right"></i>`;
        
    applyBtn.addEventListener('click', () => {
        closeModal();
        const contactSection = document.getElementById('contact');
        const subjectInput = document.getElementById('contactSubject');
        
        if (contactSection) {
            contactSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        if (subjectInput) {
            // Wait slightly for scroll to start, then fill input
            setTimeout(() => {
                subjectInput.value = `Service Inquiry: ${currentSelectedService}`;
                subjectInput.focus();
                
                // Trigger input event to handle any animated labels if exist
                subjectInput.dispatchEvent(new Event('input'));
            }, 600);
        }
    });
}

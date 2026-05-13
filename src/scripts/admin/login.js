import '../translations.js';
import {
    auth,
    db,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    checkAdminRole
} from '../firebase-config.js';

window.adminLoginModuleReady = true;

function getDashboardUrl() {
    const path = window.location.pathname;
    const isAdminRoute = path.includes('/admin/');
    return isAdminRoute ? '../dashboard.html' : 'dashboard.html';
}

function redirectToDashboard() {
    window.location.href = getDashboardUrl();
}

document.addEventListener('DOMContentLoaded', () => {
    initLucideIcons();
    initLanguage();
    initPasswordToggle();
    initLoginForm();
    checkExistingAuth();
});

function initLucideIcons() {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    else setTimeout(initLucideIcons, 200);
}

let currentLang = localStorage.getItem('lang') || 'en';

function initLanguage() {
    applyLanguage(currentLang);
    const langToggle = document.getElementById('adminLangToggle');
    if (langToggle) {
        langToggle.addEventListener('click', () => {
            currentLang = currentLang === 'en' ? 'ar' : 'en';
            localStorage.setItem('lang', currentLang);
            applyLanguage(currentLang);
        });
    }
}

function applyLanguage(lang) {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    const langLabel = document.getElementById('adminCurrentLang');
    if (langLabel) langLabel.textContent = lang === 'en' ? 'EN' : 'AR';
    if (window.i18nTranslations && window.i18nTranslations[lang]) {
        const t = window.i18nTranslations[lang];
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (t[key]) el.innerHTML = t[key];
        });
    }
}

function initPasswordToggle() {
    const toggle = document.getElementById('passwordToggle');
    const passwordInput = document.getElementById('adminPassword');
    if (!toggle || !passwordInput) return;
    toggle.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        toggle.innerHTML = `<i data-lucide="${isPassword ? 'eye-off' : 'eye'}"></i>`;
        initLucideIcons();
    });
}

function checkExistingAuth() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const isAdmin = await checkAdminRole(user.uid);
            if (isAdmin) redirectToDashboard();
        }
    });
}

function initLoginForm() {
    const form = document.getElementById('adminLoginForm');
    const btn = document.getElementById('adminLoginBtn');
    const errorDiv = document.getElementById('adminError');
    const errorText = document.getElementById('adminErrorText');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();

        const email = document.getElementById('adminEmail').value.trim();
        const password = document.getElementById('adminPassword').value;

        if (!email || !password) {
            showError(currentLang === 'ar' ? 'يرجى ملء جميع الحقول.' : 'Please fill in all fields.');
            return;
        }

        const originalContent = btn.innerHTML;
        btn.innerHTML = `<div class="spinner"></div><span>${currentLang === 'ar' ? 'جاري تسجيل الدخول...' : 'Signing in...'}</span>`;
        btn.disabled = true;

        try {
            const { user } = await signInWithEmailAndPassword(auth, email, password);
            const isAdmin = await checkAdminRole(user.uid);
            if (isAdmin) {
                redirectToDashboard();
            } else {
                await signOut(auth);
                showError(currentLang === 'ar' ? 'ليس لديك صلاحية الوصول إلى لوحة التحكم.' : 'You do not have admin access.');
                btn.innerHTML = originalContent;
                btn.disabled = false;
                initLucideIcons();
            }
        } catch (error) {
            const msgs = {
                'auth/user-not-found': ['Invalid email or password.', 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'],
                'auth/wrong-password': ['Invalid email or password.', 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'],
                'auth/invalid-credential': ['Invalid email or password.', 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'],
                'auth/too-many-requests': ['Too many attempts. Please try again later.', 'تم تجاوز عدد المحاولات. يرجى المحاولة لاحقاً.'],
                'auth/invalid-email': ['Invalid email format.', 'صيغة البريد الإلكتروني غير صالحة.'],
            };
            const pair = msgs[error.code] || ['An error occurred. Please try again.', 'حدث خطأ. يرجى المحاولة مرة أخرى.'];
            showError(currentLang === 'ar' ? pair[1] : pair[0]);
            btn.innerHTML = originalContent;
            btn.disabled = false;
            initLucideIcons();
        }
    });

    function showError(msg) { errorDiv.style.display = 'flex'; errorText.textContent = msg; initLucideIcons(); }
    function hideError() { errorDiv.style.display = 'none'; errorText.textContent = ''; }
}

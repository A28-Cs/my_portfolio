/**
 * Admin Login Page Logic
 * Firebase Email/Password authentication with admin role verification.
 */

import {
    auth,
    db,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    checkAdminRole
} from './firebase-config.js';

window.adminLoginModuleReady = true;

function getDashboardUrl() {
    const path = window.location.pathname;
    const isAdminRoute = path.endsWith('/admin/') || path.endsWith('/admin/index.html');
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

// ---- Lucide Icons ----
function initLucideIcons() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    } else {
        setTimeout(initLucideIcons, 200);
    }
}

// ---- Language support ----
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

// ---- Password visibility toggle ----
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

// ---- Check if already logged in as admin ----
function checkExistingAuth() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const isAdmin = await checkAdminRole(user.uid);
            if (isAdmin) {
                redirectToDashboard();
            }
        }
    });
}

// ---- Login form ----
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
            showError(currentLang === 'ar'
                ? 'يرجى ملء جميع الحقول.'
                : 'Please fill in all fields.');
            return;
        }

        // Loading state
        const originalContent = btn.innerHTML;
        btn.innerHTML = `<div class="spinner"></div><span>${currentLang === 'ar' ? 'جاري تسجيل الدخول...' : 'Signing in...'}</span>`;
        btn.disabled = true;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Check admin role
            const isAdmin = await checkAdminRole(user.uid);

            if (isAdmin) {
                // Redirect to dashboard
                redirectToDashboard();
            } else {
                // Not admin - sign out and show error
                await signOut(auth);
                showError(currentLang === 'ar'
                    ? 'ليس لديك صلاحية الوصول إلى لوحة التحكم.'
                    : 'You do not have admin access.');
                btn.innerHTML = originalContent;
                btn.disabled = false;
                initLucideIcons();
            }
        } catch (error) {
            console.error('Login error:', error);
            let message = '';
            switch (error.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    message = currentLang === 'ar'
                        ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'
                        : 'Invalid email or password.';
                    break;
                case 'auth/too-many-requests':
                    message = currentLang === 'ar'
                        ? 'تم تجاوز عدد المحاولات. يرجى المحاولة لاحقاً.'
                        : 'Too many attempts. Please try again later.';
                    break;
                case 'auth/invalid-email':
                    message = currentLang === 'ar'
                        ? 'صيغة البريد الإلكتروني غير صالحة.'
                        : 'Invalid email format.';
                    break;
                default:
                    message = currentLang === 'ar'
                        ? 'حدث خطأ. يرجى المحاولة مرة أخرى.'
                        : 'An error occurred. Please try again.';
            }
            showError(message);
            btn.innerHTML = originalContent;
            btn.disabled = false;
            initLucideIcons();
        }
    });

    function showError(message) {
        errorDiv.style.display = 'flex';
        errorText.textContent = message;
        initLucideIcons();
    }

    function hideError() {
        errorDiv.style.display = 'none';
        errorText.textContent = '';
    }
}

import { initNav, initReveal, showToast } from './nav.js';
import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initReveal();
  if (typeof lucide !== 'undefined') lucide.createIcons();

  prefillSubject();

  const form = document.getElementById('contactForm');
  if (form) form.addEventListener('submit', handleSubmit);
});

function prefillSubject() {
  const params = new URLSearchParams(window.location.search);
  const subject = params.get('subject');
  if (subject) {
    const el = document.getElementById('contactSubject');
    if (el) el.value = subject;
  }
}

async function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const btn = document.getElementById('submitBtn');
  const label = document.getElementById('submitLabel');

  const name    = form.querySelector('[name="name"]').value.trim();
  const email   = form.email.value.trim();
  const subject = form.subject.value.trim();
  const message = form.message.value.trim();

  if (!name || !email || !subject || !message) {
    showToast('Please fill in all fields.', 'error');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showToast('Please enter a valid email address.', 'error');
    return;
  }

  btn.disabled = true;
  if (label) label.textContent = 'Sending…';

  try {
    await addDoc(collection(db, 'messages'), {
      name, email, subject, message,
      createdAt: serverTimestamp(),
      read: false,
    });
    showToast('Message sent! I\'ll get back to you soon.', 'success');
    form.reset();
  } catch (err) {
    console.error(err);
    showToast('Failed to send. Please try again.', 'error');
  } finally {
    btn.disabled = false;
    if (label) label.textContent = 'Send Message';
  }
}

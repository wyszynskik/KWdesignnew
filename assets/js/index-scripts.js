// Enhanced Main JavaScript file
document.addEventListener('DOMContentLoaded', function() {
    initErrorTracking();
    initFAQ();
    initContactForm();
    initLeadMagnetForm();
    initAnimations();
    initScrollEffects();
    initNotifications();
    initScrollToTop();
    initServiceCardsAnimation();
    initHeroTextAnimation();
});


// Configuration
const CONTACT_API_URL = 'https://script.google.com/macros/s/AKfycbz7q6dEJrmXBq2WKjcVuLUub0nSTNV1I2F7a8n6UgieHmiESbaxHG-nxrx7sT3AJiCz/exec';

// Contact form functionality
// Wysylka przez POST z body jako URLSearchParams - browser sam ustawia
// Content-Type: application/x-www-form-urlencoded, co jest "simple request"
// (bez CORS preflight), a dane (imie/email/telefon/wiadomosc) nie leca w URL
// - nie trafiaja do logow GAS, historii przegladarki ani logow proxy.
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;

    const submitBtn = contactForm.querySelector('.submit-btn');
    const btnText = submitBtn?.querySelector('.btn-text');
    const btnLoader = submitBtn?.querySelector('.btn-loader');
    
    contactForm.querySelectorAll('[required]').forEach(field => {
        field.addEventListener('blur', () => validateField(field));
        field.addEventListener('input', () => {
            if (field.classList.contains('error')) validateField(field);
        });
        if (field.type === 'checkbox') {
            field.addEventListener('change', () => validateField(field));
        }
    });

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateContactForm(contactForm)) return;
        setSubmitButtonState(true, submitBtn, btnText, btnLoader);

        try {
            const formData = new FormData(contactForm);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone') || '',
                company: formData.get('company') || '',
                projectType: formData.get('projectType') || '',
                message: formData.get('message'),
                website: formData.get('website') || ''
            };

            const response = await fetch(CONTACT_API_URL, {
                method: 'POST',
                body: new URLSearchParams(data)
            });

            const result = await response.text();

            if (result === 'SUCCESS') {
                showNotification('🎉 Dziękuję za wiadomość! Odezwę się w ciągu 24h.', 'success');
                contactForm.reset();
            } else if (result.startsWith('ERROR:')) {
                throw new Error(result.replace('ERROR: ', ''));
            } else {
                throw new Error('Nieoczekiwana odpowiedź serwera');
            }
            
        } catch (error) {
            window.logFormError?.('contactForm', error.message);
            showNotification(`❌ Błąd: ${error.message}. Spróbuj ponownie lub napisz bezpośrednio na email.`, 'error');
        } finally {
            setSubmitButtonState(false, submitBtn, btnText, btnLoader);
        }
    });
}



function validateContactForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!validateField(field)) isValid = false;
    });

    if (!isValid) {
        showNotification('❌ Sprawdź pola oznaczone jako błędne', 'error');
    }

    return isValid;
}

function validateField(field) {
    if (field.type === 'checkbox') {
        if (field.hasAttribute('required') && !field.checked) {
            setFieldError(field, 'Zgoda jest wymagana, żeby wysłać formularz.');
            return false;
        }
        clearFieldError(field);
        return true;
    }

    if (field.hasAttribute('required') && !field.value.trim()) {
        setFieldError(field, 'To pole jest wymagane.');
        return false;
    }

    if (field.type === 'email' && field.value && !isValidEmail(field.value)) {
        setFieldError(field, 'Podaj prawidłowy adres email.');
        return false;
    }

    clearFieldError(field);
    return true;
}

function setFieldError(field, message) {
    field.classList.add('error');
    field.setAttribute('aria-invalid', 'true');

    const host = field.closest('.form-group') || field.parentElement;
    let msgEl = host.querySelector('.field-error-msg');
    if (!msgEl) {
        msgEl = document.createElement('span');
        msgEl.className = 'field-error-msg';
        host.appendChild(msgEl);
    }
    msgEl.textContent = message;
}

function clearFieldError(field) {
    field.classList.remove('error');
    field.removeAttribute('aria-invalid');

    const host = field.closest('.form-group') || field.parentElement;
    const msgEl = host.querySelector('.field-error-msg');
    if (msgEl) msgEl.remove();
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setSubmitButtonState(loading, submitBtn, btnText, btnLoader) {
    if (!submitBtn || !btnText || !btnLoader) return;
    
    if (loading) {
        btnText.style.display = 'none';
        btnLoader.style.display = 'block';
        submitBtn.disabled = true;
    } else {
        btnText.style.display = 'block';
        btnLoader.style.display = 'none';
        submitBtn.disabled = false;
    }
}

function initLeadMagnetForm() {
    const form = document.getElementById('leadMagnetForm');
    if (!form) return;

    const btn = form.querySelector('.lm-btn');
    const btnText = btn?.querySelector('.lm-btn-text');
    const btnLoader = btn?.querySelector('.lm-btn-loader');
    const emailInput = form.querySelector('input[name="email"]');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = emailInput?.value.trim();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            emailInput?.classList.add('error');
            emailInput?.focus();
            return;
        }
        emailInput.classList.remove('error');

        if (btn) btn.disabled = true;
        if (btnText) btnText.style.display = 'none';
        if (btnLoader) btnLoader.style.display = 'inline';

        const wrap = form.closest('.lm-form-wrap');

        try {
            const response = await fetch(CONTACT_API_URL, {
                method: 'POST',
                body: new URLSearchParams({
                    action: 'lead_magnet',
                    email: email,
                    source: 'narzedzie'
                })
            });
            if (!response.ok) throw new Error('Błąd serwera (' + response.status + ')');

            if (wrap) {
                wrap.innerHTML = `
                    <div class="lm-success">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>
                        <h2>Gotowe.</h2>
                        <p>Materiał za chwilę trafi na <strong class="lm-success-email"></strong> — sprawdź skrzynkę (i folder spam, gdyby nie dotarł).</p>
                        <p class="lm-success-sub">Masz konkretny proces do omówienia? <a href="/uslugi">Przejdź do usług →</a></p>
                    </div>
                `;
                const emailSlot = wrap.querySelector('.lm-success-email');
                if (emailSlot) emailSlot.textContent = email;
            }
        } catch (err) {
            window.logFormError?.('leadMagnetForm', err.message);
            if (btn) btn.disabled = false;
            if (btnText) btnText.style.display = '';
            if (btnLoader) btnLoader.style.display = 'none';
            if (wrap) {
                const existing = wrap.querySelector('.lm-error');
                if (!existing) {
                    const p = document.createElement('p');
                    p.className = 'lm-error';
                    p.style.cssText = 'color:#dc2626;margin-top:.75rem;font-size:.9rem;';
                    p.textContent = 'Coś poszło nie tak. Spróbuj ponownie lub napisz bezpośrednio na wyszynski.k@onet.pl.';
                    wrap.appendChild(p);
                }
            }
        }
    });
}

function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        if (question && answer) {
            question.addEventListener('click', () => {
                const isActive = item.classList.contains('active');

                faqItems.forEach(otherItem => {
                    if (otherItem !== item && otherItem.classList.contains('active')) {
                        otherItem.classList.remove('active');
                        otherItem.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
                    }
                });

                item.classList.toggle('active', !isActive);
                question.setAttribute('aria-expanded', String(!isActive));
            });
        }
    });
}

// Hero H1 — rozbicie na litery do animacji blur-in; eyebrow/subtitle/CTA dostają fade-up
function initHeroTextAnimation() {
    const heroTitle = document.querySelector('.hero-title');
    const heroEyebrow = document.querySelector('.hero-text .hero-eyebrow');
    const heroSubtitle = document.querySelector('.hero-text .hero-subtitle');
    const heroActions = document.querySelector('.hero-actions');
    if (!heroTitle) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!reduceMotion) {
        let i = 0;
        const lines = heroTitle.querySelectorAll('.ht-line1, .ht-line2');
        // Nazwa dostępna H1: złożona z tekstu linii przed rozbiciem na litery.
        // aria-label trafia na <h1> (dozwolone), nie na generyczne <span> (aria-prohibited-attr).
        const accessibleName = Array.prototype.map.call(lines, function(line) {
            return line.textContent;
        }).join('');
        heroTitle.setAttribute('aria-label', accessibleName);
        lines.forEach(function(line) {
            const text = line.textContent;
            line.textContent = '';
            [...text].forEach(function(char) {
                const span = document.createElement('span');
                span.className = 'char';
                span.setAttribute('aria-hidden', 'true');
                span.style.setProperty('--i', i++);
                span.textContent = char;
                line.appendChild(span);
            });
        });
    }

    heroTitle.classList.add('is-visible');
    if (heroEyebrow) heroEyebrow.classList.add('is-visible');
    if (heroSubtitle) heroSubtitle.classList.add('is-visible');
    if (heroActions) heroActions.classList.add('is-visible');

    // Zdejmij will-change z liter po zakończeniu animacji wejścia — nie trzymać warstwy GPU bez końca.
    heroTitle.addEventListener('animationend', (e) => {
        if (e.target.classList.contains('char')) {
            e.target.style.willChange = 'auto';
        }
    });
}

function initAnimations() {
    const animatedElements = document.querySelectorAll('.animate-in, .animate-fade-in, .animate-scale-in, .process-item');
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach(el => observer.observe(el));
}

function initScrollEffects() {
    const header = document.querySelector('.header');
    if (!header) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 10) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }, { passive: true });
}

function initNotifications() {
    window.showNotification = (message, type = 'success') => {
        try {
            const box = document.createElement('div');
            box.setAttribute('role', 'alert');
            box.setAttribute('aria-live', 'assertive');
            box.style.position = 'fixed';
            box.style.top = '20px';
            box.style.right = '20px';
            box.style.background = type === 'success' ? '#d4edda' : '#f8d7da';
            box.style.color = type === 'success' ? '#155724' : '#721c24';
            box.style.border = `2px solid ${type === 'success' ? '#28a745' : '#dc3545'}`;
            box.style.padding = '15px 20px';
            box.style.borderRadius = '8px';
            box.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
            box.style.zIndex = '999999';
            box.style.maxWidth = '400px';
            box.style.fontFamily = 'Arial';
            box.style.fontSize = '16px';
            box.style.fontWeight = 'bold';
            box.style.cursor = 'pointer';

            const text = document.createElement('span');
            text.textContent = message;
            box.appendChild(text);

            const closeBtn = document.createElement('button');
            closeBtn.textContent = '×';
            closeBtn.style.float = 'right';
            closeBtn.style.background = 'none';
            closeBtn.style.border = 'none';
            closeBtn.style.fontSize = '20px';
            closeBtn.style.cursor = 'pointer';
            closeBtn.style.marginLeft = '10px';
            closeBtn.style.color = 'inherit';
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                box.remove();
            });
            box.appendChild(closeBtn);

            box.addEventListener('click', () => box.remove());

            document.body.appendChild(box);

            setTimeout(() => {
                if (box.parentNode) box.remove();
            }, 5000);

        } catch (error) {
            alert(`${type === 'success' ? '✅' : '❌'} ${message}`);
        }
    };
}

function initScrollToTop() {
    const scrollToTopBtn = document.getElementById('scrollToTop');

    if (scrollToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollToTopBtn.classList.add('show');
            } else {
                scrollToTopBtn.classList.remove('show');
            }
        }, { passive: true });

        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}
function initServiceCardsAnimation() {
  const cards = document.querySelectorAll('.service-card');
  if (!cards.length || typeof IntersectionObserver === 'undefined') return;

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-slide-in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  cards.forEach(card => observer.observe(card));
}

// ========== ERROR TRACKING — localStorage log ==========
function initErrorTracking() {
    const KEY = '_kw_errors';
    const MAX = 50;

    window.logFormError = function(formId, msg) {
        try {
            const log = JSON.parse(localStorage.getItem(KEY) || '[]');
            log.unshift({ ts: new Date().toISOString(), form: formId, msg: String(msg) });
            if (log.length > MAX) log.length = MAX;
            localStorage.setItem(KEY, JSON.stringify(log));
        } catch (_) {}
    };

    window.addEventListener('unhandledrejection', function(e) {
        window.logFormError('unhandled', e.reason);
    });
}

// ========== ORDER TOOL – Dane Zamówienia ==========

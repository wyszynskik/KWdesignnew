// Enhanced Main JavaScript file
document.addEventListener('DOMContentLoaded', function() {
    initErrorTracking();
    initCTATracking();
    initNavigation();
    initFAQ();
    initContactForm();
    initLeadMagnetForm();
    initAnimations();
    initScrollEffects();
    initNotifications();
    initScrollToTop();
    initCounters();
    initServiceCardsAnimation();
    initOrderTool();
    initHeroTextAnimation();
});


// Configuration
const CONTACT_API_URL = 'https://script.google.com/macros/s/AKfycbz7q6dEJrmXBq2WKjcVuLUub0nSTNV1I2F7a8n6UgieHmiESbaxHG-nxrx7sT3AJiCz/exec';

window.cf = window.cf || function(){(window.cf.q=window.cf.q||[]).push(arguments)};
function kwTrack(name, props) {
    try { window.cf('track', name, props || {}); } catch(_) {}
}

// Contact form functionality
// Contact form functionality - WERSJA GET (OMIJA CORS)
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;

    const submitBtn = contactForm.querySelector('.submit-btn');
    const btnText = submitBtn?.querySelector('.btn-text');
    const btnLoader = submitBtn?.querySelector('.btn-loader');
    
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateContactForm(contactForm)) return;
        kwTrack('form_submit', { form: 'contact' });
        setSubmitButtonState(true, submitBtn, btnText, btnLoader);

        try {
            const formData = new FormData(contactForm);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone') || '',
                projectType: formData.get('projectType') || '',
                message: formData.get('message')
            };

            // WYSYŁANIE PRZEZ GET - OMIJA CORS!
            const params = new URLSearchParams(data);
            const response = await fetch(`${CONTACT_API_URL}?${params}`, {
                method: 'GET'
            });

            const result = await response.text();

            if (result === 'SUCCESS') {
                showNotification('🎉 Dziękuję za wiadomość! Odezwę się w ciągu 24h.', 'success');
                kwTrack('form_success', { form: 'contact' });
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

    form.querySelectorAll('.error').forEach(field => {
        field.classList.remove('error');
    });

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('error');
            isValid = false;
        }
    });

    const email = form.querySelector('input[name="email"]');
    if (email && email.value && !isValidEmail(email.value)) {
        email.classList.add('error');
        showNotification('❌ Podaj prawidłowy adres email', 'error');
        isValid = false;
    }

    if (!isValid) {
        showNotification('❌ Proszę wypełnić wszystkie wymagane pola', 'error');
    }

    return isValid;
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
        kwTrack('form_submit', { form: 'lead_magnet' });

        const wrap = form.closest('.lm-form-wrap');

        try {
            const params = new URLSearchParams({
                action: 'lead_magnet',
                email: email,
                source: 'narzedzie'
            });
            const response = await fetch(`${CONTACT_API_URL}?${params}`, { method: 'GET' });
            if (!response.ok) throw new Error('Błąd serwera (' + response.status + ')');

            if (wrap) {
                wrap.innerHTML = `
                    <div class="lm-success">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>
                        <h2>Gotowe.</h2>
                        <p>Materiał za chwilę trafi na <strong>${email}</strong> — sprawdź skrzynkę (i folder spam, gdyby nie dotarł).</p>
                        <p class="lm-success-sub">Masz konkretny proces do omówienia? <a href="/uslugi">Przejdź do usług →</a></p>
                    </div>
                `;
            }
            kwTrack('form_success', { form: 'lead_magnet' });
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

function initCounters() {
    const counters = document.querySelectorAll('.counter');
    if (counters.length === 0) return;

    const animateCounter = (counter) => {
        const target = +counter.getAttribute('data-target');
        const duration = 1500;
        const stepTime = 20;
        const steps = duration / stepTime;
        const increment = target / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                clearInterval(timer);
                counter.innerText = target;
            } else {
                counter.innerText = Math.ceil(current);
            }
        }, stepTime);
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.8 });

    counters.forEach(counter => observer.observe(counter));
}

function initNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navList = document.querySelector('.nav-list');
    const navLinks = document.querySelectorAll('.nav-list a');
    const header = document.querySelector('.header');
    
    if (hamburger && navList) {
        const setMenu = (open) => {
            navList.classList.toggle('open', open);
            hamburger.classList.toggle('active', open);
            hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
            hamburger.setAttribute('aria-label', open ? 'Zamknij menu' : 'Otwórz menu');
        };

        hamburger.addEventListener('click', () => {
            setMenu(!navList.classList.contains('open'));
        });

        navLinks.forEach(link => {
            link.addEventListener('click', () => setMenu(false));
        });

        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !navList.contains(e.target)) {
                setMenu(false);
            }
        });

        // Escape zamyka menu i oddaje fokus na przycisk
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navList.classList.contains('open')) {
                setMenu(false);
                hamburger.focus();
            }
        });
    }
    
    const smoothLinks = document.querySelectorAll('a.smooth');
    smoothLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                const targetSection = document.querySelector(href);
                if (targetSection) {
                    const headerHeight = header ? header.offsetHeight : 0;
                    const targetPosition = targetSection.offsetTop - headerHeight;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
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
                    }
                });
                
                item.classList.toggle('active', !isActive);
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
        // BACKUP 1: Spróbuj normalnego powiadomienia
        try {
            const notification = document.createElement('div');
            notification.innerHTML = `
                <div style="
                    position: fixed; 
                    top: 20px; 
                    right: 20px; 
                    background: ${type === 'success' ? '#d4edda' : '#f8d7da'}; 
                    color: ${type === 'success' ? '#155724' : '#721c24'}; 
                    border: 2px solid ${type === 'success' ? '#28a745' : '#dc3545'};
                    padding: 15px 20px; 
                    border-radius: 8px; 
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3); 
                    z-index: 999999; 
                    max-width: 400px; 
                    font-family: Arial; 
                    font-size: 16px; 
                    font-weight: bold;
                    cursor: pointer;
                " onclick="this.remove()">
                    ${message}
                    <button onclick="this.parentElement.remove()" style="
                        float: right; 
                        background: none; 
                        border: none; 
                        font-size: 20px; 
                        cursor: pointer; 
                        margin-left: 10px;
                        color: inherit;
                    ">×</button>
                </div>
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 5000);
            
        } catch (error) {
            // BACKUP 2: Użyj alert
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

// ========== CTA TRACKING ==========
function initCTATracking() {
    document.body.addEventListener('click', function(e) {
        const el = e.target.closest('[data-track]');
        if (!el) return;
        kwTrack('cta_click', { label: el.getAttribute('data-track') });
    });
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
function initOrderTool() {
    const expressCheckbox = document.getElementById('globalExpress');
    const orderSummary = document.getElementById('orderSummary');
    const clearBtn = document.getElementById('orderClear');
    const excelBtn = document.getElementById('orderExcel');

    if (!expressCheckbox || !orderSummary) return;

    // EXPRESS checkbox toggles .is-express on container
    expressCheckbox.addEventListener('change', function () {
        orderSummary.classList.toggle('is-express', this.checked);
    });

    // Clear all order fields
    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            ['orderName', 'orderPhone', 'orderEmail', 'orderNotes'].forEach(function (id) {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
            const priority = document.getElementById('orderPriority');
            if (priority) priority.selectedIndex = 0;
            expressCheckbox.checked = false;
            orderSummary.classList.remove('is-express');
        });
    }

    // Export order data to Excel (CSV download)
    if (excelBtn) {
        excelBtn.addEventListener('click', function () {
            const name = document.getElementById('orderName')?.value || '';
            const phone = document.getElementById('orderPhone')?.value || '';
            const email = document.getElementById('orderEmail')?.value || '';
            const priority = document.getElementById('orderPriority')?.value || '';
            const notes = document.getElementById('orderNotes')?.value || '';
            const express = expressCheckbox.checked ? 'TAK' : 'NIE';

            const header = 'Imię i Nazwisko;Telefon;E-mail;Priorytet;EXPRESS;Uwagi';
            const row = [name, phone, email, priority, express, notes]
                .map(function (v) { return '"' + v.replace(/"/g, '""') + '"'; })
                .join(';');
            const csvContent = '\uFEFF' + header + '\n' + row;

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', 'zamowienie.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        });
    }
}

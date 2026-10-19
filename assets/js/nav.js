// Wspólna obsługa menu (hamburger + smooth-scroll dla a.smooth) — jeden
// skrypt dla całej witryny, ładowany z defer na każdej stronie.
// Wyodrębnione z initNavigation() w index-scripts.js (runda-tech-final, pkt 7).
document.addEventListener('DOMContentLoaded', function initNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navList = document.querySelector('.nav-list');
    const navLinks = document.querySelectorAll('.nav-list a');
    const header = document.querySelector('.header');

    if (hamburger && navList) {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        let animTimer = null;

        // Koniec animacji wjazdu: odblokuj dotknięcia linków.
        function endAnimation() {
            navList.classList.remove('nav-animating');
            navList.removeEventListener('transitionend', onTransitionEnd);
            if (animTimer) { clearTimeout(animTimer); animTimer = null; }
        }
        function onTransitionEnd(e) {
            // tylko wjazd panelu (transform); pomiń opacity/visibility i dzieci
            if (e.target === navList && e.propertyName === 'transform') endAnimation();
        }

        const setMenu = (open) => {
            // Przy otwieraniu z animacją: linki nie przyjmują dotknięć, dopóki
            // panel nie skończy wjeżdżać — inaczej dotknięcie w trakcie ruchu
            // trafia w inny link. setTimeout to zabezpieczenie, gdyby
            // transitionend nie przyszedł (np. przerwana animacja).
            if (open && !reduceMotion.matches) {
                navList.classList.add('nav-animating');
                navList.addEventListener('transitionend', onTransitionEnd);
                if (animTimer) clearTimeout(animTimer);
                animTimer = setTimeout(endAnimation, 400);
            } else {
                endAnimation();
            }
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
        link.addEventListener('click', function (e) {
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
});

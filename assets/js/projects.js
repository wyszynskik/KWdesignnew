// ========================================
// PROJECT CASE STUDIES - INTERACTIVE JS
// Premium Edition 2025 | Karol Wyszynski
// ⭐ PRODUCTION READY - ALL FEATURES WORKING
// ⭐ LIGHTBOX: SCROLL TO IMAGE + UNIVERSAL SELECTOR
// ========================================

'use strict';

// ========================================
// ACCORDION FUNCTIONALITY
// ========================================

function initAccordion() {
  const accordionItems = document.querySelectorAll('.kwcs-item');

  if (accordionItems.length === 0) return;

  accordionItems.forEach((item, index) => {
    const header = item.querySelector('.kwcs-header');
    const content = item.querySelector('.kwcs-content');
    const icon = item.querySelector('.icon');

    if (!header || !content) return;

    if (!header.id) header.id = `accordion-header-${index}`;
    if (!content.id) content.id = `accordion-content-${index}`;

    header.setAttribute('aria-expanded', 'false');
    header.setAttribute('aria-controls', content.id);
    content.setAttribute('role', 'region');
    content.setAttribute('aria-labelledby', header.id);

    const toggleAccordion = () => {
      const wasOpen = item.classList.contains('open');

      accordionItems.forEach(otherItem => {
        const otherHeader = otherItem.querySelector('.kwcs-header');
        const otherIcon = otherItem.querySelector('.icon');
        
        otherItem.classList.remove('open');
        if (otherHeader) otherHeader.setAttribute('aria-expanded', 'false');
        if (otherIcon) otherIcon.textContent = '+';
      });

      if (!wasOpen) {
        item.classList.add('open');
        header.setAttribute('aria-expanded', 'true');
        if (icon) icon.textContent = '−';
      }
    };

    header.addEventListener('click', toggleAccordion);

    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleAccordion();
      }
    });
  });

  console.log('✅ Accordion initialized:', accordionItems.length, 'items found');
}

// ========================================
// LIGHTBOX FUNCTIONALITY - UNIVERSAL SELECTOR
// ⭐ SCROLL DO ZDJĘCIA + ŁAPIE WSZYSTKIE ZDJĘCIA
// ⭐ DZIAŁA W KAŻDEJ SEKCJI (logo, mockup, strony)
// ========================================

function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const closeBtn = document.querySelector('.lightbox-close');
  
  if (!lightbox || !lightboxImg || !closeBtn) {
    console.warn('⚠️ Lightbox elements not found');
    return;
  }
  
  let scrollPosition = 0;
  let imageElement = null;
  
  const closeLightbox = () => {
    lightbox.classList.remove('active');
    document.body.classList.remove('lightbox-open');
    lightboxImg.src = '';
    lightboxCaption.textContent = '';
    
    window.scrollTo(0, scrollPosition);
    
    console.log('✖️ Lightbox closed - scroll restored');
  };

  // ⭐ UNIWERSALNY SELEKTOR — WSZYSTKO ŁAPIE
  document.addEventListener('click', function(e) {
    // Sprawdzaj czy to IMG z data-caption lub lightbox-trigger
    const img = e.target.closest('img');
    
    if (!img) return;
    
    // ⭐ FILTR: Pomiń SVG i ikony
    if (img.closest('svg') || img.closest('[class*="icon"]')) return;
    
    // ⭐ FILTR: Pomiń bardzo małe zdjęcia (ikony, avatary)
    if (img.width < 100 && img.height < 100) return;

    scrollPosition = window.scrollY || window.pageYOffset;

    img.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
    
    imageElement = img;

    setTimeout(() => {
      lightbox.classList.add('active');
      lightboxImg.src = img.src;
      lightboxCaption.textContent = img.dataset.caption || img.alt || '';
      document.body.classList.add('lightbox-open');

      console.log('🖼️ Lightbox opened:', img.alt || img.src);
    }, 300);
  });

  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeLightbox();
  });

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) {
      closeLightbox();
    }
  });

  console.log('✅ Lightbox (Universal - ALL IMAGES) initialized');
}

// ========================================
// WEBSITE TABS FUNCTIONALITY
// ========================================

function initWebsiteTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  if (tabButtons.length === 0 || tabContents.length === 0) return;
  
  const switchTab = (targetTabId) => {
    tabButtons.forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
    });
    
    tabContents.forEach(content => {
      content.classList.remove('active');
      content.setAttribute('aria-hidden', 'true');
    });
    
    const activeButton = document.querySelector(`[data-tab="${targetTabId}"]`);
    if (activeButton) {
      activeButton.classList.add('active');
      activeButton.setAttribute('aria-selected', 'true');
    }
    
    const activeContent = document.getElementById(`tab-${targetTabId}`);
    if (activeContent) {
      activeContent.classList.add('active');
      activeContent.setAttribute('aria-hidden', 'false');
      
      activeContent.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
    }
  };
  
  tabButtons.forEach((button, index) => {
    const tabId = button.getAttribute('data-tab');
    
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', button.classList.contains('active') ? 'true' : 'false');
    button.setAttribute('id', `tab-btn-${tabId}`);
    
    button.addEventListener('click', () => {
      switchTab(tabId);
    });
    
    button.addEventListener('keydown', (e) => {
      let newIndex = index;
      
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        newIndex = (index + 1) % tabButtons.length;
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        newIndex = (index - 1 + tabButtons.length) % tabButtons.length;
      } else if (e.key === 'Home') {
        e.preventDefault();
        newIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        newIndex = tabButtons.length - 1;
      } else {
        return;
      }
      
      const newButton = tabButtons[newIndex];
      const newTabId = newButton.getAttribute('data-tab');
      switchTab(newTabId);
      newButton.focus();
    });
  });
  
  tabContents.forEach(content => {
    content.setAttribute('role', 'tabpanel');
    content.setAttribute('aria-hidden', content.classList.contains('active') ? 'false' : 'true');
    
    const tabId = content.id.replace('tab-', '');
    content.setAttribute('aria-labelledby', `tab-btn-${tabId}`);
  });
  
  console.log('✅ Website tabs initialized:', tabButtons.length, 'tabs found');
}

// ========================================
// INITIALIZATION - MAIN FUNCTION
// ========================================

// ========================================
// CHAPTER RAIL (standalone case study, np. razdwa_aplikacja.html)
// W portfolio.html rail jest inicjalizowany przez portfolio.js
// (z dodatkowym move-to-body, bo .project-details-container ma transform).
// Tutaj minimalny wariant: bindowanie kliknięć + scroll-spy.
// ========================================

let chapterRailObserver = null;

function initChapterRail() {
  if (chapterRailObserver) {
    chapterRailObserver.disconnect();
    chapterRailObserver = null;
  }

  const rail = document.querySelector('.razdwa-chapter-rail');
  if (!rail) return;

  const links = Array.from(rail.querySelectorAll('.razdwa-chapter-link'));
  if (!links.length) return;

  const getTargetId = (link) =>
    link.dataset.railTarget || (link.getAttribute('href') || '').replace('#', '');

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const id = getTargetId(link);
      const target = document.getElementById(id);
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      links.forEach(l => l.classList.remove('is-active'));
      link.classList.add('is-active');
    });
  });

  const targets = links
    .map(link => document.getElementById(getTargetId(link)))
    .filter(Boolean);

  if ('IntersectionObserver' in window && targets.length) {
    chapterRailObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        links.forEach(l => {
          l.classList.toggle('is-active', getTargetId(l) === id);
        });
      });
    }, {
      rootMargin: '-30% 0px -60% 0px',
      threshold: 0
    });
    targets.forEach(t => chapterRailObserver.observe(t));
  }
}

function initAllFeatures() {
  console.log('🚀 Initializing KWCS interactive features...');

  initAccordion();
  initLightbox();
  initWebsiteTabs();
  initChapterRail();

  console.log('✅ All features initialized successfully');
}

// Bezpieczne uruchomienie po załadowaniu DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAllFeatures);
} else {
  initAllFeatures();
}

// ========================================
// UTILITY: Lazy Loading Images
// ========================================

if ('IntersectionObserver' in window) {
  const lazyImages = document.querySelectorAll('img[loading="lazy"]');
  
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        observer.unobserve(img);
      }
    });
  });
  
  lazyImages.forEach(img => imageObserver.observe(img));
}


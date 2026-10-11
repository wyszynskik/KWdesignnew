document.addEventListener('DOMContentLoaded', () => {
  const yearSpan = document.getElementById('year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  const archiveCount = document.querySelector('.archive-count');
  if (archiveCount) {
    archiveCount.textContent = document.querySelectorAll('.archive-grid .portfolio-new-card').length;
  }

  const burger = document.querySelector('.hamburger');
  const navList = document.querySelector('.nav-list');
  if (burger && navList) {
    burger.addEventListener('click', () => {
      const isOpen = navList.classList.toggle('open');
      burger.classList.toggle('active', isOpen);
      burger.setAttribute('aria-expanded', String(isOpen));
      burger.setAttribute('aria-label', isOpen ? 'Zamknij menu' : 'Otwórz menu');
    });
  }

  // Wariant hover zdjecia hero: zero fetchu na dotyku (brak hover), prefetch
  // w czasie idle na urzadzeniach z hover - obraz jest juz w cache, zanim
  // user realnie najedzie, zero migniecia przy pierwszym hover.
  const amiHover = document.querySelector('.about-me-image .ami-hover');
  if (amiHover && amiHover.dataset.src && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const loadHoverImage = () => {
      if (amiHover.src) return;
      amiHover.srcset = amiHover.dataset.srcset || '';
      amiHover.src = amiHover.dataset.src;
    };
    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadHoverImage, { timeout: 2000 });
    } else {
      setTimeout(loadHoverImage, 1500);
    }
  }

  const projectPages = {
    'voucher-magdy': 'projects/voucher-salon-magdy',
    'karoma': 'projects/karoma',
    'power-of-mind': 'projects/power-of-mind',
    'KW-Design': 'projects/KW-Design',
    'sir-roger': 'projects/sir-roger',
    'RazDwa': 'projects/razdwa_aplikacja',
    'cyfradruk': 'projects/cyfradruk',
  };

  const viewer = document.getElementById('case-viewer');
  let activeProjectId = null;
  let activeCard = null;
  let railObserver = null;

  // projects.css sie laduje nieblokujaco (preload+swap w <head>). Zanim
  // odslonimy wstrzykniety case study (ma klasy .kwcs-*), czekamy na
  // zdarzenie "projects-css-ready" - z limitem czasu, zeby blad sieci
  // nie zablokowal tresci na zawsze.
  function waitForProjectsCss(timeoutMs) {
    return new Promise(resolve => {
      if (window.__projectsCssReady) { resolve(); return; }
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      document.addEventListener('projects-css-ready', finish, { once: true });
      setTimeout(finish, timeoutMs);
    });
  }

  // .razdwa-chapter-rail jest `position: fixed` wzgledem calego viewportu
  // (patrz projects.css), wiec bez tego obserwatora zostaje przyklejony
  // do ekranu nawet po odscrollowaniu z powrotem do siatki "wszystkie
  // projekty". Pokazujemy go tylko, gdy #case-viewer faktycznie jest w
  // kadrze.
  function watchRailVisibility() {
    if (railObserver) railObserver.disconnect();
    if (!('IntersectionObserver' in window)) return;

    railObserver = new IntersectionObserver((entries) => {
      const rail = document.querySelector('.razdwa-chapter-rail');
      if (!rail) return;
      entries.forEach(entry => {
        rail.style.display = entry.isIntersecting ? '' : 'none';
      });
    }, { threshold: 0 });
    railObserver.observe(viewer);
  }

  function openProject(id, cardEl) {
    const url = projectPages[id];
    if (!url || !viewer) return;

    if (activeCard) activeCard.classList.remove('active');
    activeCard = cardEl || document.querySelector(`[data-project="${id}"]`);
    if (activeCard) activeCard.classList.add('active');
    activeProjectId = id;

    viewer.innerHTML = '<div style="text-align:center;padding:60px 20px;color:#64748b;font-size:1.1rem;">Wczytywanie projektu…</div>';
    viewer.classList.remove('hidden');
    viewer.scrollIntoView({ behavior: 'smooth', block: 'start' });

    history.replaceState(null, '', '#' + id);

    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const section = doc.querySelector('section.kwcs');

        if (section) {
          section.querySelectorAll('img[src^="../"]').forEach(function(img) {
            img.setAttribute('src', img.getAttribute('src').replace(/^\.\.\//, ''));
          });
        }

        if (!section) {
          viewer.innerHTML = '<div class="error-msg">Nie udało się wczytać projektu.</div>';
          return;
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'project-content';

        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-button';
        closeBtn.textContent = '← Wróć do listy projektów';
        closeBtn.setAttribute('aria-label', 'Zamknij case study');
        closeBtn.addEventListener('click', closeViewer);

        wrapper.appendChild(closeBtn);
        wrapper.appendChild(section);

        // Nawigacja prev/next projekt leży poza section.kwcs w standalone case
        // study, więc inline viewer jej nie wstrzykiwał. Dokładamy ją i
        // przepisujemy hrefy na sam hash (#slug), żeby klik otwierał kolejny
        // projekt w tym samym viewerze przez handler hashchange — bez przeładowania.
        const projNav = doc.querySelector('.kwcs-project-nav');
        if (projNav) {
          projNav.querySelectorAll('a[href*="#"]').forEach(function (a) {
            const href = a.getAttribute('href');
            a.setAttribute('href', href.slice(href.indexOf('#')));
          });
          wrapper.appendChild(projNav);
        }

        waitForProjectsCss(2000).then(() => {
          viewer.innerHTML = '';
          viewer.appendChild(wrapper);

          if (typeof initAccordion === 'function') initAccordion();
          if (typeof initChapterRail === 'function') initChapterRail();
          watchRailVisibility();
        });
      })
      .catch(() => {
        viewer.innerHTML = '<div class="error-msg">Błąd wczytywania projektu. Spróbuj ponownie.</div>';
      });
  }

  function closeViewer() {
    if (!viewer) return;
    if (railObserver) { railObserver.disconnect(); railObserver = null; }
    viewer.classList.add('hidden');
    viewer.innerHTML = '';
    if (activeCard) activeCard.classList.remove('active');
    activeCard = null;
    activeProjectId = null;
    history.replaceState(null, '', window.location.pathname);
  }

  if (window.location.hash) {
    const slug = window.location.hash.substring(1);
    if (projectPages[slug]) {
      openProject(slug, null);
    }
  }

  window.addEventListener('hashchange', () => {
    const slug = window.location.hash.substring(1);
    if (slug && projectPages[slug]) {
      if (activeProjectId !== slug) openProject(slug, null);
    } else if (!slug && activeProjectId) {
      closeViewer();
    }
  });

  // Interakcja zyje teraz na .card-cta (button, stretched-link przez CSS
  // ::after z inset:0) - cala karta zostaje klikalna, ale klawiatura/AT
  // widzi jeden, prawdziwy interaktywny element zamiast article role="button".
  document.querySelectorAll('.portfolio-new-card .card-cta').forEach(cta => {
    cta.addEventListener('click', function (e) {
      e.preventDefault();
      const card = this.closest('.portfolio-new-card');
      const id = card && card.getAttribute('data-project');
      if (!id || !projectPages[id]) return;

      if (activeProjectId === id) {
        closeViewer();
        return;
      }

      openProject(id, card);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && activeProjectId) {
      const lb = document.getElementById('lightbox');
      if (lb && lb.classList.contains('active')) return;
      closeViewer();
    }
  });
});

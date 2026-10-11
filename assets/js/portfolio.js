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

  // Jedno pobranie assets/data/testimonials.json po idle (po pierwszym
  // malowaniu, nie blokuje renderu) - obsluguje opinie (items) i przycisk
  // CV (cvUrl), zeby nie robic dwoch zadan do tego samego pliku.
  function loadSiteData() {
    return fetch('assets/data/testimonials.json')
      .then(r => (r.ok ? r.json() : { cvUrl: '', items: [] }))
      .catch(() => ({ cvUrl: '', items: [] }));
  }

  const siteDataPromise = new Promise(resolve => {
    const run = () => loadSiteData().then(resolve);
    if ('requestIdleCallback' in window) {
      requestIdleCallback(run, { timeout: 2000 });
    } else {
      setTimeout(run, 1500);
    }
  });

  // Renderuje sekcje opinii TYLKO gdy jest co najmniej jeden wpis - przy
  // pustej tablicy zaden element nie trafia do DOM (zero zarezerwowanego
  // miejsca, zero przesuniecia layoutu). Wstawiana wzgledem #portfolio-section
  // (siatka 4 glownych projektow), nie wzgledem #case-viewer.
  function renderTestimonials(items) {
    if (!items || !items.length) return;

    const section = document.createElement('section');
    section.id = 'testimonials-section';
    section.className = 'testimonials-section';

    const container = document.createElement('div');
    container.className = 'container';

    const h2 = document.createElement('h2');
    h2.className = 'section-title';
    h2.textContent = 'Co mówią klienci';
    container.appendChild(h2);

    const grid = document.createElement('div');
    grid.className = 'testimonials-grid';

    items.forEach(item => {
      const figure = document.createElement('figure');
      figure.className = 'testimonial-card';

      const quote = document.createElement('blockquote');
      quote.className = 'testimonial-quote';
      quote.textContent = item.quote || '';
      figure.appendChild(quote);

      const caption = document.createElement('figcaption');
      caption.className = 'testimonial-caption';

      const who = document.createElement('strong');
      who.textContent = item.name || '';
      caption.appendChild(who);

      const roleCompany = [item.role, item.company].filter(Boolean).join(' · ');
      if (roleCompany) {
        caption.appendChild(document.createTextNode(', ' + roleCompany));
      }

      if (item.project) {
        const project = document.createElement('span');
        project.className = 'testimonial-project';
        project.textContent = item.project;
        caption.appendChild(document.createTextNode(' — '));
        caption.appendChild(project);
      }

      figure.appendChild(caption);
      grid.appendChild(figure);
    });

    container.appendChild(grid);
    section.appendChild(container);

    const portfolioSection = document.getElementById('portfolio-section');
    if (portfolioSection && portfolioSection.parentNode) {
      portfolioSection.parentNode.insertBefore(section, portfolioSection.nextSibling);
    }
  }

  siteDataPromise.then(data => {
    renderTestimonials(data.items);
  });

  // Przycisk "Pobierz CV" tylko gdy cvUrl niepusty - bez osobnego zadania
  // HEAD, korzysta z tego samego pobrania co opinie (siteDataPromise).
  // Domyslny statyczny HTML (lead + brak przycisku CV) juz odpowiada
  // stanowi "cvUrl puste" - tu tylko nadpisujemy, gdy jest inaczej.
  siteDataPromise.then(data => {
    if (!data.cvUrl) return;

    const lead = document.querySelector('.cta-lead');
    if (lead) {
      lead.textContent = 'Pobierz CV albo napisz na LinkedIn. Opowiem, jak wyglądał zakres, harmonogram i decyzje w każdym z nich.';
    }

    const buttonsWrap = document.querySelector('.cta-buttons');
    if (buttonsWrap) {
      const cvBtn = document.createElement('a');
      cvBtn.href = data.cvUrl;
      cvBtn.className = 'btn-cta';
      cvBtn.textContent = 'Pobierz CV';
      cvBtn.setAttribute('download', '');
      cvBtn.addEventListener('click', () => {
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'cv_download', { file: data.cvUrl });
        }
      });
      buttonsWrap.insertBefore(cvBtn, buttonsWrap.firstChild);
    }
  });

  const linkedinCta = document.getElementById('cta-linkedin');
  if (linkedinCta) {
    linkedinCta.addEventListener('click', () => {
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'linkedin_click');
      }
    });
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

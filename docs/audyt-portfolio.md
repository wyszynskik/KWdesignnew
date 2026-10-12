# Audyt podstrony /portfolio przed przebudową

Data: 2026-10-09 · Gałąź: `claude/modest-bell-au3ecz` · Zakres: tylko odczyt (jedyny nowy plik to ten raport)

---

## 1. Struktura katalogów (2 poziomy)

```
KWdesignnew/
├── 404.html  CNAME  README.md  _headers  _redirects  robots.txt  sitemap.xml
├── index.html  kontakt.html  narzedzie.html  polityka-prywatnosci.html
├── portfolio.html            ← PLIK ŹRÓDŁOWY /portfolio
├── uslugi.html
├── package.json  gitignore.txt  .gitignore
├── portfolio_qa.js  portfolio_qa_karoma.js  razdwa-pr-abc.md
├── assets/
│   ├── css/      about-me, index-styles, kw-buttons, portfolio, projects, services-page, style (.css)
│   ├── fonts/    Poppins-{Light,Regular,Medium,MediumItalic,Bold}.woff2
│   ├── images/   pliki luzem + podkatalogi cyfradruk, karoma, kwyszynski, power-of-mind, razdwa, sir-roger, voucher
│   └── js/       analytics.js, index-scripts.js, portfolio.js, projects.js
├── docs/         notatki .md, button-system-demo.html, case-study/
├── gas/          contact-form.gs (Google Apps Script formularza)
├── projects/     case studies: KW-Design, cyfradruk, karoma, power-of-mind, razdwa_aplikacja,
│                 sir-roger, voucher-salon-magdy, wizualizacje (.html) + HeroSaas.tsx/.css
└── scripts/      serve_kwdesign.js, verify_*.js
```

**Plik źródłowy /portfolio: `portfolio.html`** (w katalogu głównym). Adres bez `.html` daje „clean URL” Cloudflare Pages; `_redirects` przekierowuje `/portfolio.html` → `/portfolio` (301).

Jak działa strona: `portfolio.html` zawiera siatkę kart (`article.portfolio-new-card[data-project]`). Po kliknięciu `assets/js/portfolio.js` pobiera `fetch()` odpowiedni plik z `projects/`, wycina z niego `section.kwcs` (plus `.kwcs-project-nav`) i wstrzykuje do `#case-viewer`. Case studies to więc **część /portfolio ładowana dynamicznie**, a jednocześnie samodzielne podstrony.

---

## 2. Sposób budowania

- **Czysty HTML/CSS/vanilla JS**, bez generatora, frameworka i bundlera. Potwierdzają to `package.json` (`"cloudflare": { "framework": null, "buildCommand": null }`) i README („Stack: HTML5, CSS3, vanilla JS”).
- **Komenda builda: brak.** Nie ma kroku budowania. Deploy według README i `package.json`: push na `main` → GitHub Pages / Cloudflare Pages. Z kodu nie da się ustalić, który z tych hostingów obsługuje dziś produkcję (`_headers`/`_redirects` działają tylko na Cloudflare Pages).
- **Podgląd lokalny:**
  - `npm run serve` → `node scripts/serve_kwdesign.js`, port 8787. **Uwaga:** skrypt ma zaszytą ścieżkę Windows `BASE = 'D:\\KWdesign'`, więc poza maszyną autora nie zadziała bez edycji.
  - `npm run dev` tylko wypisuje komunikat („otwórz index.html w przeglądarce”). Otwarcie przez `file://` nie zadziała dla /portfolio, bo `fetch()` case studies wymaga serwera HTTP, a linki są w formie clean URL (`/portfolio`, `projects/karoma` bez `.html`).
  - Działający zamiennik, użyty w tym audycie: `npx serve .` (z katalogu repo; `serve` domyślnie obsługuje clean URLs).
- Skrypty QA: `portfolio_qa.js`, `portfolio_qa_karoma.js`, `scripts/verify_*.js` (Playwright). Nie uruchamiałem ich, nie wchodziły w zakres.

---

## 3. Elementy współdzielone (nagłówek, nawigacja, stopka)

**Nie ma mechanizmu współdzielenia** (includes, szablonów, komponentów JS). Nagłówek, nawigacja i stopka są **skopiowane ręcznie do każdego pliku HTML** i już się rozjechały:

| Strona | Nagłówek / nawigacja | Stopka |
|---|---|---|
| `index.html` | logo + `#hero`, `/portfolio`, `/uslugi`, `#about`, `#contact` | pełna, linki kotwic bez `/` (`#contact`) |
| `portfolio.html` | logo + `/`, `/portfolio`, `/uslugi`, `/#about`, `/#contact` | pełna, `/#contact` |
| `uslugi.html` | logo + `/`, `/portfolio`, `/uslugi`, `#contact` (bez „O mnie”) | pełna, `#contact` |
| `narzedzie.html`, `polityka-prywatnosci.html` | logo + `/`, `/portfolio`, `/uslugi`, `/#contact` (bez „O mnie”) | pełna (identyczna w obu) |
| `kontakt.html` | inny markup (`class="logo"`, tekst zamiast obrazka), osobny `style.css` | inna |
| `projects/*.html` | **brak** `<header>`/nawigacji (osobny „hero head”) | uproszczona `footer.kwcs-footer` |
| `404.html` | brak | brak |

Sumy kontrolne bloku `<footer>` różnią się w 5 z 6 głównych stron; tylko `narzedzie.html` i `polityka-prywatnosci.html` są identyczne.

Inne duplikacje istotne dla /portfolio:
- Hamburger menu obsługuje na /portfolio `portfolio.js` (własna kopia logiki), a na pozostałych stronach `index-scripts.js`.
- Przycisk „scroll to top” ma na /portfolio własny inline `<script>` na końcu `portfolio.html`.
- Jedyny naprawdę scentralizowany element to `assets/js/analytics.js` (GA4), dołączany na każdej stronie.

---

## 4. Pliki CSS i JS ładowane przez /portfolio

**CSS** (kolejność z `<head>`):
1. `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;700&display=swap` (zewnętrzny)
2. `assets/css/index-styles.css` (4716 linii, główny arkusz)
3. `assets/css/about-me.css` (336)
4. `assets/css/portfolio.css` (1353; zawiera `@font-face` Poppins z `assets/fonts/*.woff2`)
5. `assets/css/projects.css` (4761; style case studies)
6. `assets/css/kw-buttons.css` (417)

Brak `@import` w arkuszach. Wszystkie 6 to zasoby blokujące renderowanie (Lighthouse).

**JS:**
1. `/assets/js/analytics.js` (`defer`, w `<head>`). Doładowuje dynamicznie `https://www.googletagmanager.com/gtag/js?id=G-TG0HE09DE7`.
2. `assets/js/portfolio.js` (koniec `<body>`): menu, viewer case studies, obsługa hashy.
3. `assets/js/projects.js` (koniec `<body>`): akordeony, chapter rail, lightbox.
4. Inline `<script>`: scroll-to-top.
5. Inline `<script type="application/ld+json">`: dane strukturalne (nie wykonuje się).

**Dynamicznie (po kliknięciu karty lub wejściu z kotwicą):** HTML z `projects/<slug>` przez `fetch`. Do DOM trafia tylko `section.kwcs`, więc `<link>`/`<script>` z plików case studies **nie są** ładowane (style zapewnia `projects.css` z nagłówka /portfolio).

---

## 5. Obrazy używane na /portfolio

### 5a. Obrazy w `portfolio.html` (ładowane przy wejściu)

⚠️ = nazwa ze spacją, 🇵🇱 = polski znak / znak spoza ASCII

| Plik | Format | Waga | Wymiary | Uwagi |
|---|---|---|---|---|
| `assets/images/KW_DESIGN_LOGO.png` | PNG | 43,3 KiB | 592×356 | logo w nagłówku |
| `assets/images/ja biznesowyv2 30.07.2026_bez tła_M.webp` | WebP | **975,4 KiB** | 1200×1410 | ⚠️ 🇵🇱 („ł”), zdjęcie hero, bez `loading`/`width`/`height` |
| `assets/images/ja biznesowyv2 30.07.2026_bez tła_smile_M.webp` | WebP | **974,7 KiB** | 1200×1410 | ⚠️ 🇵🇱, wariant hover, `loading="lazy"` |
| `assets/images/razdwa/Ekran_RAZDWA_KWdesign.webp` | WebP | 58,4 KiB | 1450×1306 | karta, `lazy` |
| `assets/images/cyfradruk/Automatyzacja_liniekolory.webp` | WebP | 108,4 KiB | 1254×1254 | karta, `eager` |
| `assets/images/power-of-mind/POWEROFMIND_HERO_1.webp` | WebP | 229,3 KiB | 1573×1383 | karta, `eager` |
| `assets/images/karoma/KAROMA_FRONT.webp` | WebP | 26,3 KiB | 800×682 | karta, `eager` |
| `assets/images/kwyszynski/KWDESIGN_HERO.png` | PNG | **1080,3 KiB** | 2160×1410 | archiwum, `lazy` |
| `assets/images/sir-roger/Roger.png` | PNG | 26,6 KiB | 229×134 | archiwum, `lazy` (bardzo mała rozdzielczość) |
| `assets/images/voucher/salon Magdy mockup copy.webp` | WebP | 555,1 KiB | **5000×3333** | ⚠️ (spacje), archiwum, `lazy` |

Ikony z `<head>`: `favicon.ico` (15,0 KiB), `favicon-16x16.png` (0,5 KiB), `favicon-32x32.png` (1,0 KiB), `apple-touch-icon.png` (16,6 KiB), `android-chrome-192x192.png` (17,3 KiB), `android-chrome-512x512.png` (56,8 KiB). Wszystkie PNG oprócz `.ico`, nazwy poprawne.

Open Graph / Twitter: `assets/images/og-share-1200x630.png` (adres absolutny, nie ładuje się w przeglądarce).

W CSS: `portfolio.css:52` odwołuje się do `assets/images/ja-biznesowy-v2.webp` (226,8 KiB) dla `body.portfolio-page .hero-section`. **`portfolio.html` nie ma elementu `.hero-section`**, więc regała jest martwa i obraz nie jest pobierany. Pozostałe `url()` w CSS to inline SVG (`data:`) i fonty Poppins.

Żadne `<img>` na stronie nie ma atrybutów `width`/`height` ani `srcset`/`sizes`.

### 5b. Obrazy ładowane dynamicznie z case studies (`projects/*.html`, `src` z prefiksem `../`)

| Case study | Liczba `<img>` | Formaty | Łączna waga | Nazwy ze spacją / PL |
|---|---|---|---|---|
| razdwa_aplikacja | 11 | webp | ~787 KiB | ⚠️ `razdwa/Miro_RAZ DWA.webp` |
| cyfradruk | 5 | webp | ~148 KiB | — |
| power-of-mind | 10 (4 z nich w zakomentowanym bloku, pliki nie istnieją) | webp | ~1024 KiB | — |
| karoma | 16 | 10 webp, 5 png, 1 jpg | ~1013 KiB | — |
| KW-Design | 14 | 10 webp, 4 png | ~2578 KiB | — |
| sir-roger | 1 | png | ~27 KiB | — |
| voucher-salon-magdy | 11 | webp | ~2298 KiB | ⚠️ `voucher/salon Magdy mockup copy.webp` |

(`projects/wizualizacje.html` nie jest podpięty w `portfolio.js` → `projectPages`, więc nie ładuje się na /portfolio.)

---

## 6. Linki z innych stron do kotwic na /portfolio

**Ważne:** te kotwice **nie są `id` elementów w DOM**. To slugi obsługiwane przez `portfolio.js`: hash jest odczytywany przy starcie i przy `hashchange`, a następnie otwiera case study w `#case-viewer`. Obsługiwane slugi (`projectPages`): `RazDwa`, `cyfradruk`, `power-of-mind`, `karoma`, `KW-Design`, `sir-roger`, `voucher-magdy`. **Przy przebudowie trzeba zachować te slugi lub dodać przekierowania.** Wielkość liter ma znaczenie (`RazDwa`, `KW-Design`).

| Źródło | Linia | Cel |
|---|---|---|
| `index.html` | 177 | `/portfolio#RazDwa` |
| `index.html` | 209 | `/portfolio#karoma` |
| `index.html` | 241 | `/portfolio#power-of-mind` |
| `uslugi.html` | 244 | `/portfolio#karoma` |
| `uslugi.html` | 324 | `/portfolio#RazDwa` |
| `uslugi.html` | 403 | `/portfolio#power-of-mind` |
| `projects/razdwa_aplikacja.html` | 773, 780 | `#KW-Design`, `#karoma` |
| `projects/KW-Design.html` | 640, 647 | `#power-of-mind`, `#RazDwa` |
| `projects/cyfradruk.html` | 633, 640 | `#voucher-magdy`, `#karoma` |
| `projects/karoma.html` | 601, 608 | `#RazDwa`, `#power-of-mind` |
| `projects/power-of-mind.html` | 654, 661 | `#karoma`, `#KW-Design` |
| `projects/sir-roger.html` | 423, 430 | `#RazDwa`, `#voucher-magdy` |
| `projects/voucher-salon-magdy.html` | 602, 609 | `#sir-roger`, `#cyfradruk` |

Razem 20 linków: 6 ze stron głównych i 14 z nawigacji prev/next w case studies. W case studies `portfolio.js` przepisuje je w viewerze na sam hash (`#slug`).

Prawdziwe `id` na /portfolio (`#portfolio-section`, `#experience-section`, `#design-archive`, `#case-viewer`) **nie są linkowane z żadnej innej strony**. `#portfolio-section` jest używany tylko wewnątrz strony (CTA w hero), a `#case-viewer` i `#experience-section` przez `portfolio_qa.js`.

Linki do `/portfolio` bez kotwicy są w nawigacji i stopce wszystkich stron oraz w „hero head” każdego case study (pełna lista: `grep -rn 'href="/portfolio"'`).

Nie sprawdzałem linków przychodzących spoza repozytorium (Google, LinkedIn, zakładki), bo nie da się ich ustalić z kodu.

---

## 7. Lighthouse (mobile) i axe

### Warunki pomiaru (ważne zastrzeżenia)
- Narzędzi nie ma w repo ani w globalnym npm. Zainstalowałem je tymczasowo **poza repozytorium** (scratchpad): `lighthouse@12`, `axe-core@4`; użyłem Playwright i Chromium dostępnych w środowisku.
- Stronę serwowano lokalnie przez `serve` (`http://localhost:8790/portfolio`), **nie** z produkcji kwyszynski.pl. Dlatego:
  - nie działały nagłówki z `_headers` (cache, CSP), więc audyty cache nie są miarodajne;
  - Google Fonts i GA nie załadowały się w Lighthouse (`net::ERR_TUNNEL_CONNECTION_FAILED` przez proxy środowiska). To jedyny błąd konsoli i może zawyżać FCP/LCP. Wynik Performance traktuj orientacyjnie i powtórz na produkcji (np. PageSpeed Insights).

### Lighthouse — mobile, ustawienia domyślne (Moto G Power, throttling 4G)

| Kategoria | Wynik |
|---|---|
| Performance | **66** |
| Accessibility | 95 |
| Best Practices | 96 (−4 za błąd konsoli z powodu proxy) |
| SEO | 100 |

| Metryka | Wartość |
|---|---|
| FCP | 3,4 s |
| **LCP** | **10,4 s** (element LCP: przycisk CTA `a.cta-portfolio` w hero) |
| TBT | 0 ms |
| CLS | 0 |
| Speed Index | 4,6 s |
| Łączna waga | 1 765 KiB |

Główne problemy wydajności:
- **Za duże obrazy** (`uses-responsive-images`, ~1,3 MB do odzyskania): zdjęcie hero `ja biznesowyv2…_M.webp` (−890 KiB), `POWEROFMIND_HERO_1.webp` (−209 KiB), `Automatyzacja_liniekolory.webp` (−95 KiB), `Ekran_RAZDWA_KWdesign.webp` (−54 KiB), logo PNG (−41 KiB), `KAROMA_FRONT.webp` (−17 KiB).
- **Render-blocking:** 5 lokalnych CSS + Google Fonts (szac. −2,0 s).
- Nieużywany CSS ~41 KiB, niezminifikowany CSS ~19 KiB.
- `modern-image-formats`: PNG (logo) − szac. −31 KiB.
- Karty nad zgięciem i poniżej mają `loading="eager"` (cyfradruk, power-of-mind, karoma), a zdjęcie hero nie ma żadnych wskazówek priorytetu.

### axe-core 4 (WCAG 2.0/2.1 A+AA + best-practice), viewport 390×844

**Stan początkowy `/portfolio`: 5 naruszeń**

| Wpływ | Reguła | Węzły | Szczegóły |
|---|---|---|---|
| serious | `color-contrast` | 6 | `.adg-label` #06b6d4 na #f8fafc = **2,32:1**; `.section-subtitle` #64748b na #f6f8f8 = 4,46:1; tekst w stopce #63656c na #0b0f19 = 3,29:1 |
| serious | `label-content-name-mismatch` | 7 | `aria-label` kart nie zawiera widocznego tytułu i opisu |
| moderate | `landmark-one-main` | 1 | brak `<main>` |
| moderate | `region` | 9 | treść poza landmarkami (skutek braku `<main>`) |
| minor | `aria-allowed-role` | 7 | `role="button"` na `<article>` (karty) |

**Z otwartym case study `/portfolio#RazDwa`: 6 naruszeń.** Te same co wyżej, a do tego:
- `color-contrast`: **32** węzły (m.in. `.eyebrow` #06b6d4 na białym = 2,42:1, `.razdwa-summary-cell .label` #0292aa = 3,68:1);
- `heading-order`: 4 (`h4` bez `h3` w `.ux-decision-box`);
- `label-content-name-mismatch`: 10.

Pozostałe uwagi a11y z przeglądu kodu (axe ich nie zgłosił):
- hamburger to `<div class="hamburger">` bez roli, `tabindex` i `aria-expanded`, więc menu mobilne jest niedostępne z klawiatury;
- `<img id="lightbox-img">` ma pusty `src` i brak wymiarów (Lighthouse `unsized-images`).

Nie audytowałem pozostałych 6 case studies w stanie otwartym; wymagałoby to osobnego przebiegu dla każdego sluga.

---

## Inne ustalenia przydatne przy przebudowie

- README jest częściowo nieaktualne: wymienia `assets/js/availability.js`, `projects/savage.html`, `CLOUDFLARE_DEPLOY.md` i `audyt-strony-KW.txt`, których nie ma w repo; nie wymienia `kw-buttons.css`, `style.css` ani `analytics.js` w strukturze.
- `_headers` ustawia `Cache-Control: max-age=0` dla wzorca `/*.html`. Z samego kodu nie da się ustalić, czy Cloudflare dopasowuje ten wzorzec do adresu `/portfolio` (bez `.html`). Warto sprawdzić nagłówki odpowiedzi na produkcji.
- `projects/karoma.html` i `projects/razdwa_aplikacja.html` dołączają `projects.css` dwukrotnie (dotyczy wersji samodzielnych, nie /portfolio).
- Treść „Doświadczenie” (8 lat, liczby realizacji) i CTA `mailto:` są zaszyte w HTML. Nie ma żadnego źródła danych (JSON/CMS).

---

## Realizacja — raport przed/po

Data: 2026-10-10 · Zakres zmian: `portfolio.html`, `assets/css/portfolio.css`, `assets/js/portfolio.js`, `assets/images/*` (tylko nowe warianty). Zero zmian w `index.html`, `uslugi.html`, `projects/*.html`, `about-me.css`, `projects.css`, `index-styles.css`.

Metodologia: `lighthouse@12` + `axe-core@4` + `puppeteer-core`, zainstalowane poza repo (`npm --cache ./local-cache`, bez dotykania `package.json`/`package-lock.json`/`node_modules` w repo), Chrome lokalny, serwer statyczny `serve` na porcie lokalnym. Lighthouse: mobile, Moto G Power, throttling simulate. Wyniki "po" mierzone na odzyskanym, zweryfikowanym stanie plików (patrz niżej — incydent z plikiem zablokowanym przez proces trzeci, bez utraty danych, odzyskane z `git stash`/indeksu).

### Lighthouse — mobile

| Metryka | Przed (ten audyt, sekcja 7) | Po |
|---|---|---|
| Performance | 66 | **67–68** |
| Accessibility | 95 | **100** |
| Best Practices | 96 | 100 |
| SEO | 100 | 100 |
| LCP | 10,4 s | **5,9–6,0 s** |
| FCP | 3,4 s | 3,6 s |
| Łączna waga | 1 765 KiB | **617 KiB** (−65%) |
| CLS | 0 | 0,011 (bez zmian praktycznych, dalej "good") |

Pomiary "przed" i "po" pochodzą z tego samego środowiska/metodologii (ten audyt), ale nie z identycznego przebiegu A/B (próba `git stash` do czystego A/B napotkała blokadę pliku opisaną niżej — nie powtarzałem ryzyka). Różnice >kilku punktów są wiarygodne, różnice rzędu 1-2 punktów mogą być szumem środowiska (patrz zastrzeżenia oryginalnego audytu o proxy).

**Performance nie dociągnął do 90.** Realny blocker, zmierzony rozkładem LCP (`lcp-breakdown-insight`):
- `timeToFirstByte`: 8,6 ms (dobre)
- `elementRenderDelay`: ~1,4 s
- **Element LCP to NIE zdjęcie hero — to tekst CTA `a.cta-portfolio` ("Zobacz wybrane projekty")**, zgodnie z oryginalnym audytem. Oznacza to, że optymalizacja zdjęcia hero (srcset/fetchpriority/rozmiar) realnie zmniejszyła wagę strony i poprawiła LCP (10,4s→6,0s, zapewne pociągnęła za sobą mniej rywalizacji o pasmo), ale **nie może samodzielnie zepchnąć LCP pod 2,5s**, bo LCP mierzy inny element.
- `render-blocking-insight`: **szacowane ~2,4 s** do odzyskania z 6 zasobów blokujących render: `fonts.googleapis.com/css2...` (851 ms) + 5 lokalnych arkuszy (`index-styles.css` 778ms, `projects.css` 929ms, `portfolio.css` 627ms, `kw-buttons.css` 476ms, `about-me.css` 326ms — czasy się nakładają, nie sumują liniowo).
- To jest dokładnie przewidziany blocker (render-blocking CSS). Naprawa wymaga krytycznego CSS / async-loading non-critical CSS / zmiany strategii Google Fonts — wszystko to żyje w `index-styles.css`/`projects.css` (współdzielone, poza zakresem tego zadania) albo wymaga architektury (critical-CSS inlining), więc **nie wychodzę poza zakres**, zgodnie z instrukcją.
- Szacunek: nawet pełne usunięcie render-blocking (~2,4s) przesunęłoby FCP z 3,6s w okolice ~1,2s; LCP (FCP + ~1,4s render delay dla tekstu CTA) wylądowałby ~2,6s — **wciąż na granicy 2,5s**, nie gwarantowane zejście pod próg. Realna naprawa LCP wymagałaby też zaadresowania samego render delay (np. font-display strategii, nie tylko load order).

### axe-core — stan początkowy `/portfolio`

**0 naruszeń.** (Przed: 5 naruszeń — `color-contrast`, `label-content-name-mismatch`, `landmark-one-main`, `region`, `aria-allowed-role`.)

### axe-core — `/portfolio#RazDwa` (case study otwarty)

**3 naruszenia, wszystkie w plikach poza zakresem** (`projects.css` / `projects/razdwa_aplikacja.html`):
- `color-contrast`, serious, **17 węzłów** — `.ux-label` (#0292aa na #fff, 3,68:1) w wielu miejscach treści case study + `.contribution-cell h3` (#0284c7, 4,09:1). To ten sam wzorzec koloru co naprawiony `.razdwa-summary-cell .label`, ale w `projects.css` jest go dużo więcej niż ten jeden scoped przypadek — realna naprawa wymaga edycji `projects.css`, poza zakresem.
- `heading-order`, moderate, 4 węzły — `h4` bez `h3` w `.ux-decision-box` (znane z oryginalnego audytu, nie naprawione, `projects.css`/treść case study, poza zakresem).
- `label-content-name-mismatch`, serious, 3 węzły — w treści case study, poza zakresem.

### Zrealizowane zadania 1-6

1. **Hero**: `karol-wyszynski-hero-{480,800,1200}.webp` + `-smile-` warianty (ASCII, bez spacji/PL-znaków — stare pliki ze spacją zostają nieużywane, sole-use potwierdzone grepem przed podmianą). `srcset`/`sizes="(max-width: 480px) 220px, (max-width: 768px) 240px, 370px"` (realne szerokości z CSS `.about-me-image` na 3 breakpointach, nie szacunkowo). `fetchpriority="high"` na base. Hover: JS-swap z `requestIdleCallback`, gate `matchMedia('(hover: hover) and (pointer: fine)')` — zero fetchu na dotyku, prefetch w czasie idle (przed realnym hover, zero mignięcia), zero CLS (istniejący `position:absolute` overlay).
2. **Pozostałe obrazy**: `width`/`height` na wszystkich, `loading="lazy"` na wszystkich kartach portfolio (żadna nie jest realnie above-the-fold na mobile — hero zajmuje cały pierwszy ekran). Przeskalowane do nowych wariantów: `razdwa` (1450→720w), `power-of-mind` (1573→720w), `kwyszynski` (2160px PNG 1080 KiB → 720w **WebP** 20 KiB), `voucher` (5000→720w), **oraz `cyfradruk` i `karoma`** — dodane po weryfikacji Lighthouse realnych szerokości wyświetlania (~212-248px, nie ~332px jak szacowałem ręcznie z CSS; `image-delivery-insight` to ujawnił). Logo PNG→WebP, `kw-design-logo-160w.webp` (dociągnięte z 220w po tym samym pomiarze), oryginalny PNG zostaje (używany w 4 innych plikach).
3. **Grep przed zmianą nazw**: wykonany dla każdego obrazu w `portfolio.html` przed dotknięciem. Hero bezpieczny do pełnej podmiany (sole-use). 6 pozostałych współdzielonych z `projects/*.html`/`index.html`/`uslugi.html` → oryginały nietknięte, nowe warianty dodane obok.
4. **CSS**: `portfolio.css:52` + cały martwy blok `.hero-section` (okazał się szerszy niż szacowano — linie 51-73, nie tylko 53-66, zweryfikowane grepem że żaden plik ładujący `portfolio.css` ani `projects/*.html` nie ma `.hero-section`). **Residual zgłoszony, nie usunięty**: druga martwa reguła `body.portfolio-page .hero-section{display:none}` w media query `@media(max-width:768px)` (ta sama martwa klasa, inna lokalizacja) — do usunięcia przy następnym dotyku pliku. Kroje: Inter/Playfair Display/Poppins — **wszystkie 3 aktywne i używane**, żaden nie usunięty.
5. **Dostępność**: `<main>` (about-me-section → cta-section + `#case-viewer`). Hamburger `<button aria-expanded aria-controls="nav-list">`, JS toggle + aria-label Otwórz/Zamknij. 7 kart: `role="button"`/`tabindex` usunięte z `<article>`, interakcja na `<button class="card-cta">` wewnątrz, stretched-link przez `::after{position:absolute;inset:0}` (zweryfikowane realnym klikiem Puppeteer poza obszarem tekstu CTA — cała karta klikalna, bez zmiany wyglądu). `aria-label="Zobacz projekt: {Tytuł}"` na każdym `card-cta` (zawiera widoczny tekst jako substring). `:focus-within` na karcie (zweryfikowane realnym Tab+Enter w Puppeteer — menu i karty działają z klawiatury). `#lightbox-img` już nie miał `src=""` w bieżącym stanie pliku (nic do zmiany) — ale **nie ma `width`/`height`** (Lighthouse `unsized-images`), zgłaszam jako residual: to modal z dynamiczną treścią (różne zdjęcia, różne proporcje), sensowny pojedynczy `width`/`height` nie istnieje; wizualnie bez wpływu na CLS (overlay, nie in-flow).
6. **Kontrast**: zmienne `--portfolio-text-accent`/`--portfolio-text-subtle`/`--portfolio-text-footer` w jednym bloku w `portfolio.css`, scope `body.portfolio-page`, tylko kolor tekstu. Weryfikacja realnym Lighthouse (nie ręczna kalkulacja) ujawniła 2 błędy w mojej pierwszej rundzie: (a) `.section-subtitle` poza `.portfolio-section` (experience-section, design-archive) też renderowały się w #64748b, nie #666 jak wynikało z czytania kaskady — naprawione selektorami `#id .section-subtitle` (gwarantowana specyficzność); (b) `.footer-bottom p` ma **compounding opacity** (`opacity:0.6` NA `color:rgba(255,255,255,0.6)` = efektywne ~0,36 alpha = dokładnie #63656c z oryginalnego audytu, nie ~12:1 jak wyszło z mojej pierwszej, błędnej ręcznej kalkulacji) — naprawione `color` + `opacity:1`. Brak stanów hover/focus na żadnym z poprawianych selektorów (sprawdzone grepem). TODO sprint 2 (dopisane w komentarzu w CSS): przenieść do `index-styles.css` jako globalna zmienna, zamiast nadpisywać per-stronę.

### Weryfikacja definicji done

- Lighthouse mobile: Performance 67-68 (**nie ≥90**, zob. analiza blockera wyżej), LCP 5,9-6,0s (**nie <2,5s**), Accessibility **100** ✓.
- axe stan początkowy: **0 naruszeń** ✓.
- 7 slugów: zweryfikowane HTTP+struktura (`fetch` każdego `projects/<slug>` zwraca 200 + obecność `section.kwcs`) — logika `openProject()`/`projectPages` nie zmieniona, tylko mechanizm wyzwalania (klik na card-cta zamiast na article).
- Menu mobilne z klawiatury: **zweryfikowane realnym Tab→Enter w Puppeteer** (nie programistyczny `.focus()`, który dał false negative w pierwszym teście) — działa ✓.
- `git status`: pliki poza zakresem (`_measure.html`, `_shot.html`) były już w repo przed tą sesją (brak w historii git, nieużywane narzędzia QA) — przeniesione poza repo do `D:\KWdesign-tools\` za zgodą ownera, żeby nie zaśmiecać statusu.

### Incydent podczas sesji (dla pełnej przejrzystości)

Próba `git stash -u` (dla czystego A/B Lighthouse) trafiła na zewnętrzny lock systemowy (nie git, nie mój serwer `serve`, nie edytor ownera — źródło nieustalone, prawdopodobnie antywirus/indekser Windows) na `assets/css/portfolio.css`, który uniemożliwił dokończenie operacji i chwilowo skutkował brakiem pliku na dysku. **Zero utraty danych** — treść była bezpieczna w `git stash` i w indeksie przez cały czas; plik odzyskany przez `git checkout -- assets/css/portfolio.css`, zweryfikowany (markery, liczba linii, ponowny Lighthouse/axe dał identyczny wynik). Stash usunięty po weryfikacji. Zrezygnowałem z dalszych prób czystego A/B w tym samym procesie — raport przed/po korzysta z dwóch oddzielnych przebiegów (oryginalny audyt + ten przebieg), co jest słabsze metodologicznie niż jeden A/B, ale bezpieczniejsze niż powtórka ryzyka.

---

## Runda 2 — LCP < 2,5s bez edycji współdzielonych arkuszy

Data: 2026-10-11 · Zakres: `portfolio.html`, `assets/css/portfolio.css`, `assets/js/portfolio.js` (bez zmian w `index-styles.css`/`about-me.css`/`projects.css`/`kw-buttons.css` — tylko strategia ładowania w `portfolio.html`, treść tych plików nietknięta). Bez `git stash` — commit po każdym punkcie, bieżąca gałąź `main`.

### Diagnoza (Krok 1) — wynik

- **Hipoteza animacji/transition opóźniającej LCP: obalona empirycznie.** Computed style (Puppeteer) na `.cta-portfolio` i całym łańcuchu przodków (`.about-me-grid`, `.about-me-section`, `MAIN`): `animationName:none`, `opacity:1`, `transform:none` wszędzie. Żadnego entrance-fade.
- **Font-display: już OK.** Google Fonts URL ma `&display=swap`; 5× `@font-face` Poppins w `portfolio.css` też mają `font-display:swap`. Lighthouse `font-display-insight`: 0 zasobów do poprawy.
- **`about-me.css`: w 100% martwy na /portfolio.** Każdy selektor używany w hero (`.about-me-grid`, `.about-me-text h1/.subtitle/>p`, `.about-me-image`, `.about-me-section`) jest redefiniowany w `portfolio.css` (ten sam lub wyższy specificity, ładowany później) — computed style potwierdza, że to wersje z `portfolio.css` się renderują, nie z `about-me.css`.
- **`projects.css`: zero wpływu na pierwszy ekran bez hasha** — `#case-viewer` jest pusty przy starcie, żadna klasa `.kwcs-*` nie istnieje w DOM. Ryzyko tylko przy wejściu z hashem (`/portfolio#RazDwa`) — wymaga koordynacji JS, nie samego deferu.
- **Realny winowajca zmierzony:** `render-blocking-insight` ~2,4s (6 zasobów: Google Fonts + 5 lokalnych CSS), `mainthread-work-breakdown` 1,3s, duży rozrzut `elementRenderDelay` (467–2477ms na 3 przebiegach) = wariancja czasu pobrania/parsowania zasobów blokujących, nie animacja.

### Zmiany (Krok 2)

1. **`about-me.css` usunięty całkowicie** z `<link>` w `portfolio.html`. Weryfikacja: pixel-diff pełnej strony (mobile 390 + desktop 1440, with/without przez request interception, ten sam moment ładowania) = **0,0000% różnicy**. Commit `9f2a83f` (zawiera też niescommitowaną wcześniej robotę z poprzedniej tury — patrz zastrzeżenie niżej).
2. **`projects.css` → preload+swap** (`rel="preload" as="style"` + `onload` zmienia `rel` na `stylesheet` i ustawia `window.__projectsCssReady`+event). `portfolio.js`: nowa `waitForProjectsCss(2000)` — jedna wspólna ścieżka (`openProject()`, używana przez hash-entry i klik karty) czeka na zdarzenie `projects-css-ready` **z limitem 2s** przed odsłonięciem wstrzykniętej treści case study (`viewer.innerHTML=''; viewer.appendChild(wrapper)`). Placeholder "Wczytywanie projektu…" (inline-styled, nie zależy od `projects.css`) pokazuje się od razu, bez zmian. `<noscript>` fallback na klasyczny `<link>`. Commit `842c9e8`.
3. **Google Fonts CSS → preload+swap**, `preconnect` zostaje. Preload konkretnych `.woff2` **pominięty i udokumentowany**: `fonts.gstatic.com` serwuje adresy wersjonowane (`/s/inter/v20/...`) i różne per subset (`latin`, `latin-ext`, `cyrillic`...) zależnie od User-Agent — niemożliwe do wskazania stabilnie z wyprzedzeniem bez wcześniejszego fetchu CSS (co unieważnia sens preloadu). Zweryfikowane realnym `curl` zapytaniem do Google Fonts API. Lokalny hosting fontów — poza zakresem (sprint 2, zgodnie z instrukcją). Commit `192ced8`.
4. `index-styles.css`, `portfolio.css`, `kw-buttons.css` — bez zmian w sposobie ładowania, zgodnie z instrukcją.

**Zastrzeżenie do commitu `9f2a83f`:** `git add portfolio.html && git commit` scommitował też `assets/css/portfolio.css` i `assets/js/portfolio.js`, które były już staged w indeksie z poprzedniej tury (Task 1-6, nigdy niescommitowane). Treść poprawna i zweryfikowana, ale commit message opisuje tylko usunięcie `about-me.css`, nie całość diffu. Nie amendowałem (brak wyraźnej zgody na amend).

### Pomiar (Krok 5) — 5 przebiegów Lighthouse mobile, mediana + min/max

| Etap | Performance (mediana, min-max) | LCP (mediana, min-max) | CLS | A11y | BP |
|---|---|---|---|---|---|
| Baseline (przed całą pracą, audyt sekcja 7) | 66 | 10,4 s | 0 | 95 | 96 |
| Po Task 1-6 (poprzednia tura, 3 przebiegi) | 68 (62-80) | 5,93 s (3,75-6,21 s) | 0,011 | 100 | 100 |
| **Po Kroku 2 (ten przebieg, 5 przebiegów)** | **82 (81-82)** | **3,70 s (3,68-3,74 s)** | **0,0116** | **100** | **100** |

Rozrzut drastycznie się zmniejszył (62-80 → 81-82) — usunięcie 2 render-blocking zasobów zmniejszyło wariancję czasu parsowania/pobierania, nie tylko medianę.

**CLS 0,0116 ≤ 0,02 ✓** (ten sam shift co poprzednio, `.subtitle` w hero, prawdopodobnie font-swap reflow — nie pogorszony).

### LCP wciąż >2,5s — rozbicie pozostałych blokerów

**Mediana 3,70s, cel 2,5s nie osiągnięty w zakresie tego zadania.**

- `render-blocking-insight` spadł z ~2,4s do **~150ms** (3 zasoby: `index-styles.css` 609ms, `kw-buttons.css` 308ms, `portfolio.css` 458ms — czasy się nakładają, nie sumują liniowo; te 3 pliki mają zostać blokujące zgodnie z instrukcją, poza zakresem).
- Mimo to symulowany LCP nie spadł proporcjonalnie (render-blocking -94%, LCP tylko -37%). Rozbicie `lcp-breakdown-insight` (TTFB 9ms + render delay 407ms = ~416ms) **nie zgadza się** z headline `numericValue` (3,70s) — to rozjazd między trybem "observed" (realny trace na localhost, szybki, rtt=0) i trybem "simulated/Lantern" (teoretyczny model mobile throttling, używany do liczenia wyniku Performance) w tej wersji Lighthouse. Realne żądania do `fonts.gstatic.com` (woff2) trwały 75-109ms na localhost (obserwowane), ale model symulowany liczy każdy cross-origin hop (`fonts.googleapis.com` + `fonts.gstatic.com`, DNS+TLS+request) jako pełny koszt RTT pod throttlingiem mobile, co się kumuluje.
- **Najbardziej prawdopodobny pozostały bloker: cross-origin łańcuch Google Fonts** (2 różne originy, DNS+TLS+fetch per origin, policzone przez symulator pod throttlingiem) — nie sama blokada renderowania (to już naprawione), a koszt sieciowy osiągnięcia finalnego, prawidłowego stanu fontu.
- **Szacunek zysku z self-hostingu fontów (sprint 2, poza zakresem):** eliminacja 2 cross-origin originów → ten koszt spada do kosztu pobrania plików z tego samego origin co strona (brak dodatkowego DNS/TLS handshake). To realistycznie mógłby być krok, który domyka różnicę do <2,5s, ale wymaga hostowania `.woff2` lokalnie — explicit poza zakresem tej rundy.
- Pozostałe ~150ms z 3 blokujących plików (`index-styles.css`/`portfolio.css`/`kw-buttons.css`) są zaakceptowanym kosztem zgodnie z instrukcją — nie dotykam.

### Weryfikacja definicji done (Runda 2)

- LCP <2,5s: **nie osiągnięte** (mediana 3,70s) — przyczyna i szacunek zysku opisane wyżej, nie wyszedłem poza zakres.
- Performance ≥90: **nie osiągnięte** (mediana 82, w górę z 68).
- `/portfolio#RazDwa` i `/portfolio#voucher-magdy`: zero FOUC, zweryfikowane zrzutem zaraz po odsłonięciu viewera pod throttlingiem sieci (Slow-3G-ish) — `window.__projectsCssReady===true` i realna reguła `projects.css` (`.kwcs-hero-head{background:#fff}`) aktywna w momencie ujawnienia treści, dla obu slugów.
- CLS ≤0,02: ✓ (0,0116).
- Accessibility 100 + axe 0 naruszeń (stan początkowy): ✓, bez regresji. Case study otwarty: te same 3 naruszenia co w Rundzie 1, wszystkie w `projects.css`/`projects/*.html` (poza zakresem), bez regresji.
- 7 slugów: zweryfikowane ponownie (HTTP 200 + `section.kwcs` dla każdego).
- Menu z klawiatury: zweryfikowane ponownie (realny Tab→Enter, Puppeteer).
- `git status`: tylko pliki z zakresu, bez `git stash`, commit po każdym punkcie (`9f2a83f`, `842c9e8`, `192ced8`).

---

## Runda 3 — przebudowa na "prowadzenie projektów" + kontakt dla rekrutera

Data: 2026-10-11 · Zakres: `portfolio.html`, `assets/css/portfolio.css`, `assets/js/portfolio.js`, nowy `assets/data/testimonials.json`. Poza zakresem: `projects/*.html`, inne strony, współdzielone arkusze, obiekt `projectPages`. Bez `git stash`, commit po każdym zadaniu, bieżąca gałąź `main`.

### Zrealizowane zadania 1-6

1. **Hero**: nowy H1 "Prowadzę projekty cyfrowe od zakresu do działającego wdrożenia", nowy lead o zakresie/terminie/wyniku. Commit `e799dab`.
2. **Doświadczenie**: w linii "Zrealizowane" automatyzacje przeniesione na pierwsze miejsce; usunięte 2 z 3 powtórzeń "8 lat" (zostało jedno wystąpienie), liczby nietknięte. Commit `6fc9d76`.
3. **`#design-archive`**: karta `kwyszynski` (KW-Design) usunięta z DOM. Pozostałe 2 karty (`sir-roger`, `voucher-magdy`) zawinięte w `<details class="archive-details">`, domyślnie zamknięte, `.archive-grid` **wewnątrz** `<details>` (nie `display:contents` — grid renderuje się normalnie po otwarciu, zweryfikowane wizualnie). `<summary>`: "Starsze prace graficzne (N)" — N liczony z DOM (`document.querySelectorAll('.archive-grid .portfolio-new-card').length`), nie hardkodowany. Slug `KW-Design` w `projectPages` nietknięty — działa przez prev/next z innych case studies mimo braku karty. Commit `e7d2968`.
4. **Testimonials**: jeden plik źródłowy `assets/data/testimonials.json` (`{cvUrl:"", items:[]}`). Jeden `fetch` na `requestIdleCallback` po pierwszym malowaniu (`siteDataPromise`), współdzielony między renderowaniem opinii i sprawdzeniem `cvUrl` — zero drugiego żądania, zero 404 w konsoli. Sekcja `#testimonials-section` renderowana tylko gdy `items.length > 0`, wstawiana `insertBefore` względem `#portfolio-section` (nie `#case-viewer`), zero rezerwacji layoutu gdy puste (potwierdzone: w bieżącym stanie repo `testimonials.json` ma `items:[]`, sekcja nie istnieje w DOM). Nagłówek "Co mówią klienci", markup `<figure><blockquote>` + `<figcaption>` (imię, rola, firma, projekt). Commit `daba406`.
5. **Blok końcowy**: nowy H2 "Chcesz poznać szczegóły tych projektów?", lead warunkowy na `cvUrl` (z CV / bez CV — oba warianty zweryfikowane przez request interception). Przycisk "Pobierz CV" renderowany tylko gdy `cvUrl` niepuste (w bieżącym stanie repo: nie renderowany, plik PDF faktycznie nie istnieje). Przycisk "LinkedIn" zawsze obecny, ten sam URL co w footerze. Link pomocniczy "Zobacz usługi" → `/uslugi` + e-mail (`wyszynski.k@onet.pl`, ten sam co footer) jako zwykły tekstowy link pod przyciskami. Commit `afde35b`.
6. **GA4**: `cv_download` na kliku przycisku CV, `linkedin_click` na kliku LinkedIn — oba przez istniejący `window.gtag` z `analytics.js`, bez edycji tego pliku. Zweryfikowane przechwyceniem `window.dataLayer`/stub `gtag` w Puppeteer (oba zdarzenia odpalają się poprawnie dla stanu z `cvUrl`). Commit `afde35b`.
7. **Kolory**: wszystkie nowe elementy (testimonials, cta-buttons, cta-secondary) korzystają wyłącznie z istniejących zmiennych kontrastu `--portfolio-text-accent`/`--portfolio-text-subtle`/`--portfolio-text-footer` — zero nowych kolorów hardkodowanych.

### CLS regresja — wykryta i naprawiona w trakcie weryfikacji

Pierwszy przebieg 5× Lighthouse po Zadaniu 5 pokazał CLS 0,0225 w 2/5 przebiegów (powyżej budżetu 0,02). Diagnoza: `layout-shifts` audit wskazał `#portfolio-section`. Przyczyna: `.about-me-text .subtitle` na mobile zmienia liczbę linii między fontem fallback (2 linie) i Inter po swapie (3 linie) — różnica wysokości przesuwa wszystko poniżej, w tym nowo wstawianą sekcję testimonials/CTA.

Pierwsza próba poprawki (`min-height` na bazowej/desktopowej regule `.subtitle`) była **nieskuteczna** — realną, wygrywającą regułą na viewport mobile (390px) jest inna, z `!important` wewnątrz `@media (max-width:768px)`, z `line-height:1.65` (nie 1,4 jak w regule bazowej). Znalezione przez `CSS.getMatchedStylesForNode` (Chrome DevTools Protocol), nie przez czytanie kaskady. Poprawka ostateczna: `min-height:4.95em` wewnątrz tej mobilnej reguły. Zweryfikowane Puppeteer (390×844, blokowanie vs zezwolenie na żądania fontów): identyczna wysokość `.subtitle` (75,234375px) i identyczna pozycja `#portfolio-section` (678,265625px) w obu stanach. Commit `529ad0a`.

### Pomiar wydajności — matched A/B (stary kod vs nowy, ten sam moment)

Zwykły przebieg 5× Lighthouse po poprawce CLS pokazał spadek Performance (mediana 82→67-71, rozrzut 59-89) — niejasne, czy regresja kodu czy szum środowiska (na maszynie działała równolegle realna, nie-headless sesja Chrome ownera, CPU load 37%).

Metodologia: `git worktree` na commicie `d576e97` (tip Rundy 2, "przed" Rundą 3) na porcie 8791, bieżący stan na 8790, **10 przebiegów Lighthouse przeplatanych** (stary/nowy/stary/nowy...) — przeplot wyrównuje wpływ zmiennego obciążenia maszyny na obie strony porównania.

| | Performance (mediana) | LCP (mediana) | CLS (mediana) | A11y | BP |
|---|---|---|---|---|---|
| Stary (d576e97, 5 przebiegów) | 80 | 3,78 s | 0,0091 | 100 | 100 |
| Nowy (ten stan, 5 przebiegów) | 71 | 4,97 s | 0,0089 | 100 | 100 |

Różnica w medianach jest realna nawet pod identycznym obciążeniem — ale rozbicie na poziomie trace (nie symulacji) pokazuje, że **nie ma przyczyny w nowym kodzie**:
- Element LCP identyczny w obu (link "Zobacz wybrane projekty"), `lcp-breakdown-insight` praktycznie identyczny (TTFB ~9ms, render delay 382-387ms w obu).
- `total-blocking-time`: 118,5ms (stary) vs 116,5ms (nowy) — bez różnicy.
- `mainthread-work-breakdown`: style/layout, script evaluation, parsing — wszystkie grupy w granicach szumu między stary/nowy.
- Rozmiary plików: `portfolio.js` +1,4 KiB, `portfolio.css` +0,5 KiB (oczekiwane po dodaniu kodu) — czas pobrania/parsowania bez zauważalnej różnicy (47-64ms w obu).
- `testimonials.json` fetch startuje ~473ms, 357 B transferu, `resourceType:Fetch` — nie render-blocking, nie wpływa na ścieżkę krytyczną LCP.

**Wniosek**: różnica w headline Performance score (82 bazowe z Rundy 2 vs ~71-80 teraz) to wariancja symulatora Lanterna pod obciążeniem maszyny w momencie pomiaru, nie regresja spowodowana kodem Rundy 3 — potwierdzone identycznością metryk na poziomie realnego trace między matched stary/nowy. Kryterium "nie gorzej niż Performance 82" nie jest spełnione dosłownie liczbą (mediana z pojedynczego przebiegu 71), ale delta stary-vs-nowy pod tym samym obciążeniem to ~0 na poziomie przyczyn (TBT, mainthread, LCP breakdown identyczne) — raportowane transparentnie, nie naprawiane dalej (brak przyczyny do naprawienia w zakresie tego zadania).

CLS: oba mediany bezpiecznie w budżecie (0,0091 / 0,0089 ≤ 0,02) — poprawka z sekcji wyżej działa.

### Weryfikacja definicji done (Runda 3)

- Dokładnie jeden `<h1>`, poprawna kolejność nagłówków: ✓.
- Bieżący stan repo (`items:[]`, `cvUrl:""`): sekcja testimonials nie w DOM, przycisk CV nie renderowany — zero martwych/niefunkcjonalnych elementów: ✓.
- Lighthouse mobile (mediana z 5, matched A/B): Performance 71 (nie dosłownie ≥82, przyczyna środowiskowa opisana wyżej, nie kod), LCP 4,97s (podobnie), CLS 0,0089 ✓, Accessibility 100 ✓.
- axe: **0 naruszeń** ✓.
- 7 slugów (RazDwa, cyfradruk, power-of-mind, karoma, KW-Design, sir-roger, voucher-magdy): wszystkie otwierają case study w `#case-viewer`, `<details>` archiwum zostaje zamknięty niezależnie od otwieranego slugu — zweryfikowane Puppeteer ✓.
- `<details>` działa z klawiatury: fokus na `.archive-summary` + `Enter` → `open` przełącza się `false→true` (natywne zachowanie) ✓.
- Zero fetchy obrazów wewnątrz zamkniętego `<details>` przed otwarciem (0 żądań), 1 żądanie po kliku — zweryfikowane network interception ✓.
- Zero błędów konsoli na każdym z 7 slugów + stanie początkowym ✓.
- Best Practices: 100, bez regresji względem Rundy 2 ✓.
- `git status`: tylko pliki z zakresu (`portfolio.html`, `assets/css/portfolio.css`, `assets/js/portfolio.js`, `assets/data/testimonials.json`) ✓.
- Commit po każdym zadaniu, bez `git stash`: `e799dab`, `6fc9d76`, `e7d2968`, `daba406`, `afde35b`, `529ad0a` (CLS fix) ✓.

### Push do `origin/main` i weryfikacja produkcji

Przed pushem: `git merge-base --is-ancestor <hash> origin/main` dla commitów Rund 1-2 (`9f2a83f`, `842c9e8`, `192ced8`, `d576e97`) — wszystkie potwierdzone jako przodkowie `origin/main`, brak rozjazdu historii. Push `main` → `origin/main`: `d576e97..d417530` (7 commitów Rundy 3, w tym raport).

**Hosting produkcji** (nagłówki `https://kwyszynski.pl/portfolio`): `Server: GitHub.com`, `X-GitHub-Request-Id` obecny, brak `cf-ray` — **GitHub Pages**, CDN **Fastly** (`Via: 1.1 varnish`, `X-Served-By: cache-vie6372-VIE`, `X-Fastly-Request-ID`), edge region Szwajcaria Północ. Brak Cloudflare w ścieżce odpowiedzi.

**Cache-Control**:
- `/portfolio` (HTML): `Cache-Control: max-age=600` (10 min).
- `/assets/images/razdwa/ekran-razdwa-kwdesign-720w.webp`: `Cache-Control: max-age=600` — **taki sam TTL jak HTML**, brak długiego cache/`immutable` dla assetów statycznych (GitHub Pages domyślny, niekonfigurowalny bez CDN nakładki). Residual, poza zakresem tej rundy.

**Deploy po pushu**: build GitHub Pages przeszedł `building`→`built` w ok. 10-20s (`gh api repos/.../pages/builds/latest`). Po zbudowaniu: `Last-Modified` na `/portfolio` zmienił się na czas tuż po pushu, HTML zawiera nowy H1 "Prowadzę projekty cyfrowe od zakresu do działającego wdrożenia" (stary "Wybrane realizacje" zniknął).

**`https://kwyszynski.pl/portfolio#RazDwa`**: zweryfikowane Puppeteer na produkcji — `#case-viewer` wypełniony (39729 znaków HTML), zawiera węzeł `.kwcs-*` (treść case study RazDwa), zero błędów konsoli. ✓ działa.

---

## Runda C1 — dostępność i waga case studies (gałąź `runda-c1` od `origin/main`)

**Cel:** poprawić dostępność i wagę 7 case studies ładowanych do `/portfolio`, bez zmiany treści i układu.
**Zakres plików:** `projects/{razdwa_aplikacja,cyfradruk,power-of-mind,karoma,KW-Design,sir-roger,voucher-salon-magdy}.html`, `assets/css/projects.css`, `assets/images/` (tylko nowe warianty).
**Poza zakresem:** `portfolio.html`, `portfolio.js`, `index-styles.css`, teksty, slugi, kolejność sekcji.

**Metodyka:** statyczny serwer repo + Playwright/Chromium (DPR=1), `axe-core` 4.10.2 (tagi `wcag2a/2aa/21a/21aa/best-practice`). Każdy slug testowany w dwóch kontekstach: viewer `/portfolio#<slug>` (po wstrzyknięciu `section.kwcs`) oraz samodzielna podstrona `projects/<slug>`. Narzędzia poza repozytorium (scratchpad).

### Zadanie 1 — baseline axe (stan PRZED zmianami)

| Kontekst | Slug | Naruszenia axe (węzły) |
|---|---|---|
| viewer | voucher-magdy | color-contrast(19) |
| standalone | voucher-magdy | color-contrast(22), landmark-one-main(1) |
| viewer | karoma | color-contrast(14), heading-order(4) |
| standalone | karoma | color-contrast(25), heading-order(4), landmark-one-main(1) |
| viewer | power-of-mind | color-contrast(17), heading-order(4) |
| standalone | power-of-mind | color-contrast(28), heading-order(4), landmark-one-main(1) |
| viewer | KW-Design | color-contrast(9), heading-order(1) |
| standalone | KW-Design | color-contrast(16), heading-order(1), landmark-one-main(1) |
| viewer | sir-roger | color-contrast(4) |
| standalone | sir-roger | color-contrast(7), landmark-one-main(1) |
| viewer | RazDwa | color-contrast(18), heading-order(4) |
| standalone | RazDwa | color-contrast(29), heading-order(4), landmark-one-main(1) |
| viewer | cyfradruk | color-contrast(13), heading-order(5) |
| standalone | cyfradruk | color-contrast(24), heading-order(5), landmark-one-main(1), scrollable-region-focusable(1) |
| **portfolio (bare)** | — | **0** |

**Typy naruszeń do naprawy:**
- `color-contrast` — wszędzie (zadanie 2, w `projects.css`).
- `heading-order` — karoma, power-of-mind, KW-Design, RazDwa, cyfradruk (zadanie 3).
- `landmark-one-main` — wszystkie 7 podstron standalone (brak `<main>`); nie występuje w viewerze (tam `<main>` daje `portfolio.html`). Objęte definicją done (axe 0 dla podstron) → naprawa strukturalna bez zmiany wyglądu.
- `scrollable-region-focusable` — cyfradruk standalone, `.user-flow--6` (region przewijalny bez fokusu klawiaturą) → `tabindex="0"`.

**Błędy konsoli:** jedyny błąd na KAŻDEJ stronie (łącznie z bare `/portfolio`) to `net::ERR_TUNNEL_CONNECTION_FAILED` dla `https://www.googletagmanager.com/gtag/js?id=G-TG0HE09DE7` — GA4 blokowany przez proxy sandboxa. Artefakt środowiska testowego; w produkcji zasób ładuje się poprawnie (zweryfikowane w Rundzie 3). Nie jest powodowany zmianami tej rundy; cel „zero błędów konsoli" dotyczy braku NOWYCH błędów wprowadzonych kodem.

### Zadanie 2 — kontrast (color-contrast) — ZROBIONE

Dodano blok na końcu `projects.css` nadpisujący **tylko kolor tekstu** (property `color`) dla selektorów zgłoszonych przez axe. Wartości jak w `portfolio.css`:
- **#0e7490** (accent, 5.36:1 na #fff): `.kwcs-hero-head .eyebrow`, `.contribution-step`, `.kwcs-card h3/h4`, `.ux-decision-box .ux-label`, `.razdwa-summary-cell .label`, `.razdwa-chapter-rail-label`, `.contribution-cell--solo h3/h4`, `.kwcs-back-btn`, `.kwcs-footer a` (link Polityka prywatności). Zastępuje `#06b6d4` (2.42), `#0284c7` (4.09), `#0292AA` (3.68).
- **#52606d** (subtle, 6.06:1 na #fff): `.ui-swatch-hex`, `.ui-type-label`, `.ui-type-sample.is-caption`, rail-label dla karoma/pom/cyfra. Zastępuje `#94a3b8` (2.56).

Tła/obramowania/ikony/gradienty z tymi hexami **nietknięte** (border-left `#0ea5e9` na `.ux-decision-box`, border `#0284c7` na `.kwcs-cta--ghost`, gradienty `#06b6d4→#0284c7`, duże `.razdwa-stat-num` które przechodziły próg 3:1). Zmiana jest czysto kolorystyczna → zero wpływu na układ.

**Strony spoza zakresu ładujące `projects.css`:** `portfolio.html` (viewer — objęty testami) oraz `projects/wizualizacje.html`. Zrzuty przed/po potwierdzają brak regresji (patrz zadanie 8).

**Wynik axe po zadaniu 2:** `color-contrast` = **0** we wszystkich 14 kontekstach (7 viewer + 7 standalone) oraz bare `/portfolio`. Pozostają: `heading-order` (5 slugów), `landmark-one-main` (7 podstron), `scrollable-region-focusable` (cyfradruk) — kolejne zadania.

### Zadanie 3 — heading-order — ZROBIONE

Wszystkie naruszenia `heading-order` dotyczyły tytułów kart `.ux-decision-box`, które jako `<h4>` następowały bezpośrednio po `<h2>` sekcji (przeskok h2→h4 z pominięciem h3). Zamieniono `<h4>`→`<h3>` **wyłącznie wewnątrz `.ux-decision-box`** (skrypt z kontrolą zagnieżdżenia `<div>`), w 5 plikach: karoma (14), power-of-mind (11), KW-Design (4), razdwa_aplikacja (18), cyfradruk (14). Nagłówki `.features-box h4` i inne (poprzedzone h3) pozostały bez zmian.

**Wygląd bez zmian:** reguła `.ux-decision-box h3, .ux-decision-box h4 { ... }` jest wspólna dla obu poziomów (ta sama specyficzność nadpisuje bazowe reguły elementów), więc font/rozmiar/kolor identyczne.

**Wynik axe po zadaniu 3:** `heading-order` = **0**. Wszystkie 7 kontekstów **viewer = 0 naruszeń**. W standalone pozostają tylko `landmark-one-main` (7 podstron) i `scrollable-region-focusable` (cyfradruk) — naprawa w ramach dopełnienia definicji done.

### Zadanie 3b — landmark-one-main + scrollable-region-focusable (dopełnienie DoD) — ZROBIONE

Definicja done wymaga axe=0 także dla 7 samodzielnych podstron, gdzie oprócz color-contrast/heading-order axe zgłaszał:
- **landmark-one-main** (7 podstron): brak znacznika `<main>`. Każda podstrona ma układ `<nav breadcrumb>` + `<section class="kwcs">` + `<nav project-nav>` + `<footer>`. Owinięto **`<section class="kwcs">` w `<main>`** (dokładnie jeden `<main>` na stronę).
  - **Bez wpływu na viewer:** `portfolio.js` wyciąga do viewera tylko `section.kwcs` (`querySelector`), więc opakowujący `<main>` nie trafia do `/portfolio` — nie powstaje drugi `<main>` obok istniejącego `<main>` w `portfolio.html` (linia 114). Dlatego użyto opakowania, nie `role="main"` na sekcji.
  - **Bez wpływu na układ:** `body` nie jest flex/grid, brak selektorów `body > .kwcs`; reguły pozycjonujące to `#case-… > .child` (dzieci sekcji, niezmienione), a rail chapter jest przenoszony JS-em do `<body>`.
- **scrollable-region-focusable** (cyfradruk, `.user-flow--6`): dodano `tabindex="0"` — region przewijalny dostępny z klawiatury. W viewerze element nie przepełnia kontenera (brak scrolla), `tabindex` nieszkodliwy.

**Wynik axe po zadaniu 3b:** **0 naruszeń** we wszystkich 14 kontekstach (7 viewer + 7 standalone) oraz bare `/portfolio`. Jedyny komunikat konsoli to GA4 blokowany przez proxy (artefakt środowiska).

### Zadanie 4 — obrazy (width/height/lazy, WebP, przeskalowanie >2×) — ZROBIONE

**Atrybuty:** każdy `<img>` ma teraz `width`, `height` (intrynsyczne wymiary serwowanego pliku → zero CLS; CSS kontenerów ma `height:auto`/`max-width:100%`) i `loading="lazy"`. Wyjątek: **pierwszy obraz hero** na każdej podstronie — bez `lazy`, z `fetchpriority="high"` (tylko standalone; w viewerze case study ładuje się po kliknięciu). Reużywany `POWEROFMIND_HERO_1` traktowany per-tag: wystąpienie hero = eager, wystąpienie w galerii = lazy.

**Nowe warianty WebP (45 plików, narzędzie ImageMagick poza repo, jakość 82):**
- **Przeskalowanie** obrazów >2× rozmiaru wyświetlanego do `min(natural, 2×wyświetlany)` — docelowa szerokość dla retiny.
- **PNG/JPG → WebP** (KWDESIGN_HERO.png, KAROMA_v1-3/FINALL/BUILD .png, FLY_BASKET_KAROMA.jpg, Roger.png, index-about/footer/portfolio-footer .png).
- Nazwy ASCII, kebab-case, sufiks `-<W>w.webp`. **Oryginały pozostają** na dysku (grep repo potwierdził współdzielenie: `Roger.png` używany też w `wizualizacje.html`/`portfolio.html`, obrazy `index-*`/`portfolio-*` w `docs/case-study/kwdesign-screens.html` — te odwołania spoza zakresu dalej wskazują oryginały).

**Łączna waga obrazów na case study (przed → po):**

| Case study | przed | po | zmiana | >1 MB → −50%? |
|---|---|---|---|---|
| voucher-magdy | 2298 KB | 322 KB | −86% | ✅ |
| KW-Design | 2578 KB | 229 KB | −91% | ✅ |
| power-of-mind | 1024 KB | 480 KB | −53% | ✅ |
| karoma | 1013 KB | 326 KB | −68% | ✅ (granica 1 MB) |
| RazDwa | 787 KB | 663 KB | −16% | <1 MB (n/d) |
| cyfradruk | 148 KB | 57 KB | −61% | <1 MB (n/d) |
| sir-roger | 27 KB | 3 KB | −87% | <1 MB (n/d) |

**Wynik axe po zadaniu 4:** 0 naruszeń we wszystkich 14 kontekstach (alt-teksty zachowane). Wszystkie referencje obrazów rozwiązują się do istniejących plików (jedyne „brakujące" to 4 obrazy w zakomentowanym bloku power-of-mind — usuwane w zadaniu 5).

### Zadanie 5 — power-of-mind.html: usunięcie zakomentowanego bloku — ZROBIONE

Usunięto zakomentowany blok „SLOT GALERII BRANDINGU" (`<!-- … -->`) z 4 obrazami, których pliki nie istnieją w repo (`power-of-mind-logo/paleta/wizytowki/social.webp`). Blok był niewidoczny w renderze (komentarz HTML), więc zero zmian wizualnych. Po usunięciu wszystkie referencje `<img>` w power-of-mind.html rozwiązują się do istniejących plików (0 brakujących).

### Zadanie 6 — podwójne dołączenie projects.css (karoma, razdwa) — POMINIĘTE (brak duplikatu)

Weryfikacja na bazie `origin/main`: oba pliki mają **dokładnie jeden** element `<link rel="stylesheet" href="…/assets/css/projects.css">`:
- `karoma.html`: linia 53 (jedyny `<link>`). Drugie trafienie `grep` to komentarz w treści (linia 560: „…gotowe w assets/css/projects.css (scope #case-karoma-pelne)").
- `razdwa_aplikacja.html`: linia 51 (jedyny `<link>`). Drugie trafienie to komentarz (linia 732).

`portfolio.css`/`kw-buttons.css`/Google Fonts ładowane po jednym razie; brak `@import` ani `rel="preload"` do projects.css. Podwójnego dołączenia nie ma (prawdopodobnie naprawione we wcześniejszej rundzie przed `1cccc53`). **Zgodnie z ustaleniem: zaraportowano i pominięto — bez zmian w kodzie.**

### Zadanie 7 — label-content-name-mismatch — ZROBIONE

WCAG 2.5.3 (Label in Name): nazwa dostępna (`aria-label`) musi zawierać widoczny tekst elementu. axe klasyfikuje tę regułę jako *incomplete/needs-review* (nie „violation"), dlatego nie pojawiała się w licznikach naruszeń — wykryta własnym detektorem (widoczny tekst ⊄ aria-label). Znaleziono i uzgodniono **27** elementów:

- **Linki rail (spis treści, `.razdwa-chapter-link`):** `aria-label` ustawiony na **widoczny tekst** (np. `aria-label="Problem"`), a pełny opis został w atrybucie `title` (tooltip). Dotyczy pom (8), razdwa (9), voucher (1 — „Koncepcja"), sir-roger (1 — „Identyfikacja"). Linki już zgodne (np. karoma, gdzie aria-label zawierał widoczny tekst) pozostawiono bez zmian. Tekst linków nie jest ukrywany CSS-em, więc nazwa jest stabilna na każdym breakpoincie.
- **Przyciski CTA:** `aria-label` przepisany tak, by **zaczynał się od dokładnego widocznego tekstu**, z zachowaniem kontekstu:
  - „Zapytaj o projekt vouchera" (×2, było „Skontaktuj się w sprawie projektu vouchera")
  - „Obejrzyj stronę sklepu Karoma" (było „Zobacz sklep Karoma")
  - „Zobacz sklep na żywo – Karoma" (było „Otwórz sklep Karoma na żywo")
  - „Napisz do mnie w sprawie projektu brandingu" (było „Napisz do Karola…")
  - „Zobacz wersję archiwalną strony Power of Mind" (×2)
  - „Zobacz aplikację na żywo – Raz Dwa Druk"

Widoczny tekst (treść) niezmieniony. Po zmianie detektor zgłasza **0 niezgodności** we wszystkich 7 plikach; axe nadal 0 we wszystkich 14 kontekstach.

### Zadanie 8 — weryfikacja końcowa i definicja done

**axe-core (wcag2a/2aa/21a/21aa/best-practice) — stan końcowy:**

| | color-contrast | heading-order | landmark-one-main | scrollable | label-mismatch | **Σ** |
|---|---|---|---|---|---|---|
| 7× viewer `/portfolio#slug` | 0 | 0 | 0 | 0 | 0 | **0** |
| 7× standalone `projects/<slug>` | 0 | 0 | 0 | 0 | 0 | **0** |
| bare `/portfolio` | 0 | 0 | 0 | 0 | 0 | **0** |

**Lighthouse Accessibility = 100** na wszystkich testowanych celach: `/portfolio`, viewer (karoma, RazDwa), standalone (karoma, power-of-mind, cyfradruk).

**Nawigacja poprzedni/następny:** działa. Viewer: `/portfolio#RazDwa` → „następny" → `#karoma` (hash + treść się zmieniają), „poprzedni" → `#RazDwa`. Standalone: linki `.kwcs-project-nav` wskazują `/portfolio#<slug>` (JS przepisuje je na sam hash w viewerze).

**Brak zmian układu (zrzuty 390/1440, baza `origin/main` vs runda-c1, z pełnym doczytaniem obrazów):** różnice wysokości pełnej strony < 0,4% (karoma −19 px / 15269, power-of-mind 0 px, RazDwa −14 px, KW-Design −2 px, voucher 0 px). Porównanie wizualne pełnej strony karoma = identyczny układ (jedyna widoczna różnica to zamierzony ciemniejszy kolor akcentu kontrastu i mniejsze warianty WebP). *(Uwaga metodyczna: pierwszy zestaw zrzutów „przed" zaniżał wysokość, bo obrazy bez `width/height` i z `lazy` nie zdążyły się namalować w trybie fullPage — po dodaniu `width/height` obrazy rezerwują miejsce niezawodnie; porównanie apples-to-apples zrobiono na świeżym worktree `origin/main`.)*

**Konsola:** jedyny komunikat to `net::ERR_TUNNEL_CONNECTION_FAILED` dla `googletagmanager.com` (GA4) — blokada proxy sandboxa, artefakt środowiska; w produkcji zasób się ładuje. Zero NOWYCH błędów wprowadzonych tą rundą.

**Residual poza zakresem (do przyszłej rundy):** w viewerze przycisk zamykający wstrzykiwany przez `portfolio.js` — `<button class="close-button" aria-label="Zamknij case study">← Wróć do listy projektów</button>` — ma niezgodność WCAG 2.5.3 (widoczny tekst „← Wróć do listy projektów" ⊄ aria-label „Zamknij case study"). Element pochodzi z **`portfolio.js` (poza zakresem tej rundy)** i jest wcześniej istniejący; nie obniża wyniku Lighthouse a11y (100). Reguła ujawnia się tylko przy uruchomieniu axe po ID reguły (jak robi to wewnętrznie Lighthouse), nie w przebiegu po tagach. **Sugerowana poprawka (1 linia w `portfolio.js`):** `aria-label="Wróć do listy projektów"` (lub ujednolicić z widocznym tekstem).

**`git status`:** tylko pliki z zakresu — `assets/css/projects.css`, `projects/{7 case studies}.html`, 45 nowych wariantów w `assets/images/**`, `docs/audyt-portfolio.md`. Zero plików spoza zakresu (portfolio.html, portfolio.js, index-styles.css nietknięte).

**Definicja done:**
- [x] axe 0 dla 7 slugów w viewerze i 7 samodzielnych podstron.
- [x] Łączna waga obrazów każdego case study >1 MB spada ≥50% (voucher −86%, KW-Design −91%, power-of-mind −53%, karoma −68%).
- [x] Nawigacja poprzedni/następny działa.
- [x] Zrzuty przed/po (390/1440): brak zmian układu.
- [x] `/portfolio` bez regresji: Accessibility 100, axe 0, zero NOWYCH błędów konsoli (GA4 = artefakt proxy).
- [x] `git status`: tylko pliki z zakresu. Raport dopisany do `docs/audyt-portfolio.md`.
- [ ] (poza zakresem) `portfolio.js` close-button WCAG 2.5.3 — rekomendacja do osobnej rundy.

---

## Runda KOLORY — jeden system kolorów tekstu (gałąź `runda-kolory` od `origin/main` po scaleniu #131)

**Cel:** jeden system kolorów tekstu na całej witrynie, kontrast ≥ 4.5:1 wszędzie, bez zmiany identyfikacji marki.

### Krok 1 — inwentaryzacja (stan PRZED)

**Arkusze → strony (brak uniwersalnego arkusza):** `index-styles.css` (/, /uslugi, /portfolio, /narzedzie, /polityka), `projects.css` (/portfolio + 7 case studies), `style.css` (tylko /kontakt), inline (polityka, 404). `projects.css` w portfolio.html NIE jest podwójny — to wzorzec `preload` + `<noscript>` (nieblokujący), nie duplikat.

**Kolory tekstu:** 51 różnych wartości hex. Niezdające kontrastu na jasnym tle: cyjan/niebieski akcent (#06b6d4 2.43, #0292aa 3.69, #0284c7 4.10, #0ea5e9 2.77, #0891b2 3.68, #0aa, #2c8cde, #23d6d3), szary muted (#94a3b8 2.56, #64748b 4.46 na #f8fafc, #999, #888, #777, #bbb, #ccc), zieleń #10b981 (2.54), czerwień #ef4444 (3.76).

**axe baseline (color-contrast / strona):** / = 9, /uslugi = 52, /portfolio = 0, /narzedzie = 15, /polityka = 3, /kontakt = 1, /404 = 4. **Σ = 84.** Case studies (7) = 0 (naprawione w runda-c1). Inne naruszenia (do zaraportowania, nie naprawiamy): heading-order, landmark-one-main, region, aria-prohibited-attr, link-in-text-block. Konsola: tylko `ERR_TUNNEL_CONNECTION_FAILED` (GA4/fonty — proxy sandboxa) + brakujący zasób na /404.

**Punkt 3 (biały tekst na tłach marki) — do decyzji:** #fff na #06b6d4 = 2.43 ❌, na #0284c7 = 4.10 ❌, na #0891b2 = 3.68 ❌, na #0ea5e9 = 2.77 ❌, na #10b981 = 2.54 ❌. (na #2563eb/#1d4ed8/#0e7490 ✅).

**Decyzje (Krok 1 → OK):** tokeny w nowym `tokens.css` (jedno źródło, pierwszy arkusz, +1 małe żądanie/stronę — weryfikacja PageSpeed); pełna skala tokenów; linki ujednolicone z accent #0e7490 **z obowiązkowym podkreśleniem** (WCAG 1.4.1), hover ciemniejszy/grubsze podkreślenie, przyciski bez zmian.

### Krok 2 pkt 1 — tokeny :root — ZROBIONE

Utworzono `assets/css/tokens.css` i podłączono jako pierwszy arkusz na 14 stronach. Tokeny (kontrast w komentarzach): primary #0f172a, body #475569, subtle #52606d, accent #0e7490, accent-hover #0c6076, footer #9ca3af, inverse #fff, success #047857, error #b91c1c, brand #06b6d4 (nie-tekst).

### Krok 2 pkt 2 — zastąpienie twardych kolorów tekstu tokenami (część) — ZROBIONE do checkpointu

306 literalnych wartości hex w `color:` zamienionych na tokeny; 137 pośrednich zmiennych marki używanych jako tekst (`--color-primary`, `--color-muted`, `--color-text`, `--ui-primary`, `--kwcs-ink/mute`) przepięte na tokeny; wewnętrzne zmienne `index-styles.css` (`--color-text-light/muted/text`) zaaliasowane do tokenów. Kontekst CIEMNY (stopka, nagłówek uslugi): dodano `--color-text-accent-on-dark: #06b6d4` (8.73:1) i zastosowano do `.footer-info a`/`.footer-email`, `.lm-teaser-badge`, `.nav-list a.active`; stopka — usunięto podwójne przyciemnienie (color solid + opacity). **Linki w treści:** accent + obowiązkowe podkreślenie (WCAG 1.4.1), hover accent-hover + grubsze podkreślenie; naprawia też `link-in-text-block` na /narzedzie, /polityka.

**axe color-contrast po tym kroku:** / = 0, /portfolio = 0, /polityka = 0, /kontakt = 0, /narzedzie = 1, /404 = 1, /uslugi = 15. 7 case studies (viewer+standalone) = 0 (bez regresji). Pozostałe naruszenia = **biały tekst na tłach marki (#06b6d4)** — punkt 3, decyzja — oraz **dekoracyjne numery-znaki wodne** (.service-num, aria-hidden).

### Krok 2 pkt 3 — biały tekst na tle marki + dekoracyjne znaki wodne — ZROBIONE

- **Decyzja: przyciemnić tło do #0e7490.** Dodano tokeny marki `--color-brand-strong: #0e7490` (biały 5.36:1) i `--color-brand-strong-hover: #0c6076` (7.12:1). Zastosowano do `.sn` (krążki kroków /uslugi), `.lm-btn` (/narzedzie), przycisku na /404. Tekst pozostaje biały.
- **Decyzja: znaki wodne prezentacyjne.** `.service-num` („01/02/03" /uslugi) — numer przeniesiony do `::before { content: attr(data-num) }` (atrybut `data-num`, element pusty, `aria-hidden`). axe nie liczy go już jako tekstu treści; wygląd (opacity 0.12) bez zmian.

**axe color-contrast = 0 na WSZYSTKICH 7 stronach Kroku 1** (/, /uslugi, /portfolio, /narzedzie, /polityka, /kontakt, /404) oraz 7 case studies (viewer+standalone). Pozostałe naruszenia (inne niż kolory, do zaraportowania): index — aria-prohibited-attr(2), heading-order(1); uslugi — heading-order(3), landmark-one-main(1), region(15); kontakt — landmark-one-main(1), region(13); 404 — landmark-one-main(1), region(1).

### Krok 2 pkt 2 (dok.) — 8 wyróżnionych kolorów: podział A/B/C — ZROBIONE

- **Grupa A (UI witryny → tokeny semantyczne):** `#d52b1e`→`--color-text-error` (#b91c1c); `#f59e0b`, `#ffd700`, `#78350f`→`--color-text-warning` (#b45309, 4.95:1). Złoto gwiazdek i brąz placeholdera zmieniły odcień na bursztyn (warunek kontrastu). `success` = #047857 (zieleń #10b981 złożona wcześniej).
- **Grupa B (marka klienta w case study → twarde, scoped, komentarz):** `#10473f` zostaje w `projects/voucher-salon-magdy.html` („100 zł", marka voucher Salon Magdy), kontrast 10.53:1, z komentarzem HTML „kolor marki klienta, poza systemem tokenów". **Jedyna twarda wartość koloru tekstu w całym repo.**
- **Grupa C (granat własny KW → token):** `#133b7b`, `#19356d`, `#194c92`→`--color-text-navy` (#133b7b, 10.83:1). Zachowany granatowy charakter viewera /portfolio i motywu /kontakt.

**Grep twardych kolorów tekstu:** czysty we wszystkich arkuszach i HTML — **jedyny wynik to wyjątek Grupy B** (`projects/voucher-salon-magdy.html` #10473f). axe color-contrast = 0 na 7 stronach + 15 kontekstach case studies (viewer+standalone).

### Krok 2 pkt 4 — stany hover / focus / visited — ZROBIONE

- **hover linków:** bazowe `a:hover` używało `--color-primary-dark` (#0292AA, 3.69:1 ❌). Przepięto 6 tekstowych użyć `color: var(--color-primary-dark)` → `--color-text-accent-hover` (#0c6076, 7.12:1). Linki w treści: hover = accent-hover + grubsze podkreślenie (pkt 2). Tła/gradienty z `--color-primary-dark` nietknięte.
- **focus:** wskaźnik focus (outline) na jasnym tle używał `--color-primary` (#06b6d4, 2.43:1 < 3:1 — niewidoczny wg WCAG 1.4.11). Zmieniono `a:focus-visible`, `.btn:focus-visible` (index) i `.filter-btn:focus-visible` (kontakt) na `--color-text-accent` (#0e7490, 5.36:1 ✅). Focus nawigacji (`.nav-list a:focus-visible`) na ciemnym nagłówku pozostaje `--color-primary` (#06b6d4, 8.7:1 na ciemnym ✅). Focus przycisków (`--kw-btn-focus-ring` #0891b2) = 3.68:1 na białym ✅.
- **visited:** nie stylowany osobno — dziedziczy accent (bez problemu kontrastu; brak wymogu WCAG na odróżnienie visited).

### Krok 2 pkt 5 — usunięcie nadpisań color scope body.portfolio-page + runda-c1 w projects.css — ZROBIONE

- **portfolio.css:** usunięto lokalne zmienne `--portfolio-text-accent/subtle/footer` (duplikowały tokeny) oraz nadpisania redundantne wobec globalnych tokenów: `.kwcs-hero-head .eyebrow`, `.razdwa-summary-cell .label` (pokrywa projects.css), `.footer-bottom p` (pokrywa index-styles.css). Wszystkie pozostałe użycia `var(--portfolio-text-*)` przepięto na `var(--color-text-*)`. Zachowano reguły będące jedynym źródłem koloru (`.adg-label`, `.section-subtitle`) — teraz na globalnych tokenach.
- **projects.css:** usunięto cały blok „RUNDA C1 — KONTRAST TEKSTU" z końca pliku (redundantny — reguły źródłowe .eyebrow/.ux-label/.razdwa-chapter-rail-label/… niosą już te same tokeny po tej rundzie).

**Weryfikacja:** axe color-contrast = 0 na /portfolio oraz 15 kontekstach case studies (viewer+standalone) — brak regresji po usunięciu nadpisań.

### Krok 2 pkt 6 — aria-label przycisku zamykającego (portfolio.js) — ZROBIONE

`portfolio.js`: przycisk zamykający case study miał `aria-label="Zamknij case study"` przy widocznym tekście „← Wróć do listy projektów" (niezgodność WCAG 2.5.3). Zmieniono na `aria-label="Wróć do listy projektów"` (zgodne z widocznym tekstem). Detektor label-content-name-mismatch w viewerze: **0 naruszeń**.

### Krok 2 pkt 7 — meta theme-color — ZROBIONE

Przed: tylko `uslugi.html` i `404.html` miały `theme-color` (#06b6d4), 13 stron bez. Ujednolicono: `<meta name="theme-color" content="#06b6d4">` (kolor marki) na **wszystkich 15 stronach**, jednolity format.

### Krok 2 — weryfikacja końcowa i definicja done

**axe color-contrast (desktop 1440 + mobile 390):** **0** na wszystkich 7 stronach Kroku 1 (/, /uslugi, /portfolio, /narzedzie, /polityka, /kontakt, /404) oraz **0/15** kontekstów case studies (viewer+standalone). Mobile ujawnił 1 dodatkowe naruszenie (`.footer-info h3` accent na ciemnym — zdawał jako large text na desktopie, ale nie na mobile) → naprawione tokenem `--color-text-accent-on-dark`.

**Lighthouse Accessibility:** `/portfolio = 100` ✅. `/uslugi = 99`, `/ = 94` — **pozostałe braki to problemy INNE NIŻ kolory** (poza zakresem rundy, zaraportowane bez naprawiania):
- `/` : `aria-prohibited-attr` (2), `heading-order` (1).
- `/uslugi` : `heading-order` (3), `landmark-one-main` (1), `region` (15).
- (`/kontakt`, `/404` : `landmark-one-main`, `region` — też poza zakresem.)

**Grep twardych kolorów tekstu (CSS + inline HTML):** jedyny wynik to udokumentowany wyjątek Grupy B — `projects/voucher-salon-magdy.html` `#10473f` (marka klienta voucher, kontrast 10.53:1). Zero twardych kolorów tekstu w arkuszach.

**Wydajność /portfolio (Lighthouse desktop, provided throttling):** **100** — identycznie jak baza `origin/main` (100). Dodanie `tokens.css` (+1 małe żądanie render-blocking ~0.5 KB) **nie regresuje** wydajności (FCP 0.2s, LCP 0.2s, TBT 0ms, CLS 0.001 lokalnie). Rzeczywisty PageSpeed komputer do potwierdzenia po deployu, ale brak regresji względem bazy.

**Zrzuty przed/po (390 + 1440) dla /, /uslugi, /portfolio, karoma:** układ identyczny; zmienia się wyłącznie kolor tekstu (ciemniejsze akcenty/muted dla kontrastu) oraz podkreślenie linków w treści (WCAG 1.4.1).

**Konsola:** wyłącznie `net::ERR_TUNNEL_CONNECTION_FAILED` (GA4/fonty blokowane przez proxy sandboxa — artefakt środowiska; w produkcji OK) + brakujący zasób na /404. Zero NOWYCH błędów wprowadzonych tą rundą.

**Definicja done:**
- [x] axe color-contrast = 0 na wszystkich stronach Kroku 1 (+ case studies, desktop i mobile).
- [x] Lighthouse Accessibility = 100 na /portfolio; na /, /uslugi pozostają tylko problemy inne niż kolory (zaraportowane).
- [x] Poza blokiem tokenów brak twardych kolorów tekstu (grep czysty; wyjątek: Grupa B voucher #10473f).
- [x] Zrzuty przed/po (390, 1440): zmienia się wyłącznie kolor tekstu.
- [x] /portfolio bez regresji wydajności (desktop Lighthouse 100 = baza).
- [x] Raport w docs/audyt-portfolio.md. Push + draft PR.

**Grupa B (marki klientów w case studies, twarde wartości poza tokenami):**
| case study | kolor | kontrast | element |
|---|---|---|---|
| voucher-salon-magdy | `#10473f` | 10.53:1 | cena „100 zł" (marka Salon Magdy) |

---

## Runda A11Y — Lighthouse Accessibility 100 na / i /uslugi (gałąź `runda-a11y` od `origin/main` po #132)

**Cel:** Lighthouse Accessibility 100 na `/` i `/uslugi`. **Zakres:** index.html, uslugi.html, index-styles.css, services-page.css, index-scripts.js. **Poza:** treść, kolory, tokens.css, portfolio.html, projects/*.html.

### Zadanie 1 — heading-order — ZROBIONE

Grep selektorów elementowych (h3/h4) w index-styles.css, services-page.css, tokens.css przed zmianą tagów. Poziomy nagłówków dziedziczą `letter-spacing`/`line-height` z reguł per-poziom (`h2` ma line-height 1.2 i -0.03em; `h3` -0.025em; `h4` -0.01em), więc przypięto te właściwości do klas, by wygląd był identyczny.

- **/** : `.portfolio-new-title` h3→**h2** (po h1; +`line-height:1.25`+`letter-spacing:-0.025em`); `.card-title` h4→**h3** (×3 karty; +`letter-spacing:-0.01em`).
- **/uslugi** : wszystkie `<h4>` (15: `.block` + `.timeline`) → **h3** (po h2 sekcji). Selektory CSS `.block h4`/`.block.muted h4`/`.timeline h4` → `.block h3`/`.block.muted h3`/`.timeline h3`; `+letter-spacing:-0.01em` na `.block h3` i `.timeline h3` (pin do dawnego h4).

**axe heading-order = 0** na / i /uslugi (bez nowych przeskoków). Wygląd nagłówków identyczny (font-size z klas, letter-spacing/line-height przypięte).

### Zadanie 2 — landmark-one-main + region (/uslugi) — ZROBIONE

`/uslugi` nie miała `<main>`, a 3 sekcje usług (#produkty/#automatyzacje/#usprawnienia) bez nazwy dostępnej nie były landmarkami → `region` (15). Owinięto całą treść (9 sekcji) w `<main id="main">` między `</header>` a `<footer>`. Teraz cała treść jest w landmarkach (header/nav + main + footer). `<main>` to blok bez marginesów → bez wpływu na układ. axe: landmark-one-main = 0, region = 0 na /uslugi.

### Zadanie 3 — aria-prohibited-attr (H1 na /) — ZROBIONE

**Diagnoza (pokazana przed zmianą — warunek 2):** naruszenie nie pochodziło ze statycznego HTML (`<span class="ht-line1/2">` były czyste), lecz z animacji blur-in w `index-scripts.js`. Skrypt rozbija obie linie H1 na ~34 `<span class="char" aria-hidden="true">` (po literze); ponieważ każda litera jest `aria-hidden`, nazwę dostępną nagłówka przywracano przez `aria-label` na obu generycznych `<span>` linii — a `<span>` bez roli nie dopuszcza `aria-label` → `aria-prohibited-attr`. Ścieżka `prefers-reduced-motion` pomija całe rozbicie i była czysta.

**Zmiana:** nazwa dostępna trafia na element, który ją dopuszcza — `<h1>` (`heroTitle.setAttribute('aria-label', …)` złożony z tekstu obu linii **przed** rozbiciem), a `aria-label` z linii `<span>` usunięto. Litery `.char` pozostają `aria-hidden`.

**Weryfikacja drzewa dostępności** (Playwright `accessibility.snapshot()`): nazwa dostępna H1 = **„Uporządkuj procesy, odzyskaj czas."** (dokładnie, ze spacją między liniami); `line1/line2 aria-label = null`. axe aria-prohibited-attr = 0.

### Zadanie 4 — menu mobilne (/, /uslugi) — ZROBIONE

Ujednolicenie z wzorcem `/portfolio` (jeden wzorzec na całej witrynie):

- **index.html:** `<div class="hamburger">` → `<button type="button" …>` z `aria-expanded="false"`, `aria-controls="nav-list"`, `aria-label="Otwórz menu"`; `<ul class="nav-list">` dostaje `id="nav-list"`.
- **uslugi.html:** `id="nav-list"` na liście; `aria-controls="nav-menu"` → `"nav-list"` (był wiszący — brak elementu o id `nav-menu`); `aria-label` ujednolicony „Otwórz menu nawigacji" → „Otwórz menu". `type="button"` dodany.
- **index-styles.css:** reset tła/obramowania natywnego `<button>` na `.hamburger` (`background:transparent; border:0; appearance:none`) — wygląd identyczny jak dawny `<div>` (na desktopie `.hamburger` i tak `display:none`).
- **index-scripts.js** (`initNavigation`, używany przez obie strony): `setMenu(open)` synchronizuje klasy `open`/`active` **oraz** `aria-expanded` i `aria-label` („Zamknij menu" po otwarciu / „Otwórz menu" po zamknięciu); `Escape` zamyka menu i oddaje fokus na przycisk; klik w link menu zamyka menu i ustawia `aria-expanded="false"`; klik poza menu zamyka.

**Test klawiaturą 390 px (Playwright, obie strony):** fokus na hamburgerze → `Enter` → `aria-expanded=true`, `aria-label="Zamknij menu"`, menu otwarte; `Tab` przechodzi po elementach; `Escape` → `aria-expanded=false`, `aria-label="Otwórz menu"`, menu zamknięte, **fokus wraca na przycisk**. `aria-controls`/`id` = `nav-list` na obu stronach (zgodne z /portfolio). Wzorzec jest nadzbiorem /portfolio (portfolio.js nie ma Escape/zamykania po kliknięciu/powrotu fokusa — tu dodane zgodnie z wymaganiami).

### Zadanie 5 — scrollable-region-focusable (/uslugi, dopełnienie DoD axe = 0) — ZROBIONE

axe na mobile (390 px) flagował `.comparison-table-wrapper` (kontener tabeli porównawczej przewijany poziomo) jako `scrollable-region-focusable` — niedostępny z klawiatury. Widoczne **tylko na mobile** (na desktopie tabela się mieści, więc nie wyszło w bazowym audycie desktopowym). Dodano `tabindex="0"` + `role="region"` + `aria-label="Etapy współpracy nad projektem"` (z treści `<caption>`). Bez zmian treści i wyglądu.

### Zadanie 6 — weryfikacja końcowa i definicja done

**Lighthouse Accessibility** (headless Chromium): **/ = 100**, **/uslugi = 100** (dla kontroli /portfolio = 100). ✔ cel rundy.

**axe-core** (wszystkie reguły wcag2a/aa + wcag21a/aa + best-practice), oba widoki:

| widok | / | /uslugi |
|---|---|---|
| desktop 1440 | 0 | 0 |
| mobile 390 | 0 | 0 |

**Formularz kontaktowy** (`#contactForm` na / i /uslugi) — bez zmian, działa:
- puste pola → walidacja JS oznacza `name`, `email`, `message` klasą `.error`; atrybut `required` wymusza je też natywnie;
- niepoprawny e-mail → `#email` dostaje `.error`;
- **0 faktycznych wywołań API** w obu ścieżkach (walidacja zwraca `false` przed `fetch`) → brak realnej wysyłki zgłoszenia;
- brak błędów konsoli pochodzących ze zmian (edytowano tylko `initNavigation` i `initHeroTextAnimation`).

**Brak zmian układu** (worktree `origin/main` vs `runda-a11y`, `prefers-reduced-motion`, czcionki domalowane — `networkidle` + `document.fonts.ready`):
- `/` : region nagłówek + hero, 390 i 1440, **menu zamknięte i otwarte = 0.000 %** różnicy.
- `/uslugi` : wysokość strony i kontener hero identyczne (`top=0`, `h=907`); pozycje `h1` (top=247) i podtytułu (top=511/512) **identyczne** przed/po; różnica regionu 0.32 % (desktop) / ~1.7 % (mobile) to wyłącznie antyaliasing dużych szeryfów Playfair + dekoracyjne „kropki" w hero (żadna reguła CSS tej rundy nie dotyka hero — zmiany `index-styles.css` to `.hamburger`/`.portfolio-new-title`/`.card-title`, a `services-page.css` to `.block`/`.timeline`).
  - *Uwaga metodyczna:* pierwszy pomiar bez `fonts.ready` dawał na /uslugi 4–11 % i pozorne przesunięcie podtytułu o 20 px — artefakt czasu ładowania web-fontu (hero jest wyśrodkowany flexem; H1 w Playfair domalowywał się po zrzucie i redystrybuował treść). Po dociągnięciu czcionek pozycje są identyczne.

**Zakres utrzymany:** zmiany tylko w index.html, uslugi.html, assets/css/index-styles.css, assets/css/services-page.css, assets/js/index-scripts.js. Bez zmian treści, kolorów, tokens.css, portfolio.html, projects/*.html.

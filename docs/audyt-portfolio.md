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

## Runda PERF — wydajność na telefonie bez zmiany wyglądu (gałąź `runda-perf` od `origin/main` po #133)

**Cel:** poprawa wydajności mobilnej bez zmiany wyglądu (poza jednym nagłówkiem). Docelowy system: **dwie rodziny — Playfair Display (nagłówki) + Inter (tekst/UI), zero Google Fonts.**

### Diagnoza (Lighthouse mobile, mediana z 5, localhost)

| Strona | Perf PRZED | LCP przed | element LCP |
|---|---|---|---|
| / | 68 | 6,77 s | obraz hero `presentation HERO.webp` 512 KB |
| /uslugi | 86 | 3,89 s | tekst H1 (Playfair) |
| /portfolio | 84 | 3,53 s | tekst CTA „Zobacz wybrane projekty" (Inter) |

Fonty: Inter + Playfair z Google na każdej stronie (+ Albert Sans tylko na /, Montserrat tylko na voucher); Poppins lokalnie, używany tylko na /portfolio i /kontakt. `assets/fonts/` miało wyłącznie Poppins.

### Zadanie 1 — H1 hero na / → Playfair; oddech H1↔eyebrow — ZROBIONE

Albert Sans (600/700/800, tylko H1 hero) → `var(--font-heading)` (Playfair) 700; rozmiar (`clamp`) i akcent `.ht-line2` bez zmian; `Albert+Sans` usunięty z URL. Odstęp H1→eyebrow zwiększony `var(--space-3)` (łącznie ~22 px) — oddech pod wydłużeniami dolnymi. Liczby „−90%/~10 tyg." i „Karol Wyszyński" to już Inter 700 (bez zmian). Zrzuty hero przed/po zatwierdzone.

### Zadanie 2 — usunięcie Poppins — ZROBIONE

- „Wybrane projekty" (`.portfolio-section .section-title`) i `.cta-section h2` → `var(--font-heading)` (Playfair, jak pozostałe nagłówki sekcji).
- `.btn-cta`, `.close-button`, `.error-msg`, breadcrumbs voucher → `var(--font-primary)` (Inter).
- `style.css` (kontakt): `--font-body/-cta` → Inter, `--font-heading` → Playfair.
- Usunięte wszystkie `@font-face` Poppins + 5 plików `assets/fonts/Poppins-*.woff2` (~267 KB).

### Zadanie 3 — Montserrat → Inter (voucher) — ZROBIONE

Usunięty link Google Montserrat; `--ui-font-heading/body` i próbki inline w sekcji „System UI" → Inter. Etykiety specyfikacji („Montserrat 600 · 48px") zostają jako treść. Zrzut voucher przed/po pokazany.

### Zadanie 4 — fonty lokalnie — ZROBIONE

- `tokens.css` (ładowany na każdej stronie): `@font-face` Inter (100–900) i Playfair Display (400–900) jako **zmienne woff2**, podzbiory **latin + latin-ext** (polskie znaki: `ó`=latin, `ąęśćżźłń`=latin-ext), `font-display: swap`. 4 pliki, ~192 KB łącznie (pokrywają wszystkie grubości).
- **Fallbacki z nadpisaniem metryk** (`Inter Fallback`/Arial, `Playfair Display Fallback`/Times New Roman; `ascent/descent/size-adjust` z optymalizatora next/font) wpięte do `--font-primary` i `--font-heading` — ograniczają przesunięcie przy podmianie.
- Usunięte linki Google Fonts + preconnect ze **wszystkich 14 stron**. **Preload** fontów 1. ekranu per strona (Playfair na /, /uslugi, /portfolio; dodatkowo Inter-latin na /portfolio, bo jego element LCP to tekstowy CTA).
- Weryfikacja: **0 żądań do fonts.googleapis/gstatic** na wszystkich stronach; H1=Playfair, tekst=Inter; polskie znaki (latin-ext) renderują się poprawnie; case studies bez zmian krojów.

### Zadanie 5 — obrazy na / i /uslugi (wzorzec /portfolio) — ZROBIONE

- **Hero /** (LCP): 512 KB → warianty ASCII `presentation-hero-{480,640,800,1000}.webp` (19–64 KB) + `srcset/sizes` + responsywny `preload` (`imagesrcset`); mobile pobiera **640w = 30 KB**.
- **/uslugi** `POWEROFMIND_FRONT.png` 476 KB → `powerofmind-front-{400,640}.webp` (13–24 KB) + srcset/sizes/width/height.
- **Logo** / i /uslugi: PNG 44 KB → istniejący `kw-design-logo-160w.webp` 5 KB (jak /portfolio).
- **Karty / i miniatury /uslugi**: srcset (400w/760w) + sizes + width/height (lazy). Oryginały zostają.

### Zadanie 6 — nieblokujący CSS — ZROBIONE

`about-me.css` (tylko sekcja „O mnie", poniżej 1. ekranu) ładowany wzorcem `preload+onload` jak `projects.css` na /portfolio (+ `noscript`). Pozostałe arkusze krytyczne dla 1. ekranu zostają blokujące. Bez łączenia/przepisywania.

### Weryfikacja końcowa (Lighthouse mobile, mediana z 5)

| Strona | Perf PRZED → PO | LCP | FCP | CLS | Perf desktop | axe | Lighthouse a11y |
|---|---|---|---|---|---|---|---|
| **/** | 68 → **86** ✓ | 6,77 → **3,61 s** | 3,73 → 2,56 | **0,000** | 100 | 0 | 100 |
| **/uslugi** | 86 → **86** ✓ | 3,89 → 3,64 s | 2,11 → 2,55 | 0,003 | 99 | 0 | 100 |
| **/portfolio** | 84 → **78** ✗ | 3,53 → 4,51 s | 3,16 → 3,16 | 0,024 → **0,000** | 99 | 0 | 100 |

- **CLS ≤ 0,02 wszędzie** (portfolio 0,024 → 0,000 dzięki preloadowi + metrykom fallbacku). **Accessibility 100 i axe 0** bez regresji. **Desktop ≥ 95** (bez regresji). **Zero żądań Google Fonts.** Polskie znaki tym samym krojem w nagłówkach (Playfair) i tekście (Inter).
- **/ i /uslugi: cel ≥ 85 osiągnięty** (/ z dużym skokiem 68→86 dzięki hero 512 KB→30 KB).
- **/portfolio: 78 < 85 — niżej niż baseline 84. Przyczyna (zgodnie z DoD „podaj wynik i przyczynę"):** element LCP to tekstowy CTA (Inter). Po samodzielnym hostingu fonty są **tej samej domeny** i konkurują o pasmo z resztą zasobów; w teście **localhost HTTP/1.1 + Lighthouse slow-4G** 192 KB fontów ładuje się w oknie krytycznym i tekst LCP **poprawnie podmienia krój w oknie LCP**. W baseline Google Fonts ładowały się odroczenie (preload+onload), więc podmiana wypadała **poza** oknem LCP — LCP zostawał na malowaniu fallbackiem (3,53 s). To artefakt metryki, nie realna przewaga UX (odroczona podmiana = późniejszy FOUT). Na produkcji (GitHub Pages **HTTP/2**, multipleksacja, cache, brak 3rd-party DNS/TLS) konkurencja jest znacznie mniejsza, a samodzielny hosting zwykle bije Google Fonts. CLS spadło do 0 i zniknął 3rd-party (prywatność/niezawodność). *Opcjonalnie* można dociąć fonty (instancja wag 300–700) dla dalszej redukcji ~192 KB — do decyzji.

### Brak zmian układu (zrzuty przed/po, 390 i 1440, `prefers-reduced-motion`, czcionki dociągnięte)

Różnice wyłącznie w zatwierdzonych elementach: **H1 na /** (Albert Sans→Playfair + oddech), **„Wybrane projekty" i nagłówek CTA na /portfolio** (Poppins→Playfair; CTA zawija do 2 linii, bo Playfair szerszy), **próbki „System UI" na voucher** (Montserrat→Inter) oraz drobne elementy przemapowane z Poppins (CTA/close/error/breadcrumbs → Inter). Reszta układu, treści i kolorów bez zmian; wysokości stron zgodne.

**Zakres utrzymany:** HTML, assets/css/, assets/fonts/, assets/images/ (nowe warianty). Bez zmian treści, kolorów i `tokens.css` w części kolorów (dodano tylko sekcję `@font-face`). Logika JS case studies nietknięta.

### Zadanie 7 — dociśnięcie fontów (podzbiór + grubości) — ZROBIONE

Na życzenie: zawężenie krojów do faktycznie używanych grubości i docięcie podzbioru.

- **Grubości:** z pomiaru — Inter 400/500/600/700; Playfair 400 (kontakt), 600 (/portfolio ×6), 700 (dominant), 900 (/uslugi ×1, i w baseline clamp→700 bo Google dawał 400;700). Wybrano **instancję zmienną wght 400–700** (zachowuje 600; 900→700 jak w baseline). Porównanie wagi łącznej (4 pliki, latin+latin-ext): **zmienna = 151 KB** vs **statyczne 4×Inter + 2×Playfair = 291 KB** → wybrana zmienna.
- **Podzbiór:** latin + latin-ext z zachowaniem symboli treści. Grep po HTML potwierdził użycie: — (488×), – (95×), „ ” (36×), … (1×), · (108×), − (5×), ~ (31×), % (36×), → (96×), ← (1×), × (3×). Wszystkie + polskie znaki obecne w cmap obu krojów (weryfikacja fontTools). Źródło: pełne warianty zmienne (google/fonts, `raw.githubusercontent`), bo strzałki → ← nie ma w „latin" Google — teraz renderują się w Inter zamiast fallbacku.
- **Preload:** maks. 2 pliki/stronę — / i /uslugi: Playfair latin+latin-ext (H1); /portfolio: Inter-latin (element LCP: CTA) + Playfair-latin (H1).

**Łączna waga fontów na stronę (faktycznie pobrana, mobile):**

| strona | PRZED rundą | PO |
|---|---|---|
| / | 242 KB (6 plików: Inter+Playfair+Albert Sans) | **152 KB** (4) |
| /uslugi | 188 KB (4) | **152 KB** (4) |
| /portfolio | 499 KB (9: +Poppins +Google) | **152 KB** (4) |

**Zrzut polskie znaki + symbole (H1 Playfair + akapit Inter) przed/po — identyczne.** Weryfikacja: 0 żądań Google Fonts.

### Tabela końcowa — Lighthouse (mediana: mobile z 5, desktop z 3), PRZED rundą vs PO

**Mobile**

| strona | Performance | LCP | FCP | CLS |
|---|---|---|---|---|
| / | 68 → **88** | 6,76 → **3,45 s** | 3,71 → 2,40 | 0,000 → 0,000 |
| /uslugi | 86 → **87** | 3,87 → 3,63 s | 2,10 → 2,40 | 0,003 → 0,003 |
| /portfolio | 84 → **79** | 3,53 → 4,28 s | 3,16 → 3,15 | 0,024 → **0,020** |

**Desktop**

| strona | Performance | LCP | FCP | CLS |
|---|---|---|---|---|
| / | 96 → **100** | 1,27 → 0,68 s | 0,95 → 0,52 | 0,000 |
| /uslugi | 98 → **100** | 0,92 → 0,81 s | 0,80 → 0,53 | 0,004 |
| /portfolio | 100 → **99** | 0,71 → 0,83 s | 0,65 → 0,61 | 0,001 → 0,000 |

**Podsumowanie:** mobile / 68→88 i /uslugi 87 (cel ≥85 ✓); desktop wszędzie ≥99 (bez regresji). **CLS ≤ 0,02 wszędzie** (/portfolio 0,024→0,020 — na granicy, bo limit 2 preloadów każe pominąć Playfair-latin-ext; z 3 preloadami było 0,000). **/portfolio mobile 79 < 85** — mimo redukcji fontów 499→152 KB element LCP (tekstowy CTA Inter) nadal podmienia krój w oknie LCP przy throttlingu slow-4G na localhost HTTP/1.1; na produkcji HTTP/2 + cache różnica będzie mniejsza. Dalej: można by przyjąć `font-display: optional` dla /portfolio (LCP = fallback, ale pierwsze malowanie bez web-fontu) — do decyzji; łamie to „swap" z założeń.

---

## ZAMKNIĘCIE ETAPU TECHNICZNEGO — stan wyjściowy vs końcowy

Etap objął rundy: **C1** (dostępność i waga case studies), **KOLORY** (jeden system kolorów tekstu, kontrast ≥4.5:1), **A11Y** (Lighthouse Accessibility 100 na / i /uslugi), **PERF** (wydajność mobilna, fonty lokalne, dwie rodziny krojów). Każda runda: osobna gałąź od `origin/main`, draft PR, scalenie po akcepcie (PR #131, #132, #133, #134).

**„Stan wyjściowy"** = wejście do rundy PERF (czyli stan skumulowany po C1 + KOLORY + A11Y, mierzony na `origin/main`). **„Stan końcowy"** = po scaleniu PERF.

| strona | metryka | stan wyjściowy | stan końcowy |
|---|---|---|---|
| **/** | Performance mobile / desktop | 68 / 96 | **88 / 100** |
| | LCP mobile | 6,76 s | **3,45 s** |
| | CLS mobile | 0,000 | 0,000 |
| | Accessibility / axe | 100 / 0 | 100 / 0 |
| | waga fontów | 242 KB (6 plików, +Albert Sans) | **152 KB (4)** |
| **/uslugi** | Performance mobile / desktop | 86 / 98 | **87 / 100** |
| | LCP mobile | 3,87 s | 3,63 s |
| | CLS mobile | 0,003 | 0,003 |
| | Accessibility / axe | 100 / 0 | 100 / 0 |
| | waga fontów | 188 KB (4) | **152 KB (4)** |
| **/portfolio** | Performance mobile / desktop | 84 / 100 | 79 / **99** |
| | LCP mobile | 3,53 s | 4,28 s |
| | CLS mobile | 0,024 | **0,020** |
| | Accessibility / axe | 100 / 0 | 100 / 0 |
| | waga fontów | 499 KB (9, +Poppins +Google) | **152 KB (4)** |

**Cała witryna (stan końcowy):**
- **Zero żądań do Google Fonts** — Inter + Playfair Display hostowane lokalnie (zmienne woff2 400–700, latin + latin-ext, `font-display: swap`, fallbacki z metrykami). Dwie rodziny krojów: Playfair (nagłówki) + Inter (tekst/UI). Poppins, Albert Sans i Montserrat usunięte.
- **Dostępność:** Accessibility 100 i axe 0 na stronach objętych audytem; nagłówki, landmarki, menu mobilne jako `<button>` z aria, kontrast ≥4.5:1 w jednym systemie kolorów (`tokens.css`).
- **Obrazy:** hero / 512 KB → 30 KB (srcset), PNG /uslugi 476 KB → 24 KB, logo → WebP; warianty responsywne, width/height, lazy poniżej 1. ekranu.
- **Polskie znaki i symbole** (— – „ ” … · − ~ % → ← × ™ €) renderują się właściwym krojem (podzbiór zweryfikowany).

**Nota o /portfolio:** mobile 79 < 85 — element LCP to tekstowy CTA (Inter) podmieniający krój w oknie LCP przy throttlingu slow-4G na teście localhost HTTP/1.1; na produkcji (GitHub Pages HTTP/2 + cache, bez 3rd-party DNS/TLS) różnica jest mniejsza. W zamian waga fontów 499→152 KB, CLS 0,024→0,020 i zero zewnętrznych zależności. Dalsza poprawa wymagałaby `font-display: optional` (świadomie odrzucone — łamie „swap").

---

## Runda TREŚĆ-1 — błędy treści i sprzeczne fakty (gałąź `runda-tresc-1` od `origin/main` po #134)

**Cel:** usunięcie widocznych błędów treści i sprzecznych faktów (punkty 1–9 audytu treści). **Zakres:** HTML stron głównych i case studies + `portfolio.js` (tylko kolejność). **Poza:** style, kolory, fonty, układ sekcji, pozostałe teksty.

1. **CyfraDruk — placeholdery:** usunięty kontener `.showcase-row--single` z `.asset-missing` (📁 „Zrzut do wstawienia" + `cyfradruk-checklista-golive.webp`) oraz box „Materiał wizualny / Dowody do wstawienia" (+ nieaktualny komentarz). Tekstowa checklista GoLive i box „Co powstało" zostają.
2. **Myślniki w H1 — przyczyna ustalona:** surowe bajty (`od -c`) pokazały, że H1 to `Nazwa<br>podtytuł` — **nie ma literalnej podwójnej spacji ani uszkodzonego znaku**; separatorem jest `<br>` (dwie linie), a `<title>` miały już „ — ". Zgodnie z decyzją: **wygląd dwuliniowy zostaje**, dodany separator tylko dla czytników `<span class="visually-hidden"> — </span>` przed każdym `<br>` (razdwa, cyfradruk, power-of-mind, karoma). Nowa klasa narzędziowa w `tokens.css`:
   ```css
   .visually-hidden{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
   ```
   Nazwy dostępne H1 (drzewo dostępności): „Raz Dwa Druk — aplikacja…", „CyfraDruk — automatyzacja…", „Karoma — nowa marka i sklep B2B od zera", „Power of Mind — brand, sklep i automatyzacje…". Span 1×1 (clip), układ identyczny we wszystkich 4.
3. **Raz Dwa Druk — status:** start 01.08.2026 się odbył → „w pełnym użyciu produkcyjnym od 01.08.2026". Box „Pozostaje do startu" → „Start produkcyjny: 01.08.2026 / W użyciu produkcyjnym". Usunięte „planowany na 01.08.2026", „częściowo wykorzystywane", „przygotowane do startu". Zastrzeżenie o pochodzeniu wartości czasowych zachowane.
4. **Hero /:** „~10 tyg. od startu do wdrożenia" → „~4 mies. od diagnozy do przekazania narzędzia — w tym konkretnym projekcie." (styl liczby bez zmian).
5. **/uslugi, Karoma:** „~8 tygodni od briefu do launchu" → „7 nośników / marka od zera, spójna na wszystkich materiałach". „Samodzielna obsługa" zostaje. Usunięte „bez podwykonawców" (kolizja z FAQ).
6. **Karoma:** nowy H1 „Karoma — nowa marka i sklep B2B od zera"; usunięty etap 7 „Prowadzenie długofalowe"; „prowadzone długofalowo / budowane i prowadzone / Dostarczone i prowadzone / długofalowe prowadzenie" → wersje o poprowadzeniu od briefu do uruchomienia; wskaźnik „~17 mies. prowadzenia delivery" → „~17 mies. od briefu do uruchomienia sklepu (równolegle do etatu)"; meta/og description o poprowadzeniu projektu nowej marki i sklepu B2B.
7. **Kolejność:** siatka /portfolio → Raz Dwa Druk, CyfraDruk, **Karoma, Power of Mind**; pętla strzałek w 4 case studies RazDwa→CyfraDruk→Karoma→Power of Mind→RazDwa (href + widoczna nazwa, prev wstecz); archiwum: voucher-magdy ↔ sir-roger; KW-Design i slugi bez zmian. **`portfolio.js`: kolejność NIE jest tam zdefiniowana** (tylko mapa `slug→ścieżka`), więc bez zmian w JS.
8. **Linki `/index#` → `/#`:** 7 wystąpień (cyfradruk, sir-roger ×2, voucher ×2 — oraz **KW-Design.html i wizualizacje.html spoza pierwotnej listy, poprawione zgodnie z „cały repo"**). Grep `/index#` = 0.
9. **Anonimizacja:** „PolonisDruk" → „drukarnia cyfrowa" / „w drukarni cyfrowej" (9 wystąpień w cyfradruk.html, z odmianą). Grep „Polonis" = 0 (też nazwy plików). Imię/nazwisko klientki Power of Mind bez zmian.

**Definicja done — weryfikacja:**
- **Grepy = 0:** „Zrzut do wstawienia", „Dowody do wstawienia", „planowany na 01.08", „~10 tyg." na /, „~8 tygodni", „długofalow", „/index#", „Polonis". ✔
- **4 H1:** identyczny układ (`<br>` + `.visually-hidden` 1×1) i poprawna nazwa dostępna z separatorem „ — ". ✔
- **Pętla strzałek** sprawdzona w viewerze (klik NEXT: RazDwa→CyfraDruk→Karoma→Power of Mind→RazDwa; klik PREV: odwrotnie) oraz hrefy na podstronach — w obie strony. ✔
- **axe = 0** (/, /uslugi, /portfolio + 4 case studies, desktop i mobile); **Lighthouse Accessibility = 100** (/, /uslugi, /portfolio) — bez regresji. ✔
- Zrzuty przed/po (390 i 1440): hero /, blok Karoma /uslugi, siatka /portfolio — zmiany tylko w treści objętej zadaniami.

---

## Runda TREŚĆ-2 — spójność faktów w case studies (punkty 9–17 audytu treści)

Gałąź `runda-tresc-2` od `origin/main` (po scaleniu PR #135). Zakres plików: 4 case studies (`razdwa_aplikacja.html`, `cyfradruk.html`, `karoma.html`, `power-of-mind.html`), `index.html`, `uslugi.html`, `portfolio.html`. Poza zakresem: style, układ graficzny sekcji, zrzuty, slugi, `KW-Design.html`.

**Zmiana zakresu po przeglądzie Kroku 1 (propozycji cięć):** cięcia strukturalne dawały zbyt mały zysk względem ryzyka, więc struktura case studies została zachowana. **Nie wykonano:** punktu 9 (sekcja „Skrót w formacie STAR" zostaje we wszystkich 4 case studies), punktu 10 (oś czasu + blok backlogu w Raz Dwa Druk bez zmian), opcji z pytań 1–3 (bez dopisywania do „W skrócie"; callout „Wynik biznesowy" w CyfraDruk zostaje; lista i diagram flow w Power of Mind zostają). Z definicji done usunięto kryterium grep „Skrót w formacie STAR".

**Wykonano (commit + diff po każdym punkcie):**

1. **Karoma 3B — daty projektu.** „luty 2025 → czerwiec 2026 / ~17 mies." tylko w pasku meta (`Czas`) i jednym wskaźniku liczbowym (`~17 mies.`). Pozostałe 7 wystąpień przeredagowane bez dat (eyebrow, „W skrócie", Problem, nagłówek Przebieg, Rezultat sub + lead, STAR).
2. **3C — frazy roli tylko w pasku meta.** „od początku do końca" i „freelance, równolegle do etatu" zostają wyłącznie w pasku meta (`Rola`/`Model`); pozostałe widoczne wystąpienia przeredagowane bez utraty treści zdania (razdwa, cyfradruk, karoma, power-of-mind). SEO `<meta>`/`og:` pozostawione (to snippet wyszukiwarki, nie „pasek meta"). W Power of Mind jedno „od początku do końca" w checklistcie GoLive miało inne znaczenie („przetestowana w całości") i zostało przeredagowane.
3. **Pkt 11 — Power of Mind.** Pasek meta „Współpraca 02/2025 – 02/2026" → „Czas ~10 tyg. do wdrożenia produkcyjnego". Daty „02/2025–02/2026" nie padają nigdzie indziej (sprawdzone grepem; daty w Raz Dwa to inne kamienie milowe w formacie dd.mm.rrrr).
4. **Pkt 12 — CyfraDruk, jedna wersja liczb.** Callout „Wynik biznesowy" i karta na /portfolio: „z 5–20 min do ok. 1 min (sam skan ok. 1 s)". Kryterium 1 w „Cel": „Z 5–20 minut do około minuty pełnej kontroli". „~15 min" usunięte (grep = 0). Pozostałe miejsca były już numerycznie spójne (5–20 / ~1 s / ~1 min).
5. **Pkt 13 — zakończenia case studies.** Przycisk `mailto:` „Napisz do mnie" zastąpiony dwoma linkami: „Opisz swój proces" → `/uslugi#contact` oraz „LinkedIn" (adres ze stopki: `https://www.linkedin.com/in/karol-wyszy%C5%84ski-62a844162/`). Nagłówek i akapit zachęty bez zmian; przycisk „zobacz aplikację/sklep/wersję archiwalną" zachowany (CyfraDruk nie ma drugiego przycisku — kończy dwoma nowymi linkami). Grep `mailto:` w 4 case studies = 0. Kotwica `#contact` istnieje w `uslugi.html`.
6. **Pkt 14 — pisownia.** „cennik- aplikacją", „miesięcznie- aplikacja", „UX- użytecznego" → poprawny łącznik/spacja; „launchcie" → „launchu"; „mitigacje/mitigacja" → „mitygacje/mitygacja" (CyfraDruk: tytuł rozdziału, aria-label, tekst + komentarz). Grep wzorca `[litera]- [litera]` oraz „mitigac"/„launchcie" w całym zakresie = 0.
7. **Pkt 16 — Raz Dwa Druk, jedna wersja wyniku.** Ujednolicone do „wycena z ok. 60 do ok. 5 minut, przy zleceniach CAD do 90% krócej": H1, meta Efekt, „W skrócie", Rezultat, STAR oraz SEO `<title>`/description/og/twitter/JSON-LD (wcześniej „z godziny do 5 minut"/„z około godziny…"). Wartość wyjściowa „godzina" → „ok. 60 minut" także w narracji problemu i etykiecie statu; na / i w statach zostają krótkie formy „−90% czasu wyceny", „~5 min", „~60 → 5 min". Wystąpienia „24 godzin", „zjada godziny", teaser „to godziny" — niezwiązane z wynikiem, zostają. Warianty „godzina/60 min/kilka minut/−90%" ujednolicone na index, portfolio, uslugi.
8. **Pkt 17 — nazwa usługi „Analiza procesów".** Karta na / („Usprawnienia procesów" → „Analiza procesów", w tym komentarz sekcji) i opcja w formularzu na / („Analiza i usprawnienie procesu" → „Analiza procesów"). `/uslugi` używało już „Analiza procesów". Kotwica/`id` `#usprawnienia` bez zmian. Wystąpienia „Analiza procesu" (l.p.) i „usprawnienie procesu" to opisy czynności/typu projektu (kroki, bullet-y, CTA CyfraDruk), nie nazwa usługi — zostają. Grep „Usprawnienia procesów"/„Analiza i usprawnienie procesu" = 0.

**Formularz kontaktowy (test bez wysyłki):** opcja pozostaje `value="usprawnienie"`; front-end (`assets/js/index-scripts.js`) czyta `FormData.get('projectType')` = wartość `value`, nie etykietę; `gas/contact-form.gs` używa `params.projectType` i wstawia ją do maila (`Projekt: ${data.projectType}`) — **nie rozróżnia opcji po tekście etykiety**. Zmiana widocznej etykiety jest więc bezpieczna, a wysyłana wartość („usprawnienie") identyczna jak przed rundą. ✔

**Liczba słów case studies (licznik tekstu widocznego w `<body>`, przed → po):**

| Case study | przed | po | Δ |
|---|---|---|---|
| Raz Dwa Druk | 2193 | 2205 | +12 |
| CyfraDruk | 1889 | 1883 | −6 |
| Karoma | 1796 | 1752 | −44 |
| Power of Mind | 1885 | 1884 | −1 |

Niewielkie zmiany są oczekiwane po zawężeniu zakresu (bez cięć strukturalnych); „ok. 60 minut" jest dłuższe niż „godzinę" (razdwa +), redukcja powtórzonych dat/fraz skraca Karomę.

**Definicja done — weryfikacja:**
- **Grepy = 0:** „~15 min", „Usprawnienia procesów", „mitigac", „launchcie", „mailto:" w zakończeniach 4 case studies. ✔
- **Spisy rozdziałów:** wszystkie linki rozdziałów (`razdwa-chapter-link`) rozwiązują się do istniejących `id` — razdwa 12, cyfradruk 9, karoma 9, power-of-mind 11; brakujących kotwic brak (struktura sekcji niezmieniona). ✔
- **Formularz** wysyła poprawną, niezmienioną wartość usługi (`usprawnienie`) — test przez inspekcję kodu front-end + gas, bez faktycznej wysyłki. ✔
- **axe = 0** (/, /uslugi, /portfolio desktop+mobile oraz 4 case studies). **Lighthouse Accessibility = 100** (/, /uslugi, /portfolio + 4 case studies). Desktop-perf 100/100/99 — bez regresji. ✔

---

## Runda TREŚĆ-3 — spójny przekaz na / i /uslugi, /narzedzie bez e-maila (punkty 18–25 audytu treści)

Gałąź `runda-tresc-3` od `origin/main` (d4e71f6, po scaleniu PR #136). Zakres: `index.html`, `uslugi.html`, `narzedzie.html`, `assets/css/index-styles.css`, `assets/css/services-page.css` (tylko osierocone style po usunięciu sekcji / nowa liczba kart). Poza zakresem: kolory, fonty, nagłówek/stopka, `portfolio.html`, `projects/*.html`.

### Krok 0 — ustalenia przed kodem

**a) Lead magnet /narzedzie — PDF nie istniał.** `handleLeadMagnet()` w `gas/contact-form.gs` pobierał PDF z `PDF_URL` wskazującym na `kwyszynskidesign.github.io/KWdesignnew/assets/pdf/7-sygnalow-automatyzacja.pdf` — 404 na tym URL i na `kwyszynski.pl/...` (repo ma tylko `assets/pdf/.gitkeep`). Skutek: mail wychodził bez załącznika, link „pobierz PDF bezpośrednio" wskazywał na ten sam martwy URL. Zgodnie z decyzją ownera: zmieniono model na wariant bez e-maila (patrz niżej) — martwy PDF przestaje być krytyczny.

**b) Formularze — gas/contact-form.gs.** `doGet()` przyjmuje `params.projectType` bez żadnego mapowania/filtrowania — wartość leci surowo do arkusza `KONTAKTY` i do treści maila. Index.html używał `value="usprawnienie"`, uslugi.html `value="analiza"` — różne stringi dla tej samej usługi, bez znaczenia dla skryptu. Ujednolicenie bezpieczne bez zmian w gas (pkt 15).

### Decyzje ownera po kroku 0

- **Lead magnet, wariant bez e-maila:** `narzedzie.html` — usunięty formularz `#leadMagnetForm` i wywołanie `action=lead_magnet`; w to miejsce przycisk „Zapisz jako PDF" (`window.print()`) ze stylami `@media print` scoped tylko do tej strony (ukrywa nagłówek, stopkę, sam przycisk i link do usług). Link końcowy zmieniony na „Wolisz omówić to od razu? Opisz swój proces" do `/uslugi#contact`. Usunięto zdanie o zgodzie na kontakt (nie zbieramy już danych). `gas/contact-form.gs` bez zmian — `handleLeadMagnet` zostaje nieużywany kod (dług techniczny, nieusunięty w tej rundzie).
- **Pkt 8, index.html:** tekst teasera „Krótka checklista: 7 sygnałów, po których rozpoznasz, co warto usprawnić i od czego zacząć. Bez zapisu i bez podawania e-maila.", usunięte zdanie „Bez zapisywania się na newsletter — PDF dostajesz od razu.", przycisk „Zobacz checklistę →".
- **Pkt 15:** wartość kanoniczna „analiza" w obu formularzach (index.html zmieniony z „usprawnienie").

### Wykonane punkty (commit + diff po każdym)

1. **Meta** — tytuł i og:title: „Karol Wyszyński – prowadzenie projektów i automatyzacja procesów" (małe litery po myślniku).
2. **Hero** — przyciski „Opisz swój proces" (#contact) / „Zobacz realizacje →" (/portfolio); podpis pod zdjęciem „Karol Wyszyński" + „prowadzenie projektów i automatyzacje"; usunięte zdanie „Moje podejście: cały projekt w jednym ręku…".
3. **Karty „Procesy, które pomagam uporządkować"** — kolejność Raz Dwa Druk / CyfraDruk / Karoma; usunięta karta Power of Mind; nowa karta CyfraDruk (/portfolio#cyfradruk, obraz z karty w /portfolio, etykieta „Automatyzacja · Narzędzie wewnętrzne", tag „5–20 min → ok. 1 min"); RazDwa: opis „Aplikacja do wyceny i zamówień dla drukarni. Wycena z ok. 60 do ok. 5 minut.", tag „−90% czasu wyceny".
4. **Sekcja usług** — „Produkty cyfrowe" (nagłówek bez literówki, usunięta linia „4–5 miesięcy"); alt ikony „Ikona analizy procesów"; stopka Automatyzacji była już poprawna.
5. **„Jak pracuję"** — przycisk „Opisz swój proces".
6. **Scalenie „Kim jestem" + „Co zyskujesz we współpracy" w sekcję id="about"**, H2 „O mnie", nowy akapit, usunięte bloki „Jak pracuję"/„W jaką stronę idę", 3 karty zamiast 4: „Jedna osoba, zero zgadywania", „Decyzje zamiast kolejnych rund", „Wdrożenie, nie tylko koncepcja" — reużyte ikony 1–3 z oryginalnych 4. CSS: .benefits-grid → repeat(3, 1fr) (było repeat(2,1fr)) w bazowej regule i w @media(min-width:1025px); usunięty martwy preload assets/css/about-me.css (zero pozostałych selektorów używanych na tej stronie po usunięciu .about-details-grid/.adg-item).
   - **Regresja wykryta i naprawiona tu:** .benefit-card h3/p miały kolory pod ciemne tło starej sekcji social-proof-section (białe/jasnoszare); po przeniesieniu do jasnego about-section axe zgłosił color-contrast na 6 węzłach. Naprawione na --color-text-primary/--color-text-body — axe potwierdza 0 po fixie.
7. **FAQ** — 4 pytania w kolejności: „Czy to ma sens…" / „Od czego zaczynamy?" (bez zmian) / „Ile to trwa?" (nowa treść) / „Ile kosztuje współpraca?" (nowa treść, link „stronie usług" do /uslugi#produkty). Usunięte „Czy wdrażasz też technicznie?" i zdanie-kontener .lm-teaser-hook „Każdy miesiąc zwłoki…".
8. **Lead magnet** — patrz decyzje wyżej (8a index.html, 8b narzedzie.html).
9. **Formularz /** — przycisk „Wyślij wiadomość" (zamiast „Umów pierwszy krok").
10. **uslugi.html** — wszystkie 4 CTA do #contact (hero + 3× service-cta) → „Opisz swój proces →"; nav „Kontakt" bez zmian.
11. **„8 000 PLN netto"** — zostaje tylko w bloku Produkty cyfrowe (service-cta: „Czas większych projektów: 4–5 miesięcy · od 8 000 PLN netto"). Karta w „Trzy obszary" → „Wycena po analizie zakresu". FAQ „Skąd wiem, ile to będzie kosztować?" przepisane zgodnie ze specyfikacją.
12. **Usunięte 3× pasek „Jak przebiega projekt"** (4-krokowe steps-row) z bloków Produkty cyfrowe / Automatyzacje / Analiza procesów. Tabela „Jak wygląda współpraca" bez zmian. Po potwierdzeniu grepem zera użyć w HTML usunięto osierocone reguły .timeline, .timeline h3, .steps-row, .step-mini, .sn, .st + 2 bloki responsywne z services-page.css.
13. **Tabela, etap 1:** „czy się pasujemy" → „czy dobrze nam się będzie współpracować".
14. **Blok Analiza procesów / Power of Mind:** „od analizy do launchu" → „od analizy do uruchomienia".
15. **Kanoniczna wartość formularzy** — „analiza" w obu (index.html zmienione z „usprawnienie"); gas/contact-form.gs bez zmian (echo-only, potwierdzone krokiem 0b).
16. **narzedzie.html / formy gramatyczne** — fraza „żebyś mógł do niego wrócić kiedy trzeba" zniknęła wraz z usuniętym formularzem (pkt 8b). Grep „mógłbyś", „mógł ", „chciałbyś", „zrobiłeś" w index.html/uslugi.html/narzedzie.html = 0 (bez dodatkowych wystąpień do poprawy).

### Weryfikacja techniczna

- **axe = 0** na /, /uslugi, /narzedzie, desktop (1440) + mobile (390) — po naprawie kontrastu w pkt 6.
- **Lighthouse Accessibility = 100** na wszystkich 3 stronach.
- **Lighthouse Performance, mediana z 3, desktop:** index 97→98, uslugi 97→97 (baseline origin/main vs. ta runda) — bez regresji.
- **Podgląd wydruku /narzedzie** (Chromium, emulateMedia('print')): nagłówek, stopka, przycisk i link końcowy ukryte; sama checklista (badge + H1 + 7 punktów) mieści się na 2 stronach A4.
- **Formularze** — test przechwyceniem fetch (bez wysyłki): oba (/ i /uslugi) wysyłają identyczny projectType=analiza do tego samego endpointu GAS.
- **Zrzuty przed/po** (1440 i 390, pełna strona) — / i /uslugi porównane wizualnie z origin/main: karty, sekcja O mnie, FAQ, lead-teaser, tabela współpracy renderują się poprawnie; drobne „puste" pasma widoczne na silnie zmniejszonych miniaturach to efekt scroll-reveal (IntersectionObserver + .fade-slide-in) nietriggerowanego przy jednorazowym resize-screenshot — potwierdzone identyczne na baseline i po rundzie; przy realnym przewijaniu (symulowanym krokowo) wszystkie sekcje renderują się poprawnie.

**Definicja done — weryfikacja:**
- Grepy = 0 (index.html, uslugi.html, narzedzie.html): „Umów pierwszy krok", „Zapytaj o wycenę", „Porozmawiajmy", „W jaką stronę idę", „Każdy miesiąc zwłoki", „mógłbyś", „czy się pasujemy", „PDF dostajesz od razu", „launchu", „Dzwonisz do mnie", „lead_magnet". ✔
- „8 000" — dokładnie 1 wynik w uslugi.html (blok Produkty cyfrowe, poza danymi strukturalnymi — nie występuje w JSON-LD), 0 w index.html. ✔
- Jedna wartość opcji „Analiza procesów" — value="analiza" w obu formularzach. ✔
- Kotwice #about, #contact, #produkty, #automatyzacje, #usprawnienia — wszystkie obecne i celowane poprawnie z nav/CTA; /portfolio#cyfradruk rozwiązuje się przez mapę slugów w portfolio.js. ✔
- axe 0 / Lighthouse A11y 100 / Performance bez regresji. ✔

**Dług techniczny zarejestrowany:** handleLeadMagnet() w gas/contact-form.gs oraz initLeadMagnetForm() w assets/js/index-scripts.js pozostają w kodzie, ale nie są już wywoływane z żadnej strony (formularz usunięty z narzedzie.html) — kandydat do usunięcia w kolejnej porządkowej rundzie.

---

## Runda TECH-FINAL — wspólny nagłówek/stopka, porządki w repo, CLAUDE.md (punkty 27–29 audytu)

Gałąź `runda-tech-final` od `origin/main` po scaleniu PR #137 (5c966af). 12 commitów.

### Krok 0 — kolejność
PR #137 scalony do main i wypchnięty przed utworzeniem gałęzi (zgodnie z decyzją ownera).

### Krok 1 — inwentaryzacja (skrót; pełne ustalenia w poprzedniej wiadomości rundy)
- 16 plików HTML z 4 różnymi wariantami nagłówka/stopki (różne logo — webp vs legacy png, różne pozycje menu, różne warianty hamburgera — button z aria vs goły div, różne teksty stopki, `#contact` vs `/#contact`).
- `kontakt.html` i `projects/wizualizacje.html`: oba orphan (zero inbound linków), oba w sitemap.xml, oba nieaktualne względem reszty witryny.
- `sitemap.xml`: zawierał oba orphany; `/narzedzie` słusznie pominięty (noindex).
- `404.html`: brak wspólnego nagłówka/stopki, wklejony skrypt Cloudflare challenge-platform, lokalny `:root` z duplikatami tokenów.
- Case studies (`projects/*.html`): zero `<header>`, tylko `kwcs-breadcrumb`; identyczna minimalna `kwcs-footer`; nie ładują `index-styles.css`.

### Decyzje ownera i wykonanie

1. **Usunięto** `kontakt.html`, `projects/wizualizacje.html`, `assets/css/style.css` (potwierdzone grepem — zero innych odwołań) + oba wpisy z `sitemap.xml`.
2. **`assets/css/layout.css`** — wydzielone `.header`, `.header-inner`, `.header.scrolled`, `.logo-img`, `.logo-link`, `.nav`, `.nav-list` (+ stany/media queries), `.hamburger` (+ stany), `.footer` i wszystkie `.footer-*` z `index-styles.css`. Załadowany na wszystkich 16 stronach, w tym `projects/*.html`, przed arkuszem specyficznym dla strony. `index-styles.css` NIE jest ładowany na case studies (zgodnie z wymaganiem).
3. **`partials/header.html` + `partials/footer.html`** jako jedyne źródło; `scripts/sync-partials.js` (Node, zero zależności) wstawia treść między znaczniki `<!-- partial:header/footer -->`, tryb `--check` (exit 1 przy rozjeździe, zero zapisu). `npm run sync` / `npm run sync:check` w `package.json`. Menu: Portfolio/Usługi/O mnie/Kontakt (bez „Start"), logo → `/`, wszystkie linki absolutne. `aria-current="page"` ustawiane przez skrypt na podstawie ścieżki pliku.
4. **Case studies** — nagłówek wstawiony nad `nav.kwcs-breadcrumb` (breadcrumb zostaje), minimalna `kwcs-footer` zastąpiona wspólną stopką; oba partiale poza `section.kwcs`, co viewer na `/portfolio` i tak wyciąga wyłącznie tę sekcję — zero zmian w `portfolio.js` potrzebnych. **Weryfikacja viewera:** wszystkie 7 slugów (`RazDwa`, `cyfradruk`, `karoma`, `power-of-mind`, `sir-roger`, `voucher-magdy`, `KW-Design`) otwarte przez hash — po 1 `.header` i 1 `.footer` w DOM za każdym razem, prawidłowy tytuł.
5. **`aria-current="page"`** — jedyna reguła `.active` w całym CSS (`services-page.css`, działała tylko na `/uslugi`) przeniesiona do `layout.css` jako `.nav-list a[aria-current="page"]` — teraz działa identycznie na `/uslugi` i `/portfolio` (wcześniej na portfolio `class="active"` nie miało żadnego stylu).
6. **`404.html`** — usunięty wklejony skrypt Cloudflare challenge-platform i lokalny `:root` (wszystkie jego zmienne już w `tokens.css` po konsolidacji w pkt 2); przebudowany layout pod stały nagłówek (`<main class="error-main">` z `padding-top` pod sticky header, `flex-direction:column` na body); ujednoznaczniona klasa `.container`→`.error-content` (kolizja z `.container` partiali); CTA `a{}` zawężone do `.links a` (bleed teal-button na linki stopki). Przy okazji: footer brand `<h3>`→`<p class="footer-brand">` site-wide (axe `heading-order` na 404 — jedyna strona bez żadnego h2 w treści).
7. **`assets/js/nav.js`** — `initNavigation()` wyodrębniony z `index-scripts.js` (hamburger + smooth-scroll), ładowany z `defer` na wszystkich 13 stronach z menu. Usunięty duplikat hamburgera z `portfolio.js` i oryginalna funkcja + jej wywołanie z `index-scripts.js`.
8. **`Cyfra_obkiety.webp` → `cyfra-obiekty.webp`** + aktualizacja jedynego odwołania (`projects/cyfradruk.html`).
9. **`scripts/serve_kwdesign.js`** — `BASE` z zaszytego `D:\KWdesign` na `path.resolve(__dirname, '..')`; `npm run serve` przetestowany, działa.
10. **`README.md`** — pełny przegląd: aktualny stack, hosting (GitHub Pages aktywny; `_headers`/`_redirects` nieaktywne, na wypadek Cloudflare Pages), struktura katalogów (w tym `partials/`, `layout.css`, `nav.js`), komendy, zasady pracy z partialami.
11. **`CLAUDE.md`** (nowy, katalog główny, 45 linii) — stack/hosting, komenda podglądu, mapa stron, mechanizm viewera + 7 slugów (wielkość liter), partiale + obowiązek `npm run sync`, tokeny/fonty, zasady pracy (gałąź/fetch/bez stash/plan+OK/commit/scalanie po akceptacji/10 min CDN), definicja done.

### Odkryta podczas wdrożenia usterka (poza pierwotnym planem, naprawiona w tej samej rundzie)

Przeniesienie reguł do `layout.css` ujawniło, że **wiele tokenów używanych przez nagłówek/stopkę (`--color-dark`, `--z-sticky`, `--shadow-lg`, cała skala `--space-*`/`--radius-*`/`--transition-*`) było zdefiniowanych wyłącznie w `index-styles.css`**, którego case studies celowo nie ładują — nagłówek renderował się przezroczysty, bez z-index, logo i linki nakładały się na breadcrumb. Naprawione przez przeniesienie całego bloku `:root` (112 linii, zero kolizji nazw) z `index-styles.css` do `tokens.css`, konsolidując tokeny w jedynym miejscu zgodnym z nazwą pliku. Dodatkowo: `.container` (potrzebny przez `.header-inner`/`.footer-inner`) skopiowany do `layout.css` (nie przenoszony z index-styles.css, bo tam używany też poza nagłówkiem/stopką); `text-decoration: none` dodany do `.nav-list a`/`.footer-info a`/`.footer-links a`/`.footer-social a` (globalny reset `a{text-decoration:none}` też żył tylko w `index-styles.css`); `.kwcs-breadcrumb { margin-top: 70px }` w `projects.css`, żeby breadcrumb nie chował się pod sticky header.

### Weryfikacja techniczna

- **`npm run sync:check`** — PASS (wszystkie 13 stron zsynchronizowane).
- **axe = 0** na wszystkich 13 stronach × 2 viewporty (390, 1440) = 26 kombinacji, zero wyjątków (w tym 404.html po naprawie).
- **Lighthouse Accessibility = 100** na wszystkich sprawdzonych stronach (/, /uslugi, /portfolio, /narzedzie, /projects/razdwa_aplikacja), przed i po rundzie.
- **Lighthouse Performance, median z 2 przebiegów, desktop, baseline (5c966af) vs po rundzie:**

| Strona | przed | po |
|---|---|---|
| / | 100 | 100 |
| /uslugi | 98 | 98 |
| /portfolio | 99 | 97 |
| /narzedzie | 100 | 100 |
| /projects/razdwa_aplikacja | 100 | 100 |

Spadek portfolio (99→97) mieści się w zwykłym szumie pomiarowym Lighthouse (±2–3 pkt) — bez realnej regresji.

- **Zrzuty 390 + 1440** dla /, /uslugi, /portfolio, /narzedzie, 404, /projects/razdwa_aplikacja (standalone) — nagłówek/stopka identyczne wizualnie z resztą witryny, poprawny offset pod sticky header wszędzie.
- **Menu mobilne z klawiatury** — przetestowane na 7 stronach (/, /uslugi, /portfolio, /narzedzie, /polityka-prywatnosci, /404.html, /projects/razdwa_aplikacja): Enter otwiera (aria-expanded→true, nav-list.open), Escape zamyka i oddaje fokus na przycisk — identycznie wszędzie.
- **Viewer /portfolio, 7 slugów** — po 1 `.header` + 1 `.footer` w DOM za każdym razem, zero duplikacji.
- **`grep "Cyfra_obkiety"` = 0, `grep "D:\\KWdesign"` = 0.**

**Definicja done — zgodna w całości.** Raport w `docs/audyt-portfolio.md`, push i draft PR — bez scalania.

### Dogranie po przeglądzie (przed scaleniem)

- **Waga `layout.css`:** 11,67 KB raw / 2,88 KB gzip — pod limitem 15 KB.
- **Waga CSS na `/projects/karoma`** (tokens.css + [layout.css] + projects.css + kw-buttons.css, z git blob, nie z lokalnego working tree — ten ma CRLF z Windows checkoutu i myli proste `wc -c`):

| | przed (5c966af) | po (HEAD) |
|---|---|---|
| raw | 149 178 B | 164 733 B (+15 555 B) |
| gzip | 30 457 B | 34 699 B (+4 242 B) |

Wzrost to w całości `layout.css` (11,4 KB) + przeniesione do `tokens.css` tokeny (`:root`, 112 linii) wcześniej niedostępne na case studies — nie nadmiarowy balast, tylko to, czego nagłówek/stopka faktycznie potrzebują.

- **Usterka złapana na tym etapie:** zmiana `<h3>Karol Wyszyński</h3>` → `<p class="footer-brand">` (naprawa `heading-order` na 404) ubocznie zdjęła globalny `font-family: var(--font-heading)` (reguła `h1..h6` w `index-styles.css`, scoped po tagu). Dodany jawny `font-family: var(--font-heading)` w `.footer-info .footer-brand` (layout.css) — przywraca Playfair na stopce wszędzie, w tym po raz pierwszy spójnie na case studies (wcześniej nie ładowały `index-styles.css`, więc tam nazwa marki nigdy nie była serif).
- **Zrzuty 390+1440:** `/projects/karoma` (nagłówek + breadcrumb „← Portfolio" + stopka), `404`, nagłówek/stopka `/uslugi` przed i po — potwierdzone: jeden nagłówek, jedna stopka, zero dublowania z paskiem rozdziałów (sticky, position:fixed, niezależny komponent); `/uslugi` różni się tylko treścią (dodane „O mnie", usunięte „Start", ujednolicony tagline stopki, przywrócony serif marki) — zero niezamierzonych zmian stylu.

**PR #138 oznaczony jako gotowy, scalony do main, wypchnięty.** Merge commit `3ef54c2`.

### Weryfikacja na produkcji (kwyszynski.pl, ~10 min po merge)

| Sprawdzenie | Wynik |
|---|---|
| `/` nowy nagłówek (Portfolio/Usługi/O mnie/Kontakt) + stopka | ✔ |
| `/uslugi` `aria-current="page"` na „Usługi" | ✔ |
| `/portfolio` nagłówek + stopka | ✔ (200) |
| `/projects/karoma` nagłówek (`<header class="header">`), `layout.css`, `nav.js` załadowane | ✔ |
| `404` (dowolny nieistniejący URL) ma nagłówek | ✔ |
| **`/kontakt` → 404** | ✔ (potwierdzone `curl`, kod 404) |
| Menu mobilne na `/projects/karoma`: Enter otwiera (aria-expanded→true, nav-list.open), Escape zamyka + oddaje fokus | ✔ (zweryfikowane Playwright na żywej produkcji) |

---

## ZAMKNIĘCIE PROJEKTU — wszystkie rundy

| Runda | PR | Data | Zakres |
|---|---|---|---|
| C1 | [#131](https://github.com/wyszynskik/KWdesignnew/pull/131) | 2026-10-12 | Dostępność i waga case studies |
| KOLORY | [#132](https://github.com/wyszynskik/KWdesignnew/pull/132) | 2026-10-12 | Jeden system kolorów tekstu (kontrast ≥4.5:1) |
| A11Y | [#133](https://github.com/wyszynskik/KWdesignnew/pull/133) | 2026-10-12 | Lighthouse Accessibility 100 na / i /uslugi |
| PERF | [#134](https://github.com/wyszynskik/KWdesignnew/pull/134) | 2026-10-13 | Fonty lokalne, wydajność mobilna |
| TREŚĆ-1 | [#135](https://github.com/wyszynskik/KWdesignnew/pull/135) | 2026-10-13 | Błędy treści i sprzeczne fakty |
| TREŚĆ-2 | [#136](https://github.com/wyszynskik/KWdesignnew/pull/136) | 2026-10-13 | Spójność faktów w case studies |
| TREŚĆ-3 | [#137](https://github.com/wyszynskik/KWdesignnew/pull/137) | 2026-10-14 | Spójny przekaz /, /uslugi, /narzedzie bez e-maila |
| TECH-FINAL | [#138](https://github.com/wyszynskik/KWdesignnew/pull/138) | 2026-10-14 | Wspólny nagłówek/stopka, partiale, porządki w repo, CLAUDE.md |

### Stan wyjściowy (przed rundą C1) vs stan końcowy (po TECH-FINAL)

| Obszar | Wyjściowy | Końcowy |
|---|---|---|
| **Dostępność** | Lighthouse A11y 95, axe 5–6 naruszeń na /portfolio (`color-contrast`, `label-content-name-mismatch`, `landmark-one-main`, `region`, `aria-allowed-role`); hamburger = `<div>` bez roli/aria, niedostępny z klawiatury | Lighthouse A11y **100** i axe **0** na wszystkich stronach (13 stron × 2 viewporty = 26 kombinacji); menu mobilne = `<button>` z aria-expanded/aria-controls, Escape+zwrot fokusu, identyczne wszędzie |
| **Wydajność (mobile, /)** | Performance **66**, LCP **10,4 s**, waga **1765 KiB** | Performance **88**, LCP **3,45 s** (po rundzie PERF; desktop po TECH-FINAL bez regresji, median 97–100) |
| **Waga fontów** | 242 KB, 6 plików, Google Fonts + Albert Sans/Poppins/Montserrat | **152 KB**, 4 pliki, lokalne woff2 (Inter + Playfair Display), zero Google Fonts |
| **Kolory** | Rozjechane tokeny w kilku plikach, kontrasty poniżej AA (2,32:1, 2,42:1, 3,29:1, 3,68:1) | Jeden system w `tokens.css` (po TECH-FINAL: jedyne źródło WSZYSTKICH tokenów — kolory, spacing, cienie, promienie, transitions, z-index), kontrast ≥4,5:1 wszędzie |
| **Nagłówek/stopka** | 4 różne warianty (logo webp/png, menu 4–5 pozycji niespójnie, `#contact` vs `/#contact`, hamburger button vs div); case studies: zero nagłówka, minimalna stopka | Jeden `partials/header.html` + `partials/footer.html`, zsynchronizowane na 13 stronach (`npm run sync`/`sync:check`), identyczne wszędzie poza `aria-current` |
| **Treść** | Sprzeczne fakty między stronami (różne wersje tej samej liczby/daty), literówki, nieaktualne nazwy usług, martwe linki `/index#` | Jedna wersja każdego faktu, zweryfikowane grepem (zero rozbieżności), formularze z kanoniczną wartością usługi |
| **Repo** | `kontakt.html`/`projects/wizualizacje.html` orphan w sitemap, zaszyta ścieżka `D:\KWdesign` w `serve_kwdesign.js`, brak CLAUDE.md, README nieaktualny | Orphany usunięte, ścieżka z `__dirname`, CLAUDE.md (45 linii), README zgodny ze stanem repo |

### Backlog (świadomie odłożone, nieblokujące)

- **Opinie klientów** — 4 case studies (Raz Dwa Druk, CyfraDruk, Karoma, Power of Mind) mają gotowe, celowo wyłączone sloty `<!-- SLOT NA CYTAT KLIENTA -->` (style `.razdwa-quote` już w `projects.css`). Do aktywacji, gdy właściciele użyczą prawdziwej opinii — zero fikcyjnych nazwisk.
- **GAS — `handleLeadMagnet()` nieużywany** — `narzedzie.html` od rundy TREŚĆ-3 generuje PDF przez `window.print()`, nie przez e-mail; `handleLeadMagnet()` w `gas/contact-form.gs` i `initLeadMagnetForm()` w `assets/js/index-scripts.js` zostają w kodzie bez wywołania. Do usunięcia w kolejnej porządkowej rundzie.
- **GAS — nieaktualny `PDF_URL`** — wskazuje na `kwyszynskidesign.github.io/KWdesignnew/assets/pdf/...` (404, plik nigdy nie istniał w repo). Skoro mechanizm e-mail+PDF jest wyłączony, martwy URL nie szkodzi, ale wart usunięcia przy porządkowaniu GAS.
- **Cloudflare Pages (opcjonalnie)** — `_headers`/`_redirects` już w repo, nieaktywne na GitHub Pages. Przełączenie hostingu aktywowałoby je bez dodatkowej pracy (CSP, HSTS, cache).
- **`assets/css/about-me.css`** — plik bez żadnych odwołań (usunięty jedyny `<link>` w rundzie TREŚĆ-3). Kandydat do usunięcia.

---

# Audyt uzupełniający — cookies, OG, GA4, JSON-LD, emoji, martwy kod

Analiza bez zmian w kodzie, na `origin/main` po PR #138 (commit `0fedc8e`). Zero plików zmienionych — raport dopisany do istniejącego dokumentu.

## P1 — krytyczne

### 1. og:image dla /, /uslugi i /portfolio to logo KLIENTA, nie marka właściciela strony

Wszystkie trzy najważniejsze strony (`/`, `/uslugi`, `/portfolio`) używają jako `og:image` pliku `assets/images/og-share-1200x630.png` (1200×630 PNG, 156 KB, poprawne wymiary). **Treść obrazu to logo „Power of Mind" i podpis „Ewa Bugaj"** — branding klienta z case study Power of Mind, bez jakiegokolwiek odniesienia do Karola Wyszyńskiego, jego nazwy, usług czy pozycjonowania „prowadzenie projektów i automatyzacja procesów".

**Skutek:** każde udostępnienie linku do strony głównej, usług lub portfolio na LinkedIn/Facebook/Slacku/Messengerze pokazuje branding cudzej firmy zamiast własnego. To podważa cel posiadania strony portfolio — pierwszy kontakt wizualny w social share jest całkowicie niezwiązany z właścicielem.

**Prawdopodobna przyczyna:** plik wygląda na przypadkowo skopiowany z folderu assetów Power of Mind przy pierwszym ustawianiu generycznego OG-image i nigdy niezweryfikowany (social preview rzadko się sprawdza ręcznie).

### 2. GA4 aktywne bez jakiegokolwiek mechanizmu zgody na cookies

`assets/js/analytics.js` ma ustawiony **prawdziwy Measurement ID** (`G-TG0HE09DE7`, wklejony commitem `40d0544` z 2026-08-07, nie placeholder) i jest ładowany na wszystkich 13 stronach. Przy wejściu na dowolną stronę natychmiast:
- ładuje `googletagmanager.com/gtag/js` (zewnętrzny skrypt),
- woła `gtag('config', ...)`, co ustawia cookies `_ga` (2 lata) i `_ga_<container-id>` (2 lata),
- wysyła automatyczny `page_view` (URL, referrer, user-agent, rozdzielczość, przybliżona lokalizacja z IP).

**W całym repozytorium nie ma ŻADNEGO mechanizmu zgody** (zero bibliotek consent — sprawdzone pod kątem Cookiebot/OneTrust/Iubenda/Osano/Termly/CookieYes/Complianz, zero własnego baneru). Jedyne złagodzenie to `anonymize_ip: true` (maskowanie IP) — nie zastępuje zgody na ustawienie cookies.

**Ryzyko:** cookies analityczne (nie-niezbędne) ustawiane przed zgodą naruszają art. 173 ust. 1 Prawa telekomunikacyjnego (implementacja dyrektywy ePrivacy) i oczekiwania RODO wobec profilowania/trackingu.

### 3. polityka-prywatnosci.html wprost zaprzecza rzeczywistości

Treść: *„Serwis nie instaluje własnych plików cookie ani nie prowadzi własnego systemu analityki. Pliki cookie mogą być ustawiane przez zewnętrzne usługi wskazane w pkt 4."* Punkt 4 wymienia **wyłącznie Google Apps Script i Google Sheets** (backend formularzy — wywołanie API, zero cookies). **GA4 nie jest wymienione nigdzie w dokumencie**, mimo że to jedyna usługa na stronie faktycznie ustawiająca cookies. Polityka kieruje czytelnika do złego miejsca, jakby cookies pochodziły z zapisu formularza do arkusza, podczas gdy realne cookies pochodzą z Google Analytics, o którym dokument milczy.

## P2 — średni priorytet

### 4. Najważniejsza konwersja na stronie jest niewidoczna w GA4

`kwTrack()` (`index-scripts.js:23`) woła `window.cf('track', ...)` — kolejkę **Cloudflare Web Analytics**, nie `window.gtag`. Formularz kontaktowy na `/` i `/uslugi` (`form_submit`, `form_success`), lead magnet (przed rundą TREŚĆ-3) i 4 warianty `cta_click` (`cta_hero`, `cta_hero_contact`, `cta_leadmagnet`, `cta_quote`) wszystkie lecą do `window.cf`. Ten mechanizm jest **martwy**: beacon Cloudflare (`static.cloudflareinsights.com/beacon.min.js`) ładuje się tylko na 3 z 13 stron (`uslugi.html`, `narzedzie.html`, `polityka-prywatnosci.html`), ze wszędzie placeholderowym tokenem `"TWOJ_TOKEN"` — nigdzie realnie nie wysyła danych. Na `/` i `/portfolio` beacon nie ładuje się wcale, więc `window.cf(...)` tylko dopisuje do pustej tablicy w pamięci, czytanej przez nikogo.

**Efekt:** wysłanie formularza kontaktowego — najważniejsza akcja na stronie — nie generuje żadnego zdarzenia w jedynej aktywnej analityce (GA4). Właściciel nie widzi w GA4, ile osób wysyła zapytania ani skąd przychodzą konwersje.

### 5. Błędne og:image:width/height na 5 z 7 case studies

| Strona | deklarowane w meta | rzeczywiste wymiary pliku | zgodność |
|---|---|---|---|
| razdwa_aplikacja.html | 1200×630 | 1388×1269 | ❌ |
| cyfradruk.html | 1254×1254 | 1254×1254 | ✔ |
| karoma.html | 1200×630 | 1221×1275 | ❌ |
| power-of-mind.html | 1200×630 | 1144×975 | ❌ |
| sir-roger.html | 1200×630 | **229×134** | ❌ (plik 5× mniejszy niż deklaracja) |
| voucher-salon-magdy.html | 1423×1240 | 1423×1240 | ✔ |
| KW-Design.html | 1200×630 | 2160×1410 | ❌ |

Wygląda na to, że „1200/630" wklejono jako uniwersalny domyślny wymiar bez sprawdzenia realnych plików. `sir-roger.html` jest najbardziej problematyczny — źródłowy plik `Roger.png` ma zaledwie 229×134 px, więc podgląd w social share będzie rozmyty niezależnie od deklaracji.

### 6. Spacja w nazwie pliku og:image (razdwa_aplikacja.html)

`og:image` wskazuje na `https://kwyszynski.pl/assets/images/razdwa/strona startowa_RAZDWA.webp` — **nieenkodowana spacja** w URL-u. Niezgodne z RFC 3986; część crawlerów social (szczególnie starsze parsery Facebooka/LinkedIn) może nie pobrać obrazu poprawnie. Przeglądarki zwykle auto-koduja spację przy nawigacji, ale meta-crawlery bywają mniej tolerancyjne.

### 7. polityka-prywatnosci.html opisuje nieaktualny mechanizm lead magnet

Pkt 2–3 polityki: *„Lead magnet (checklista PDF): adres e-mail"* / *„wyłącznie w celu wysłania zamówionego materiału (PDF)"*. Od rundy TREŚĆ-3 `/narzedzie` **nie zbiera żadnych danych** — materiał pobiera się przez `window.print()` w przeglądarce, formularz e-mail został usunięty. Polityka opisuje proces, który już nie istnieje na stronie.

### 8. Emoji zamiast spójnych SVG na /uslugi

`uslugi.html` (sekcja „Trzy obszary"), trzy karty-linki z emoji jako ikonami: 💻 (Produkty cyfrowe), ⚙️ (Automatyzacje), 🎯 (Analiza procesów) — wszystkie `aria-hidden="true"` (poprawnie, nie zaśmiecają drzewa dostępności), ale renderują się niespójnie między systemami (Windows/macOS/Android różne zestawy emoji, różne kolory/style).

**Gotowe zamienniki już istnieją** — `index.html` dla tych samych trzech kategorii, w tej samej kolejności, używa:
- Produkty cyfrowe → `assets/images/KW_laptop.svg`
- Automatyzacje procesów → inline SVG (ikona cyklu/sync)
- Analiza procesów → `assets/images/KW_rocket_STARTCOMPANY.svg`

Zamiana wymaga tylko podmiany znacznika `<div class="card-icon">{emoji}</div>` na odpowiedni `<img>`/`<svg>` — zero nowych assetów do zrobienia.

### 9. Ciężkie, niezoptymalizowane OG-images (PNG zamiast WebP)

| Plik | format | waga |
|---|---|---|
| `karoma/karoma_Front_side.png` | PNG | 532 KB |
| `power-of-mind/POWEROFMIND_FRONT.png` | PNG | 476 KB |
| `kwyszynski/KWDESIGN_HERO.png` | PNG | **1,1 MB** |

Reszta strony konsekwentnie używa WebP (potwierdzone w rundach PERF/TECH-FINAL); te trzy pliki OG-specific nie przeszły przez ten sam pipeline. Większość platform social re-kompresuje obraz przy pobraniu, ale czas pobrania i ryzyko timeoutu rosną wraz z wagą źródła.

### 10. Cloudflare beacon z placeholder tokenem na 3 stronach

`uslugi.html`, `narzedzie.html`, `polityka-prywatnosci.html` ładują `static.cloudflareinsights.com/beacon.min.js` z `data-cf-beacon='{"token": "TWOJ_TOKEN"}'` — nieprawidłowy token, skrypt generuje żądanie sieciowe do zewnętrznej domeny (dodatkowe opóźnienie, dodatkowy punkt w CSP/zaufaniu) bez żadnego realnego efektu. Pozostałe 10 stron w ogóle nie ładują tego skryptu — niespójne.

## P3 — niski priorytet / porządkowe

### 11. Brak Open Graph na 3 stronach

`narzedzie.html` (ma `noindex,nofollow`, więc częściowo uzasadnione), `polityka-prywatnosci.html` i `404.html` nie mają żadnych tagów `og:*`. Udostępnienie linku do polityki prywatności pokaże generyczną kartę bez obrazu/opisu.

### 12. `assets/css/about-me.css` — martwy plik

Zero odwołań w jakimkolwiek `<link>` na żadnej z 13 stron (potwierdzone grepem). Zostawiony po usunięciu jedynego linku w rundzie TREŚĆ-3. (Już w backlogu zamknięcia projektu — powtórzone tu dla kompletności audytu.)

### 13. `cv_download` — zdarzenie dla warunkowo nieistniejącego elementu

`portfolio.js:138` woła `gtag('event', 'cv_download', ...)` wewnątrz handlera przycisku, który **tworzy się tylko, gdy `cvUrl` w `assets/data/testimonials.json` jest niepuste**. Obecna zawartość: `{"cvUrl": "", "items": []}` — przycisk nigdy nie powstaje, zdarzenie nigdy nie odpala. To nie martwy/błędny kod (logika warunkowa jest poprawna), tylko przygotowana, obecnie nieaktywna funkcja — do odnotowania, nie do naprawy. Dla porównania `linkedin_click` (ten sam plik, l.149) ma realny, zawsze obecny element (`#cta-linkedin` na `portfolio.html`) i działa.

### 14. Dane zbierane przez formularz kontaktowy a treść polityki

Pole `projectType` (select „Jak mogę pomóc?") nie jest wymienione wprost w pkt 2 polityki — mieści się pod ogólnym „rodzaj zapytania", ale dosłowne dopasowanie do faktycznych pól formularza (imię, e-mail, telefon, rodzaj zapytania, opis) byłoby czystsze.

---

**Podsumowanie:** 3 ustalenia P1 (błędny branding w OG, GA4 bez zgody, polityka prywatności sprzeczna z rzeczywistością), 7 ustaleń P2, 4 ustalenia P3. Zero zmian w kodzie — zgodnie z poleceniem.

---

# Runda uzupełniająca — naprawa ustaleń P1-P3 (gałąź `runda-uzupelniajaca` od `origin/main`)

Realizacja wszystkich 5 punktów audytu powyżej. 5 commitów, diff pokazany po każdym punkcie, bez `git stash`.

## Punkt 1 — Analityka: GA4 → Cloudflare Web Analytics

- Usunięto `assets/js/analytics.js`, tag `<script>` na 13 stronach, `window.cf`/`kwTrack()` i wszystkie wywołania (`form_submit`, `form_success` ×2, `cta_click`, `cv_download`, `linkedin_click`), całą funkcję `initCTATracking()`, placeholderowe beacony (`TWOJ_TOKEN`) na `uslugi.html`/`narzedzie.html`/`polityka-prywatnosci.html`.
- Dodano prawdziwy beacon Cloudflare Web Analytics (`type="module"`, token produkcyjny) w `partials/footer.html` — jedno źródło, propagowane na 13 stron przez `npm run sync`.
- Grep sweep: zero wyników dla `googletagmanager`, `gtag`, `G-TG0HE09DE7`, `kwTrack`, `window.cf` w plikach publicznych.
- 2 commity: `fix(analytics): usun GA4 (...)`, `feat(analytics): dodaj Cloudflare Web Analytics beacon (...)`.
- **Nie zweryfikowane na produkcji**: realne żądanie do `cloudflareinsights.com` wymaga wdrożenia na `kwyszynski.pl` — branch nie jest scalony (zgodnie z poleceniem „Bez scalania"). Do zweryfikowania po akceptacji i merge.

## Punkt 2 — Polityka prywatności

Przepisano `polityka-prywatnosci.html` zgodnie z 8 wymaganymi punktami: administrator, formularz kontaktowy (pola, cel, Google Apps Script/Sheets/e-mail, okres przechowywania), analityka (Cloudflare Web Analytics, bez cookies), hosting (GitHub Pages, logi serwera), czcionki lokalne (brak Google Fonts), brak newslettera/lead magnetu, prawa osoby. Usunięto zdanie o braku własnej analityki i opis lead magnetu. Okres przechowywania oznaczony jako `[DO UZUPEŁNIENIA]` — decyzja właściciela.

**⚠️ Treść wymaga weryfikacji prawnej przed publikacją produkcyjną** — nie jest to opinia prawna, tylko techniczny opis mechanizmów strony.

Commit: `docs(polityka-prywatnosci): przepisz zgodnie z realnym stanem serwisu`.

## Punkt 3 — Open Graph

8 nowych obrazów w `assets/images/og/` (1200×630, JPG, wszystkie ≤80 KB — margines do limitu 200 KB):

| Plik | Źródło | Metoda | Waga |
|---|---|---|---|
| `kwyszynski-og.jpg` | `presentation-hero-1000.webp` | cover-crop + imię (Playfair) + tagline (Inter), kolory z tokens.css | 58 KB |
| `razdwa-aplikacja-og.jpg` | hero (1450×1306, ≥1200px) | cover-crop | 77 KB |
| `power-of-mind-og.jpg` | hero (1573×1383, ≥1200px) | cover-crop | 76 KB |
| `cyfradruk-og.jpg` | hero (1180×1180, <1200px) | natywny rozmiar na tle `--color-dark`, nazwa pod spodem, bez upscale | 29 KB |
| `karoma-og.jpg` | hero (800×682, <1200px) | j.w. | 43 KB |
| `sir-roger-og.jpg`, `voucher-salon-magdy-og.jpg`, `kw-design-og.jpg` | — | kopia `kwyszynski-og.jpg` (wspólny obraz archiwum, decyzja właściciela) | 58 KB każdy |

`kwyszynski-og.jpg` i `razdwa-aplikacja-og.jpg` pokazane i zaakceptowane przed zastosowaniem na resztę stron.

Zastosowano na `/`, `/uslugi`, `/portfolio`, `/narzedzie`, polityce prywatności (dodano brakujący blok OG na dwóch ostatnich) i wszystkich 7 case studies. `og:image`/`twitter:image` jako pełny adres `https://kwyszynski.pl/...`, `og:image:width`/`og:image:height` = 1200/630 wszędzie (poprawiono błędne wymiary z audytu: cyfradruk 1254×1254→1200×630, voucher 1423×1240→1200×630).

Usunięto 4 stare obrazy OG z zerową liczbą referencji (grep potwierdzony): `og-share-1200x630.png`, `karoma_Front_side.png`, `POWEROFMIND_FRONT.png`, `KWDESIGN_HERO.png`. `sir-roger/Roger.png` **zostaje** — nadal używany jako miniatura w `portfolio.html`.

**Ograniczenie jakości, odnotowane transparentnie:** `sir-roger-og.jpg` to kopia wspólnego obrazu (decyzja właściciela o traktowaniu archiwum zbiorczo) — źródłowy hero tego case study (`roger-229w.webp`, 229×134px) pozostaje jedynym plikiem w repo i nie został użyty do dedykowanego OG z powodu zbyt niskiej rozdzielczości.

Commit: `feat(og): nowe obrazy Open Graph 1200x630, usun przestarzale pliki`.

## Punkt 4 — Emoji → SVG na /uslugi

3 emoji w kartach „Trzy obszary" (💻⚙️🎯) zamienione na te same ikony co na `index.html`: `KW_laptop.svg`, inline SVG (gear/cykl), `KW_rocket_STARTCOMPANY.svg`. `alt=""` — ikony dekoracyjne, nazwa obszaru już jest w nagłówku karty. Dodano `.card-icon img/svg { width/height: 48px }` (40px na mobile) w `services-page.css`, zastępując font-size-driven skalowanie emoji.

Commit: `fix(uslugi): zamien emoji na ikony SVG w kartach Trzy obszary`.

## Punkt 5 — Martwy kod i JSON-LD

- Usunięto `assets/css/about-me.css` (0 referencji, potwierdzone grepem).
- Pełny sweep wszystkich plików w `assets/css/` i `assets/js/`: każdy pozostały plik ma ≥1 referencję — brak innych kandydatów do usunięcia.
- JSON-LD na wszystkich stronach: pola `"image"` na 7 case studies automatycznie zaktualizowane przy wymianie OG (punkt 3, ten sam URL co `og:image`). Reszta treści (Person na `/`, Service na `/uslugi`, CollectionPage na `/portfolio`, CreativeWork na case studies) bez przestarzałych danych — bez zmian.

Commit: `chore: usun martwy about-me.css (0 referencji)`.

## Weryfikacja

**axe-core** (Playwright + axe.min.js, lokalny serwer, 13 stron): **0 nowych naruszeń** wprowadzonych tą rundą. Znaleziono 2 preexisting naruszenia niezwiązane z tym zakresem prac:
- `projects/razdwa_aplikacja.html` i `projects/power-of-mind.html`: `scrollable-region-focusable` (serious) — scrollowalny kontener bez fokusowalności klawiaturą (prawdopodobnie `.kwcs-chapter-rail` lub `.user-flow`, `overflow-x/y: auto` bez `tabindex`). Potwierdzone diffem względem `origin/main` jako **niezwiązane z tą rundą** (te pliki w tej rundzie dostały wyłącznie zmiany w `<head>`, treść `<body>` nietknięta). Nie naprawione — poza zakresem 5 punktów tego zlecenia, wymaga osobnej decyzji właściciela.

**Lighthouse desktop**, mediana z 3 przebiegów, lokalny serwer:

| Strona | Accessibility | Performance |
|---|---|---|
| `/` | 100 | 99 |
| `/uslugi` | 100 | 99 |
| `/portfolio` | 100 | 99 |

Bez regresji względem ostatniej zanotowanej bazy (97–98, Runda TECH-FINAL) — wynik nawet nieznacznie wyższy (prawdopodobnie efekt usunięcia blokującego `analytics.js`).

**Debugger podglądu linków — WYKONANE po merge.** PR #139 scalony do `main` 2026-10-18 12:10 UTC (`2fc3c21`), weryfikacja produkcji po ~10 min propagacji CDN.

## Weryfikacja produkcji (po merge PR #139, 2026-10-18)

**Żądania sieciowe** (Playwright, `networkidle`, realny request log — nie tylko HTML):
- `/`: `cloudflareinsights.com` → **2 żądania** (`beacon.min.js` + `cdn-cgi/rum`), `googletagmanager.com` → **0**.
- `/portfolio`: identycznie — `cloudflareinsights.com` **2 żądania**, `googletagmanager.com` **0**.

**Podgląd linku (meta tagi `og:title`/`og:image`, odczyt bezpośredni zamiast zewnętrznego debuggera — te same dane, bez zależności od dostępności narzędzia trzeciej strony):**

| Strona | og:title | og:image |
|---|---|---|
| `/` | Karol Wyszyński – prowadzenie projektów i automatyzacja procesów | `assets/images/og/kwyszynski-og.jpg` |
| `/portfolio` | Portfolio – Karol Wyszyński \| Produkty cyfrowe, aplikacje, automatyzacje | `assets/images/og/kwyszynski-og.jpg` |
| `/projects/razdwa_aplikacja` | Raz Dwa Druk — aplikacja, która skróciła wycenę z ok. 60 do ok. 5 minut | `assets/images/og/razdwa-aplikacja-og.jpg` |

Obrazy OG zweryfikowane: oba `200 OK`, `image/jpeg` (kwyszynski-og.jpg 59 638 B, razdwa-aplikacja-og.jpg 79 283 B).

## A/B Lighthouse mobile — origin/main vs runda-uzupelniajaca (przed merge, interleaved, 3 przebiegi/gałąź)

| Strona | Branch | Performance (mediana) | LCP (mediana) | CLS (mediana) | TBT (mediana) |
|---|---|---|---|---|---|
| `/` | main | 77 | 5,21s | 0,0005 | 122ms |
| `/` | runda-uzupelniajaca | 83 | 4,12s | 0,0005 | 0ms |
| `/portfolio` | main | 75 | 4,78s | 0 (flaky: 0,1229 w 1/3) | 113ms |
| `/portfolio` | runda-uzupelniajaca | 74 | 5,02s | 0 (flaky: 0,1229 w 1/3) | 0ms |

Wniosek: `/` lepsza na runda-uzupelniajaca (+6 pkt, TBT 0 — usunięcie blokującego `analytics.js`). `/portfolio` różnica 1 pkt (w granicy 3) — bez regresji przypisywalnej tej rundzie. CLS-flakiness na `/portfolio` (`#portfolio-section`) występuje **identycznie na obu gałęziach** — potwierdzony pre-existing bug, nie wprowadzony przez PR #139. Realna przyczyna (nie font-swap, jak wstępnie podejrzewano — patrz B0 niżej) i naprawa przeniesione do punktu B0 części B (runda-hero-mobile).

## B0 — fix CLS /portfolio (gałąź runda-hero-mobile, commit `7d3a948`)

**Diagnoza** (Chrome trace via Lighthouse `additionalTraceCategories`, PerformanceObserver z `sources`, `getBoundingClientRect` polling): element, który się przesuwa, to `.about-me-visuals` (kontener zdjęcia hero) — box startował `20×26px`, skakał do finalnych `240×220px` (lub `270×240px` na 600-768px) w oknie ~250-900ms po starcie, przesuwając `#portfolio-section` i CTA o tę samą deltę (stąd CLS 0,1229 widziane wcześniej).

**Przyczyna:** dwa nakładające się "emergency fix" breakpointy w `portfolio.css` (`max-width:768px` i `max-width:480px`) ustawiają `.about-me-visuals{align-items:center}` (usuwa flex `stretch`), bez jawnej `width`. Box liczy się jako shrink-to-fit po dziecku (`.about-me-image{width:100%}`), które zależy od rodzica — cykliczna nieokreśloność. Pierwszy layout dostaje prowizoryczny (bliski zeru) rozmiar, realny dociąga się dopiero gdy przeglądarka pozna wymiary obrazka hero — po pierwszym malowaniu, więc liczy się do CLS.

**Fix:** jawna `width:min(240px,100%)` (blok 480px) i `width:min(270px,100%)` (blok 768px) na `.about-me-visuals`.

**Decyzja `!important`:** pierwsza wersja (commit roboczy przed `c693615`, nigdy niewypchnięty) użyła `width:240px !important` tylko dla bloku 480px i tylko na szerokości 320-390px — wtedy jeszcze nieprzetestowane 481-768px. Przed commitem `c693615` sprawdziłem grepem całe `portfolio.css` pod `.about-me-visuals` (6 wystąpień — baza desktop, 2× sam selektor w breakpointach, 2× `.about-me-visuals .cta-portfolio`, komentarz) — żadna inna reguła nie ustawia na nim `width`, więc `!important` niczego nie musiał pokonywać. Usunięty w finalnej wersji na obu blokach (480px i 768px) — potwierdzone, że bez niego CLS=0 nadal trzyma (tabela niżej). Gdyby jakaś inna reguła `width` z `!important` istniała, zostałby zachowany i odnotowany tu jako dług.

**Weryfikacja per szerokość (Lighthouse mobile, `throttlingMethod:simulate`, 3 przebiegi każda, finalna wersja bez `!important`):**

| Szerokość | Przebieg 1 | Przebieg 2 | Przebieg 3 |
|---|---|---|---|
| 320px | CLS 0,0000 | CLS 0,0000 | CLS 0,0000 |
| 360px | CLS 0,0000 | CLS 0,0000 | CLS 0,0000 |
| 390px | CLS 0,0000 | CLS 0,0000 | CLS 0,0000 |
| 600px | CLS 0,0000 | CLS 0,0000 | CLS 0,0000 |
| 768px | CLS 0,0000 | CLS 0,0000 | CLS 0,0000 |

Przed fixem (dla porównania, osobny przebieg): 600px i 768px dawały CLS 0,1203-0,1284 w 2-3 z 3 przebiegów; 320/360/390px — flakiness 0 / 0,1229 (opisane wcześniej w sekcji A/B main vs runda-uzupelniajaca).

**Efekt uboczny znaleziony przy diagnozie, osobny bug:** `.lightbox-content{animation:imageZoomIn}` w `projects.css` działała bezwarunkowo od załadowania strony — `.lightbox` jest skryty `opacity/visibility` (nie `display:none`), więc animacja realnie tyka w drzewie renderowania na zamkniętym modalu. Zawężone do `.lightbox.active .lightbox-content` (klasa realnie przełączana w `projects.js:120`). Nie był to główny powód zmierzonego CLS (potwierdzone: fix usunięty → shift nadal występował), ale zbędna praca silnika warta naprawienia.

**Weryfikacja:**
- CLS = **0,0000** w 15/15 przebiegów Lighthouse mobile, 5 szerokości (320/360/390/600/768px, 3 przebiegi każda).
- Pixel-diff zrzutów hero (320px i 600px, przed/po) = **0,0000%** — zero zmiany wizualnej.

**Dług techniczny (nie naprawiony w tym PR):** dwa nakładające się breakpointy awaryjne `max-width:768px` i `max-width:480px` w `portfolio.css` (sekcje „EMERGENCY MOBILE FIX" / „480PX BREAKPOINT") duplikują i częściowo nadpisują te same selektory (`.about-me-visuals`, `.about-me-image`, `.about-me-text` itd.) z `!important` po obu stronach — np. `.about-me-image` dostaje `aspect-ratio:1` z bloku 768px, nieredefiniowane w bloku 480px, więc wygrywa mimo że wizualny design zakłada proporcję 4:5. Działa (potwierdzone pixel-diff 0%), ale struktura jest krucha — do uporządkowania w osobnej rundzie: scalić do jednego, nienakładającego się zestawu breakpointów.

## Otwarte punkty po tej rundzie

1. ~~Weryfikacja prawna treści `polityka-prywatnosci.html` (właściciel).~~ — treść uzupełniona (okres przechowywania, podstawa prawna, transfer poza EOG, prawa RODO); **ostateczna weryfikacja prawnika wciąż rekomendowana**, nie wykonana w tej rundzie.
2. ~~Uzupełnienie `[DO UZUPEŁNIENIA]`~~ — zamknięte, grep w całym repo = 0.
3. ~~Realne potwierdzenie żądania do `cloudflareinsights.com` i wyników debuggera OG~~ — zamknięte, patrz wyżej.
4. ~~`scrollable-region-focusable` na 2 case studies~~ — naprawione (`tabindex="0" role="region" aria-label`), zero zmian wizualnych.
5. ~~CLS `/portfolio`~~ — naprawione w B0 (patrz niżej), realna przyczyna to `.about-me-visuals` bez jawnej `width`, nie font-swap.

## B1-B5 — uśmiech na hero /portfolio, dotyk (gałąź runda-hero-mobile, commit `6fcc950`)

**Zakres:** `assets/css/portfolio.css` (CSS), `assets/js/portfolio.js` (logika). Zero zmian w `portfolio.html` — struktura `.ami-base`/`.ami-hover` już istniała.

**Mechanizm (urządzenia `hover:none` lub `pointer:coarse`, bez `prefers-reduced-motion:reduce`):**
- Wariant z uśmiechem ładowany dopiero po `window.load`, w `requestIdleCallback` (fallback `setTimeout` 1500ms).
- `IntersectionObserver` (próg 0,3) na `.about-me-image`, trzyma ostatni `intersectionRatio`.
- Pierwsze zdarzenie `scroll` (`passive, once`) startuje `setTimeout(1000ms)`. Po nim: jeśli zdjęcie widoczne ≥30% — przejście startuje; jeśli nie — obserwator sam wywoła przejście, gdy zdjęcie znów przekroczy próg 30% (flaga „po bramce" zostaje ustawiona raz, na stałe).
- Przejście czeka na Promise z załadowania obrazu + `await img.decode()` (fallback przy braku wsparcia/błędzie), dopiero potem dodaje klasę `.ami-smile-active` (`requestAnimationFrame`).
- Jednorazowe, bez odwrotu — po wywołaniu `observer.disconnect()`, flaga `revealTriggered` blokuje ponowne uruchomienie.
- `prefers-reduced-motion:reduce` — cały blok JS pomijany (warunek wejścia), dodatkowo CSS `!important` jako zabezpieczenie drugiej linii.
- Desktop (`hover:hover and pointer:fine`) — kod nietknięty; jedyna usunięta reguła to `@media(hover:none){display:none}`, która wcześniej w całości blokowała funkcję na dotyku.

**Weryfikacja (Playwright, emulacja iPhone 13, 390px):**
- Bez scrolla, bez dotknięcia: `hasClass:false, opacity:0` — brak zmiany ✓.
- Scroll (5px) + zdjęcie widoczne, po ~1,5s: `hasClass:true, opacity≈0,92` (w trakcie przejścia 0,6s) ✓. Zrzuty: `seq-1-no-scroll.png` (baza) → `seq-2-after-scroll-1s.png` (uśmiech, identyczna pozycja/rozmiar, zero przesunięcia).
- Scroll daleko w dół (zdjęcie poza kadrem) → gate przechodzi, ale `hasClass:false` (zdjęcie niewidoczne) → scroll z powrotem do góry → `hasClass:true, opacity:1` natychmiast po powrocie w kadr ✓.
- `prefers-reduced-motion:reduce` + scroll: `hasClass:false, opacity:0, hoverSrc:""` (obraz nawet nie załadowany — cała funkcja wyłączona) ✓.
- Desktop (1280px, mysz): hover → `opacity:1`, zjazd kursora → `opacity:0`, `hasClass` zawsze `false` — identyczne z zachowaniem sprzed zmiany ✓.

**Lighthouse mobile /portfolio** (`throttlingMethod:simulate`, 390px, po B1-B5): Performance 74-75, LCP ~5,05-5,07s, **CLS 0,0000 w 8/8 przebiegów** — bez regresji względem stanu po B0 (Performance 74-75, LCP ~4,97-5,07s, CLS 0,0000 w 8/8).

**axe-core:** 0 naruszeń na `/portfolio` (390px, po B1-B5).

**Definicja done — status:**
- [x] Test telefon 390px, dotyk: bez scrolla = bez zmiany; krótkie przewinięcie = zmiana po ~1s; szybkie przewinięcie w dół i powrót = zmiana po powrocie.
- [x] `prefers-reduced-motion`: brak zmiany.
- [x] Desktop: hover jak wcześniej.
- [x] Lighthouse mobile /portfolio: Performance i LCP nie gorsze niż przed zmianą (B0), CLS bez zmian (0,0000).
- [x] CLS /portfolio ≤0,02 w każdym z przebiegów mobile (zmierzone: 0,0000 w 8/8, oraz 15/15 w teście 5 szerokości w B0).
- [x] axe 0.
- [x] Raport w `docs/audyt-portfolio.md`.
- [ ] Push i draft PR — następny krok.

---

## Runda MENU-MOBILE — naprawa dotknięć w menu mobilnym

Zgłoszenie: na iPhonie (WebKit w przeglądarce Messengera) dotknięcie „Portfolio" w otwartym menu otwierało `/uslugi`. Gałąź `runda-menu-mobile` od `origin/main`. Zakres: `partials/header.html` (bez zmian — markup OK), `assets/css/layout.css`, `assets/js/nav.js`; dodatkowo `assets/css/projects.css` (breadcrumb, w ramach audytu pozostałych linków).

### Diagnoza (Krok 1)
Przyczyna: `.nav-list a` były **`display:inline`**. Dla elementów inline `width:100%` jest ignorowane, a pionowy `padding: 1,25rem` rysuje się wizualnie, ale nie rezerwuje miejsca w układzie. Zmierzone @390px: pudełka przepływu `<li>` miały 28 px, a klikalne pudełka `<a>` 61 px → **nachodziły na siebie ~33 px**, i w strefie nachodzenia wygrywał link **późniejszy w DOM** (poniżej). Stąd dotknięcie środka „Portfolio" trafiało w „Usługi".
- Reprodukcja (Chromium @ iPhone 390px, ustabilizowane menu): Portfolio środek → `/uslugi`, dół → `/#about`; każda pozycja myliła się o jeden w dół.
- `nav.js` zamykał menu na `click` (nie `pointerdown`/`touchstart`) — to nie było przyczyną.
- Animacja wejścia `.nav-list` (`transform: translateY(-100%)→0`, 250 ms) dokładała błędy przy dotknięciu w trakcie ruchu (czynnik wtórny).

### Poprawka (Krok 2)
- **`layout.css`** (scoped `@media (max-width:1024px)`): `.nav-list a` → `display:flex; align-items/justify center; min-height:48px; width:100%; padding 12/16px`; `.nav-list { gap: 8px }`; hamburger/X `min 48×48`; `.nav-list.nav-animating a { pointer-events:none }`. `@media (prefers-reduced-motion: reduce) .nav-list { transition:none }`. Napisy (krój, rozmiar, kolor, wyśrodkowanie) bez zmian. Desktop (≥1025px) nietknięty.
- **`nav.js`**: przy otwieraniu z animacją linki dostają `pointer-events:none` (klasa `.nav-animating`), zdejmowaną na `transitionend` (`transform`) z zabezpieczeniem `setTimeout(400 ms)`; przy `prefers-reduced-motion` bez blokady (brak animacji). Zamknięcie nadal na `click`, bez przesuwania listy przed nawigacją.
- **`projects.css`**: `.kwcs-back-btn` (breadcrumb) min-height 44px na mobile (było 17px). **`layout.css`**: `.footer-info a` e-mail min-height 24px (było 23px).

### Weryfikacja (DoD)
- **Tabela dotknięć 4 pozycje × 3 punkty** (góra/środek/dół), menu ustabilizowane — **wszystkie trafiają we właściwą stronę**, na Chromium @ iPhone 390px i Chromium Android (Pixel 5):

  | pozycja | góra | środek | dół |
  |---|---|---|---|
  | Portfolio | /portfolio | /portfolio | /portfolio |
  | Usługi | /uslugi | /uslugi | /uslugi |
  | O mnie | /#about | /#about | /#about |
  | Kontakt | /#contact | /#contact | /#contact |

- **Dotknięcie środka każdej pozycji w trakcie animacji wejścia → brak nawigacji** (zostaje `/`), na obu silnikach.
- Obszary dotyku po poprawce @390px: linki menu ~108×52 (8px odstępy), hamburger 48×48, breadcrumb „‹ Portfolio" 70,8×**60**, e-mail w stopce 146,5×**24**. Pozostałe (stopka linki 358×41, social 107×39, prev/next 310×73) były OK.
- **axe = 0** (/, /uslugi, /portfolio desktop+mobile oraz 4 case studies). **Lighthouse Accessibility = 100** (3 strony desktop i mobile). Perf desktop 100/100/99 — bez regresji.
- **CLS bez zmian**: index 0,0000, portfolio 0,0000, razdwa 0,0261 (baseline origin/main 0,0284 — w granicach szumu).
- Zrzuty menu @390px przed i po.
- **Test WebKit iPhone — do wykonania na urządzeniu przez właściciela.** WebKit nie da się uruchomić w kontenerze (polityka sieci blokuje `cdn.playwright.dev`, 403). Diagnoza i poprawka są czysto-CSS/JS i reprodukują się niezależnie od silnika; finalne potwierdzenie na realnym iPhonie (Messenger/WebKit) po stronie właściciela.

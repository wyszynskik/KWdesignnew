# Karol Wyszyński – Prowadzenie Projektów i Automatyzacja Procesów

Strona portfolio i usług: produkty cyfrowe, automatyzacje procesów, analiza procesów.

**Live:** [kwyszynski.pl](https://kwyszynski.pl)
**Stack:** statyczny HTML5 + CSS3 + vanilla JS, zero frameworków i zero build stepu. Fonty lokalne (Inter + Playfair Display, woff2, zero Google Fonts). Formularze: Google Apps Script.

---

## 🚀 Hosting

**GitHub Pages** (obecny, aktywny) — push na `main` → auto-deploy na `kwyszynski.pl` (custom domain w `CNAME`). Build step brak — repo publikowane 1:1.

**`_headers` i `_redirects`** — pliki konfiguracyjne Cloudflare Pages. **Nieaktywne** na GitHub Pages (który ich nie czyta), zostawione w repo na wypadek przełączenia hostingu na Cloudflare Pages w przyszłości — wtedy zadziałają bez dodatkowej pracy.

Po pushu na `main` licz się z ok. **10 minutami** na odświeżenie CDN przed weryfikacją na produkcji.

---

## 📁 Struktura projektu

```
KWdesignnew/
├── index.html                  # Strona główna
├── uslugi.html                 # Usługi (3 obszary, FAQ, tabela współpracy)
├── portfolio.html              # Portfolio + viewer case studies (hash routing)
├── narzedzie.html               # Lead magnet (checklista do druku/PDF)
├── polityka-prywatnosci.html
├── 404.html
├── sitemap.xml · robots.txt · CNAME · _headers · _redirects
│
├── partials/                   # Jedyne źródło nagłówka i stopki (patrz niżej)
│   ├── header.html
│   └── footer.html
│
├── scripts/
│   ├── sync-partials.js        # npm run sync / sync:check
│   ├── update-sitemap.js       # npm run sitemap / sitemap:check
│   ├── serve_kwdesign.js       # npm run serve
│   └── verify_*.js             # 4 ad-hoc skrypty Playwright (zrzuty razdwa_aplikacja,
│                                # debug wizualny) — npm run verify:cad/:phase2/:razdwa/:razdwa2,
│                                # wymagają `npm run serve` uruchomionego w drugim terminalu
│
├── assets/
│   ├── css/
│   │   ├── tokens.css          # JEDYNE źródło tokenów (kolory, fonty, spacing,
│   │   │                       # cienie, promienie, transitions, z-index) —
│   │   │                       # ładowany jako pierwszy na każdej stronie
│   │   ├── layout.css          # .header/.nav*/.hamburger/.footer* — ładowany
│   │   │                       # na KAŻDEJ stronie, w tym projects/*.html
│   │   ├── index-styles.css    # Reszta stylu stron głównych (/, /uslugi, /narzedzie...)
│   │   ├── kw-buttons.css      # System przycisków (.kw-btn*) — po index-styles.css,
│   │   │                       # żeby aliasy wygrywały w kaskadzie
│   │   ├── services-page.css   # Dodatki specyficzne dla /uslugi
│   │   ├── portfolio.css       # Siatka /portfolio
│   │   └── projects.css        # Case studies (kwcs-*, breadcrumb, lightbox)
│   ├── js/
│   │   ├── nav.js              # Menu (hamburger + smooth-scroll) — WSPÓLNY dla
│   │   │                       # całej witryny, ładowany z defer wszędzie
│   │   ├── index-scripts.js    # Formularz kontaktowy, FAQ, animacje, lead magnet
│   │   ├── portfolio.js        # Viewer case studies (hash routing), lightbox
│   │   └── projects.js         # Skrypty case studies (lightbox, rail nawigacji)
│   ├── images/ · fonts/ · pdf/ · data/
│
├── projects/                   # Case studies — ładowane przez /portfolio (AJAX,
│   ├── razdwa_aplikacja.html   # tylko section.kwcs) ORAZ dostępne samodzielnie
│   ├── cyfradruk.html          # pod /projects/<plik> z własnym nagłówkiem/stopką
│   ├── karoma.html
│   ├── power-of-mind.html
│   ├── sir-roger.html
│   ├── voucher-salon-magdy.html
│   └── KW-Design.html
│
├── gas/                        # Kod Google Apps Script (formularz + lead magnet) —
│                                # osobny system (script.google.com), wymaga ręcznego
│                                # wklejenia + redeployu po każdej zmianie tego pliku
├── .github/workflows/          # CI: sync:check + sitemap:check na PR/push do main
├── .gitattributes               # wymusza LF na checkout/commit (zapobiega false-positive
│                                # w sync:check przez CRLF/LF z edytorów Windows)
└── docs/                       # Raporty audytowe i materiały pomocnicze (case-study-playbook,
                                 # szablony case study, mapa przycisków) — audyt-portfolio.md
                                 # to najdłuższy, zawiera historię każdej rundy zmian
```

---

## 🧩 Partiale — nagłówek i stopka

`partials/header.html` i `partials/footer.html` to **jedyne źródło** treści nagłówka i stopki. Każda strona ma w swoim HTML znaczniki:

```html
<!-- partial:header -->
<!-- /partial:header -->
```

i analogicznie `<!-- partial:footer -->`. Zawartość między nimi jest generowana — **nie edytuj jej ręcznie**, zmieniaj `partials/header.html` / `partials/footer.html`, a potem uruchom:

```bash
npm run sync          # wstawia aktualną treść partiali we wszystkie strony
npm run sync:check    # sprawdza, czy wszystko zsynchronizowane (exit 1, jeśli nie) — bez zapisu
```

`aria-current="page"` na pozycji bieżącej strony w menu jest ustawiane automatycznie przez skrypt na podstawie ścieżki pliku — nie wpisuj go ręcznie.

**Po każdej zmianie w `partials/` uruchom `npm run sync` i zacommituj wynik razem ze zmianą partiala.** CI/review powinno sprawdzać `npm run sync:check`.

Case studies (`projects/*.html`) nie ładują `index-styles.css` — tylko `tokens.css` + `layout.css` + `projects.css`. Jeśli dodajesz do nagłówka/stopki coś, co zależy od nowych tokenów lub klas, upewnij się, że są zdefiniowane w `tokens.css` / `layout.css`, inaczej case studies wyrenderują się bez stylu.

---

## 🖥️ Komendy

```bash
npm run serve          # lokalny serwer statyczny, port 8787 (ścieżka repo liczona z __dirname)
npm run sync           # synchronizuje partiale do wszystkich stron + odświeża sitemap
npm run sync:check     # weryfikuje synchronizację partiali, bez zapisu (exit 1 przy rozjeździe)
npm run sitemap        # odświeża <lastmod> w sitemap.xml wg ostatniego commita pliku
npm run sitemap:check  # weryfikuje sitemap.xml, bez zapisu (exit 1 przy rozjeździe)
npm run verify:razdwa  # i 3 pozostałe verify:* — ad-hoc Playwright, wymaga npm run serve w tle
```

**CI** (`.github/workflows/checks.yml`) uruchamia `sync:check` + `sitemap:check` na każdym PR i pushu do `main`.

---

## 🎨 Tokeny i fonty

Wszystkie tokeny (kolory, typografia, spacing, cienie, promienie, transitions, z-index) żyją w `assets/css/tokens.css` — jedyne źródło prawdy, ładowane jako pierwszy arkusz na każdej stronie. Fonty: Inter (tekst/UI) + Playfair Display (nagłówki), lokalne pliki `woff2` (latin + latin-ext), zero Google Fonts, z metric-matched fallbackami.

---

## 🔒 Bezpieczeństwo

- `_headers` (Cloudflare Pages, nieaktywny na GitHub Pages): CSP, HSTS, X-Frame-Options.
- Formularze: POST do Google Apps Script (`gas/contact-form.gs`) — dane w body, nie w URL.
  Honeypot, walidacja formatu email, sanityzacja przed Formula Injection w arkuszu,
  rate-limit per-email (15 min) + globalny throttle per godzinę (GAS nie udostępnia
  IP wywołującego, więc per-email rate-limit da się obejść rotacją adresów).

---

## 📊 Analityka

Cloudflare Web Analytics — beacon wklejony w `partials/footer.html` (token w `data-cf-beacon`), synchronizowany na wszystkie strony przez `npm run sync`.

---

## 📝 Raport zmian

Każda runda zmian treści i technicznych jest dokumentowana w [`docs/audyt-portfolio.md`](./docs/audyt-portfolio.md) — stan wyjściowy, wykonane punkty, weryfikacja (axe, Lighthouse, zrzuty przed/po).

---

## 👤 Autor

**Karol Wyszyński** – Prowadzenie Projektów i Automatyzacja Procesów
[wyszynski.k@onet.pl](mailto:wyszynski.k@onet.pl) • [LinkedIn](https://www.linkedin.com/in/karol-wyszy%C5%84ski-62a844162/)

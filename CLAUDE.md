# CLAUDE.md — kwyszynski.pl

Statyczny HTML/CSS/JS, zero build stepu, zero frameworków. Hosting: GitHub
Pages (push na `main` → auto-deploy, custom domain przez `CNAME`). `_headers`
i `_redirects` to konfiguracja Cloudflare Pages — nieaktywne na GitHub Pages,
zostawione na wypadek zmiany hostingu.

**Podgląd lokalny:** `npm run serve` (port 8787, ścieżka repo z `__dirname`).

## Mapa stron
`/`, `/uslugi`, `/portfolio`, `/narzedzie` (noindex), `/polityka-prywatnosci`,
`/404.html`, `/projects/<slug>` (7 case studies, patrz niżej).

## Viewer case studies
`/portfolio` wczytuje case study przez hash (`#slug`) i AJAX-em wstrzykuje
WYŁĄCZNIE `section.kwcs` z pliku źródłowego (`portfolio.js`). Nagłówek i
stopka case study muszą być POZA `section.kwcs`, inaczej zdublują się z
nagłówkiem/stopką `/portfolio`. 7 slugów (wielkość liter ma znaczenie):
`RazDwa`, `cyfradruk`, `karoma`, `power-of-mind`, `KW-Design`, `sir-roger`,
`voucher-magdy`.

## Partiale
`partials/header.html` i `partials/footer.html` to jedyne źródło nagłówka i
stopki. Po KAŻDEJ zmianie w nich uruchom `npm run sync` i zacommituj wynik.
`npm run sync:check` weryfikuje zgodność bez zapisu. Case studies nie ładują
`index-styles.css` — tylko `tokens.css` + `layout.css` + `projects.css`.

## Tokeny i fonty
`assets/css/tokens.css` — jedyne źródło tokenów (kolory, spacing, cienie,
promienie, transitions, z-index), ładowane jako pierwszy arkusz wszędzie.
Fonty: Inter + Playfair Display, lokalne woff2, zero Google Fonts.

## Zasady pracy
- Nowa gałąź na każdą rundę od aktualnego `origin/main`; `git fetch` na start.
- Bez `git stash`.
- Plan przed kodem, czekaj na „OK" przed zmianami.
- Commit (i diff) po każdym zadaniu/punkcie.
- Scalanie do `main` tylko po wyraźnej akceptacji.
- Po pushu na `main`: ok. 10 minut na odświeżenie CDN przed weryfikacją na
  produkcji.

## Definicja done (każda runda)
- axe = 0, Lighthouse Accessibility = 100.
- Brak regresji Performance.
- Raport w `docs/audyt-portfolio.md`.

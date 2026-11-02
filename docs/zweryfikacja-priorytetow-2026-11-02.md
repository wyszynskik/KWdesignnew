# Weryfikacja priorytetów — co wymaga zmiany, a co nie

Data: 2026-11-02
Repo: `wyszynskik/KWdesignnew`

## Założenie oceny
Zasada jest prosta: wpis kwalifikuję jako `WYMAGA ZMIANY` tylko wtedy, gdy:
- istnieje realny problem biznesowy / prawny / UX / konwersyjny,
- problem jest widoczny w aktualnym repo,
- nie jest to element już zrobiony lub nieistotny dla obecnej strategii strony.

Wszystko pozostałe traktuję jako:
- `JUŻ ZROBIONE`,
- `OPCJONALNE / nice-to-have`,
- `NIE WYMAGA ZMIANY`.

## Uwaga o CI
W obecnym repo GitHub nie widać katalogu `.github/workflows` ani pliku CI. Jeśli plik istnieje tylko lokalnie / nie jest jeszcze wypchnięty, nie jest on uwzględniony w tej weryfikacji. To nie zmienia oceny treściowej listy priorytetów, bo wszystkie punkty można ocenić na podstawie aktualnego kodu strony statycznej.

## Źródła weryfikacji
- `index.html`
- `portfolio.html`
- `partials/header.html`
- `partials/footer.html`
- `docs/audyt-portfolio.md`

---

## 1) Punkt po punkcie

| Lp. | Punkt | Status | Weryfikacja | Czy wymaga zmiany? |
|---|---|---|---|---|
| 1 | Popraw `Najczęstsze pytania` (ortografia) | JUŻ ZROBIONE | W `index.html` sekcja ma tytuł `Najczęstsze pytania` — poprawnie. | Nie |
| 2 | Hero PM: problem → decyzja → wynik mierzalny | OPCJONALNE / DO LEPSZEGO DOPASOWANIA | Hero ma mocny komunikat procesowy: `Uporządkuj procesy, odzyskaj czas`, `Jeden partner od pomysłu do wdrożenia`, metryki. To jest wciąż spójne z narracją biznesową. Nie jest to błąd, tylko mniej „PM-ostry” niż w audycie. | Nie jako pilne, tak jako opcjonalne doprecyzowanie |
| 3 | Synchronizacja repo z produkcją | JUŻ ZROBIONE | W `index.html` tytuł i `jobTitle` są w wersji `prowadzenie projektów i automatyzacja procesów`, bez starego `Digital Product Designer`. | Nie |
| 4 | Rozbudowa sekcji `O mnie` jako PM | OPCJONALNE / MAŁO PILNE | Sekcja istnieje i mówi o zarządzaniu projektem od analizy do wdrożenia, jednak nie jest w pełni „PM bio”. To jest dobry poziom komunikacji, a nie luka krytyczna. | Nie jako wymóg natychmiastowy |
| 5 | Dedykowana sekcja doświadczenie zawodowe | JUŻ ZROBIONE / ZASTĄPIONE INNYM FORMATEM | W `portfolio.html` jest sekcja `Doświadczenie` z metrykami: `Branże`, `Staż`, `Zrealizowane`. To spełnia funkcję podsumowania doświadczenia bez osobnej strony CV. | Nie |
| 6 | Case studies PM detail | JUŻ ZROBIONE W ZAKRESIE OBECNEJ STRATEGII | Portfolio ma case study, metryki, wyniki, opis rozwiązania i sekcję `Doświadczenie`. Nie ma pełnego formatu PM w każdym projekcie, ale strona ma już konkretny charakter biznesowy. | Nie jako pilne |
| 7 | `ux-decision-grid` | OPCJONALNE | Ta struktura może wzmacniać narrację, ale nie jest warunkiem szczęścia dla obecnej strony. Nie widzę problemu biznesowego, który wymagałby natychmiastowej poprawki. | Nie |
| 8 | `pm-hero-meta` 4 pola | OPCJONALNE | W praktyce istnieją już metryki i sekcje typu `Branże / Staż / Zrealizowane`. To nie jest problem z funkcjonalnością strony. | Nie |
| 9 | Sekcja z narzędziami PM | OPCJONALNE | Jest to bardziej dodatek do personal brandu niż obowiązkowy element strony. Nie ma tu błędu technicznego ani problemu konwersyjnego. | Nie |
| 10 | Referencje / opinie klientów | OPCJONALNE | Brakuje ich na stronie, ale nie jest to problem `must-have` przy obecnym poziomie produktu. To jest element poziomu trust-building, nie bug. | Nie jako priorytet |
| 11 | Dowód społeczny / `happy ending` przed CTA | OPCJONALNE | Istnieje sekcja lead magnet `Nie wiesz, co warto zautomatyzować?` i CTA. To jest wystarczające dla obecnej konwersji. | Nie |
| 12 | CV / one-pager PM | OPCJONALNE | Nie ma go, ale nie jest to wymóg techniczny strony. Jeśli biznes potrzebuje CV jako materiał sprzedażowy, warto dodać. | Nie jako obowiązkowe |
| 13 | Formularz kontaktowy — RODO + opis projektu | WYMAGA ZMIANY | W `index.html` formularz ma `required`, ale nie ma checkboxa RODO z klauzulą i nie ma pola szczegółowo kwalifikującego projekt. To jest jedyny element z listy, który ma realne znaczenie prawne / jakość leadów. | Tak |
| 14 | Dodatkowe kanały kontaktu (telefon / kalendarz) | OPCJONALNE | E-mail jest widoczny i LinkedIn też. Telefon nie jest wymagany do działania strony, a kalendarz to kwestia strategii. | Nie |
| 15 | Link do polityki prywatności w stopce / nawigacji | JUŻ ZROBIONE | W `partials/footer.html` link do `/polityka-prywatnosci` jest widoczny. | Nie |
| 16 | SEO meta description i keywords | JUŻ ZROBIONE / DOBRE | W `index.html` i `portfolio.html` są poprawne `title`, `meta description`, Open Graph. Strona ma w praktyce dobry poziom optymalizacji na poziomie ogólnym. | Nie |
| 17 | Sekcja certyfikatów / szkoleń PM | OPCJONALNE | Brak certyfikatów nie jest błędem; to weryfikuje pozycję profesjonalną, ale nie powoduje problemu w działaniu strony. | Nie |
| 18 | FAQ PM-owe | OPCJONALNE | Obecne FAQ jest sensowne, ale jest bardziej ogólne niż PM-specific. Warto rozwinąć, ale to nie jest wymagane do działania strony. | Nie |
| 19 | Link do LinkedIn w `O mnie` i stopce | JUŻ ZROBIONE | `partials/footer.html` i `portfolio.html` mają link do LinkedIn; w stopce jest widoczny, w portfolio też. | Nie |
| 20 | Desktop: sekcja procesu jako 2 kolumny | JUŻ ZROBIONE W REALNYM CSS / STRUKTURZE | Sekcja procesu ma czytelny układ timeline i _nie_ wygląda jak projekt z luką ujemną. Nie ma potrzeby zmieniać na podstawie samego audytu. | Nie |
| 21 | Mobile: sekcja procesu jako akordeon / 3 kroki | DECYZJA ODŁOŻONA / ZALEŻY OD ANALITYKI | To jest poprawna decyzja defer, bo wymaga danych. Nie ma tu realnego problemu do naprawy bez danych. | Nie w tej chwili |
| 22 | Ujednolicenie stylu ikon | OPCJONALNE | W praktyce jest to kwestia spójności wizualnej, nie problemu funkcjonalnego. | Nie |
| 23 | `aspect-ratio` w obrazach portfolio | OPCJONALNE | Obrazy mają stałe proporcje i layout jest w większości stabilny. Nie ma tu ciężkiego problemu. | Nie |
| 24 | Popraw alt text loga | JUŻ ZROBIONE | `partials/header.html` ma alt: `Karol Wyszyński – prowadzenie projektów i automatyzacje`. | Nie |
| 25 | Rozszerzenie placeholdera `textarea` | JUŻ ZROBIONE | `index.html` ma placeholder opisujący problem, efekty i proces: `Napisz, co dziś nie działa...` | Nie |
| 26 | Sekcja z doświadczeniem branżowym | JUŻ ZROBIONE | W `portfolio.html` jest sekcja `Doświadczenie` z `Branże`, z pięcioma obszarami biznesowymi i metrykami. | Nie |
| 27 | Mapa procesu PM | JUŻ ZROBIONE W PÓŁWIZUALNYM FORMATCIE | Sekcja `Jak pracuję` ma trzy kroki i jasny przebieg od analizy do wdrożenia. To wystarcza jako mapa procesu. | Nie |
| 28 | Szybkość ładowania / Lighthouse | JUŻ ZROBIONE W PRZYPADKU STRUKTURY | Strona jest statyczna, ma preloading, lazy loading, `defer` i lokalne fonty. To jest już solidnie zrobione. | Nie |
| 29 | Favicon i meta tagi | JUŻ ZROBIONE | W `index.html` i `portfolio.html` są favicony oraz `og:*` / `twitter:*`. | Nie |
| 30 | Link do GitHub | OPCJONALNE | Dobry do personal brandu, ale nie jest to element konieczny do działania prezentacji. | Nie |
| 31 | A11y / kontrast / H1–H3 | JUŻ ZROBIONE / BARDZO DOBRY POZIOM | Strona ma `skip-link`, etykiety formularzy, `alt`, `aria-label`, i czytelne znaczniki sekcji. Nie widać problemu krytycznego. | Nie |
| 32 | Higiena repo / docs / archiwum | OPCJONALNE | To jest bardziej kwestia porządku w repo niż problem strony. Nie widać błędu produkcyjnego. | Nie |

---

## 2) Co realnie wymaga zmiany w tej chwili

Na podstawie aktualnego repo najważniejsze i jedyne realnie uzasadnione poprawki to:

1. Formularz kontaktowy — RODO / zgodność / lepszy lead qualification
   - w `index.html` formularz ma walidację `required`, ale brakuje:
     - checkboxa RODO z klauzulą,
     - linku do polityki prywatności w formularzu,
     - lepszego pola opisującego zakres projektu / termin / liczbę osób.
   - To jest jedyny punkt listy z realnym znaczeniem prawno-biznesowym.

2. (Opcjonalnie, nie krytycznie) Rozszerzenie materiału trust-building
   - opinie klientów,
   - short CV / one-pager,
   - dodatkowe kanały sprzedażowe,
   - rozbudowa `O mnie` jako PM.
   - To nie są błędy, ale mogą poprawić konwersję i wiarygodność.

---

## 3) Co nie wymaga zmiany

Największa część listy to już zrobione lub ma charakter „opcjonalny”. W szczególności:
- tytuł strony i meta są aktualne,
- FAQ ma poprawną pisownię,
- sekcja `O mnie` ma sens, choć nie jest pełnym PM bio,
- portfolio ma publikacje i case studies,
- sekcja `Doświadczenie` jest widoczna,
- linki do polityki i LinkedIn są w stopce,
- `partials/header.html` i `partials/footer.html` są prawidłowo synchronizowane,
- strona jest statyczna, bez build procesu, co jest zgodne z założeniami repo.

---

## 4) Wniosek końcowy

Liczba punktów wymagających realnej poprawki jest mała. W praktyce:
- `Tak, trzeba poprawić`: formularz kontaktowy (RODO + jakość leadów).
- `Można poprawić, ale nie jest to wymagane`: rozwinięcie PM positioning, referencje, one-pager, FAQ PM-owe, większa rozbudowa `O mnie`.
- `Już zrobione / nie wymagane`: większość pozostałych punktów z listy.

To oznacza, że nie ma sensu robić szerokiego, kosztownego „przerabiania” strony według pełnej listy bez biernej selekcji. Najbardziej uzasadniona ścieżka to:
1. formularz RODO + lepsze kwalifikowanie leadów,
2. ewentualnie uzupełnienie trust-buildingu,
3. pominięcie elementów, które już są zrealizowane lub mają charakter kosmetyczny.

---

## 5) Krótka rekomendacja do wdrożenia

Priorytet 1:
- `index.html` — dodać checkbox RODO i link do polityki prywatności w formularzu,
- rozwinąć `textarea` o opis procesu / budżetu / terminu / liczby osób,
- dodać pola typu `Firma / Branża` (opcjonalnie).

Priorytet 2:
- ewentualnie dodać 2–3 krótkie referencje,
- dodać `CV / one-pager` jeżeli chcesz mocniejszą sprzedażową narrację.

Priorytet 3:
- drobne doprecyzowanie `hero` i `about` na styl bardziej PM, ale bez całkowitego przepisania strony.



### Status końcowy
- `WYMAGAJĄ ZMIANY`: 1 główny punkt + 1–2 opcjonalne doprecyzowania.
- `JUŻ ZROBIONE / NIEWYMAGAJĄCE`: reszta listy.
- `CI`: brak widocznego workflow w repo, więc nie wchodzi do oceny produktu.























































































































































































































































































































































































































































































































































































Google style? etc.

// ═══════════════════════════════════════════════════════════════════════════
// CAŁY KOD BACKENDU GAS DLA KWYSZYNSKI.PL — formularz kontaktowy + lead magnet
// ═══════════════════════════════════════════════════════════════════════════
// To jest kompletna, aktualna wersja projektu Google Apps Script podpiętego
// pod CONTACT_API_URL w assets/js/index-scripts.js.
//
// DEPLOYMENT:
// 1. Otwórz projekt GAS (script.google.com) → wklej CAŁĄ zawartość tego pliku,
//    zastępując obecny kod (usuń też ewentualną osobną funkcję autoryzujGmail —
//    była tylko jednorazowym narzędziem do wymuszenia autoryzacji Gmaila).
// 2. Rozmieść → Zarządzaj wdrożeniami → edytuj istniejące wdrożenie →
//    Wersja: Nowa wersja → Wdróż.
//    URL /exec się NIE zmienia — index-scripts.js zostaje bez zmian.
// 3. Jeśli po wdrożeniu maile przestaną wychodzić, sprawdź w arkuszu KONTAKTY
//    kolumnę Status — błędy Gmaila są tam zapisywane wprost (np. "BŁĄD MAILA: ...").
// ═══════════════════════════════════════════════════════════════════════════

function isValidEmailFormat_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Google Sheets wykonuje formuły zaczynające się od =,+,-,@ — apostrof z przodu
// wymusza traktowanie wartości jako tekst (Formula Injection guard).
function sanitizeForSheet_(value) {
  const v = String(value || '');
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

// Rate limit per adres e-mail: max 1 zgłoszenie na 15 minut w danym "bucket"
// (bucket rozdziela formularz kontaktowy od lead magnetu — bez tego ten sam
// email w jednym i w drugim formularzu blokował się wzajemnie).
function isRateLimited_(bucket, email) {
  const cache = CacheService.getScriptCache();
  const key = bucket + '_' + email.toLowerCase();
  if (cache.get(key)) return true;
  cache.put(key, '1', 15 * 60);
  return false;
}

// Globalny throttle niezależny od adresu e-mail: GAS nie udostępnia IP
// wywołującego (CacheService/doGet nie mają takiego pola), więc rate-limit
// per-email można obejść rotując adresy — to ogranicza szkodę (np. joe-job,
// wyczerpanie dziennego limitu Gmaila) sufitem na liczbę wysyłek w danym
// buckecie na godzinę, bez względu na to, jaki email atakujący poda.
function isGloballyThrottled_(bucket, maxPerHour) {
  const cache = CacheService.getScriptCache();
  const key = 'global_' + bucket;
  const count = parseInt(cache.get(key) || '0', 10);
  if (count >= maxPerHour) return true;
  cache.put(key, String(count + 1), 60 * 60);
  return false;
}

// doGet zostaje dla health-checku ("API działa!" przy wejściu w /exec bez
// parametrów) i starych linków z zapisanymi query-stringami. Formularze na
// stronie wysyłają teraz przez doPost — dane w body żądania, nie w URL, więc
// nie trafiają do logów serwera/historii przeglądarki/proxy.
function doGet(e) {
  return handleRequest_(e);
}

function doPost(e) {
  return handleRequest_(e);
}

function handleRequest_(e) {
  try {
    // Routing dla lead magnetu (checklista PDF z narzedzie.html)
    if (e.parameter && e.parameter.action === 'lead_magnet') {
      return handleLeadMagnet(e);
    }

    let params = {};
    if (e.parameter) params = e.parameter;
    else if (e.parameters) {
      Object.keys(e.parameters).forEach(key => {
        params[key] = e.parameters[key][0];
      });
    }

    if (!params || Object.keys(params).length === 0) {
      return ContentService.createTextOutput('API działa!');
    }

    // Honeypot — ukryte pole w formularzu, wypełnia je tylko bot. Zwracamy
    // SUCCESS (nie ERROR), żeby bot nie dostał sygnału, że został złapany.
    if (params.website) {
      return ContentService.createTextOutput('SUCCESS');
    }

    const data = {
      name: params.name || '',
      email: params.email || '',
      phone: params.phone || '',
      company: params.company || '',
      projectType: params.projectType || '',
      budget: params.budget || '',
      message: params.message || ''
    };

    if (!data.name || !data.email || !data.message) {
      return ContentService.createTextOutput('ERROR: Brakuje wymaganych danych');
    }

    if (!isValidEmailFormat_(data.email)) {
      return ContentService.createTextOutput('ERROR: Nieprawidłowy adres email');
    }

    if (isGloballyThrottled_('contact', 20)) {
      return ContentService.createTextOutput('ERROR: Za duży ruch na formularzu, spróbuj za chwilę');
    }

    if (isRateLimited_('contact', data.email)) {
      return ContentService.createTextOutput('ERROR: Zgłoszenie z tym adresem email zostało już wysłane, odczekaj 15 minut');
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('KONTAKTY');
    if (!sheet) {
      sheet = ss.insertSheet('KONTAKTY');
      sheet.appendRow(['Data', 'Imię', 'Email', 'Telefon', 'Firma', 'Projekt', 'Budżet', 'Wiadomość', 'Status']);
    }

    // Zapisujemy zgłoszenie NAJPIERW, niezależnie od tego czy mail się uda —
    // dane klienta nie mogą zginąć, jeśli zawiedzie tylko powiadomienie mailowe.
    const rowIndex = sheet.appendRow([
      new Date(),
      sanitizeForSheet_(data.name),
      sanitizeForSheet_(data.email),
      data.phone,
      sanitizeForSheet_(data.company),
      data.projectType,
      data.budget,
      sanitizeForSheet_(data.message),
      'NOWE'
    ]).getLastRow();

    let mailError = null;
    try {
      const imie = data.name.split(' ')[0] || '';
      GmailApp.sendEmail(
        data.email,
        'Dziękuję za kontakt!',
        `Cześć ${imie}, otrzymałem Twoje zgłoszenie i odezwę się w ciągu 24h. Pozdrawiam, Karol`
      );
      GmailApp.sendEmail(
        'wyszynski.k@onet.pl',
        `Nowe zgłoszenie: ${data.name}`,
        `Email: ${data.email}\nTelefon: ${data.phone}\nFirma: ${data.company}\nProjekt: ${data.projectType}\nWiadomość: ${data.message}`,
        { replyTo: data.email }
      );
    } catch (err) {
      mailError = err.message;
      // Błąd maila zapisujemy WPROST do arkusza, żeby był widoczny bez
      // zaglądania w logi Apps Script — inaczej ginie bezpowrotnie.
      sheet.getRange(rowIndex, 9).setValue('BŁĄD MAILA: ' + mailError);
    }

    if (mailError) {
      console.error('Zgłoszenie zapisane, ale wysyłka maila nie powiodła się: ' + mailError);
    }

    return ContentService.createTextOutput('SUCCESS');

  } catch (error) {
    console.error('Błąd handleRequest_:', error);
    return ContentService.createTextOutput('ERROR: ' + error.message);
  }
}

// ── LEAD MAGNET ──────────────────────────────────────────────────────────────
var PDF_URL = 'https://kwyszynski.pl/assets/pdf/7-sygnalow-automatyzacja.pdf';
var SHEET_NAME = 'LeadMagnet';

function handleLeadMagnet(e) {
  var email = (e.parameter.email || '').trim().toLowerCase();

  if (!email || !isValidEmailFormat_(email)) {
    return ContentService.createTextOutput('ERROR: invalid email')
      .setMimeType(ContentService.MimeType.TEXT);
  }

  if (isGloballyThrottled_('leadmagnet', 30)) {
    return ContentService.createTextOutput('ERROR: too much traffic, try later')
      .setMimeType(ContentService.MimeType.TEXT);
  }

  if (isRateLimited_('leadmagnet', email)) {
    return ContentService.createTextOutput('ERROR: already sent, try later')
      .setMimeType(ContentService.MimeType.TEXT);
  }

  var source = e.parameter.source || 'unknown';
  var timestamp = new Date().toISOString();
  var pdfStatus = 'OK';

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Timestamp', 'Email', 'Source', 'Status']);
  }

  var pdfBlob = null;
  try {
    var response = UrlFetchApp.fetch(PDF_URL, { muteHttpExceptions: true });
    if (response.getResponseCode() === 200) {
      pdfBlob = response.getBlob().setName('7-sygnalow-automatyzacja.pdf');
    } else {
      pdfStatus = 'PDF_FETCH_ERROR_' + response.getResponseCode();
    }
  } catch (err) {
    pdfStatus = 'PDF_FETCH_EXCEPTION';
  }

  var subject = '7 sygnałów, że Twój proces nadaje się do automatyzacji';
  var htmlBody = [
    '<p>Cześć,</p>',
    '<p>Dziękuję za pobranie materiału. Znajdziesz go w załączniku.</p>',
    '<p>Jeśli masz konkretny proces, który chcesz omówić — napisz lub przejdź na ',
    '<a href="https://kwyszynski.pl/uslugi">kwyszynski.pl/uslugi</a>.',
    '</p>',
    '<p>Karol Wyszyński<br>Prowadzenie Projektów i Automatyzacja Procesów</p>',
    '<hr>',
    '<p style="font-size:12px;color:#888">Jeśli załącznik nie dotarł: ',
    '<a href="' + PDF_URL + '">pobierz PDF bezpośrednio</a>.</p>'
  ].join('');

  var mailOptions = {
    htmlBody: htmlBody,
    name: 'Karol Wyszyński'
  };
  if (pdfBlob) {
    mailOptions.attachments = [pdfBlob];
  }

  try {
    GmailApp.sendEmail(email, subject, '', mailOptions);
  } catch (mailErr) {
    pdfStatus = pdfStatus === 'OK' ? 'MAIL_ERROR' : pdfStatus + '_MAIL_ERROR';
  }

  sheet.appendRow([timestamp, sanitizeForSheet_(email), sanitizeForSheet_(source), pdfStatus]);

  return ContentService.createTextOutput('SUCCESS')
    .setMimeType(ContentService.MimeType.TEXT);
}

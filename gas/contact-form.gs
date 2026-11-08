// ================ APPS SCRIPT - FORMULARZ KONTAKTOWY + LEAD MAGNET ================
// WAŻNE: po wklejeniu do script.google.com -> Rozmieść -> Zarządzaj wdrożeniami ->
// edytuj istniejące wdrożenie -> Wersja: Nowa wersja -> Wdróż. URL /exec się nie zmienia.
//
// Wymaga: w arkuszu KONTAKTY wstawiona nowa kolumna "Firma" między Telefon i Rodzaj
// projektu (kolumna E), PRZED wdrożeniem tego kodu - inaczej nowe zgłoszenia wylądują
// w złych kolumnach względem starych nagłówków.

function isValidEmailFormat_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Google Sheets wykonuje formuły zaczynające się od =,+,-,@ - apostrof z przodu
// wymusza traktowanie wartości jako tekst (Formula Injection guard).
function sanitizeForSheet_(value) {
  const v = String(value || '');
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

// Rate limit per adres e-mail: max 1 zgłoszenie na 15 minut w danym "bucket"
// (bucket rozdziela formularz kontaktowy od lead magnetu, żeby ten sam email
// w jednym i w drugim formularzu się wzajemnie nie blokował).
function isRateLimited_(bucket, email) {
  const cache = CacheService.getScriptCache();
  const key = bucket + '_' + email.toLowerCase();
  if (cache.get(key)) return true;
  cache.put(key, '1', 15 * 60);
  return false;
}

// Globalny throttle niezależny od adresu e-mail: GAS nie udostępnia IP
// wywołującego, więc rate-limit per-email da się obejść rotując adresy -
// to ogranicza szkodę (spam na cudze adresy, wyczerpanie limitu Gmaila)
// sufitem liczby wysyłek w danym buckecie na godzinę.
function isGloballyThrottled_(bucket, maxPerHour) {
  const cache = CacheService.getScriptCache();
  const key = 'global_' + bucket;
  const count = parseInt(cache.get(key) || '0', 10);
  if (count >= maxPerHour) return true;
  cache.put(key, String(count + 1), 60 * 60);
  return false;
}

function doGet(e) {
  return handleFormRequest_(e, 'GET');
}

// Formularz na stronie wysyła teraz POST z body jako URLSearchParams
// (Content-Type: application/x-www-form-urlencoded) - Apps Script wypełnia
// e.parameter identycznie jak przy GET, więc ten sam handler obsługuje oba.
// Dane nie lecą w URL (nie trafiają do logów/historii przeglądarki).
function doPost(e) {
  return handleFormRequest_(e, 'POST');
}

function doOptions() {
  return ContentService.createTextOutput('');
}

function handleFormRequest_(e, method) {
  try {
    console.log('📨 Otrzymano ' + method + ' request');
    console.log('📝 e.parameter:', JSON.stringify(e.parameter));

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

    console.log('📝 Przetworzone parametry:', JSON.stringify(params));

    if (!params || Object.keys(params).length === 0) {
      console.log('ℹ️ Brak parametrów - zwracam podstawową odpowiedź');
      return ContentService.createTextOutput('API działa!');
    }

    // Honeypot - ukryte pole w formularzu, wypełnia je tylko bot. Zwracamy
    // SUCCESS (nie ERROR), żeby bot nie dostał sygnału, że został złapany.
    if (params.website) {
      console.log('🕷️ Honeypot złapany, ignoruję zgłoszenie');
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

    console.log('📝 Dane:', JSON.stringify(data));

    if (!data.name || !data.email || !data.message) {
      console.log('❌ Brakuje wymaganych danych:', data);
      return ContentService.createTextOutput('ERROR: Brakuje wymaganych danych');
    }

    if (!isValidEmailFormat_(data.email)) {
      console.log('❌ Nieprawidłowy email:', data.email);
      return ContentService.createTextOutput('ERROR: Nieprawidłowy adres email');
    }

    if (isGloballyThrottled_('contact', 20)) {
      console.log('⛔ Globalny throttle - za duży ruch');
      return ContentService.createTextOutput('ERROR: Za duży ruch na formularzu, spróbuj za chwilę');
    }

    if (isRateLimited_('contact', data.email)) {
      console.log('⛔ Rate limit dla:', data.email);
      return ContentService.createTextOutput('ERROR: Zgłoszenie z tym adresem email zostało już wysłane, odczekaj 15 minut');
    }

    // Zapisz do arkusza
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('KONTAKTY');

    if (!sheet) {
      sheet = ss.insertSheet('KONTAKTY');
      sheet.appendRow(['Data', 'Imię', 'Email', 'Telefon', 'Firma', 'Projekt', 'Budżet', 'Wiadomość', 'Status']);
      console.log('📊 Utworzono arkusz KONTAKTY');
    }

    // Zapisujemy zgłoszenie NAJPIERW, niezależnie od tego czy mail się uda -
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

    console.log(`✅ Zapisano: ${data.name} <${data.email}>`);

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
      console.log('📧 Emaile wysłane');
    } catch (mailError) {
      console.error('❌ Błąd emaili:', mailError.message);
      // Błąd maila zapisujemy WPROST do arkusza (kolumna Status, teraz I=9
      // po dodaniu kolumny Firma), żeby był widoczny bez zaglądania w logi.
      sheet.getRange(rowIndex, 9).setValue('BŁĄD MAILA: ' + mailError.message);
    }

    return ContentService.createTextOutput('SUCCESS');

  } catch (error) {
    console.error('❌ Błąd ' + method + ':', error);
    return ContentService.createTextOutput('ERROR: ' + error.message);
  }
}

// ── LEAD MAGNET (checklista PDF z narzedzie.html) ───────────────────────────
var PDF_URL = 'https://kwyszynski.pl/assets/pdf/7-sygnalow-automatyzacja.pdf';
var LEAD_MAGNET_SHEET_NAME = 'LeadMagnet';

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
  var sheet = ss.getSheetByName(LEAD_MAGNET_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(LEAD_MAGNET_SHEET_NAME);
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
    '<p>Jeśli masz konkretny proces, który chcesz omówić - napisz lub przejdź na ',
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

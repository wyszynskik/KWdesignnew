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

function doGet(e) {
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

    const data = {
      name: params.name || '',
      email: params.email || '',
      phone: params.phone || '',
      projectType: params.projectType || '',
      budget: params.budget || '',
      message: params.message || ''
    };

    if (!data.name || !data.email || !data.message) {
      return ContentService.createTextOutput('ERROR: Brakuje wymaganych danych');
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('KONTAKTY');
    if (!sheet) {
      sheet = ss.insertSheet('KONTAKTY');
      sheet.appendRow(['Data', 'Imię', 'Email', 'Telefon', 'Projekt', 'Budżet', 'Wiadomość', 'Status']);
    }

    // Zapisujemy zgłoszenie NAJPIERW, niezależnie od tego czy mail się uda —
    // dane klienta nie mogą zginąć, jeśli zawiedzie tylko powiadomienie mailowe.
    const rowIndex = sheet.appendRow([
      new Date(),
      data.name,
      data.email,
      data.phone,
      data.projectType,
      data.budget,
      data.message,
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
        `Email: ${data.email}\nProjekt: ${data.projectType}\nWiadomość: ${data.message}`,
        { replyTo: data.email }
      );
    } catch (err) {
      mailError = err.message;
      // Błąd maila zapisujemy WPROST do arkusza, żeby był widoczny bez
      // zaglądania w logi Apps Script — inaczej ginie bezpowrotnie.
      sheet.getRange(rowIndex, 8).setValue('BŁĄD MAILA: ' + mailError);
    }

    if (mailError) {
      console.error('Zgłoszenie zapisane, ale wysyłka maila nie powiodła się: ' + mailError);
    }

    return ContentService.createTextOutput('SUCCESS');

  } catch (error) {
    console.error('Błąd doGet:', error);
    return ContentService.createTextOutput('ERROR: ' + error.message);
  }
}

// ── LEAD MAGNET ──────────────────────────────────────────────────────────────
var PDF_URL = 'https://kwyszynskidesign.github.io/KWdesignnew/assets/pdf/7-sygnalow-automatyzacja.pdf';
var SHEET_NAME = 'LeadMagnet';

function handleLeadMagnet(e) {
  var email = (e.parameter.email || '').trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return ContentService.createTextOutput('ERROR: invalid email')
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

  sheet.appendRow([timestamp, email, source, pdfStatus]);

  return ContentService.createTextOutput('SUCCESS')
    .setMimeType(ContentService.MimeType.TEXT);
}

// ── LEAD MAGNET — addytywny routing ──────────────────────────────────────────
// Wklej tę funkcję do istniejącego pliku GAS.
// Na początku doGet(e) dodaj:
//
//   if (e.parameter.action === 'lead_magnet') return handleLeadMagnet(e);
//
// PRZED całą resztą istniejącego kodu (nie przepisuj doGet — tylko dołóż jeden if).
// ─────────────────────────────────────────────────────────────────────────────

// DEPLOYMENT:
// 1. Otwórz projekt GAS (script.google.com), wklej tę funkcję.
// 2. Dodaj `if (e.parameter.action === 'lead_magnet') return handleLeadMagnet(e);`
//    na początku doGet(e).
// 3. Kliknij "Rozmieść" → "Zarządzaj wdrożeniami" → edytuj istniejące,
//    zmień "Wersja" na "Nowa wersja" → Wdróż.
//    WAŻNE: przy pierwszym wdrożeniu po dodaniu GmailApp Google wymusi
//    ponowną autoryzację — potwierdź nowe uprawnienia w popupie.
// 4. URL /exec się NIE zmienia po redeploymencie — index-scripts.js bez zmian.

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
    '<a href="https://kwyszynskidesign.com/uslugi.html">kwyszynskidesign.com/uslugi</a>.',
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

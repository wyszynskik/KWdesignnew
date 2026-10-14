#!/usr/bin/env node
// Synchronizes partials/header.html and partials/footer.html into every
// HTML page listed in TARGETS, between the <!-- partial:NAME --> markers.
// Sets aria-current="page" on the nav link matching the target's route.
//
// Usage:
//   node scripts/sync-partials.js          writes changes to disk
//   node scripts/sync-partials.js --check  exits 1 if any file is stale, writes nothing
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CHECK = process.argv.includes('--check');

const PARTIALS = {
  header: fs.readFileSync(path.join(ROOT, 'partials/header.html'), 'utf8').replace(/\n$/, ''),
  footer: fs.readFileSync(path.join(ROOT, 'partials/footer.html'), 'utf8').replace(/\n$/, ''),
};

// route: null means "no nav item should be marked current for this page"
const TARGETS = [
  { file: 'index.html', route: null },
  { file: 'uslugi.html', route: '/uslugi' },
  { file: 'portfolio.html', route: '/portfolio' },
  { file: 'narzedzie.html', route: null },
  { file: 'polityka-prywatnosci.html', route: null },
  { file: '404.html', route: null },
  ...fs.readdirSync(path.join(ROOT, 'projects'))
    .filter(f => f.endsWith('.html'))
    .sort()
    .map(f => ({ file: 'projects/' + f, route: null })),
];

function withAriaCurrent(headerHtml, route) {
  if (!route) return headerHtml;
  const needle = `href="${route}">`;
  const idx = headerHtml.indexOf(needle);
  if (idx === -1) return headerHtml;
  return (
    headerHtml.slice(0, idx) +
    `href="${route}" aria-current="page">` +
    headerHtml.slice(idx + needle.length)
  );
}

function replaceBetween(content, name, replacement) {
  const open = `<!-- partial:${name} -->`;
  const close = `<!-- /partial:${name} -->`;
  const start = content.indexOf(open);
  const end = content.indexOf(close);
  if (start === -1 || end === -1 || end < start) return { content, found: false };
  const before = content.slice(0, start + open.length);
  const after = content.slice(end);
  return { content: `${before}\n${replacement}\n${after}`, found: true };
}

let staleFiles = [];
let changedFiles = [];
let missingMarkers = [];

for (const target of TARGETS) {
  const fp = path.join(ROOT, target.file);
  if (!fs.existsSync(fp)) continue;
  const original = fs.readFileSync(fp, 'utf8');

  let { content: afterHeader, found: hasHeader } = replaceBetween(
    original,
    'header',
    withAriaCurrent(PARTIALS.header, target.route)
  );
  let { content: afterFooter, found: hasFooter } = replaceBetween(
    afterHeader,
    'footer',
    PARTIALS.footer
  );

  if (!hasHeader || !hasFooter) {
    missingMarkers.push(target.file);
    continue;
  }

  if (afterFooter !== original) {
    staleFiles.push(target.file);
    if (!CHECK) {
      fs.writeFileSync(fp, afterFooter, 'utf8');
      changedFiles.push(target.file);
    }
  }
}

if (missingMarkers.length) {
  console.log('Pliki bez znaczników <!-- partial:header/footer --> (pominięte):');
  missingMarkers.forEach(f => console.log('  ' + f));
}

if (CHECK) {
  if (staleFiles.length) {
    console.error('Niezsynchronizowane pliki (' + staleFiles.length + '):');
    staleFiles.forEach(f => console.error('  ' + f));
    process.exit(1);
  }
  console.log('sync:check OK — wszystkie pliki zsynchronizowane.');
  process.exit(0);
} else {
  console.log('Zaktualizowano ' + changedFiles.length + ' plik(ów):');
  changedFiles.forEach(f => console.log('  ' + f));
}

#!/usr/bin/env node
/**
 * update-sitemap.js — ustawia <lastmod> każdego adresu w sitemap.xml na datę
 * ostatniego commita, który zmienił odpowiadający mu plik HTML
 * (git log -1 --format=%cs -- <plik>).
 *
 * Mapowanie <loc> → plik:
 *   https://kwyszynski.pl/                     → index.html
 *   https://kwyszynski.pl/uslugi               → uslugi.html
 *   https://kwyszynski.pl/projects/karoma      → projects/karoma.html
 *
 * Uruchamiane ręcznie (`npm run sitemap`) i automatycznie w `npm run sync`,
 * żeby daty aktualizowały się przy każdej zmianie. Zależy od historii git —
 * w płytkim klonie daty mogą być ucięte (uruchom `git fetch --unshallow`).
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITEMAP = path.join(ROOT, 'sitemap.xml');

function locToFile(loc) {
  let p;
  try { p = new URL(loc).pathname; } catch { p = loc; }
  if (p === '/' || p === '') return 'index.html';
  return p.replace(/^\/+/, '').replace(/\/+$/, '') + '.html';
}

function lastCommitDate(file) {
  try {
    return execSync(`git log -1 --format=%cs -- "${file}"`, { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

function run() {
  const original = fs.readFileSync(SITEMAP, 'utf8');
  const summary = [];
  const missing = [];
  let changed = 0;

  const updated = original.replace(/<url>[\s\S]*?<\/url>/g, (block) => {
    const locM = block.match(/<loc>\s*([^<\s]+)\s*<\/loc>/);
    if (!locM) return block;
    const loc = locM[1];
    const file = locToFile(loc);

    if (!fs.existsSync(path.join(ROOT, file))) {
      missing.push(`${loc} → ${file} (brak pliku)`);
      return block;
    }
    const date = lastCommitDate(file);
    if (!date) {
      missing.push(`${loc} → ${file} (brak w historii git)`);
      return block;
    }

    let replaced = false;
    let nb = block.replace(/<lastmod>\s*[^<]*\s*<\/lastmod>/, () => {
      replaced = true;
      return `<lastmod>${date}</lastmod>`;
    });
    if (!replaced) {
      nb = block.replace(/(<loc>[^<]*<\/loc>)/, `$1\n    <lastmod>${date}</lastmod>`);
    }
    if (nb !== block) changed++;
    summary.push(`${file.padEnd(38)} ${date}`);
    return nb;
  });

  const isCheck = process.argv.includes('--check');
  if (isCheck) {
    if (updated !== original) {
      console.error('sitemap:check — sitemap.xml nieaktualny (uruchom `npm run sitemap`).');
      process.exit(1);
    }
    console.log('sitemap:check OK — daty aktualne.');
    return;
  }

  if (updated !== original) fs.writeFileSync(SITEMAP, updated);
  console.log('sitemap.xml — <lastmod> wg ostatniego commita pliku:');
  summary.forEach((s) => console.log('  ' + s));
  if (missing.length) {
    console.log('UWAGA — pominięte wpisy:');
    missing.forEach((m) => console.log('  ' + m));
  }
  console.log(updated === original ? 'Bez zmian (daty już aktualne).' : `Zaktualizowano wpisów: ${changed}.`);
}

run();

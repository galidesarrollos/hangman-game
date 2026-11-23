const { mkdirSync, readFileSync, writeFileSync } = require('node:fs');
const { resolve } = require('node:path');

const docs = resolve(__dirname, '../docs');

const shell = readFileSync(resolve(docs, 'index.html'), 'utf8')
  .replace(/<app-root>[\s\S]*?<\/app-root>/, '<app-root></app-root>');

// Only the public home page needs content before Angular bootstraps.
const home = readFileSync(resolve(__dirname, '../src/home-fallback.html'), 'utf8').trimEnd();
writeFileSync(resolve(docs, 'index.html'), shell.replace('<app-root></app-root>', `<app-root>\n${home}\n  </app-root>`));
writeFileSync(resolve(docs, '404.html'), shell);

// GitHub Pages serves directory indexes with HTTP 200 for direct visits.
const terms = resolve(docs, 'terminos-y-condiciones');
mkdirSync(terms, { recursive: true });
writeFileSync(resolve(terms, 'index.html'), shell
  .replace('<title>El Juego del Ahorcado</title>', '<title>Términos y condiciones | El Juego del Ahorcado</title>')
  .replace(/<meta name="description"[^>]*>/, '<meta name="description" content="Términos y condiciones de uso del Juego del Ahorcado.">'));
writeFileSync(resolve(docs, '.nojekyll'), '');
writeFileSync(resolve(docs, 'CNAME'), 'elahorcadojuego.com\n');

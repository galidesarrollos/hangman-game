const { copyFileSync, writeFileSync } = require('node:fs');
const { resolve } = require('node:path');

const docs = resolve(__dirname, '../docs');

// Keep Angular routes usable when GitHub Pages serves its custom 404 page.
copyFileSync(resolve(docs, 'index.html'), resolve(docs, '404.html'));
writeFileSync(resolve(docs, '.nojekyll'), '');
writeFileSync(resolve(docs, 'CNAME'), 'elahorcadojuego.com\n');

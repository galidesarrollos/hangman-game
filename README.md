# hangman-game

Aplicación Ionic/Angular con versiones web y móvil.

- `src/`: código fuente compartido.
- `www/`: compilación local generada con `npm run build`, utilizada por Capacitor para Android/iOS. No se guarda en Git.
- `docs/`: compilación publicada por GitHub Pages desde la rama `main`. Se guarda en Git y puede corresponder a una versión diferente de `www/`.

## Publicar la web

Ejecutar `npm run build:pages` para compilar la versión de producción en `docs/` con `<base href="/">`, adecuado para `https://elahorcadojuego.com/`.
El comando también genera `404.html`, `.nojekyll` y `CNAME` para conservar el dominio personalizado tras cada compilación.

Después, guardar los cambios de `docs/` en un commit y subirlos a `main`. GitHub Pages debe mantener como origen `main` → `/docs`.

`/docs` es la carpeta de publicación del repositorio; no forma parte de la URL pública. No usar `/hangman-game/` como base mientras se publique en el dominio propio.

La compilación habitual para móvil continúa siendo `npm run build`, con salida en `www/`.

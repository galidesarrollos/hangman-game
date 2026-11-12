# Configurar AdSense desde cero

La integración usa dos bloques de display adaptables, al final de las pantallas de temáticas y niveles. No se añaden anuncios al teclado ni durante las partidas. Los espacios vacíos permanecen ocultos. El script solo se carga en producción, en el dominio público, y fuera de Capacitor.

## 1. Cuenta y sitio

1. Entra en https://www.google.com/adsense/ con la cuenta de Google que utilizarás para cobrar. Si todavía no tienes AdSense, completa el alta y tus datos reales de país, titular y pagos. AdMob no sustituye el alta del sitio en AdSense.
2. En **Sitios**, añade `elahorcadojuego.com`.
3. Comprueba en **Cuenta → Configuración → Información de la cuenta** tu ID de editor. El proyecto usa `pub-6536506161156686`. Si AdSense muestra otro, cambia `client` en `src/app/config/web-ads.config.ts`, la etiqueta `google-adsense-account` en `src/index.html` y la línea de `src/ads.txt`. Los identificadores AdMob móviles se configuran aparte.
4. Publica esta versión (paso 5). Para vincular el sitio selecciona **Etiqueta meta** o **ads.txt**, ambos preparados. Pulsa **Verificar** y **Solicitar revisión**. Es necesario que Google apruebe el sitio antes de servir anuncios; añadir código no garantiza la aprobación.

## 2. Consentimiento

1. En **Privacidad y mensajes → Reglamentos europeos**, crea o edita el mensaje para este dominio.
2. Selecciona la CMP de Google. Configura el español y la URL de privacidad `https://elahorcadojuego.com/politica-privacidad.html`.
3. Habilita las opciones de consentir, no consentir y gestionar opciones; revisa el contenido y publica el mensaje. La etiqueta AdSense carga la CMP publicada: no hay que duplicar scripts.
4. Configura los mensajes adicionales que correspondan a los países donde sirvas anuncios.
5. El enlace **Privacidad y anuncios** del pie vuelve a abrir el mensaje europeo de Google. El antiguo aviso de cerrar cookies se ha retirado, porque no recogía consentimiento publicitario.

## 3. Dos bloques de anuncios

1. En **Anuncios → Por bloque de anuncios → Anuncios de display**, crea `Web - Tematicas` con tamaño **Adaptable**.
2. Pulsa **Crear / Guardar y obtener código** y copia el número del atributo `data-ad-slot`. No copies el ID `ca-app-pub-.../...` de AdMob.
3. Repite para `Web - Niveles`.
4. Coloca ambos números como cadenas en `src/app/config/web-ads.config.ts`:

   ```ts
   slots: { themes: '2821034524', levels: '8077230632' }
   ```

   Estos son los identificadores reales facilitados para este sitio y ya están incorporados. No pegues otra vez el script o el HTML completo: el componente compartido ya los incorpora.

## 4. Ubicación de anuncios

En **Anuncios → Por sitio web**, busca `elahorcadojuego.com` y pulsa el lápiz **Editar**. En la vista previa abre **Configuración de anuncios**, desactiva **Anuncios automáticos** y pulsa **Aplicar al sitio web → Aplicar ahora → Guardar**. Si el interruptor ya está desactivado, déjalo así. Esto conserva los dos bloques manuales integrados. De lo contrario Google puede añadir ubicaciones, anclas y anuncios superpuestos, también en pantallas de juego. Desactiva también la optimización automática de anuncios existentes si la cuenta la ofrece y quieres conservar las ubicaciones manuales.

## 5. Compilar y publicar

Ejecuta `npm.cmd run build:pages` en Windows (o `npm run build:pages` en otros sistemas). Guarda los cambios del código y de `docs/` en Git y súbelos a `main` mediante tu procedimiento habitual. GitHub Pages debe publicar `main → /docs`. La compilación local por sí sola no actualiza el sitio público.

Tras publicar, comprueba:

- `https://elahorcadojuego.com/ads.txt` devuelve `google.com, pub-6536506161156686, DIRECT, f08c47fec0942fa0` (o el editor real de tu AdSense). `app-ads.txt` es independiente, para las apps móviles.
- En **Sitios** de AdSense, la web aparece aprobada y el estado de ads.txt es autorizado; solicita una nueva comprobación si está disponible.
- Sin bloqueador, en una ventana privada, aparece el mensaje cuando corresponde. Para previsualizar el mensaje publicado: `https://elahorcadojuego.com/?fc=alwaysshow&fctype=gdpr`.
- Aceptar, rechazar y gestionar funcionan; el enlace del pie permite volver a abrir las opciones.
- Los bloques aparecen en temáticas y niveles con pantalla estrecha y ancha. Navegar y volver no duplica anuncios. Un bloque puede quedar sin anuncio si Google no tiene inventario.
- El juego sigue funcionando cuando un bloqueador impide cargar Google. No hagas clic en tus propios anuncios para probarlos.

La aparición real depende de la aprobación del sitio, de los IDs válidos, del consentimiento aplicable y de la disponibilidad de anuncios. No se puede verificar desde una compilación local sin la configuración de la cuenta.

## Referencias oficiales

- [Conectar un sitio a AdSense](https://support.google.com/adsense/answer/7584263?hl=es)
- [Crear un bloque de display](https://support.google.com/adsense/answer/9274025?hl=es)
- [Requisitos de CMP](https://support.google.com/adsense/answer/13554116?hl=es)
- [API de privacidad y mensajes](https://developers.google.com/funding-choices/fc-api-docs)
- [Anuncios automáticos](https://support.google.com/adsense/answer/9261307?hl=es)

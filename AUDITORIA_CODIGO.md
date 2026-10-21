# Auditoría y seguimiento del código

Actualizado: 21 de octubre de 2026.

Este documento recoge los hallazgos de la revisión del código Angular, los recursos y la configuración nativa. Se actualizará al aplicar cada corrección.

## Prioridad alta

| Punto | Hallazgo | Estado |
| --- | --- | --- |
| 1 | Había dos almacenes de claves Android versionados (`android/my-release-key.jks` y `android/my-new-release-key.jks`). | Retirados del índice de Git e ignorados para futuros commits. Los archivos locales siguen intactos. El propietario confirma que ninguno firma la app publicada: el material de firma activo está en una carpeta `jks` externa al repositorio. No hace falta sustituir la firma publicada por esta limpieza. Las dos claves antiguas permanecen en el historial de Git. |
| 2 | El reto diario se puede repetir mediante acceso directo a `/reto-diario` y volver a registrar resultados. | Resuelto: el servicio impide empezar un reto finalizado, guarda el progreso del reto activo y lo reanuda al volver o recargar. El reintento recompensado sigue permitido una vez. |
| 3 | Las pruebas no compilan por tres errores TS4111 en `words.service.spec.ts`. | Resuelto: corregidos los accesos tipados y añadida «señalización» a ciencia avanzado para cumplir la cobertura de «ñ» exigida por la prueba. |
| 4 | Faltan identificadores de anuncios web e iOS. | Aplazado por decisión del propietario; el foco actual es Android. |
| 5 | El intersticial se solicita sin controlar plataforma ni errores y se inicia la partida antes de resolver el anuncio. | Resuelto: AdMob omite el intersticial fuera de plataformas nativas; la partida espera al anuncio y continúa si este falla, registrando el error. |

## Código inactivo y reutilización

| Hallazgo | Estado |
| --- | --- |
| Ramas inalcanzables y dos caminos de reintento diario en `GameComponent`. | Resuelto: retirada la rama de derrota inalcanzable y conservado un solo flujo de reintento. |
| Métodos de volumen y selección de temática sin uso en las plantillas, `isMuted` inactivo, `WordData` y `hideBanner` sin consumidores. | Resuelto: retirados los miembros sin uso y ajustada la prueba de inicio a la navegación real. |
| Metadatos de temáticas, apertura de modales e inicialización web de AdSense repetidos. | Resuelto: definiciones de temática, utilidad de modales y servicio de inicialización compartidos. Se han conservado los identificadores y marcadores publicitarios para la etapa web. |
| La página de privacidad importa los estilos completos de términos. | Resuelto: estilos legales compartidos en `src/theme/_legal-page.scss`, importados una sola vez desde `src/global.scss`. |

## Recursos y mantenimiento

| Hallazgo | Propuesta / estado |
| --- | --- |
| `src/assets/keys/key` se copiaba a la salida web; ya aparecía eliminado del árbol de trabajo al iniciar esta tarea. | Conservada la eliminación preexistente, ignorada la ruta para evitar reintroducirla y retirada la copia `docs/assets/keys/key`. La compilación actual ya no contiene el archivo. La retirada de `docs/` llegará al sitio publicado cuando se despliegue este cambio. |
| `src/manifest.webmanifest` no se enlaza ni se copia y declara MIME `image/png` para iconos WebP. | Aplazar la configuración PWA con la versión web; mantener constancia aquí. |
| `docs/` (1.445 archivos) y `dist.zip` (37,5 MB) están versionados. | `dist.zip` y los metadatos generados de `android/app/release/` se retiraron del índice de Git y se ignoran; sus copias locales siguen intactas. Se mantiene `docs/` por su posible función de publicación. |
| Recursos gráficos web sin referencias visibles en la interfaz actual. | Revisarlos antes de borrar, pues algunos pueden ser fuente de iconos y splash nativos. |

## Validación

- `npm.cmd run lint`: correcto.
- `npm.cmd run build`: correcto, con tres avisos de presupuesto SCSS existentes en nivel, selector de temáticas y volumen.
- `npm.cmd test -- --watch=false`: 38 pruebas correctas.
- `git diff --check` y `git diff --cached --check`: correctos.
- Las 16 listas de `words.json` no tenían entradas inválidas ni duplicados internos en la auditoría inicial.

## Decisiones pendientes

1. Confirmar si `docs/` es el origen del sitio publicado antes de cambiar el proceso de despliegue.
2. Abordar los identificadores web/iOS, el manifiesto web y los recursos gráficos sin uso cuando se retome la versión web.

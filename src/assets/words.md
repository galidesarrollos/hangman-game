# Banco de palabras

`words.json` contiene palabras españolas revisadas por temática. Cada temática tiene tres listas independientes: `facil`, `normal` y `avanzado`. Una palabra solo puede figurar en un nivel de la misma temática.

## Criterio de dificultad

1. **Fácil:** palabras conocidas, concretas y de hasta seis letras. La longitud es un límite estricto.
2. **Normal:** vocabulario familiar de la temática que suele tener más letras o más letras diferentes. Puede incluir términos cortos algo menos evidentes.
3. **Avanzado:** términos poco frecuentes, técnicos o abstractos; también palabras largas o con combinaciones de letras difíciles. Un término raro puede ser corto.

La clasificación es editorial: la familiaridad del término dentro de la temática prevalece sobre una puntuación automática basada solo en la longitud. Al ampliar el banco, comprueba que la palabra tenga un significado reconocible en la categoría y que sea una sola palabra escribible con las letras del teclado del juego. No incluyas nombres propios, variantes de la misma palabra ni duplicados entre niveles de una temática.

El servicio guarda localmente las palabras ya mostradas para cada combinación de temática y nivel. Solo empieza una nueva vuelta cuando agota esa lista; al reiniciarla mantiene bloqueadas las cinco últimas palabras para evitar repeticiones inmediatas. El reto diario utiliza las tres listas y conserva su elección determinista por fecha.

No se ha importado un diccionario general: las listas públicas de frecuencia consultadas no aportan una clasificación fiable en estas ocho temáticas. El banco se puede seguir ampliando con palabras revisadas, manteniendo las comprobaciones de `words.service.spec.ts`.

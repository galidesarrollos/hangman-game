import { Injectable } from '@angular/core';
import { Theme, Level } from '../models/game.model';

@Injectable({
  providedIn: 'root'
})
export class WordsService {
  private palabras: Map<string, string[]> = new Map();

  constructor() {
    this.inicializarPalabras();
  }

  private inicializarPalabras(): void {
  this.palabras.set('deportes-normal', [
    'futbol', 'baloncesto', 'tenis', 'natacion', 'ciclismo',
    'atletismo', 'voley', 'boxeo', 'rugby', 'golf',
    'surf', 'patinaje', 'beisbol', 'hockey', 'escalada',
    'yoga', 'senderismo', 'pingpong', 'karate', 'skate',
    'balón', 'raqueta', 'guante', 'casco', 'red',
    'aro', 'silbato', 'zapatillas', 'canoa', 'pista',
    'botines', 'colchoneta', 'tabla', 'pesa', 'arco',
    'pelota', 'campo', 'equipo', 'entrenador', 'jugador',
    'torneo', 'gol', 'cancha', 'maratón', 'pódium',
    'récord', 'competencia', 'victoria', 'derrota', 'campeón',
    'carrera', 'lanzamiento', 'salto', 'relevo', 'meta',
    'afición', 'tribuna', 'uniforme', 'guantes', 'cronómetro',
    'entrenamiento', 'árbitro', 'puntuación', 'marcador', 'bandera',
    'resistencia', 'fuerza', 'velocidad', 'coordinación', 'equilibrio',
    'pesas', 'bicicleta', 'balónmano', 'gimnasio', 'musculación',
    'natatorio', 'remo', 'campeonato', 'jornada', 'desempeño',
    'fairplay', 'esfuerzo', 'prueba', 'participante', 'trofeo',
    'temporada', 'club', 'liga', 'táctica', 'estrategia',
    'cinta', 'portería', 'delantero', 'defensa', 'saque'
  ]);

  this.palabras.set('deportes-avanzado', [
    'esgrima', 'halterofilia', 'piragüismo', 'waterpolo', 'balonmano',
    'pentatlón', 'triatlón', 'badminton', 'kayak', 'esquí',
    'snowboard', 'taekwondo', 'cricket', 'parapente', 'windsurf',
    'automovilismo', 'motocross', 'alpinismo', 'maratón', 'curling',
    'cronómetro', 'protector', 'paracaídas', 'arnés', 'pértiga',
    'puck', 'paleta', 'bastón', 'rodilleras', 'trineo',
    'neopreno', 'remo', 'colchón', 'uniforme', 'karategi',
    'kimono', 'patines', 'jabalina', 'tobillera', 'vóleyplaya',
    'paralelismo', 'anillas', 'disco', 'martillo', 'eslalon',
    'rafting', 'enduro', 'bádminton', 'frontón', 'pólder',
    'lucha', 'capoeira', 'boxeador', 'gimnasta', 'judoka',
    'póker', 'billar', 'tiro', 'apnea', 'ultramaratón',
    'halteras', 'bicicross', 'paratriatlón', 'crossfit', 'fitboxing',
    'paintball', 'orientación', 'patineta', 'trampolín', 'curling',
    'windsurfista', 'kitesurf', 'taichi', 'remoergómetro', 'kayakista',
    'bobsleigh', 'skeleton', 'snowkite', 'ultratrail', 'footing',
    'kickboxing', 'skatepark', 'muaythai', 'pesista', 'hípica',
    'escudería', 'ciclocrós', 'tenista', 'remero', 'competidor'
  ]);

  this.palabras.set('ciencia-normal', [
    'átomo', 'célula', 'planeta', 'energía', 'oxígeno',
    'molécula', 'gravedad', 'volcán', 'circuito', 'imán',
    'luz', 'estrella', 'roca', 'agua', 'fósil',
    'metal', 'galaxia', 'solar', 'nube', 'átomo',
    'tierra', 'mar', 'aire', 'planta', 'animal',
    'experimento', 'laboratorio', 'prueba', 'electricidad', 'temperatura',
    'microscopio', 'tubo', 'gas', 'fuerza', 'materia',
    'química', 'física', 'biología', 'ciencia', 'energía',
    'reacción', 'átomos', 'partícula', 'espacio', 'universo',
    'tierra', 'atmósfera', 'ecosistema', 'flora', 'fauna',
    'ciclo', 'agua', 'combustión', 'explosión', 'cráter',
    'clima', 'lluvia', 'viento', 'tormenta', 'relámpago',
    'nervio', 'cerebro', 'cuerpo', 'ojo', 'sangre',
    'corazón', 'hueso', 'pulmón', 'piel', 'células',
    'micrómetro', 'oxígeno', 'carbono', 'hidrógeno', 'nitrógeno',
    'ácido', 'base', 'mezcla', 'solución', 'presión',
    'densidad', 'masa', 'volumen', 'peso', 'altura',
    'experimento', 'teoría', 'descubrimiento', 'análisis', 'observación',
    'modelo', 'energía', 'movimiento', 'luz', 'ondas'
  ]);

  this.palabras.set('ciencia-avanzado', [
    'bioquímica', 'electromagnetismo', 'fotosíntesis', 'termodinámica', 'cromosoma',
    'ecosistema', 'mitocondria', 'radioactividad', 'neurología', 'astronomía',
    'genética', 'microbiología', 'nanotecnología', 'astrofísica', 'geología',
    'biotecnología', 'virología', 'ecología', 'zoología', 'química',
    'hematología', 'mecánica', 'óptica', 'astrobiología', 'paleontología',
    'hidrodinámica', 'quimioterapia', 'neurociencia', 'electrólisis', 'polimerización',
    'enzima', 'fusión', 'fisión', 'entropía', 'radiación',
    'partícula', 'fotón', 'átomo', 'cuántica', 'elemento',
    'reacción', 'ion', 'protón', 'neutrón', 'electrón',
    'bigbang', 'expansión', 'cosmos', 'universo', 'gravedad',
    'campo', 'magnetismo', 'inercia', 'refracción', 'óptica',
    'placenta', 'mutación', 'ADN', 'ARN', 'síntesis',
    'enzimática', 'nanómetro', 'nuclear', 'biofísica', 'anatomía',
    'fisiología', 'terapia', 'microorganismo', 'bacteriología', 'quark',
    'moleculardinamics', 'matriz', 'vector', 'logaritmo', 'derivada',
    'integral', 'hipótesis', 'constante', 'reacción', 'modelo',
    'vibración', 'sinapsis', 'transgénico', 'biomedicina', 'espaciotiempo'
  ]);

  this.palabras.set('infantil-normal', [
    'parque', 'amigo', 'juguete', 'pelota', 'cuento',
    'colegio', 'familia', 'mascota', 'dibujo', 'fiesta',
    'helado', 'caramelo', 'muñeca', 'camión', 'tren',
    'sueño', 'risa', 'burbuja', 'dulce', 'abrazo',
    'pintura', 'globo', 'arena', 'mar', 'flor',
    'sol', 'estrella', 'nube', 'lluvia', 'rayo',
    'auto', 'camisa', 'zapato', 'sombrero', 'pijama',
    'patín', 'balón', 'patio', 'árbol', 'columpio',
    'tobogán', 'patito', 'peluche', 'canción', 'rima',
    'gato', 'perro', 'conejo', 'pez', 'oso',
    'zorro', 'ratón', 'pájaro', 'mariposa', 'caballo',
    'león', 'jirafa', 'cebra', 'mono', 'rana',
    'caracol', 'abeja', 'hormiga', 'pato', 'pollito',
    'color', 'crayón', 'pincel', 'cuadro', 'historia',
    'palabra', 'voz', 'sueño', 'risa', 'abrazo',
    'paseo', 'rincón', 'amigo', 'cohete', 'planeta',
    'estrella', 'fantasma', 'rayo', 'ronda', 'payaso'
  ]);

  this.palabras.set('infantil-avanzado', [
    'dinosaurio', 'mariposa', 'arcoíris', 'aventura', 'astronauta',
    'castillo', 'piratas', 'princesa', 'dragón', 'tesoro',
    'superhéroe', 'cohete', 'planeta', 'magia', 'robot',
    'unicornio', 'gigante', 'fantasía', 'galaxia', 'explorador',
    'misterio', 'hechizo', 'planeta', 'viajero', 'misión',
    'travesía', 'espacial', 'luna', 'sol', 'cometa',
    'nave', 'ciudad', 'bosque', 'marino', 'océano',
    'caballero', 'bruja', 'rey', 'reina', 'hada',
    'duende', 'monstruo', 'gigante', 'gnomo', 'sirena',
    'criatura', 'caverna', 'montaña', 'isla', 'volcán',
    'trampa', 'poción', 'encantamiento', 'reloj', 'laberinto',
    'universo', 'cosmos', 'meteorito', 'espiral', 'portales',
    'rayo', 'fuerza', 'batalla', 'rescate', 'alianza',
    'villano', 'amuleto', 'poder', 'corona', 'aventurero',
    'guardían', 'relámpago', 'invento', 'plan', 'sueño'
  ]);

  // 🏠 GENERAL - NORMAL
  this.palabras.set('general-normal', [
    'casa', 'libro', 'mesa', 'puerta', 'ventana',
    'silla', 'reloj', 'plato', 'vaso', 'cama',
    'camisa', 'zapato', 'perro', 'flor', 'árbol',
    'calle', 'ciudad', 'carro', 'llave', 'radio',
    'televisor', 'computadora', 'cocina', 'baño', 'patio',
    'refrigerador', 'sofá', 'almohada', 'espejo', 'lámpara',
    'cortina', 'piso', 'techo', 'pared', 'escritorio',
    'cuadro', 'reloj', 'foto', 'puente', 'parque',
    'plaza', 'mercado', 'escuela', 'hospital', 'cine',
    'teatro', 'oficina', 'iglesia', 'tienda', 'restaurante',
    'hotel', 'estadio', 'aeropuerto', 'puerto', 'playa',
    'montaña', 'río', 'lago', 'bosque', 'campo',
    'ciudad', 'pueblo', 'barrio', 'avenida', 'carretera',
    'semaforo', 'parada', 'autobús', 'tren', 'avión',
    'bicicleta', 'motocicleta', 'camión', 'taxi', 'metro',
    'teléfono', 'correo', 'periódico', 'revista', 'noticia',
    'radio', 'televisión', 'computadora', 'internet', 'cable',
    'electricidad', 'agua', 'gas', 'foco', 'llave'
  ]);

  // 🧠 GENERAL - AVANZADO
  this.palabras.set('general-avanzado', [
    'arquitectura', 'filosofía', 'democracia', 'tecnología', 'gastronomía',
    'literatura', 'economía', 'universidad', 'biblioteca', 'hospital',
    'ingeniería', 'historia', 'matemáticas', 'pintura', 'política',
    'psicología', 'ecología', 'astronomía', 'arqueología', 'mecánica',
    'informática', 'lingüística', 'sociología', 'antropología', 'metafísica',
    'cibernética', 'biotecnología', 'robótica', 'arquivística', 'urbanismo',
    'estadística', 'geografía', 'cartografía', 'demografía', 'jurisprudencia',
    'ética', 'estética', 'filología', 'gramática', 'retórica',
    'poesía', 'música', 'escultura', 'pintor', 'artesano',
    'compositor', 'director', 'guionista', 'actor', 'fotógrafo',
    'arquitecto', 'científico', 'filósofo', 'matemático', 'economista',
    'historiador', 'investigador', 'ingeniero', 'biólogo', 'médico',
    'docente', 'artista', 'diseñador', 'programador', 'editor',
    'periodista', 'traductor', 'geólogo', 'abogado', 'psiquiatra',
    'sociólogo', 'arqueólogo', 'antropólogo', 'lingüista', 'teólogo',
    'urbanista', 'analista', 'estratega', 'consultor', 'asesor',
    'filántropo', 'científico', 'innovador', 'emprendedor', 'visionario'
  ]);
}

  obtenerPalabraAleatoria(tematica: Theme, nivel: Level): string {
    const clave = `${tematica}-${nivel}`;
    const listaPalabras = this.palabras.get(clave) || [];

    if (listaPalabras.length === 0) {
      return 'error';
    }

    const indiceAleatorio = Math.floor(Math.random() * listaPalabras.length);
    return listaPalabras[indiceAleatorio].toUpperCase();
  }
}

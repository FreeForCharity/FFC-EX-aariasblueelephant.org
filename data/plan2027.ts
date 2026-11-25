/**
 * 2027 program plan — the PUBLIC half (shown on /events/2027).
 *
 * Everything here is tentative and public (this repo is public). The board's
 * working budget — line items, owners, ask status — lives in Supabase table
 * program_plan_items (staff-only RLS) and is edited in Dashboard → 2027 Plan.
 * The page asks program_plan_summary() for live rounded totals per program;
 * `est` / `fund` below are only the fallback if that call fails, so keep
 * them roughly in step with the board's totals.
 *
 * Source: the 2027 Program Overview flyer.
 */

export type L = [string, string]; // [English, Español]

export type FundingSource =
  | 'grant' | 'sponsor' | 'in_kind' | 'giving_tuesday'
  | 'employee_giving' | 'donations' | 'own_funds';

export const FUNDING_LABEL: Record<FundingSource, { emoji: string; label: L }> = {
  grant:           { emoji: '📝', label: ['Grants', 'Subvenciones'] },
  sponsor:         { emoji: '🤝', label: ['Local sponsors', 'Patrocinadores locales'] },
  in_kind:         { emoji: '📦', label: ['In-kind donations', 'Donaciones en especie'] },
  giving_tuesday:  { emoji: '💙', label: ['GivingTuesday', 'GivingTuesday'] },
  employee_giving: { emoji: '🏢', label: ['Employee giving & matching', 'Donaciones de empleados y aportes de empresas'] },
  donations:       { emoji: '🪙', label: ['Community donations', 'Donaciones de la comunidad'] },
  own_funds:       { emoji: '🐘', label: ['Our own savings', 'Nuestros propios ahorros'] },
};

export type GroupKey = 'sports' | 'outdoors' | 'schools' | 'community' | 'operations';

export const GROUPS: { key: GroupKey; emoji: string; title: L; blurb: L; tint: string }[] = [
  { key: 'sports', emoji: '🏅', title: ['Special Olympics Junior Athlete Division', 'División de Atletas Juveniles de Olimpiadas Especiales'],
    blurb: ['Our 2027 pilot with Special Olympics Northern California: athletes under 20, practices every Wednesday and Saturday.',
            'Nuestro piloto 2027 con Olimpiadas Especiales del Norte de California: atletas menores de 20 años, prácticas todos los miércoles y sábados.'],
    tint: 'from-sky-100 to-indigo-50 dark:from-sky-900/30 dark:to-indigo-900/20' },
  { key: 'outdoors', emoji: '🌲', title: ['Outdoor Family Experiences', 'Experiencias familiares al aire libre'],
    blurb: ['Getting whole families outside together, at a pace that works for every child.',
            'Familias enteras al aire libre, a un ritmo que funcione para cada niño.'],
    tint: 'from-emerald-100 to-lime-50 dark:from-emerald-900/30 dark:to-lime-900/20' },
  { key: 'schools', emoji: '🏫', title: ['Schools & Family Support', 'Escuelas y apoyo familiar'],
    blurb: ['Inclusion in the classroom and support for the grown-ups at home.',
            'Inclusión en el salón de clases y apoyo para los adultos en casa.'],
    tint: 'from-violet-100 to-pink-50 dark:from-violet-900/30 dark:to-pink-900/20' },
  { key: 'community', emoji: '🎉', title: ['Community Events All Year', 'Eventos comunitarios todo el año'],
    blurb: ['Sensory-friendly celebrations where nobody has to explain their child.',
            'Celebraciones sensorialmente amigables donde nadie tiene que explicar a su hijo.'],
    tint: 'from-amber-100 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/20' },
  { key: 'operations', emoji: '🧰', title: ['Behind Every Event', 'Detrás de cada evento'],
    blurb: ['The quiet costs that keep every program safe, insured and bilingual.',
            'Los costos invisibles que mantienen cada programa seguro, asegurado y bilingüe.'],
    tint: 'from-slate-100 to-sky-50 dark:from-slate-800/60 dark:to-sky-900/20' },
];

export interface PlanProgram {
  key: string;
  group: GroupKey;
  emoji: string;
  title: L;
  when: L;
  /** months (1–12) it appears on the year-at-a-glance strip; empty = date TBD */
  months: number[];
  blurb: L;
  needs: L[];
  /** fallback only — live figure comes from program_plan_summary() */
  est: number;
  fund: FundingSource[];
  /** sub-seasons, for the Special Olympics card */
  seasons?: { emoji: string; name: L; when: L; months: number[] }[];
}

export const PLAN_YEAR = 2027;

export const PROGRAMS: PlanProgram[] = [
  {
    key: 'special-olympics', group: 'sports', emoji: '🏅',
    title: ['Junior Athlete Division', 'División de Atletas Juveniles'],
    when: ['January – December', 'Enero – diciembre'],
    months: [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12],
    blurb: ['Four sport seasons, one team. Every athlete plays, every practice is free.',
            'Cuatro temporadas, un solo equipo. Cada atleta juega y cada práctica es gratis.'],
    seasons: [
      { emoji: '🏀', name: ['Basketball (indoor)', 'Básquetbol (bajo techo)'], when: ['Jan – Mar', 'Ene – mar'], months: [1, 2, 3] },
      { emoji: '🏃', name: ['Track & Field', 'Atletismo'], when: ['Mar – Jun', 'Mar – jun'], months: [3, 4, 5, 6] },
      { emoji: '🥎', name: ['Softball', 'Sóftbol'], when: ['Aug – Oct', 'Ago – oct'], months: [8, 9, 10] },
      { emoji: '⚽', name: ['Soccer', 'Fútbol'], when: ['Oct – Dec', 'Oct – dic'], months: [10, 11, 12] },
    ],
    needs: [
      ['Uniforms for every athlete', 'Uniformes para cada atleta'],
      ['Balls, cones and sport gear', 'Balones, conos y equipo deportivo'],
      ['An indoor gym for basketball season', 'Un gimnasio techado para la temporada de básquetbol'],
      ['Certified, background-checked volunteer coaches', 'Entrenadores voluntarios certificados y con verificación de antecedentes'],
      ['Water, snacks and first aid', 'Agua, refrigerios y primeros auxilios'],
    ],
    est: 6600, fund: ['grant', 'sponsor', 'in_kind', 'donations'],
  },
  {
    key: 'hiking', group: 'outdoors', emoji: '🥾',
    title: ['Family Hiking Trips', 'Caminatas en familia'],
    when: ['At least 4 weekends, May – August', 'Al menos 4 fines de semana, mayo – agosto'],
    months: [5, 6, 7, 8],
    blurb: ['Short, accessible trails with a visual map, quiet breaks and no rush.',
            'Senderos cortos y accesibles, con mapa visual, pausas tranquilas y sin prisa.'],
    needs: [
      ['Park entry and parking', 'Entrada y estacionamiento del parque'],
      ['Water and trail snacks', 'Agua y refrigerios para el camino'],
      ['First-aid kits and sensory bags', 'Botiquines y bolsas sensoriales'],
      ['Trail leaders who know the route', 'Guías que conozcan la ruta'],
    ],
    est: 700, fund: ['donations', 'in_kind', 'grant'],
  },
  {
    key: 'beach', group: 'outdoors', emoji: '🏖️',
    title: ['Beach Days', 'Días de playa'],
    when: ['At least twice each summer', 'Al menos dos veces cada verano'],
    months: [6, 7, 8],
    blurb: ['Sand, waves and a shaded quiet tent for when it all gets to be too much.',
            'Arena, olas y una carpa tranquila con sombra para cuando todo sea demasiado.'],
    needs: [
      ['Shade canopies and a quiet sensory tent', 'Toldos y una carpa sensorial tranquila'],
      ['Sunscreen, water and snacks', 'Protector solar, agua y refrigerios'],
      ['Parking and carpool drivers', 'Estacionamiento y conductores para compartir auto'],
    ],
    est: 800, fund: ['sponsor', 'in_kind', 'donations'],
  },
  {
    key: 'camping', group: 'outdoors', emoji: '⛺',
    title: ['Family Camping Trip', 'Campamento familiar'],
    when: ['Once a year, summer', 'Una vez al año, en verano'],
    months: [7],
    blurb: ['A first night under the stars, with families who already understand.',
            'Una primera noche bajo las estrellas, con familias que ya entienden.'],
    needs: [
      ['A group campsite for two nights', 'Un campamento grupal por dos noches'],
      ['Shared meals', 'Comidas compartidas'],
      ['Loaner tents and sleeping bags', 'Tiendas y sacos de dormir prestados'],
      ['S’mores, obviously', 'Malvaviscos asados, por supuesto'],
    ],
    est: 2100, fund: ['grant', 'sponsor', 'in_kind', 'donations'],
  },
  {
    key: 'picnic', group: 'outdoors', emoji: '🧺',
    title: ['Annual Family Picnic', 'Picnic familiar anual'],
    when: ['Once a year, date to be announced', 'Una vez al año, fecha por anunciar'],
    months: [],
    blurb: ['Our whole herd in one park: food, games and a sensory corner.',
            'Toda nuestra manada en un parque: comida, juegos y un rincón sensorial.'],
    needs: [
      ['A park pavilion', 'Un pabellón en el parque'],
      ['Food and drinks for about 150 people', 'Comida y bebidas para unas 150 personas'],
      ['Games and a sensory station', 'Juegos y una estación sensorial'],
    ],
    est: 2300, fund: ['sponsor', 'in_kind', 'donations', 'own_funds'],
  },
  {
    key: 'circle-of-friends', group: 'schools', emoji: '🤝',
    title: ['Circle of Friends', 'Círculo de Amigos'],
    when: ['School year · Lammersville Unified, expanding to Tracy Unified', 'Año escolar · Lammersville Unified, ampliándose a Tracy Unified'],
    months: [],
    blurb: ['Classmates trained to be real friends, not just helpers. Recognized by the Mountain House City Council.',
            'Compañeros capacitados para ser amigos de verdad, no solo ayudantes. Reconocido por el Concejo Municipal de Mountain House.'],
    needs: [
      ['Facilitator training materials', 'Materiales de capacitación para facilitadores'],
      ['Classroom activity kits', 'Kits de actividades para el salón'],
      ['A buddy celebration and awards', 'Una celebración de compañeros y premios'],
    ],
    est: 2200, fund: ['grant', 'sponsor', 'employee_giving'],
  },
  {
    key: 'parent-seminars', group: 'schools', emoji: '🎤',
    title: ['Parent Seminars', 'Seminarios para padres'],
    when: ['About four through the year', 'Unos cuatro durante el año'],
    months: [],
    blurb: ['IEPs, therapies, insurance, burnout: the things nobody hands you a manual for.',
            'IEP, terapias, seguros, agotamiento: las cosas para las que nadie te da un manual.'],
    needs: [
      ['Expert speakers', 'Expertos invitados'],
      ['Childcare so both parents can come', 'Cuidado de niños para que ambos padres puedan asistir'],
      ['Spanish interpretation', 'Interpretación al español'],
      ['Refreshments', 'Refrigerios'],
    ],
    est: 2000, fund: ['grant', 'donations', 'in_kind'],
  },
  {
    key: 'sensory-art', group: 'schools', emoji: '🎨',
    title: ['Sensory-Friendly Art Workshops', 'Talleres de arte sensorialmente amigables'],
    when: ['Through the year', 'Durante el año'],
    months: [],
    blurb: ['Messy, calm, no wrong answers.', 'Con desorden, con calma y sin respuestas incorrectas.'],
    needs: [
      ['Art supplies', 'Materiales de arte'],
      ['Noise-reducing headphones and fidgets', 'Audífonos que reducen el ruido y juguetes sensoriales'],
    ],
    est: 800, fund: ['in_kind', 'grant'],
  },
  {
    key: 'hero-kits', group: 'schools', emoji: '🧸',
    title: ['HERO Project Sensory Kits', 'Kits sensoriales del Proyecto HERO'],
    when: ['Year-round', 'Todo el año'],
    months: [],
    blurb: ['A bag of calm for 100 children: fidgets, headphones, a visual schedule.',
            'Una bolsa de calma para 100 niños: juguetes sensoriales, audífonos y un horario visual.'],
    needs: [
      ['Kit contents for 100 children', 'Contenido de kits para 100 niños'],
      ['Packaging and printed visual schedules', 'Empaques y horarios visuales impresos'],
      ['Volunteers for a packing day', 'Voluntarios para un día de armado'],
    ],
    est: 3800, fund: ['grant', 'employee_giving'],
  },
  {
    key: 'speaker-series', group: 'community', emoji: '🗣️',
    title: ['Autism Acceptance Month Speaker Series', 'Charlas del Mes de la Aceptación del Autismo'],
    when: ['April', 'Abril'], months: [4],
    blurb: ['Autistic voices and experts, open to everyone.', 'Voces autistas y expertos, abiertas a todos.'],
    needs: [
      ['A venue with A/V', 'Un lugar con audio y video'],
      ['Speaker thank-you gifts', 'Obsequios de agradecimiento para los ponentes'],
      ['Refreshments', 'Refrigerios'],
    ],
    est: 800, fund: ['in_kind', 'donations'],
  },
  {
    key: 'egg-hunt', group: 'community', emoji: '🐣',
    title: ['Sensory-Friendly Easter Egg Hunt', 'Búsqueda de huevos de Pascua sensorialmente amigable'],
    when: ['Spring', 'Primavera'], months: [3],
    blurb: ['No stampede: staggered start times and a quiet zone.', 'Sin estampidas: horarios escalonados y una zona tranquila.'],
    needs: [
      ['Eggs and allergy-safe fillers', 'Huevos y sorpresas sin alérgenos'],
      ['A park permit', 'Un permiso del parque'],
      ['Quiet-zone supplies', 'Materiales para la zona tranquila'],
    ],
    est: 550, fund: ['in_kind', 'donations', 'grant'],
  },
  {
    key: 'bike-rodeo', group: 'community', emoji: '🚲',
    title: ['Bike Rodeo', 'Rodeo de bicicletas'],
    when: ['May', 'Mayo'], months: [5],
    blurb: ['Bike safety, at every child’s pace, and a free helmet to take home.',
            'Seguridad en bicicleta, al ritmo de cada niño, y un casco gratis para llevar a casa.'],
    needs: [
      ['Helmets for about 50 kids', 'Cascos para unos 50 niños'],
      ['Cones, chalk and signs', 'Conos, gis y letreros'],
      ['Snacks and small prizes', 'Refrigerios y pequeños premios'],
    ],
    est: 1150, fund: ['sponsor', 'in_kind', 'donations'],
  },
  {
    key: 'kite-festival', group: 'community', emoji: '🪁',
    title: ['Kite Festival', 'Festival de papalotes'],
    when: ['August', 'Agosto'], months: [8],
    blurb: ['Eighty kites in the sky, one for every child.', 'Ochenta papalotes en el cielo, uno para cada niño.'],
    needs: [
      ['Kites for about 80 kids', 'Papalotes para unos 80 niños'],
      ['A park permit', 'Un permiso del parque'],
      ['Snacks and water', 'Refrigerios y agua'],
    ],
    est: 950, fund: ['sponsor', 'in_kind', 'donations'],
  },
  {
    key: 'halloween', group: 'community', emoji: '🎃',
    title: ['Halloween Celebration', 'Celebración de Halloween'],
    when: ['October', 'Octubre'], months: [10],
    blurb: ['A sensory-friendly trunk-or-treat: no scary surprises, costumes optional.',
            'Un “trunk-or-treat” sensorialmente amigable: sin sustos y con disfraz opcional.'],
    needs: [
      ['Candy and non-food treats', 'Dulces y sorpresas que no son comida'],
      ['Gentle decorations', 'Decoraciones tranquilas'],
      ['A venue', 'Un lugar'],
    ],
    est: 900, fund: ['in_kind', 'donations'],
  },
  {
    key: 'christmas', group: 'community', emoji: '🎄',
    title: ['Christmas Celebration', 'Celebración de Navidad'],
    when: ['December', 'Diciembre'], months: [12],
    blurb: ['A gift for every child and a Santa who knows to wait.',
            'Un regalo para cada niño y un Santa que sabe esperar.'],
    needs: [
      ['A venue', 'Un lugar'],
      ['Gifts for about 80 children', 'Regalos para unos 80 niños'],
      ['Food', 'Comida'],
      ['A sensory-friendly Santa setup', 'Un espacio con Santa sensorialmente amigable'],
    ],
    est: 2300, fund: ['sponsor', 'giving_tuesday', 'donations'],
  },
  {
    key: 'library-art', group: 'community', emoji: '✂️',
    title: ['Art & Craft at the Library', 'Arte y manualidades en la biblioteca'],
    when: ['Every other month', 'Cada dos meses'], months: [1, 3, 5, 7, 9, 11],
    blurb: ['A free, low-key hour of making things together.', 'Una hora gratis y tranquila para crear juntos.'],
    needs: [['Craft supplies for six sessions', 'Materiales de manualidades para seis sesiones']],
    est: 600, fund: ['in_kind'],
  },
  {
    key: 'operations', group: 'operations', emoji: '🧰',
    title: ['Safety, Insurance & Outreach', 'Seguridad, seguros y difusión'],
    when: ['All year', 'Todo el año'], months: [],
    blurb: ['Every event above rests on these.', 'Cada evento de arriba depende de esto.'],
    needs: [
      ['Liability insurance for every event', 'Seguro de responsabilidad para cada evento'],
      ['Background checks for every volunteer', 'Verificación de antecedentes para cada voluntario'],
      ['First-aid and CPR training', 'Capacitación en primeros auxilios y RCP'],
      ['Bilingual flyers and printing', 'Volantes bilingües e impresión'],
    ],
    est: 3300, fund: ['grant', 'employee_giving'],
  },
];

export const MONTHS: L[] = [
  ['Jan', 'Ene'], ['Feb', 'Feb'], ['Mar', 'Mar'], ['Apr', 'Abr'], ['May', 'May'], ['Jun', 'Jun'],
  ['Jul', 'Jul'], ['Aug', 'Ago'], ['Sep', 'Sep'], ['Oct', 'Oct'], ['Nov', 'Nov'], ['Dec', 'Dic'],
];

/* SPANISH CURRICULUM — PENDING CLINICAL REVIEW (RBT). English is canonical; flag any drift.
   =====================================================================
   Aaria's Helping Hands — curriculum content (Spanish)
   ---------------------------------------------------------------------
   Mirrors js/content.js (window.HH) structure-for-structure so main.js /
   world.js can select "(ABELang.es && HH_ES.X) || HH.X" at each read site.
   Non-text fields (id, tier, place, room, emoji, tellTo, keepTelling,
   reviewPending, roomId, objIndex, safe) are copied unchanged from
   content.js so whole-object substitution keeps working.
   Same language rules as content.js: short literal sentences, present
   tense, the child is never blamed, telling is always praised, abuse is
   never depicted, distractors are phrased as QUESTIONS (not statements).
   Grown-Ups Corner (adult-facing review sheets) is NOT mirrored here —
   it stays English for the clinical reviewer; see main.js HH.GROWNUPS.
   ===================================================================== */
window.HH_ES = window.HH_ES || {};

/* ---------------- helper people (friend cards) ---------------- */
HH_ES.HELPERS = {
  mom:       { emoji: "👩", name: "Mamá",             where: "home",   line: "Soy tu mamá. Puedes contarme cualquier cosa. Siempre te voy a escuchar." },
  dad:       { emoji: "👨", name: "Papá",             where: "home",   line: "Soy tu papá. Si algo se siente mal, ven a mí." },
  grandma:   { emoji: "👵", name: "Abuela",           where: "home",   line: "Soy la abuela. Te quiero. Siempre puedes hablar conmigo." },
  teacher:   { emoji: "👩‍🏫", name: "Maestra",         where: "school", line: "Soy tu maestra. Mi trabajo es ayudarte a aprender Y a estar a salvo." },
  principal: { emoji: "🧑‍💼", name: "Director/a",     where: "school", line: "Soy el director o la directora. Trabajo en la oficina de la escuela. ¡Los problemas grandes vienen a mí!" },
  nurse:     { emoji: "🧑‍⚕️", name: "Enfermera",      where: "school", line: "Soy la enfermera de la escuela. Si estás lastimado o asustado, mi puerta está abierta." },
  counselor: { emoji: "🧑‍🦱", name: "Consejero/a",    where: "school", line: "Soy el consejero de la escuela. Hablar de los sentimientos es mi trabajo favorito." },
  librarian: { emoji: "👩‍🦳", name: "Bibliotecaria",  where: "library", line: "Soy la bibliotecaria. Te ayudo a encontrar libros y a registrarlos." },
  doctor:    { emoji: "👨‍⚕️", name: "Doctor/a",       where: "clinic", line: "Soy un doctor. Ayudo a que tu cuerpo se sienta mejor. Puedes contarme si algo te duele." },
  firefighter:{ emoji: "👩‍🚒", name: "Bombero/a",      where: "firestation", line: "Soy bombera. Si hay peligro, ¡venimos rápido a ayudar!" },
  officer:   { emoji: "👮", name: "Oficial de Policía", where: "police", line: "Soy un oficial de policía. Ayudar a la gente a estar segura es todo mi trabajo." },
};

/* ---------------- places & rooms (Discovery mode) ---------------- */
HH_ES.PLACES = {
  house: {
    name: "Mi Casa", emoji: "🏠",
    rooms: [
      { id: "bedroom",  name: "Dormitorio",     emoji: "🛏️", action: "Dormimos en el dormitorio.",
        objects: [["🛏️","cama — aquí dormimos","🧒🛏️💤","Nos acostamos en la cama y dormimos. ¡Buenas noches!"],["🧸","osito — un amigo acogedor","🧒🤗🧸","Abrazamos al osito. ¡Qué acogedor!"],["🌙","lámpara — luz suave para la noche","🧒💡🌙","Encendemos la lámpara para tener luz suave en la noche."]],
        quiz: { q: "¿Qué hacemos en el dormitorio?", a: ["Dormir 😴", "Cocinar comida 🍳", "Lavar el carro 🚗"] } },
      { id: "bathroom", name: "Baño",    emoji: "🛁", action: "Nos lavamos las manos y nos cepillamos los dientes en el baño.",
        objects: [["🚽","inodoro","🧒🚽🧻","Usamos el inodoro, luego tiramos de la cadena y nos lavamos las manos."],["🪥","cepillo de dientes — cepíllate en la mañana y en la noche","🧒🪥✨","Nos cepillamos los dientes en la mañana y en la noche."],["🧼","jabón — lávate las manos","🧼🙌💧","Ponemos jabón en las manos y las lavamos con agua."]],
        quiz: { q: "¿Qué hacemos en el baño?", a: ["Cepillarnos los dientes 🪥", "Andar en bicicleta 🚲", "Tomar una siesta 😴"] } },
      { id: "kitchen",  name: "Cocina",     emoji: "🍳", action: "Los adultos cocinan la comida en la cocina.",
        objects: [["🍳","estufa — ¡caliente! solo los adultos","🧑‍🍳🍳🔥","Un adulto cocina en la estufa. ¡Caliente — solo los adultos!"],["🧊","refrigerador — mantiene la comida fría","🧒🧊🥛","El refrigerador mantiene fría la comida, como la leche y la fruta."],["🥣","tazón — para mezclar","🧑‍🍳🥣🥄","Mezclamos cosas ricas en el tazón."]],
        quiz: { q: "¿Qué pasa en la cocina?", a: ["Cocinar comida 🍳", "Dormir 😴", "Jugar fútbol ⚽"] } },
      { id: "dining",   name: "Comedor", emoji: "🍽️", action: "Comemos juntos en el comedor.",
        objects: [["🍽️","mesa — nos sentamos y comemos","👨‍👩‍👧🍽️😋","La familia come junta en la mesa."],["🪑","silla","🧒🪑🍽️","Nos sentamos en la silla para comer."],["🥛","leche — rica","🧒🥛💪","Tomamos leche para crecer fuertes."]],
        quiz: { q: "¿Qué hacemos en el comedor?", a: ["Comer 🍽️", "Bañarnos 🛁", "Manejar un carro 🚗"] } },
      { id: "living",   name: "Sala", emoji: "🛋️", action: "Jugamos y descansamos juntos en la sala.",
        objects: [["🛋️","sofá — siéntate y relájate","👨‍👩‍👧🛋️📖","Nos sentamos en el sofá y leemos juntos."],["📚","libros — hora del cuento","🧒📚😊","Leemos cuentos. ¡Cuántas aventuras!"],["🧩","rompecabezas — juega en equipo","🧒🧩🎉","Armamos el rompecabezas pieza por pieza. ¡Lo lograste!"]],
        quiz: { q: "¿Qué hacemos en la sala?", a: ["Jugar y descansar 🧩", "Cepillarnos los dientes 🪥", "Ver al doctor 🩺"] } },
    ],
  },
  school: {
    name: "Mi Escuela", emoji: "🏫",
    rooms: [
      { id: "classroom", name: "Salón de clases",   emoji: "📚", action: "Aprendemos en el salón de clases. Aquí enseña la maestra.",
        objects: [["🖍️","crayones — para dibujar","🧒🖍️🌈","Dibujamos imágenes de colores con los crayones."],["📚","libros — para aprender","👩‍🏫📚🧒","La maestra lee libros con nosotros para aprender."],["🪑","tu escritorio","🧒🪑✏️","Nos sentamos en nuestro escritorio para aprender y escribir."]],
        quiz: { q: "¿Qué hacemos en el salón de clases?", a: ["Aprender 📚", "Dormir 😴", "Cocinar 🍳"] } },
      { id: "cafeteria", name: "Cafetería",   emoji: "🍎", action: "Almorzamos en la cafetería.",
        objects: [["🍎","manzana — una merienda saludable","🧒🍎😋","Comemos una manzana crujiente. ¡Rico!"],["🥪","bandeja del almuerzo","🧒🥪🍽️","Llevamos nuestro almuerzo en la bandeja hasta la mesa."],["🪑","mesas largas — siéntate con amigos","🧒🧒🪑","Nos sentamos con amigos en las mesas largas."]],
        quiz: { q: "¿Qué hacemos en la cafetería?", a: ["Almorzar 🍎", "Ir al dentista 🦷", "Dormir 😴"] } },
      { id: "playground", name: "Patio de recreo", emoji: "🛝", action: "Jugamos afuera en el recreo, en el patio.",
        objects: [["🛝","resbaladilla — ¡wiii!","🧒🛝😄","Subimos y nos deslizamos. ¡Wiii!"],["🏀","pelota — toma turnos","🧒🏀🧒","Nos turnamos para lanzar la pelota con los amigos."],["🌳","árbol — buena sombra","🌳🐦☀️","El árbol nos da sombra fresca. ¡Ahí viven los pájaros!"]],
        quiz: { q: "¿Qué hacemos en el patio de recreo?", a: ["Jugar 🛝", "Hacer la tarea ✏️", "Bañarnos 🛁"] } },
      { id: "office",    name: "Oficina de la escuela", emoji: "🏢", action: "La oficina es donde trabaja el director o la directora. Puedes venir aquí para pedir ayuda cuando quieras.",
        objects: [["🖥️","el mostrador principal — di tu nombre aquí","🧒🖥️🙋","Decimos nuestro nombre en el mostrador para recibir ayuda."],["📞","teléfono — la oficina puede llamar a tu familia","🧑‍💼📞👨‍👩‍👧","La oficina puede llamar a tu familia por teléfono."],["🚪","la puerta del director — toca, ¡está bien!","🧒🚪🧑‍💼","Tocamos la puerta del director. ¡Adelante!"]],
        quiz: { q: "¿Quién trabaja en la oficina de la escuela?", a: ["El director o la directora 🧑‍💼", "Un bombero 👩‍🚒", "Un perro 🐶"] } },
      { id: "nurseroom", name: "Enfermería", emoji: "🩹", action: "La enfermería es donde la enfermera te ayuda a sentirte mejor.",
        objects: [["🩹","curitas","🧑‍⚕️🩹🧒","La enfermera pone una curita en un raspón."],["🛏️","cama para descansar — acuéstate si te sientes mal","🧒🛏️😌","Descansamos en la cama cuando nos sentimos mal."],["🌡️","termómetro — revisa si tienes fiebre","🧑‍⚕️🌡️🧒","La enfermera revisa si tienes mucha temperatura con el termómetro."]],
        quiz: { q: "¿Cuándo vamos a la enfermería?", a: ["Cuando estamos lastimados o enfermos 🩹", "Cuando queremos dulces 🍬", "Cuando es hora de cantar 🎵"] } },
    ],
  },
  library: {
    name: "Biblioteca", emoji: "📖",
    rooms: [
      { id: "readingroom", name: "Sala de Lectura", emoji: "📚", action: "¡La biblioteca está llena de libros! Aquí leemos en silencio y usamos voz baja.",
        objects: [["📚","libros — tantas historias para leer","🧒📚🤫","Elegimos un libro y leemos en silencio."],["🪑","silla cómoda — siéntate y lee","🧒🪑📖","Nos sentamos en la silla cómoda para leer."],["🌍","globo terráqueo — mira el mundo entero","🧒🌍👀","Giramos el globo terráqueo y vemos el mundo entero."]],
        quiz: { q: "¿Cómo hablamos en la biblioteca?", a: ["Con voz baja 🤫", "Gritando fuerte 📢", "Cantando canciones 🎤"] } },
      { id: "checkout", name: "Mostrador de Préstamos", emoji: "💳", action: "Para llevarte un libro a casa, tráelo a la bibliotecaria en el mostrador de préstamos. ¡Beep! Ahora es tuyo para llevarlo prestado.",
        objects: [["📖","un libro para llevar prestado — tráelo al mostrador","🧒📖👩‍🦳","Llevamos el libro a la bibliotecaria para que nos lo preste."],["💳","tarjeta de la biblioteca — muestra que el libro es tuyo","🧒💳📖","Mostramos nuestra tarjeta de la biblioteca. ¡Ahora el libro es nuestro para llevarlo prestado!"],["🖨️","escáner — ¡beep! todo listo","👩‍🦳🖨️✅","La bibliotecaria escanea el libro. ¡Beep! Todo listo."]],
        quiz: { q: "¿Cómo llevamos un libro a casa?", a: ["Registrarlo en el mostrador 💳", "Esconderlo en la mochila 🙈", "Simplemente irnos corriendo con él 🏃"] } },
    ],
  },
  clinic: {
    name: "Consultorio del Doctor", emoji: "🩺",
    rooms: [
      { id: "waiting", name: "Sala de Espera", emoji: "🪑", action: "Nos sentamos en la sala de espera hasta que sea nuestro turno de ver al doctor.",
        objects: [["🪑","sillas de espera — siéntate hasta que digan tu nombre","🧒🪑⏰","Nos sentamos y esperamos nuestro turno."],["📚","libros ilustrados — lee mientras esperas","🧒📚😌","Leemos libros ilustrados mientras esperamos."],["🧸","caja de juguetes — juega tranquilo mientras esperas","🧒🧸🤫","Jugamos tranquilos con los juguetes mientras esperamos."]],
        quiz: { q: "¿Qué hacemos en la sala de espera?", a: ["Esperar nuestro turno 🪑", "Ver el camión de bomberos 🚒", "Bañarnos 🛁"] } },
      { id: "examroom", name: "Consultorio", emoji: "🩺", action: "El doctor revisa tu cuerpo para mantenerte sano. Puedes decirle al doctor si algo te duele.",
        objects: [["🩺","estetoscopio — escucha tu corazón, tum-tum","🧑‍⚕️🩺🧒","El doctor escucha tu corazón con el estetoscopio. ¡Tum-tum!"],["⚖️","báscula — revisa cuánto has crecido","🧒⚖️📏","Nos paramos en la báscula para ver cuánto crecimos."],["🛏️","camilla — siéntate aquí para tu chequeo","🧒🛏️🧑‍⚕️","Nos sentamos en la camilla para nuestro chequeo."]],
        quiz: { q: "¿Qué hace el doctor?", a: ["Ayuda a que tu cuerpo esté sano 🩺", "Enseña matemáticas 📐", "Maneja un autobús 🚌"] } },
    ],
  },
  firestation: {
    name: "Estación de Bomberos", emoji: "🚒",
    rooms: [
      { id: "garage", name: "Garaje de Camiones", emoji: "🚒", action: "El gran camión de bomberos rojo vive en el garaje, ¡listo para salir volando y ayudar!",
        objects: [["🚒","camión de bomberos — sale volando a ayudar a la gente","👩‍🚒🚒🔥","Los bomberos manejan el camión rápido para ayudar a la gente."],["🧯","extintor — apaga fuegos pequeños","👩‍🚒🧯🔥","Un bombero rocía el extintor para apagar fuegos pequeños."],["🔔","campana de alarma — ¡RING! hora de ir a ayudar","🔔👩‍🚒🏃","¡RING! Cuando suena la campana, los bomberos corren a ayudar."]],
        quiz: { q: "¿Qué hace el camión de bomberos?", a: ["Sale volando a ayudar a la gente 🚒", "Reparte pizza 🍕", "Duerme todo el día 😴"] } },
      { id: "gearroom", name: "Sala de Equipo", emoji: "⛑️", action: "Los bomberos guardan sus cascos, chaquetas y botas listos para ponerse súper rápido.",
        objects: [["⛑️","casco — protege la cabeza del bombero","👩‍🚒⛑️🛡️","El bombero usa el casco para estar seguro."],["🧥","chaqueta de bombero — fuerte y resistente al calor","👩‍🚒🧥🔥","La chaqueta grande mantiene alejado el calor del fuego."],["🥾","botas — ¡ponte las botas y vamos!","👩‍🚒🥾💨","¡Ponte las botas y VAMOS!"]],
        quiz: { q: "¿Por qué los bomberos usan cascos?", a: ["Para proteger su cabeza ⛑️", "Porque son bonitos 🎀", "Para escuchar música 🎧"] } },
    ],
  },
  police: {
    name: "Estación de Policía", emoji: "🚓",
    rooms: [
      { id: "frontdesk", name: "Recepción", emoji: "🛡️", action: "El oficial de policía ayuda a la gente en la recepción. Los oficiales de policía son ayudantes seguros a quienes siempre puedes pedir ayuda.",
        objects: [["🛡️","placa — significa 'estoy aquí para ayudarte'","👮🛡️😊","La placa significa: estoy aquí para ayudarte."],["📻","radio — los oficiales se hablan entre ellos para ayudar rápido","👮📻👮","Los oficiales hablan por radio para traer ayuda rápido."],["📞","teléfono — la gente llama cuando necesita ayuda","🧑📞👮","La gente llama al teléfono de la policía cuando necesita ayuda."]],
        quiz: { q: "¿Qué hacen los oficiales de policía?", a: ["Ayudan a que la gente esté segura 🛡️", "Hacen galletas 🍪", "Vuelan aviones ✈️"] } },
      { id: "safecorner", name: "Rincón Seguro", emoji: "🗺️", action: "Si alguna vez te pierdes, busca a un oficial de policía. Esperas en el rincón seguro mientras ellos encuentran a tu familia.",
        objects: [["🗺️","mapa de la ciudad — ayuda a encontrar el camino a casa","👮🗺️🏠","El oficial mira el mapa para encontrar tu casa."],["🧸","osito de espera — un amigo acogedor mientras esperas","🧒🧸😌","Abrazas al osito de espera hasta que llega tu familia."],["🥤","vaso de agua — los ayudantes se aseguran de que estés bien","🧒🥤💧","Los ayudantes te dan agua. Estás bien."]],
        quiz: { q: "¿Qué haces si te pierdes?", a: ["Buscar a un oficial de policía 👮", "Esconderte donde nadie te vea 🙈", "Irte con un desconocido 🚶"] } },
    ],
  },
};

/* ---------------- Mode 2: My Helping Hand lessons ---------------- */
HH_ES.HAND_INTRO = [
  "Todos necesitamos ayudantes. Los ayudantes nos mantienen a salvo.",
  "¡Elige 5 ayudantes — uno para cada dedo de tu mano!",
  "Elige ayudantes de lugares DIFERENTES. Algunos en casa, otros en la escuela.",
  "Si un ayudante no puede ayudarte, vas al SIGUIENTE dedo. ¡Sigue contando!",
];

HH_ES.FEELINGS = {
  intro: "¡Tu cuerpo te habla! Cuando algo está mal, tu cuerpo te da la sensación de alerta.",
  signs: [
    { emoji: "💓", text: "Tu corazón late rápido" },
    { emoji: "😖", text: "Te duele la pancita" },
    { emoji: "🤲", text: "Sientes las manos temblorosas" },
    { emoji: "😢", text: "Quieres llorar" },
    { emoji: "🙈", text: "Quieres esconderte" },
  ],
  lesson: "La sensación de alerta es un mensaje: VE Y CUÉNTALE A UN AYUDANTE. No estás en problemas por sentirla. Tus sentimientos nunca están equivocados.",
  quiz: { q: "Sientes la sensación de alerta. ¿Qué haces?",
          a: ["Contarle a un ayudante de mi mano 🖐️", "Guardármelo todo para siempre 🤐", "Nada — los sentimientos no importan 🚫"] },
};

HH_ES.SECRETS = {
  intro: "Algunos secretos son sorpresas FELICES. Algunos secretos se sienten MAL. ¡Aprendamos la diferencia!",
  rule: "Una sorpresa feliz se contará pronto y hace sonreír a la gente. Un secreto malo hace que tu pancita sienta la alerta — y alguien dice 'nunca lo cuentes'. Los secretos malos son para CONTÁRSELOS a un ayudante.",
  items: [
    { text: "¡Le compramos un regalo sorpresa a mamá! Guárdalo en secreto hasta su cumpleaños el domingo.", emoji: "🎁", safe: true,
      why: "Esta es una sorpresa feliz. ¡Todos sonreirán el domingo!" },
    { text: "No le digas a nadie que te empujé, o te vas a meter en un gran problema.", emoji: "😠", safe: false,
      why: "Alguien dijo 'nunca lo cuentes' sobre algo que te lastimó. Cuéntaselo a un ayudante. NO te meterás en problemas." },
    { text: "¡Shh! ¡Estamos planeando una fiesta sorpresa para la abuela!", emoji: "🎉", safe: true,
      why: "Una fiesta sorpresa es un secreto feliz. ¡La abuela se va a reír y aplaudir!" },
    { text: "Este es nuestro juego secreto. Nunca jamás se lo digas a tu mamá.", emoji: "🤫", safe: false,
      why: "Un juego que debes esconder de mamá NO es un juego de verdad. Cuéntaselo a un ayudante enseguida." },
  ],
};

/* ---------------- Mode 3: scenarios (mirrors HH.SCENARIOS, same order/ids) ---------------- */
HH_ES.SCENARIOS = [
  {
    id: "ball", tier: "A", place: "school", room: "playground", emoji: "🏀",
    title: "El que quita la pelota",
    setup: "Cada día en el recreo, un niño grande te quita la pelota de las manos. Te dice 'muy lento' y se ríe.",
    feelQ: "¿Cómo se siente tu cuerpo?",
    feelA: ["Sensación de alerta — te duele la pancita 😖", "Súper feliz 😄"],
    reactQ: "¿Qué puedes hacer PRIMERO?",
    reactA: ["Decir 'PARA. No me gusta eso.' y alejarte caminando 🚶", "Agarrarlo y empujarlo 😠", "Esconderte y no jugar nunca más 🙈"],
    reactWhy: "Palabras firmes + alejarte te mantiene A SALVO. Lastimar de vuelta puede lastimarte más a ti.",
    tellTo: ["teacher"], keepTelling: false,
    tellPrompt: "Ahora VE y CUÉNTALE. ¿Quién es el mejor ayudante en el recreo?",
    resolve: "Tu maestra escucha cada palabra. Habla con el niño y ahora vigila el recreo. La pelota vuelve a ser para compartir.",
  },
  {
    id: "cookies", tier: "A", place: "school", room: "cafeteria", emoji: "🍪",
    title: "El que quita el almuerzo",
    setup: "En el almuerzo, una niña te quita las galletas de tu lonchera todos los días. Te susurra: 'No lo cuentes, o si no…'",
    feelQ: "Ella dijo 'no lo cuentes'. ¿Es una sorpresa feliz o un secreto malo?",
    feelA: ["Un secreto malo — debería contarlo 🗣️", "Una sorpresa feliz 🎁"],
    reactQ: "¿Qué puedes hacer?",
    reactA: ["Sostener mi lonchera e ir a sentarme cerca de un ayudante 🚶", "Darle todo mi almuerzo para siempre 😞", "Llorar solo y no contarle a nadie 😢"],
    reactWhy: "'No lo cuentes' es exactamente cuando SÍ lo contamos. No hiciste nada malo.",
    tellTo: ["teacher", "principal"], keepTelling: true,
    busyLine: "Le cuentas al asistente del comedor. Está muy ocupado y no te escucha. ¡Ay no!",
    keepLine: "Un ayudante no pudo ayudar. ¿Nos rendimos? ¡NO! ¡Vamos al SIGUIENTE ayudante de nuestra mano!",
    tellPrompt: "¿A quién le cuentas después?",
    resolve: "La directora te agradece por contarlo. 'Fuiste valiente por seguir contando,' dice. El almuerzo ahora está a salvo — y tus galletas son tuyas.",
  },
  {
    id: "leftout", tier: "A", place: "school", room: "playground", emoji: "⛔",
    title: "No puedes jugar",
    setup: "Cada día, algunos niños dicen '¡No puedes jugar con nosotros!' y se ríen de ti. Pasa una y otra vez.",
    feelQ: "¿Cómo se siente tu cuerpo?",
    feelA: ["Triste y con alerta 😢", "Nada — está bien 😐"],
    reactQ: "¿Qué puedes hacer?",
    reactA: ["Buscar a otro amigo o a un ayudante 🚶", "Rogarles todos los días 😞", "Decir cosas feas de vuelta 😠"],
    reactWhy: "Que te dejen fuera a propósito, una y otra vez, es un tipo de acoso. Está bien contarlo.",
    tellTo: ["counselor", "teacher"], keepTelling: false,
    tellPrompt: "¿Quién es un gran ayudante para problemas con amigos?",
    resolve: "El consejero escucha. 'Todos merecen jugar,' dice. Ayuda a tu clase a aprender a incluir a todos.",
  },
  {
    id: "poker", tier: "A", place: "school", room: "classroom", emoji: "✏️",
    title: "El que pica con el lápiz",
    setup: "En clase, un niño te pica la espalda con un lápiz cuando la maestra no está mirando. Duele. Te dice que eres un chismoso si hablas.",
    feelQ: "Él dice que contar es malo. ¿Tiene razón?",
    feelA: ["No. Contar que te lastimaron SIEMPRE está bien 🗣️", "¿Debo quedarme callado? 🤐"],
    reactQ: "¿Qué puedes hacer?",
    reactA: ["Decir '¡Para!' y levantar la mano para la maestra ✋", "Picarlo de vuelta más fuerte ✏️", "No volver nunca más a la escuela 🙈"],
    reactWhy: "Contarle a un ayudante que te lastimaron no es acusar. Es estar a salvo.",
    tellTo: ["teacher", "mom"], keepTelling: true,
    busyLine: "Tu maestra está ayudando a otro niño y dice 'un minuto' — pero suena la campana y todos se van.",
    keepLine: "El primer intento no funcionó. ¡Sigue contando! ¿Quién más está en tu mano?",
    goLine: "La escuela terminó. Hora de ir a casa. ¡Busquemos a mamá y contémosle!",
    tellPrompt: "¿A quién le puedes contar en casa?",
    resolve: "Le cuentas todo a mamá en casa. Mamá te abraza y llama a la escuela. Los pinchazos se detienen. ¡Contarlo dos veces funcionó!",
  },
  {
    id: "follower", tier: "A", place: "school", room: "playground", emoji: "🧍",
    title: "El desconocido en la cerca",
    setup: "Una persona que no conoces está parada en la cerca del patio de recreo. Te pide que te acerques y dice que tiene dulces para ti.",
    feelQ: "¿Cómo se siente tu cuerpo?",
    feelA: ["¡Alerta! Algo está mal 💓", "Emocionado por los dulces 🍬"],
    reactQ: "¿Qué haces?",
    reactA: ["NO — VETE — CUÉNTALO: da un paso atrás y corre hacia un ayudante 🏃", "Acercarte para ver los dulces 🍬", "Solo saludar y quedarte ahí 👋"],
    reactWhy: "Nunca nos vamos con alguien que no conocemos. No. Vete. Cuéntalo. ¡Pies rápidos!",
    tellTo: ["teacher", "principal"], keepTelling: false,
    tellPrompt: "¡Corriste — muy bien! Ahora cuéntale a un ayudante enseguida. ¿A quién?",
    resolve: "Tu maestra actúa rápido y se lo dice a la directora. Los adultos mantienen a todos a salvo. '¡Hiciste EXACTAMENTE lo correcto!' dicen.",
  },
  /* ---------- Tier B: adults & home — CLINICAL REVIEW PENDING ---------- */
  {
    id: "aide", tier: "B", reviewPending: true, place: "school", room: "classroom", emoji: "💪",
    title: "El adulto que agarra fuerte",
    setup: "Un adulto ayudante en la escuela te agarra el brazo fuerte cuando vas lento. Duele. Te dice: 'Si lo cuentas, pierdes el recreo.'",
    feelQ: "Un adulto hizo esto. ¿Todavía está bien contarlo?",
    feelA: ["SÍ. A los adultos no se les permite lastimarme 🗣️", "¿Los adultos siempre tienen razón? 🤔"],
    reactQ: "¿Qué es verdad?",
    reactA: ["Mi cuerpo me pertenece a mí. Lastimarme no está permitido — ni siquiera para los adultos 💙", "¿Fue mi culpa por ir lento? 🤔", "¿Perderé el recreo si lo cuento? 😨"],
    reactWhy: "Nadie tiene permiso de lastimarte. Ni los niños. Ni los adultos. Ni siquiera los adultos cuyo trabajo es ayudar. Y contarlo NUNCA puede meterte en problemas.",
    tellTo: ["teacher", "principal", "mom"], keepTelling: true,
    busyLine: "Le cuentas a un adulto, pero nada cambia. El agarrón vuelve a pasar.",
    keepLine: "Cuando nada cambia, NO nos detenemos. Le contamos al SIGUIENTE ayudante. Y al siguiente. ¡Sigue contando hasta que pare!",
    tellPrompt: "¿A quién más le puedes contar?",
    resolve: "Sigues contando — y mamá y la directora AMBAS te escuchan. Los adultos lo arreglan. 'Gracias por contarnos. Nunca fue tu culpa.'",
  },
  {
    id: "cousin", tier: "B", reviewPending: true, place: "house", room: "living", emoji: "🎮",
    title: "No es un juego de verdad",
    setup: "Un primo grande te golpea cuando nadie está mirando. Se ríe y dice '¡es solo un juego!' Pero duele, y no se siente como un juego.",
    feelQ: "Él dice que es un juego. ¿Qué dice TU cuerpo?",
    feelA: ["Alerta. Duele. NO es un juego 😖", "A veces los juegos duelen, está bien 😐"],
    reactQ: "¿Qué es verdad?",
    reactA: ["Si duele y se siente mal, no es un juego — puedo contarlo 💙", "¿Está bien porque es familia? 🤔", "¿Tengo que seguir jugando? 😨"],
    reactWhy: "Un juego de verdad se siente divertido para TODOS. Si te duele, puedes decir NO y contarlo — incluso si es familia.",
    tellTo: ["mom", "dad", "grandma"], keepTelling: false,
    tellPrompt: "¿A quién en casa le puedes contar?",
    resolve: "La abuela escucha todo. 'Contármelo estuvo bien,' dice. Los adultos hacen que pare. Estás a salvo.",
  },
  {
    id: "scaryhome", tier: "B", reviewPending: true, place: "school", room: "nurseroom", emoji: "🌧️",
    title: "Cuando la casa se siente asustadora",
    setup: "Alguien en casa te grita y te asusta casi todos los días. Te dice que eres malo. Te duele mucho la pancita.",
    feelQ: "¿Es tu culpa cuando un adulto te asusta?",
    feelA: ["NO. Nunca es mi culpa 💙", "¿Hice algo mal? 😟"],
    reactQ: "Tus ayudantes de casa no pueden ayudar esta vez. ¿Dónde más hay ayudantes?",
    reactA: ["¡En la escuela! Maestros, la enfermera, el consejero 🏫", "¿No hay ningún otro lugar? 😢", "¿Debería guardarlo en secreto? 🤐"],
    reactWhy: "Por eso tu mano tiene ayudantes de lugares DIFERENTES. Si la casa no se siente segura, los ayudantes de la escuela pueden ayudarte.",
    tellTo: ["teacher", "nurse", "counselor"], keepTelling: true,
    busyLine: "Es difícil encontrar las palabras la primera vez, y el momento pasa.",
    keepLine: "Está bien. Intentar contarlo cuenta. Inténtalo de nuevo — elige otro ayudante. Los ayudantes QUIEREN escuchar.",
    tellPrompt: "¿A quién en la escuela le vas a contar?",
    resolve: "La enfermera se sienta contigo y escucha cada palabra. 'No eres malo. Eres valiente,' dice. 'Los adultos van a ayudar ahora.' Y lo hacen.",
  },
  /* ---------- Wave 2: community safety + being-a-friend ---------- */
  {
    id: "lost", tier: "A", place: "library", room: "readingroom", emoji: "🧭",
    title: "¡Perdido!",
    setup: "Estás en la biblioteca. Miras hacia arriba — no puedes ver a tu adulto por ningún lado. Todo se siente demasiado grande.",
    feelQ: "¿Cómo se siente tu cuerpo?",
    feelA: ["Sensación de alerta — asustado y tembloroso 💓", "¿Importa? 🤔"],
    reactQ: "¿Qué haces PRIMERO?",
    reactA: ["Quedarte donde estás y buscar a un trabajador que te ayude 🧍", "¿Correr afuera a buscar en la calle? 🏃", "¿Esconderte debajo de una mesa? 🙈"],
    reactWhy: "Quédate quieto y pide ayuda a un ayudante. Los adultos pueden encontrarte mucho más rápido cuando te quedas adentro y le cuentas a un trabajador.",
    tellTo: ["librarian", "officer"], keepTelling: true,
    busyLine: "La bibliotecaria te toma de la mano. '¡Estás a salvo conmigo. Los oficiales de policía son los MEJORES para encontrar familias!'",
    keepLine: "Los ayudantes pueden llevarte con MÁS ayudantes. ¡Ese es su trabajo!",
    goLine: "La bibliotecaria te lleva caminando a la estación de policía. ¡Busquemos al oficial de policía!",
    tellPrompt: "¿Quién puede ayudar cuando estás perdido?",
    resolve: "El oficial de policía sonríe. 'Hiciste todo bien — te quedaste quieto y les contaste a los ayudantes.' Muy pronto tu adulto está ahí, abrazándote fuerte.",
  },
  {
    id: "friend", tier: "A", place: "school", room: "playground", emoji: "🤝",
    title: "Ayuda a un amigo",
    setup: "En el recreo, algunos niños se ríen de tu amiga y dicen que no puede jugar. Tu amiga se ve muy triste.",
    feelQ: "Están dejando fuera a tu amiga. ¿Cómo se siente eso?",
    feelA: ["Mi pancita dice alerta — esto no es amable 😟", "¿Es gracioso? 🤔"],
    reactQ: "¿Qué puedes hacer TÚ por tu amiga?",
    reactA: ["Pararte junto a mi amiga y decir '¡Ven a jugar conmigo!' 🤝", "¿Reírme junto con los niños? 😬", "¿Mirar para otro lado y no hacer nada? 🙈"],
    reactWhy: "Ser un buen amigo es valiente. También puedes buscar a un adulto — contarlo por un AMIGO es ayudar, no acusar.",
    tellTo: ["teacher", "counselor"], keepTelling: false,
    tellPrompt: "¿A quién le puedes contar para ayudar a tu amiga?",
    resolve: "La maestra te agradece por defender a tu amiga. Tu amiga te sonríe. Ayudar a un amigo se siente BIEN.",
  },
  {
    id: "alarm", tier: "A", place: "house", room: "living", emoji: "🚨",
    title: "La alarma fuerte",
    setup: "¡BEEP! ¡BEEP! ¡BEEP! La alarma de humo está muy fuerte. Te duelen los oídos. Algo se podría estar quemando.",
    feelQ: "La alarma es fuerte y da miedo. ¿Qué te dice?",
    feelA: ["Sal afuera rápido — ¡la alarma significa VETE! 🏃", "¿Debo esconderme debajo de mi cama? 🛏️"],
    reactQ: "¿Qué hacemos cuando suena la alarma de humo?",
    reactA: ["Salir rápido con mi familia y quedarme afuera 🚪", "¿Detenerme a empacar mis juguetes? 🧸", "¿Esconderme en el clóset? 🙈"],
    reactWhy: "Nunca te escondas de una alarma. Que sea fuerte está bien — es el sonido de mantenerte A SALVO. Sal, quédate afuera.",
    tellTo: ["mom", "firefighter"], keepTelling: true,
    busyLine: "Afuera, mamá te abraza. '¡Perfecto! Saliste enseguida.' El camión de bomberos llega — ¡UII-UUU UII-UUU!",
    keepLine: "Los bomberos siempre revisan que todos estén a salvo. ¡Vamos a contarle al bombero!",
    goLine: "¡Visitemos la estación de bomberos y contémosle al bombero lo que hiciste!",
    tellPrompt: "¿Quién revisa que todos estén a salvo?",
    resolve: "El bombero te choca los cinco. '¡Eres una estrella de la seguridad! Sal rápido, quédate afuera, nunca te escondas.' Los adultos se encargan de todo lo demás.",
  },
  {
    id: "different", tier: "A", place: "school", room: "playground", emoji: "🌟",
    title: "Simplemente siendo yo",
    setup: "Aleteas las manos cuando estás feliz. Algunos niños señalan y se ríen: '¿Por qué haces eso? ¡Qué raro!'",
    feelQ: "Los niños se rieron de ti. ¿Cómo se siente tu cuerpo?",
    feelA: ["Triste y con alerta 😢", "¿Reírse significa que está bien? 🤔"],
    reactQ: "¿Qué es VERDAD?",
    reactA: ["No hay nada malo conmigo. El cuerpo de cada persona es diferente 🌟", "¿Tengo que dejar de ser yo? 😟", "¿Debería esconder mis manos felices para siempre? 🤐"],
    reactWhy: "Aletear, girar, hacer sonidos — los cuerpos hacen cosas diferentes. Ser diferente no está mal. La risa poco amable es el problema, no tú.",
    tellTo: ["counselor", "teacher"], keepTelling: false,
    tellPrompt: "¿Quién ayuda cuando los niños no son amables?",
    resolve: "El consejero dice: 'Me encanta cómo te conoces a ti mismo. Vamos a ayudar a la clase a aprender que todos somos diferentes — y eso es lo que hace interesantes a los amigos.'",
  },
  {
    id: "touch", tier: "B", place: "house", room: "living", emoji: "🩱",
    title: "Mi cuerpo es mío",
    setup: "Alguien quiere tocar las partes privadas de tu cuerpo — las partes que cubre tu traje de baño. Te dice: 'Es un juego secreto.'",
    feelQ: "Las partes privadas son privadas. ¿Es esto un juego de verdad?",
    feelA: ["NO. Las partes que cubre mi traje de baño son PRIVADAS 🩱", "¿Es un juego si ellos lo dicen? 🤔"],
    reactQ: "¿Qué puedes decir y hacer?",
    reactA: ["Decir '¡NO! ¡PARA!' fuerte y claro, y alejarte 🗣️", "¿Tengo que ser educado y quedarme? 😟", "¿Debería mantener en secreto el juego secreto? 🤐"],
    reactWhy: "Tu cuerpo te pertenece a TI. Nadie puede tocar tus partes privadas — ni niños, ni adultos, ni familia. Un NO fuerte y claro siempre está permitido.",
    tellTo: ["mom", "nurse"], keepTelling: true,
    busyLine: "Mamá escucha cada palabra. ¿Y sabes qué? También puedes contarle a MÁS ayudantes — mientras más ayudantes lo sepan, más a salvo estás.",
    keepLine: "Sigue contando hasta que los adultos ayuden. NUNCA te meterás en problemas por contarlo.",
    goLine: "En la escuela, la enfermera también es una ayudante segura. ¡Contémosle!",
    tellPrompt: "¿A quién le cuentas?",
    resolve: "Le contaste a mamá Y a la enfermera. Ambas dicen: 'Gracias por contarlo. No hiciste nada malo. Te vamos a mantener a salvo.' Y lo hacen.",
  },
  {
    id: "secretgift", tier: "B", place: "house", room: "living", emoji: "🎁",
    title: "El regalo secreto",
    setup: "Un adulto que conoces te da dulces y susurra: 'No le digas a tu mamá. Este es nuestro pequeño secreto.'",
    feelQ: "Un regalo que debes guardar en secreto — ¿sorpresa feliz o secreto malo?",
    feelA: ["Un secreto malo — los regalos nunca deberían ser secretos 🗣️", "¿Está bien porque son dulces? 🤔"],
    reactQ: "¿Qué es verdad sobre los regalos y los secretos?",
    reactA: ["Los adultos seguros nunca me piden que guarde secretos de mamá 💙", "¿Le debo un secreto porque me dio dulces? 🤔", "¿Debería guardar solo este pequeño secreto? 🤐"],
    reactWhy: "Un adulto seguro NUNCA dice 'no le digas a tu mamá.' Justo ahí es cuando lo contamos.",
    tellTo: ["mom", "dad"], keepTelling: false,
    tellPrompt: "¿A quién le cuentas sobre el regalo secreto?",
    resolve: "Mamá dice: 'Gracias por contármelo — hiciste lo correcto. Los regalos nunca son secretos.' Te sientes ligero y a salvo de nuevo.",
  },
];

/* ---------------- in-world enactment data (mirrors HH.FIND_TASKS) ---------------- */
HH_ES.FIND_TASKS = {
  house: [
    { ask: "¿Dónde dormimos? ¡Camina hasta allá y toca la cama!", roomId: "bedroom", objIndex: 0, praise: "¡Sí! ¡Dormimos en el dormitorio! 😴" },
    { ask: "¡Hora de cepillarnos los dientes! ¡Encuentra el cepillo de dientes!", roomId: "bathroom", objIndex: 1, praise: "¡Sí! ¡Nos cepillamos los dientes en el baño! 🪥" },
    { ask: "Los adultos cocinan en algún lugar. ¡Encuentra la estufa!", roomId: "kitchen", objIndex: 0, praise: "¡Sí! ¡Cocinar pasa en la cocina! 🍳" },
    { ask: "¿Dónde comemos juntos? ¡Toca la mesa!", roomId: "dining", objIndex: 0, praise: "¡Sí! ¡Comemos en el comedor! 🍽️" },
    { ask: "¡Juguemos un rompecabezas! ¿Dónde jugamos y descansamos?", roomId: "living", objIndex: 2, praise: "¡Sí! ¡Jugamos en la sala! 🧩" },
  ],
  school: [
    { ask: "¿Dónde aprendemos? ¡Camina hasta allá y toca los libros!", roomId: "classroom", objIndex: 1, praise: "¡Sí! ¡Aprendemos en el salón de clases! 📚" },
    { ask: "¡Es hora del almuerzo! ¡Encuentra tu bandeja de almuerzo!", roomId: "cafeteria", objIndex: 1, praise: "¡Sí! ¡Almorzamos en la cafetería! 🍎" },
    { ask: "¡Hora del recreo! ¡Encuentra la resbaladilla!", roomId: "playground", objIndex: 0, praise: "¡Sí! ¡Jugamos en el patio de recreo! 🛝" },
    { ask: "¿Dónde trabaja el director? ¡Encuentra el mostrador principal!", roomId: "office", objIndex: 0, praise: "¡Sí! ¡La oficina es donde trabaja el director! 🏢" },
    { ask: "Te sientes mal. ¿Dónde puedes descansar? ¡Encuentra la cama para descansar!", roomId: "nurseroom", objIndex: 1, praise: "¡Sí! ¡La enfermera te ayuda en la enfermería! 🩹" },
  ],
  library: [
    { ask: "¡Tantas historias! ¡Encuentra los libros en la Sala de Lectura!", roomId: "readingroom", objIndex: 0, praise: "¡Sí! ¡Las bibliotecas están llenas de libros! 📚" },
    { ask: "Quieres llevar un libro a casa. ¡Encuentra el libro en el Mostrador de Préstamos!", roomId: "checkout", objIndex: 0, praise: "¡Sí! ¡Primero llevamos el libro al mostrador! 📖" },
    { ask: "¡Ahora regístralo! ¡Encuentra el escáner — beep!", roomId: "checkout", objIndex: 2, praise: "¡Beep! El libro está registrado. ¡Ahora puedes llevártelo a casa! 🎉" },
  ],
  clinic: [
    { ask: "Primero esperamos nuestro turno. ¡Encuentra las sillas de espera!", roomId: "waiting", objIndex: 0, praise: "¡Sí! ¡Esperamos en la sala de espera! 🪑" },
    { ask: "El doctor escucha tu corazón. ¡Encuentra el estetoscopio!", roomId: "examroom", objIndex: 0, praise: "¡Tum-tum! ¡El estetoscopio escucha tu corazón! 🩺" },
    { ask: "¡Hora de tu chequeo! ¡Encuentra la camilla!", roomId: "examroom", objIndex: 2, praise: "¡Sí! ¡Te sientas ahí y el doctor te revisa! 🛏️" },
  ],
  firestation: [
    { ask: "¿Dónde está el gran camión de bomberos rojo? ¡Ve a buscarlo!", roomId: "garage", objIndex: 0, praise: "¡Ahí está! ¡El camión de bomberos sale volando a ayudar a la gente! 🚒" },
    { ask: "Los bomberos necesitan sus cascos. ¡Encuentra uno en la Sala de Equipo!", roomId: "gearroom", objIndex: 0, praise: "¡Sí! ¡Los cascos protegen a los bomberos! ⛑️" },
    { ask: "¡RING RING! ¡Encuentra la campana de alarma!", roomId: "garage", objIndex: 2, praise: "¡Ring! ¡Cuando suena la campana, los bomberos van a ayudar! 🔔" },
  ],
  police: [
    { ask: "Los oficiales de policía usan una placa especial. ¡Encuéntrala!", roomId: "frontdesk", objIndex: 0, praise: "¡Sí! ¡Una placa significa \"estoy aquí para ayudarte\"! 🛡️" },
    { ask: "Si estás perdido, ¿dónde esperas? ¡Encuentra el osito de espera en el Rincón Seguro!", roomId: "safecorner", objIndex: 1, praise: "¡Sí! ¡Esperas en el rincón seguro y la policía encuentra a tu familia! 🧸" },
    { ask: "Los oficiales se hablan entre ellos para ayudar rápido. ¡Encuentra la radio!", roomId: "frontdesk", objIndex: 1, praise: "¡Sí! ¡La radio llama a más ayudantes súper rápido! 📻" },
  ],
};

/* short speech-bubble lines for scenario actors (mirrors HH.SCENARIO_ACTORS) */
HH_ES.SCENARIO_ACTORS = {
  ball:     { emoji: "🧒", name: "Un niño grande", bubble: "¡Dame la pelota! ¡Eres muy lento!" },
  cookies:  { emoji: "👧", name: "Una niña", bubble: "Dame tus galletas. ¡No lo cuentes!" },
  leftout:  { emoji: "🧒", name: "Niños", bubble: "¡No puedes jugar con nosotros!" },
  poker:    { emoji: "🧒", name: "Un niño", bubble: "*pica pica* ¡No seas chismoso!" },
  follower: { emoji: "🧍", name: "Desconocido", bubble: "¡Ven más cerca! Tengo dulces…" },
  aide:     { emoji: "🧑", name: "El adulto", bubble: "¡Apúrate! *agarra el brazo* ¡No lo cuentes!" },
  cousin:   { emoji: "🧒", name: "Primo", bubble: "¡Es solo un juego! *golpea*" },
  scaryhome:{ emoji: "🌧️", name: "En casa", bubble: "…gritando otra vez…" },
  friend:    { emoji: "🧒", name: "Unos niños", bubble: "¡Ja ja! ¡No puedes jugar con nosotros!" },
  different: { emoji: "🧒", name: "Unos niños", bubble: "¿Por qué aleteas así? ¡Qué raro!" },
  secretgift:{ emoji: "🧑", name: "Un adulto que conoces", bubble: "Shh… ¡no le digas a tu mamá!" },
};

HH_ES.AFFIRMATIONS = [
  "Contarlo es de valientes. 💙",
  "NUNCA es tu culpa.",
  "Tu cuerpo te pertenece a ti.",
  "Los ayudantes quieren mantenerte a salvo.",
  "Si un ayudante no puede ayudar — cuéntale al siguiente. ¡Sigue contando!",
  "Nunca te meterás en problemas por contarlo.",
];

/* ---------------- Getting Ready: appointment-prep walkthroughs (mirrors HH.PREP) ---------------- */
HH_ES.PREP_TITLE = "Prepárate 🩺";
HH_ES.PREP_SUB = "Practica lo que pasa en una cita — paso a paso, para que nada sea una sorpresa.";
HH_ES.PREP_DONE_LINE = "Sabías todo lo que iba a pasar. ¡Fuiste muy valiente!";
HH_ES.PREP = [
  {
    id: "doctorvisit", title: "Visita al Doctor", emoji: "🩺", place: "clinic",
    intro: "¡Practiquemos una visita al doctor! Te voy a mostrar todo lo que pasa. Sin sorpresas.",
    steps: [
      { label: "Ver", emoji: "🪑",
        text: "Primero nos sentamos en la sala de espera. La sala de espera tiene sillas y libros. Esperamos nuestro turno." },
      { label: "Oír", emoji: "📣",
        text: "Alguien dice tu nombre. Así sabes que es tu turno. Caminas con tu adulto." },
      { label: "Ver", emoji: "📏",
        text: "¡Después vemos qué tan grande estás creciendo! Te paras en la báscula, luego te paras derecho junto a la pared. ¡Fácil!" },
      { label: "Ver", emoji: "🚪",
        text: "Luego vamos a un cuartito y nos sentamos en la camilla suave. El doctor viene a verte ahí." },
      { label: "Sentir + Practicar", emoji: "🫁", coping: "breath",
        text: "El doctor escucha tu corazón con un círculo pequeño. El círculo se siente un poco frío. Solo toma unos segundos.",
        copingPrompt: "Mientras el doctor escucha, tomamos 3 respiraciones lentas. ¡Toca el círculo para respirar conmigo!",
        copingDone: "¡Tres respiraciones lentas! Tu cuerpo se siente tranquilo. Puedes usar respiraciones lentas en cualquier momento." },
      { label: "Ver", emoji: "👂",
        text: "El doctor mira tus oídos con una lucecita. No duele. Hace un poco de cosquillas." },
      { label: "Todo listo", emoji: "🌟",
        text: "¡Todo listo! El doctor dice que estás creciendo genial. ¡Te ganas una calcomanía!" },
    ],
  },
  {
    id: "dentistvisit", title: "Visita al Dentista", emoji: "🦷", place: "clinic",
    intro: "¡Practiquemos una visita al dentista! Te voy a mostrar todo lo que pasa. Sin sorpresas.",
    steps: [
      { label: "Ver", emoji: "🪑",
        text: "En el dentista hay una silla grande y especial. La silla sube y baja despacio. ¡Puedes montarte en ella!" },
      { label: "Ver", emoji: "💡",
        text: "Hay una luz brillante para que el dentista pueda ver tus dientes. Puedes cerrar los ojos si es demasiado brillante. ¡Está bien!" },
      { label: "Sentir", emoji: "🪞",
        text: "El dentista cuenta tus dientes con un espejito. Uno, dos, tres… No duele. Solo se siente un poco raro." },
      { label: "Practicar", emoji: "✋", coping: "hand",
        text: "Aquí está tu herramienta especial: si quieres un descanso, levantas la mano. El dentista se detiene y te espera.",
        copingPrompt: "Practiquemos una vez. ¡Toca la mano para levantar la mano!",
        copingDone: "¡Levantaste la mano! El dentista se detiene y espera. Puedes hacer eso cuando necesites una pausa." },
      { label: "Oír", emoji: "🪥",
        text: "El cepillo cosquilloso hace un sonido de zumbido. ¡Bzzz! Te hace cosquillas en los dientes. Recuerda — ¡puedes levantar la mano para pausar!" },
      { label: "Hacer", emoji: "💧",
        text: "Después te dan un vasito de agua. Enjuagas y escupes en el lavabito pequeño. ¡Uish!" },
      { label: "Todo listo", emoji: "✨",
        text: "¡Todo listo! Tus dientes están limpios y brillantes. ¡Puedes elegir un premio!" },
    ],
  },
  {
    id: "haircut", title: "Corte de Pelo", emoji: "💇", place: "house",
    intro: "¡Practiquemos cómo es cortarte el pelo! Te voy a mostrar todo lo que pasa. Sin sorpresas.",
    steps: [
      { label: "Ver", emoji: "🦸",
        text: "En el corte de pelo te sientas en una silla grande. Usas una capa — ¡como un superhéroe! La capa mantiene el pelo lejos de tu ropa." },
      { label: "Sentir", emoji: "💦",
        text: "El ayudante del pelo rocía un poco de agua en tu cabello. El agua se siente un poco fría. Es solo una pequeña rociada." },
      { label: "Practicar", emoji: "🤲", coping: "squeeze",
        text: "Aquí está tu herramienta especial: el truco de apretar las manos. Si un sentimiento se hace grande, aprietas tus propias manos juntas… y las sueltas.",
        copingPrompt: "¡Practiquemos! Toca las manos para apretar… y soltar.",
        copingDone: "¡Apretar… y soltar! Tus manos ayudan a que tu cuerpo se sienta tranquilo. Puedes hacer eso en cualquier momento en la silla." },
      { label: "Oír", emoji: "✂️",
        text: "Las tijeras hacen un sonido de tris-tris cerca de tus oídos. Las tijeras nunca te tocan. Solo cortan tu pelo — y el pelo no siente nada." },
      { label: "Sentir", emoji: "🪶",
        text: "Caen pelitos pequeños como plumas suaves. A veces se siente picazón. La picazón es normal. Puedes usar tu truco de apretar las manos." },
      { label: "Ver", emoji: "🪞",
        text: "Luego te miras en el espejo. Ves tu corte de pelo nuevo. ¡Te ves genial!" },
      { label: "Todo listo", emoji: "🎉",
        text: "¡Todo listo! Te quitan la capa. Te sacudes los pelitos que dan cosquillas." },
    ],
  },
  {
    id: "shots", title: "Ponerte una Inyección", emoji: "💉", place: "clinic",
    intro: "¡Practiquemos cómo es ponerte una inyección! Te voy a mostrar todo lo que pasa. Sin sorpresas.",
    steps: [
      { label: "Ver", emoji: "🪑",
        text: "Primero nos sentamos en la sala de espera. Esperamos nuestro turno, igual que en una visita al doctor." },
      { label: "Oír", emoji: "📣",
        text: "Alguien dice tu nombre. Eso significa que es tu turno. Caminas con tu adulto a un cuartito." },
      { label: "Oler", emoji: "🧴",
        text: "La enfermera limpia un puntito en tu brazo con una toallita fresca. Huele limpio, como algodón. Ese olor significa que ya casi estás listo." },
      { label: "Sentir", emoji: "👀",
        text: "Está bien mirar hacia otro lado si quieres. A algunos niños les gusta mirar, a otros les gusta mirar para otro lado. Las dos maneras están bien." },
      { label: "Sentir + Practicar", emoji: "🤲", coping: "squeeze",
        text: "El piquete es rápido — como un pellizquito. Uno, dos, tres, y ya terminó. ¡Puedes contar con la enfermera!",
        copingPrompt: "Practiquemos el truco de apretar las manos para el piquete. ¡Toca las manos para apretar… y soltar!",
        copingDone: "¡Apretar… y soltar! Puedes apretar tus manos cada vez que sientas un pellizquito rápido." },
      { label: "Ver", emoji: "🩹",
        text: "Justo después, te ponen una curita o una calcomanía en el puntito. ¡Fuiste muy valiente!" },
      { label: "Todo listo", emoji: "🍭",
        text: "¡Todo listo! El piquete ya terminó. Te ganas un premio por ser tan valiente." },
    ],
  },
  {
    id: "newclass", title: "Un Salón Nuevo", emoji: "🏫", place: "school",
    intro: "¡Practiquemos cómo es un salón nuevo! Te voy a mostrar todo lo que pasa. Sin sorpresas.",
    steps: [
      { label: "Ver", emoji: "🚪",
        text: "Primero encuentras la puerta de tu salón nuevo. Tu nombre puede estar en una lista junto a la puerta." },
      { label: "Conocer", emoji: "🧑‍🏫",
        text: "Adentro, conoces a tu maestra o maestro nuevo. Su trabajo es ayudarte a aprender y mantenerte seguro todo el día." },
      { label: "Ver", emoji: "🪑",
        text: "Después encuentras tu asiento. También puedes tener un casillero — un lugar especial solo para tus cosas." },
      { label: "Ver", emoji: "🚻",
        text: "El maestro te muestra dónde está el baño. Ahora ya sabes exactamente a dónde ir." },
      { label: "Practicar", emoji: "✋", coping: "hand",
        text: "Aquí está tu herramienta especial: si tienes una pregunta, siempre puedes levantar la mano. El maestro la verá y vendrá a ayudarte.",
        copingPrompt: "Practiquemos una vez. ¡Toca la mano para levantar la mano!",
        copingDone: "¡Levantaste la mano! Siempre puedes levantar la mano para preguntar. El maestro está atento." },
      { label: "Ver", emoji: "🛝",
        text: "¡El recreo sigue siendo recreo! Todavía juegas afuera con tu clase, igual que antes." },
      { label: "Todo listo", emoji: "🎒",
        text: "¡Todo listo! A la hora de salida, empacas tu mochila y vas a casa. ¡Hasta mañana!" },
    ],
  },
  {
    id: "firedrill", title: "Simulacro de Incendio en la Escuela", emoji: "🚨", place: "school",
    intro: "¡Practiquemos un simulacro de incendio! Te voy a mostrar todo lo que pasa. Sin sorpresas.",
    steps: [
      { label: "Oír", emoji: "🚨",
        text: "La alarma de incendio hace un sonido muy fuerte. Es muy fuerte — pero fuerte no significa peligro. Fuerte significa práctica." },
      { label: "Sentir", emoji: "🙉",
        text: "Está bien taparte los oídos si el sonido es demasiado fuerte. Taparte los oídos es una manera inteligente de ayudar a tu cuerpo." },
      { label: "Ver", emoji: "🚶",
        text: "Tu maestro le dice a la clase que se forme en fila. Todos se forman juntos, igual que practicamos." },
      { label: "Hacer", emoji: "🚪",
        text: "La clase camina hacia afuera. Caminamos — nunca corremos. Caminar mantiene a todos seguros." },
      { label: "Ver", emoji: "🔢",
        text: "Afuera, tu maestro cuenta a todos en la clase. Uno, dos, tres… ¡todos están aquí!" },
      { label: "Sentir + Practicar", emoji: "🫁", coping: "breath",
        text: "Mientras esperamos afuera, nuestros cuerpos pueden sentirse un poco temblorosos por el sonido fuerte. Tomemos 3 respiraciones lentas juntos.",
        copingPrompt: "Toca el círculo para respirar conmigo — 3 respiraciones lentas.",
        copingDone: "¡Tres respiraciones lentas! Tu cuerpo se siente tranquilo otra vez. El simulacro ya casi termina." },
      { label: "Todo listo", emoji: "🏫",
        text: "¡Todo listo! Cuando termina el simulacro, la clase camina de regreso adentro. Todos están seguros. Fue solo práctica." },
    ],
  },
];

/* ---------------- My Stickers (pure display, no new mechanics) ---------------- */
HH_ES.STICKER_BOOK = {
  title: "Mis Calcomanías",
  empty: "¡Juega y practica para ganar tu primera calcomanía! 🌟",
  countText(n) {
    if (!n || n <= 0) return "Todavía no tienes calcomanías. ¡Sigue jugando!";
    return "¡Tienes " + n + " calcomanía" + (n === 1 ? "" : "s") + "!";
  },
};

/* ---------------- first-run movement tutorial (interiors) ---------------- */
HH_ES.TUTORIAL_TEXT = "¡Usa esta palanca para caminar! 🕹️";

/* ---------------- spaced re-practice nudge (Practice menu) ---------------- */
HH_ES.REVIEW_PROMPT = {
  banner(title) { return "¡Practiquemos " + title + " otra vez! 💪"; },
  button: "¡Vamos!",
};

/* ---------------- Grown-Ups Corner ----------------
   Intentionally NOT mirrored — the clinical reviewer reads English.
   HH_ES.GROWNUPS does not exist; main.js must always read HH.GROWNUPS. */

/* ---------------- current-language content bridge ----------------
   main.js / world.js read window.HH_C for anything KID-FACING so the
   game flips language with one switch. Grown-Ups Corner review sheets
   (buildReviewScriptHTML, helperNames, gatedItems, HH.GROWNUPS, the
   progress report) deliberately keep reading window.HH directly —
   the clinical reviewer always sees the canonical English. Non-text
   config (ENABLE_TIER_B, REQUIRE_GATE, GATE_HASH, HELPER_SPOTS,
   HH.World) is untouched either way since HH_ES does not define it. */
window.HH_C = (window.ABELang && window.ABELang.es && window.HH_ES)
  ? Object.assign({}, window.HH, window.HH_ES)
  : window.HH;


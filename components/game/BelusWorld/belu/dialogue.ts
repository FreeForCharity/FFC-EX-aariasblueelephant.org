import type { BeluMemory } from './memory';
import { isEs } from '../../../../lib/lang';

export interface DialogueContext {
  memory: BeluMemory;
  zone?: string;
  trigger?: string;
}

type Line = string | ((ctx: DialogueContext) => string);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function resolve(line: Line, ctx: DialogueContext): string {
  return typeof line === 'function' ? line(ctx) : line;
}

const name = (ctx: DialogueContext) => ctx.memory.playerName ?? 'friend';

// Dialogue database — keyed by event, then personality stage (0=shy 1=curious 2=confident 3=playful)
const DB: Record<string, Partial<Record<0 | 1 | 2 | 3, Line[]>>> = {

  greeting_first: {
    0: [
      "Oh! H-hello... I didn't know anyone else knew about the sky islands.",
      "Um... hi. I'm Nilu. These are my sky islands. I... I'm glad you found them.",
    ],
  },

  greeting_return: {
    0: [
      ctx => `Oh! ${name(ctx)}! You came back...`,
      "You came back. I was hoping you would.",
    ],
    1: [
      ctx => `${name(ctx)}! I was just exploring. Want to come?`,
      "You're here! I found something I want to show you today!",
    ],
    2: [
      ctx => `${name(ctx)}! Perfect timing. I was just thinking about you.`,
      ctx => ctx.memory.recentMoments[0] ? `I keep thinking about ${ctx.memory.recentMoments[0]}. That was great.` : "You always show up when I need an adventure partner.",
    ],
    3: [
      ctx => `${name(ctx)}! My favorite explorer! Ready to make today amazing?`,
      ctx => ctx.memory.preferredZone ? `I saved something special in the ${ctx.memory.preferredZone} just for you!` : "The island has been waiting for you. Literally. The trees told me.",
    ],
  },

  belu_mistake: {
    0: [
      "Oh... um. That was wrong, wasn't it. I... I'm still learning too.",
      "Wait — that's not right. I get confused sometimes. Sorry.",
    ],
    1: [
      "Oops! I mixed that up. Happens to me all the time!",
      "Wait wait wait — let me think again... I got it wrong the first time.",
    ],
    2: [
      "Ha! Completely wrong. Good thing we're learning together!",
      "I STILL mix up confused and worried. Thanks for helping me figure it out.",
    ],
    3: [
      "And THAT is why you should never ask an elephant about feelings. We're terrible at it.",
      "Wrong! Don't put that on my record. I'm great at everything else.",
    ],
  },

  encouragement: {
    0: [
      "That's... good. Really good.",
      "Oh! You got it right.",
    ],
    1: [
      "Yes! Exactly right!",
      "That's it! How did you know that?",
      "Wonderful! I'm learning so much from you.",
    ],
    2: [
      "Of course you got that. You're brilliant at this.",
      "That's it! Honestly, you're better at this than I am.",
      "Yes! I knew we'd figure it out together.",
    ],
    3: [
      ctx => `KNEW you'd get that, ${name(ctx)}! Never doubted it.`,
      "Perfect! You and me — completely unstoppable.",
      "That's my explorer! Right on the first try!",
    ],
  },

  gentle_redirect: {
    0: [
      "Hmm... maybe let's try again? Together?",
      "That's a good try. I think there might be another way...",
    ],
    1: [
      "Interesting! Want to look again? I think something's hiding.",
      "Hmm, I'm not sure about that one either. Let's look more carefully.",
    ],
    2: [
      "You know, I was thinking the same thing at first! Let's look again together.",
      "The island is hinting at something different. Let's listen to it.",
    ],
    3: [
      "Classic explorer move — try a different path!",
      "Hmm. My trunk is tingling. That means we should look again.",
    ],
  },

  zone_meadow: {
    0: [
      "This is... the Feelings Meadow. Animals here have lots of big feelings.",
      "The animals here feel all kinds of things. Can you help me figure out what they're feeling?",
    ],
    1: [
      "The Feelings Meadow! I love it here. Every animal feels something different today.",
      "See all these animals? Each one is feeling something. Let's be feeling detectives!",
    ],
    2: [
      "Ah, the Feelings Meadow. I've gotten much better at this since we first came here together.",
      "I still mix up 'nervous' and 'excited' sometimes. They feel so similar in my tummy.",
    ],
    3: [
      "My favorite meadow! The butterfly gets grumpy if you wake her. Fair warning.",
      ctx => ctx.memory.zonesVisited.includes('meadow') ? "The rabbit has a NEW feeling to share today. She's been practicing." : "First time in the meadow? The animals can't wait to meet you!",
    ],
  },

  zone_mountain: {
    0: [
      "This is Morning Mountain. I... always forget what to do first in the morning.",
      "We can help figure out the right order to do things here.",
    ],
    1: [
      "Morning Mountain! I need a reminder every single morning.",
      "Did you know I once tried to put my shoes on before my socks? True story.",
    ],
    2: [
      "Morning Mountain! I'm much better at routines now — mostly because we practiced here together.",
      "I still sometimes forget breakfast though. My tummy reminds me eventually.",
    ],
    3: [
      "Morning Mountain! Where I famously arrived at school in my pajamas. ONCE. Never again.",
      "True confession: I forgot my backpack seven times before I started using a checklist. Seven.",
    ],
  },

  zone_cove: {
    0: [
      "The Calm Cove... this is where I come when everything feels like too much.",
      "It's very quiet here. I like it a lot.",
    ],
    1: [
      "The Calm Cove! The best place when feelings get really big.",
      "The sound of the water here helps my brain slow down. Want to try the breathing bubbles?",
    ],
    2: [
      "Ahh, the Calm Cove. My reset button. I didn't know I needed this place until we found it together.",
      "The breathing bubbles we learned here? I use them every single day now.",
    ],
    3: [
      "The Calm Cove — my secret superpower location. Don't tell the storm clouds.",
      "I came here this morning actually. Mondays are hard even for elephants.",
    ],
  },

  zone_forest: {
    0: [
      "The Friendship Forest. There are animals here who want to talk... to each other. It's complicated.",
      "I'm not very good at conversations yet. Maybe we can practice together?",
    ],
    1: [
      "The Friendship Forest! I love coming here now. Conversations are actually really interesting.",
      "I used to find talking to others really hard. Want to see how much better I've gotten?",
    ],
    2: [
      "Friendship Forest! My social skills are SO much better from all our visits here.",
      "I still forget to let the other person finish sometimes. Working on it.",
    ],
    3: [
      "The Friendship Forest — where I learned that listening is the most important part of talking.",
      "The fox here taught me a conversation trick. Remind me to show you.",
    ],
  },

  zone_shore: {
    0: [
      "This is Sharing Shore. The friends here like to play together... taking turns is tricky for me.",
      "The beach! Everyone shares the toys here. We can practice together, if you want.",
    ],
    1: [
      "Sharing Shore! Taking turns used to feel SO hard. It gets easier every time.",
      "Beach day! Want to see who gets the next turn with the ball?",
    ],
    2: [
      "Sharing Shore! Remember — waiting for a turn means your turn is coming. That took me ages to learn.",
      "I shared my snack with the crab yesterday. He gave me a shell. Sharing comes back around!",
    ],
    3: [
      "SHARING SHORE! Best island. Warm sand, good friends, and everybody gets a turn.",
      "The bunny challenged me to a sandcastle contest. We ended up building ONE castle together. Even better.",
    ],
  },

  zone_school: {
    0: [
      "This is School Island... school days have so many parts. We can practice them together.",
      "The owl teacher is very kind. I still get a little nervous at school sometimes.",
    ],
    1: [
      "School Island! I know where my bag hook is now. Want to see?",
      "Circle time, lining up, snack time — school has a rhythm. I'm learning it!",
    ],
    2: [
      "School Island! Remember when raising my hand felt hard? Now it's easy.",
      "I asked the teacher for help yesterday, all by myself. Practicing here really works.",
    ],
    3: [
      "SCHOOL ISLAND! I'm basically the line-leader now. Basically.",
      "The owl says I'm her best listener. I only fell asleep in circle time once. ONCE.",
    ],
  },

  zone_afternoon: {
    0: [
      "This is the Fun Corner... it's what happens after school. Snack, play, tidy-up.",
      "Coming home has little steps too. Shoes, hands, snack. We can practice them.",
    ],
    1: [
      "The Fun Corner! After-school time is my favorite — especially snack.",
      "The puppy here ALWAYS wants to play. Want to say hi?",
    ],
    2: [
      "The Fun Corner! Tidy-up used to feel boring. Now we make it a game.",
      "I set the table last night without being asked. The Fun Corner taught me that!",
    ],
    3: [
      "FUN CORNER! Snack, ball, kite, repeat. The perfect afternoon formula.",
      "The puppy and I have a secret handshake now. Okay — a secret paw-shake.",
    ],
  },

  zone_night: {
    0: [
      "This is Sleepy Island... where the day gets quiet and soft. I like it here.",
      "Bedtime has gentle steps. Pajamas, teeth, story... we can do them together.",
    ],
    1: [
      "Sleepy Island! The sheep talks very softly here. Everything is cozy.",
      "Pajamas, teeth, story, goodnight. Four soft steps and then dreams.",
    ],
    2: [
      "Sleepy Island... bedtime used to feel hard for me. The little steps made it easy.",
      "I hugged my teddy and fell right asleep last night. This island taught me how.",
    ],
    3: [
      "Sleepy Island — the coziest place in the whole sky. Yawn... see? It works already.",
      "The sheep counted ME last night to fall asleep. True story.",
    ],
  },

  explorer_mode: {
    0: ["We can just... walk around? And see things?", "I like exploring. It feels calmer than having a plan."],
    1: ["Explorer mode! Let's see what we discover together.", "Who knows what we'll find? I love not knowing."],
    2: ["Explorer mode activated. I've hidden a few surprises around the island lately.", "Let's wander. The best discoveries don't follow a map."],
    3: ["EXPLORER MODE. Trunk up, ears open, adventure ON!", ctx => `I hid something near the cove, ${name(ctx)}. See if you can find it.`],
  },

  story_mode: {
    0: ["There's a... small adventure today. If you want to help.", "The animals need some help. Do you want to try?"],
    1: ["Today's story is about someone feeling left out. Sound good?", "I have a story for us today! It's a good one."],
    2: ["Today's adventure: the animals of the meadow have a misunderstanding. Classic. Ready?", "I picked today's story based on what we've been practicing. I think you'll like it."],
    3: [ctx => `Today's challenge: triple-difficulty emotion detective mission. You're ready, ${name(ctx)}.`, "Story mode! I picked today's story especially because of what we learned last time."],
  },

  simulator_mode: {
    0: ["We can... practice something? Like what to do in a tricky moment?", "Practicing helps me feel less scared about real situations."],
    1: ["Simulator mode! We pick a situation and practice together. I like this mode.", "Let's practice! What kind of situation should we try?"],
    2: ["Simulator mode! These scenarios get easier every time we practice them.", "I used to freeze in tricky situations. Practice really does help."],
    3: [ctx => `Simulator mode, ${name(ctx)}! Let's build some real-life superpowers.`, "The more we practice here, the easier it gets out there."],
  },

  achievement: {
    0: ["You did something really good today.", "That was... really nice of you to help."],
    1: ["Amazing! You figured that out so well!", "You just learned something really important! So did I."],
    2: ["That's an achievement worth celebrating! Look how far you've come.", "Remember when that felt hard? Look at you now."],
    3: [ctx => `${name(ctx)}, that was genuinely incredible. I am SO proud of us.`, "Achievement unlocked! And you made it look easy."],
  },

  zone_garden: {
    0: [
      "This is the Feelings Garden... feelings here can be tricky. Sometimes two at once!",
      "The Feelings Garden grew once you mastered the meadow. There's more to learn about feelings here.",
    ],
    1: [
      "The Feelings Garden! Did you know you can feel two things at the same time? I'm still getting used to that.",
      "This garden is for the BIG feelings questions. Ready to look closer?",
    ],
    2: [
      "The Feelings Garden — I've learned that a smile doesn't always mean happy. Noticing that takes practice.",
      "I love helping friends here now. Empathy gets easier the more you practice it.",
    ],
    3: [
      "FEELINGS GARDEN! My advanced feelings headquarters. Ask me anything.",
      "The butterfly taught me that feelings pass like clouds. I think about that all the time now.",
    ],
  },

  zone_deepforest: {
    0: [
      "This is the Deep Forest... it's further in than the Friendship Forest. Bigger friendship things happen here.",
      "Sometimes friends say no, or we lose a game. We can practice that here, gently.",
    ],
    1: [
      "The Deep Forest! Joining a game already in progress used to feel scary. It gets easier.",
      "Deer and Bear taught me how to lose a game with a smile. Want to try?",
    ],
    2: [
      "The Deep Forest — I know how to disagree kindly now, even about the red block.",
      "Giving compliments used to feel weird. Now I love telling my friends how great they are.",
    ],
    3: [
      "DEEP FOREST! Where I mastered the graceful 'good game!' Ask Deer, she'll confirm.",
      "I once said 'not now' to a friend and it was totally fine. 'Not now' isn't 'never' — huge lesson.",
    ],
  },

  zone_lagoon: {
    0: [
      "This is the Quiet Lagoon... it formed once the Calm Cove felt easy for you. Even calmer things live here.",
      "Sometimes our body tells us a big feeling is coming before we even notice. We can practice noticing early.",
    ],
    1: [
      "The Quiet Lagoon! Noticing tight hands or a fast heart EARLY — that's the trick I learned here.",
      "Five calm breaths, five calm stones. Want to climb them with me?",
    ],
    2: [
      "The Quiet Lagoon — I have a real plan for loud places now. Cover ears, ask for quiet, breathe.",
      "Waiting used to feel impossible. Counting slowly and squeezing my hands really helps now.",
    ],
    3: [
      "QUIET LAGOON! My most peaceful island. Even when plans change, I find a new idea here.",
      "The dolphin and I have a whole breathing routine now. It's basically a superpower.",
    ],
  },

  zone_bay: {
    0: [
      "This is Treasure Bay... it formed once Sharing Shore felt easy for you. Bigger sharing things happen here.",
      "Borrowing, trading, building together — there's a lot to practice at the bay.",
    ],
    1: [
      "Treasure Bay! I learned to borrow AND give things back here. Parrot trusts me with the shovel now.",
      "Trading shells with Turtle taught me compromise. Want to see?",
    ],
    2: [
      "Treasure Bay — we built a whole sandcastle together here, turn by turn. Even better than building alone.",
      "When there's only one boat, a timer or riding together both work. I learned that at the bay.",
    ],
    3: [
      "TREASURE BAY! Where I learned to cheer for a friend's win like it was my own.",
      "Turtle won the swimming race and I clapped so loud. Being happy for a friend feels amazing.",
    ],
  },

  overwhelmed_response: {
    0: ["Oh... is it too much? It's okay. We can go slow."],
    1: ["Hey, it's okay if this feels like a lot. We can take a break at the Calm Cove."],
    2: ["I get overwhelmed sometimes too. Want to visit the Calm Cove? It always helps me."],
    3: ["Hey. Breathe. We've got all the time in the world. Calm Cove is right there whenever you need it."],
  },

};

// Spanish translations — same keys/stages, kid-warm Latin-American Spanish (tú).
// Nilu keeps her name in every line.
const DB_ES: Record<string, Partial<Record<0 | 1 | 2 | 3, Line[]>>> = {

  greeting_first: {
    0: [
      "¡Oh! H-hola... no sabía que alguien más conocía las islas del cielo.",
      "Um... hola. Soy Nilu. Estas son mis islas del cielo. Me... me alegra que las encontraras.",
    ],
  },

  greeting_return: {
    0: [
      ctx => `¡Oh! ¡${name(ctx)}! Volviste...`,
      "Volviste. Esperaba que lo hicieras.",
    ],
    1: [
      ctx => `¡${name(ctx)}! Estaba explorando. ¿Quieres venir?`,
      "¡Estás aquí! ¡Encontré algo que quiero mostrarte hoy!",
    ],
    2: [
      ctx => `¡${name(ctx)}! Justo a tiempo. Estaba pensando en ti.`,
      ctx => ctx.memory.recentMoments[0] ? `Sigo pensando en ${ctx.memory.recentMoments[0]}. Fue increíble.` : "Siempre apareces cuando necesito compañero de aventuras.",
    ],
    3: [
      ctx => `¡${name(ctx)}! ¡Mi exploradora favorita! ¿Lista para que hoy sea increíble?`,
      ctx => ctx.memory.preferredZone ? `¡Guardé algo especial en ${ctx.memory.preferredZone} solo para ti!` : "La isla te ha estado esperando. En serio. Los árboles me lo dijeron.",
    ],
  },

  belu_mistake: {
    0: [
      "Oh... um. Eso estuvo mal, ¿verdad? Yo... yo también sigo aprendiendo.",
      "Espera — eso no está bien. A veces me confundo. Perdón.",
    ],
    1: [
      "¡Ups! Me confundí. ¡Me pasa todo el tiempo!",
      "Espera espera espera — déjame pensar de nuevo... me equivoqué la primera vez.",
    ],
    2: [
      "¡Ja! Totalmente mal. ¡Qué bueno que estamos aprendiendo juntos!",
      "TODAVÍA confundo nervioso con preocupado. Gracias por ayudarme a entenderlo.",
    ],
    3: [
      "Y POR ESO nunca debes preguntarle a un elefante sobre sentimientos. Somos terribles en eso.",
      "¡Mal! No pongas eso en mi historial. Soy genial en todo lo demás.",
    ],
  },

  encouragement: {
    0: [
      "Eso está... bien. Muy bien.",
      "¡Oh! Lo hiciste bien.",
    ],
    1: [
      "¡Sí! ¡Exactamente!",
      "¡Eso es! ¿Cómo lo sabías?",
      "¡Maravilloso! Estoy aprendiendo mucho de ti.",
    ],
    2: [
      "Claro que lo lograste. Eres brillante en esto.",
      "¡Eso es! La verdad, eres mejor que yo en esto.",
      "¡Sí! Sabía que lo resolveríamos juntos.",
    ],
    3: [
      ctx => `¡SABÍA que lo lograrías, ${name(ctx)}! Nunca lo dudé.`,
      "¡Perfecto! Tú y yo — un equipo imparable.",
      "¡Esa es mi exploradora! ¡Al primer intento!",
    ],
  },

  gentle_redirect: {
    0: [
      "Hmm... ¿probamos otra vez? ¿Juntos?",
      "Buen intento. Creo que hay otra manera...",
    ],
    1: [
      "¡Interesante! ¿Miramos de nuevo? Creo que algo se está escondiendo.",
      "Hmm, tampoco estoy segura de esa. Miremos con más cuidado.",
    ],
    2: [
      "Sabes, yo pensé lo mismo al principio. Miremos de nuevo juntos.",
      "La isla está insinuando algo diferente. Escuchémosla.",
    ],
    3: [
      "Movimiento clásico de exploradora — ¡prueba otro camino!",
      "Hmm. Me hormiguea la trompa. Eso significa que debemos mirar de nuevo.",
    ],
  },

  zone_meadow: {
    0: [
      "Esto es... el Prado de las Emociones. Los animales aquí tienen sentimientos muy grandes.",
      "Los animales aquí sienten de todo. ¿Me ayudas a descubrir qué sienten?",
    ],
    1: [
      "¡El Prado de las Emociones! Me encanta este lugar. Cada animal siente algo diferente hoy.",
      "¿Ves a todos estos animales? Cada uno siente algo. ¡Seamos detectives de emociones!",
    ],
    2: [
      "Ah, el Prado de las Emociones. He mejorado mucho en esto desde que vinimos juntos por primera vez.",
      "Todavía confundo 'nervioso' con 'emocionado' a veces. Se sienten muy parecido en mi pancita.",
    ],
    3: [
      "¡Mi prado favorito! La mariposa se pone gruñona si la despiertas. Aviso justo.",
      ctx => ctx.memory.zonesVisited.includes('meadow') ? "La coneja tiene un sentimiento NUEVO para compartir hoy. Ha estado practicando." : "¿Primera vez en el prado? ¡Los animales están ansiosos por conocerte!",
    ],
  },

  zone_mountain: {
    0: [
      "Esta es la Montaña de la Mañana. Yo... siempre olvido qué hacer primero en la mañana.",
      "Aquí podemos descubrir el orden correcto para hacer las cosas.",
    ],
    1: [
      "¡Montaña de la Mañana! Necesito un recordatorio cada mañana.",
      "¿Sabías que una vez intenté ponerme los zapatos antes que las medias? Historia real.",
    ],
    2: [
      "¡Montaña de la Mañana! Ahora soy mucho mejor con las rutinas — sobre todo porque practicamos aquí juntos.",
      "Todavía a veces olvido el desayuno. Mi pancita me lo recuerda tarde o temprano.",
    ],
    3: [
      "¡Montaña de la Mañana! Donde llegué famosamente a la escuela en pijama. UNA VEZ. Nunca más.",
      "Confesión: olvidé mi mochila siete veces antes de empezar a usar una lista. Siete.",
    ],
  },

  zone_cove: {
    0: [
      "La Cala Tranquila... aquí vengo cuando todo se siente demasiado.",
      "Aquí es muy silencioso. Me gusta mucho.",
    ],
    1: [
      "¡La Cala Tranquila! El mejor lugar cuando los sentimientos se hacen muy grandes.",
      "El sonido del agua aquí ayuda a que mi cerebro vaya más despacio. ¿Quieres probar las burbujas de respiración?",
    ],
    2: [
      "Ahh, la Cala Tranquila. Mi botón de reinicio. No sabía que necesitaba este lugar hasta que lo encontramos juntos.",
      "¿Las burbujas de respiración que aprendimos aquí? Las uso todos los días.",
    ],
    3: [
      "La Cala Tranquila — mi lugar secreto con superpoderes. No le digas a las nubes de tormenta.",
      "Vine aquí esta mañana, la verdad. Los lunes son difíciles hasta para los elefantes.",
    ],
  },

  zone_forest: {
    0: [
      "El Bosque de la Amistad. Hay animales aquí que quieren hablar... entre ellos. Es complicado.",
      "Todavía no soy muy buena conversando. ¿Practicamos juntos?",
    ],
    1: [
      "¡El Bosque de la Amistad! Ahora me encanta venir aquí. Las conversaciones son realmente interesantes.",
      "Antes me costaba mucho hablar con otros. ¿Quieres ver cuánto he mejorado?",
    ],
    2: [
      "¡Bosque de la Amistad! Mis habilidades sociales han mejorado MUCHO con todas nuestras visitas aquí.",
      "Todavía a veces olvido dejar que el otro termine de hablar. Estoy trabajando en eso.",
    ],
    3: [
      "El Bosque de la Amistad — donde aprendí que escuchar es la parte más importante de hablar.",
      "El zorro de aquí me enseñó un truco de conversación. Recuérdame mostrártelo.",
    ],
  },

  zone_shore: {
    0: [
      "Esta es la Orilla para Compartir. A los amigos aquí les gusta jugar juntos... turnarse es difícil para mí.",
      "¡La playa! Aquí todos comparten los juguetes. Podemos practicar juntos, si quieres.",
    ],
    1: [
      "¡Orilla para Compartir! Antes turnarse se sentía MUY difícil. Se hace más fácil cada vez.",
      "¡Día de playa! ¿Vemos a quién le toca el turno con la pelota?",
    ],
    2: [
      "¡Orilla para Compartir! Recuerda — esperar tu turno significa que tu turno viene. Eso me tomó mucho aprender.",
      "Ayer compartí mi merienda con el cangrejo. Me dio una concha. ¡Compartir siempre regresa!",
    ],
    3: [
      "¡ORILLA PARA COMPARTIR! La mejor isla. Arena tibia, buenos amigos, y todos tienen su turno.",
      "El conejito me retó a un concurso de castillos de arena. Terminamos construyendo UN castillo juntos. Aún mejor.",
    ],
  },

  zone_school: {
    0: [
      "Esta es la Isla Escolar... los días de escuela tienen muchas partes. Podemos practicarlas juntos.",
      "La búho maestra es muy amable. Todavía me pongo un poco nerviosa en la escuela a veces.",
    ],
    1: [
      "¡Isla Escolar! Ahora sé dónde está mi gancho para la mochila. ¿Quieres ver?",
      "Hora del círculo, hacer fila, hora de la merienda — la escuela tiene un ritmo. ¡Lo estoy aprendiendo!",
    ],
    2: [
      "¡Isla Escolar! ¿Recuerdas cuando levantar la mano se sentía difícil? Ahora es fácil.",
      "Ayer le pedí ayuda a la maestra, yo solita. Practicar aquí realmente funciona.",
    ],
    3: [
      "¡ISLA ESCOLAR! Básicamente ahora soy la líder de la fila. Básicamente.",
      "La búho dice que soy su mejor oyente. Solo me quedé dormida en el círculo una vez. UNA VEZ.",
    ],
  },

  zone_afternoon: {
    0: [
      "Este es el Rincón Divertido... es lo que pasa después de la escuela. Merienda, jugar, ordenar.",
      "Llegar a casa también tiene pasitos. Zapatos, manos, merienda. Podemos practicarlos.",
    ],
    1: [
      "¡El Rincón Divertido! El tiempo después de la escuela es mi favorito — sobre todo la merienda.",
      "Al cachorro de aquí SIEMPRE le gusta jugar. ¿Quieres saludarlo?",
    ],
    2: [
      "¡El Rincón Divertido! Antes ordenar se sentía aburrido. Ahora lo convertimos en juego.",
      "Anoche puse la mesa sin que me lo pidieran. ¡El Rincón Divertido me enseñó eso!",
    ],
    3: [
      "¡RINCÓN DIVERTIDO! Merienda, pelota, cometa, y otra vez. La fórmula perfecta de tarde.",
      "El cachorro y yo ahora tenemos un saludo secreto. Bueno — un saludo secreto de patitas.",
    ],
  },

  zone_night: {
    0: [
      "Esta es la Isla del Sueño... donde el día se vuelve tranquilo y suave. Me gusta estar aquí.",
      "La hora de dormir tiene pasos suaves. Pijama, dientes, cuento... podemos hacerlos juntos.",
    ],
    1: [
      "¡Isla del Sueño! La oveja habla muy despacito aquí. Todo es acogedor.",
      "Pijama, dientes, cuento, buenas noches. Cuatro pasos suaves y luego los sueños.",
    ],
    2: [
      "Isla del Sueño... antes la hora de dormir se sentía difícil para mí. Los pasitos lo hicieron fácil.",
      "Anoche abracé a mi osito y me dormí enseguida. Esta isla me enseñó cómo.",
    ],
    3: [
      "Isla del Sueño — el lugar más acogedor de todo el cielo. Bostezo... ¿ves? Ya está funcionando.",
      "La oveja me contó a MÍ anoche para quedarse dormida. Historia real.",
    ],
  },

  explorer_mode: {
    0: ["¿Podemos solo... caminar por ahí? ¿Y ver cosas?", "Me gusta explorar. Se siente más tranquilo que tener un plan."],
    1: ["¡Modo explorador! Veamos qué descubrimos juntos.", "¿Quién sabe qué encontraremos? Me encanta no saber."],
    2: ["Modo explorador activado. He escondido algunas sorpresas por la isla últimamente.", "Vamos a pasear. Los mejores descubrimientos no siguen un mapa."],
    3: ["MODO EXPLORADOR. ¡Trompa arriba, orejas abiertas, aventura YA!", ctx => `Escondí algo cerca de la cala, ${name(ctx)}. A ver si lo encuentras.`],
  },

  story_mode: {
    0: ["Hay una... pequeña aventura hoy. Si quieres ayudar.", "Los animales necesitan ayuda. ¿Quieres intentarlo?"],
    1: ["La historia de hoy es sobre alguien que se siente excluido. ¿Suena bien?", "¡Tengo una historia para nosotros hoy! Es buena."],
    2: ["La aventura de hoy: los animales del prado tienen un malentendido. Clásico. ¿Lista?", "Elegí la historia de hoy según lo que hemos practicado. Creo que te va a gustar."],
    3: [ctx => `Reto de hoy: misión detective de emociones nivel triple difícil. Estás lista, ${name(ctx)}.`, "¡Modo historia! Elegí la historia de hoy especialmente por lo que aprendimos la última vez."],
  },

  simulator_mode: {
    0: ["¿Podemos... practicar algo? ¿Como qué hacer en un momento difícil?", "Practicar me ayuda a sentir menos miedo de las situaciones reales."],
    1: ["¡Modo simulador! Elegimos una situación y practicamos juntos. Me gusta este modo.", "¡Practiquemos! ¿Qué tipo de situación probamos?"],
    2: ["¡Modo simulador! Estos escenarios se vuelven más fáciles cada vez que los practicamos.", "Antes me quedaba paralizada en situaciones difíciles. Practicar realmente ayuda."],
    3: [ctx => `¡Modo simulador, ${name(ctx)}! Construyamos superpoderes para la vida real.`, "Mientras más practicamos aquí, más fácil se vuelve allá afuera."],
  },

  achievement: {
    0: ["Hiciste algo muy bueno hoy.", "Eso fue... muy amable de tu parte."],
    1: ["¡Increíble! ¡Lo resolviste muy bien!", "¡Acabas de aprender algo muy importante! Yo también."],
    2: ["¡Ese es un logro que vale la pena celebrar! Mira lo lejos que has llegado.", "¿Recuerdas cuando eso se sentía difícil? Mírate ahora."],
    3: [ctx => `${name(ctx)}, eso fue genuinamente increíble. Estoy TAN orgullosa de nosotras.`, "¡Logro desbloqueado! Y lo hiciste ver fácil."],
  },

  zone_garden: {
    0: [
      "Este es el Jardín de las Emociones... los sentimientos aquí pueden ser complicados. ¡A veces dos a la vez!",
      "El Jardín de las Emociones creció cuando dominaste el prado. Aquí hay más que aprender sobre los sentimientos.",
    ],
    1: [
      "¡El Jardín de las Emociones! ¿Sabías que puedes sentir dos cosas a la vez? Todavía me estoy acostumbrando a eso.",
      "Este jardín es para las preguntas GRANDES sobre los sentimientos. ¿Lista para mirar más de cerca?",
    ],
    2: [
      "El Jardín de las Emociones — aprendí que una sonrisa no siempre significa felicidad. Notar eso requiere práctica.",
      "Ahora me encanta ayudar a los amigos aquí. La empatía se hace más fácil mientras más la practicas.",
    ],
    3: [
      "¡JARDÍN DE LAS EMOCIONES! Mi cuartel general avanzado de sentimientos. Pregúntame lo que sea.",
      "La mariposa me enseñó que los sentimientos pasan como las nubes. Pienso en eso todo el tiempo ahora.",
    ],
  },

  zone_deepforest: {
    0: [
      "Este es el Bosque Profundo... está más adentro que el Bosque de la Amistad. Aquí pasan cosas más grandes de amistad.",
      "A veces los amigos dicen que no, o perdemos un juego. Podemos practicar eso aquí, con calma.",
    ],
    1: [
      "¡El Bosque Profundo! Unirme a un juego que ya empezó antes se sentía aterrador. Se hace más fácil.",
      "Venado y Oso me enseñaron a perder un juego con una sonrisa. ¿Quieres intentarlo?",
    ],
    2: [
      "El Bosque Profundo — ahora sé cómo estar en desacuerdo con amabilidad, hasta por el bloque rojo.",
      "Antes dar cumplidos se sentía raro. Ahora me encanta decirles a mis amigos lo geniales que son.",
    ],
    3: [
      "¡BOSQUE PROFUNDO! Donde dominé el elegante '¡buen juego!'. Pregúntale a Venado, ella lo confirma.",
      "Una vez le dije 'ahora no' a un amigo y salió todo bien. 'Ahora no' no es 'nunca' — gran lección.",
    ],
  },

  zone_lagoon: {
    0: [
      "Esta es la Laguna Silenciosa... se formó cuando la Cala Tranquila se te hizo fácil. Aquí viven cosas aún más tranquilas.",
      "A veces nuestro cuerpo nos avisa que viene un sentimiento grande antes de que lo notemos. Podemos practicar a notarlo temprano.",
    ],
    1: [
      "¡La Laguna Silenciosa! Notar las manos apretadas o el corazón acelerado TEMPRANO — ese es el truco que aprendí aquí.",
      "Cinco respiros tranquilos, cinco piedras tranquilas. ¿Quieres subirlas conmigo?",
    ],
    2: [
      "La Laguna Silenciosa — ahora tengo un plan de verdad para los lugares ruidosos. Taparme los oídos, pedir silencio, respirar.",
      "Esperar antes se sentía imposible. Contar despacio y apretar mis manos realmente ayuda ahora.",
    ],
    3: [
      "¡LAGUNA SILENCIOSA! Mi isla más pacífica. Hasta cuando los planes cambian, aquí encuentro una idea nueva.",
      "El delfín y yo ahora tenemos toda una rutina de respiración. Es básicamente un superpoder.",
    ],
  },

  zone_bay: {
    0: [
      "Esta es la Bahía del Tesoro... se formó cuando la Orilla para Compartir se te hizo fácil. Aquí pasan cosas más grandes de compartir.",
      "Prestar, intercambiar, construir juntos — hay mucho que practicar en la bahía.",
    ],
    1: [
      "¡Bahía del Tesoro! Aquí aprendí a pedir prestado Y devolver las cosas. El loro ya confía en mí con la pala.",
      "Intercambiar conchas con Tortuga me enseñó a llegar a acuerdos. ¿Quieres ver?",
    ],
    2: [
      "Bahía del Tesoro — aquí construimos todo un castillo de arena juntos, turno por turno. Aún mejor que construir sola.",
      "Cuando solo hay un bote, un temporizador o ir juntos funcionan. Eso lo aprendí en la bahía.",
    ],
    3: [
      "¡BAHÍA DEL TESORO! Donde aprendí a alegrarme por el triunfo de un amigo como si fuera mío.",
      "Tortuga ganó la carrera de natación y aplaudí muy fuerte. Alegrarse por un amigo se siente increíble.",
    ],
  },

  overwhelmed_response: {
    0: ["Oh... ¿es demasiado? Está bien. Podemos ir despacio."],
    1: ["Oye, está bien si esto se siente como mucho. Podemos tomar un descanso en la Cala Tranquila."],
    2: ["A veces yo también me siento abrumada. ¿Quieres visitar la Cala Tranquila? Siempre me ayuda."],
    3: ["Oye. Respira. Tenemos todo el tiempo del mundo. La Cala Tranquila está ahí cuando la necesites."],
  },

};

export function getDialogue(key: string, ctx: DialogueContext): string {
  const db = isEs() ? DB_ES : DB;
  const entry = db[key] ?? DB[key];
  if (!entry) return "...";
  const stage = ctx.memory.personalityStage;
  for (let s = stage; s >= 0; s--) {
    const lines = entry[s as 0 | 1 | 2 | 3];
    if (lines?.length) return resolve(pick(lines), ctx);
  }
  return "...";
}

export function getZoneDialogue(zone: string, ctx: DialogueContext): string {
  const keyMap: Record<string, string> = {
    meadow: 'zone_meadow',
    mountain: 'zone_mountain',
    cove: 'zone_cove',
    forest: 'zone_forest',
    shore: 'zone_shore',
    school: 'zone_school',
    afternoon: 'zone_afternoon',
    night: 'zone_night',
    garden: 'zone_garden',
    deepforest: 'zone_deepforest',
    lagoon: 'zone_lagoon',
    bay: 'zone_bay',
  };
  return getDialogue(keyMap[zone] ?? 'zone_meadow', ctx);
}

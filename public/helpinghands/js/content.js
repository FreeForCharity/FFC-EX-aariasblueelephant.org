/* =====================================================================
   Nilu's Helping Hands — curriculum content
   ---------------------------------------------------------------------
   ALL child-facing language lives in this file so it can be reviewed
   line-by-line by a clinical reviewer (RBT / Clinical Supervisor)
   before launch. Language rules used throughout:
     • short literal sentences, present tense, no idioms or sarcasm
     • the child is never blamed; telling is always praised
     • abuse is never depicted — only the situation's edge + feeling
     • "keep telling" is practiced, not just mentioned
   Frameworks drawn from: protective-behaviors education (Helping Hand /
   five trusted adults), NSPCC PANTS, Second Step child-protection unit,
   Kidpower (No–Go–Tell), Daniel Morcombe (Recognise–React–Report).
   Tier B scenarios are marked reviewPending: true and show a
   "Clinical review" ribbon in-game.
   ===================================================================== */
window.HH = window.HH || {};

// Tier B (adult/home scenarios) cleared by clinical review 2026-07-05 with
// wording changes applied. ALL scenarios and lessons are individually gated
// behind per-item ADULT SIGN-OFF (see main.js) — a grown-up reviews each
// section on the device and can re-lock it any time from the Grown-Ups Corner.
HH.ENABLE_TIER_B = true;

// Password gate. Tier A (peer scenarios + discovery + lessons) was
// cleared for public release by AJ on 2026-07-04, so the gate is OFF.
// Set REQUIRE_GATE = true to re-gate future review builds (e.g. when
// enabling Tier B); hash is SHA-256 of the review password.
HH.REQUIRE_GATE = false;
HH.GATE_HASH = "4fa22d94b2f4dfb0942b08d38edc40e1e46d304519a73a8d4add1c13a1e327f4"; // dormant; NILU-SAFE-2026, only used if REQUIRE_GATE is re-enabled

/* ---------------- helper people (friend cards) ---------------- */
HH.HELPERS = {
  mom:       { emoji: "👩", name: "Mom",             where: "home",   line: "I am your mom. You can tell me anything. I will always listen." },
  dad:       { emoji: "👨", name: "Dad",             where: "home",   line: "I am your dad. If something feels wrong, come to me." },
  grandma:   { emoji: "👵", name: "Grandma",         where: "home",   line: "I am Grandma. I love you. You can always talk to me." },
  teacher:   { emoji: "👩‍🏫", name: "Teacher",        where: "school", line: "I am your teacher. My job is to help you learn AND stay safe." },
  principal: { emoji: "🧑‍💼", name: "Principal", where: "school", line: "I am the principal. I work in the school office. Big problems come to me!" },
  nurse:     { emoji: "🧑‍⚕️", name: "Nurse",      where: "school", line: "I am the school nurse. If you are hurt or scared, my door is open." },
  counselor: { emoji: "🧑‍🦱", name: "Counselor",  where: "school", line: "I am the school counselor. Talking about feelings is my favorite job." },
  librarian: { emoji: "👩‍🦳", name: "Librarian",        where: "library", line: "I am the librarian. I help you find books and check them out." },
  doctor:    { emoji: "👨‍⚕️", name: "Doctor",     where: "clinic", line: "I am a doctor. I help your body feel better. You can tell me if something hurts." },
  firefighter:{ emoji: "👩‍🚒", name: "Firefighter", where: "firestation", line: "I am a firefighter. If there is danger, we come fast to help!" },
  officer:   { emoji: "👮", name: "Police Officer",    where: "police", line: "I am a police officer. Helping people stay safe is my whole job." },
};

/* ---------------- places & rooms (Discovery mode) ----------------
   action = the anchor activity taught for the room.
   quiz = "What do we do here?"  (correct first; UI shuffles) */
HH.PLACES = {
  house: {
    name: "My House", emoji: "🏠", unlocked: true,
    helpers: ["mom", "dad", "grandma"],
    rooms: [
      { id: "bedroom",  name: "Bedroom",     emoji: "🛏️", action: "We sleep in the bedroom.",
        objects: [["🛏️","bed — we sleep here","🧒🛏️💤","We lie on the bed and sleep. Good night!"],["🧸","teddy — a cozy friend","🧒🤗🧸","We hug the teddy. So cozy!"],["🌙","lamp — soft light for night","🧒💡🌙","We turn on the lamp for soft light at night."]],
        quiz: { q: "What do we do in the bedroom?", a: ["Sleep 😴", "Cook food 🍳", "Wash the car 🚗"] } },
      { id: "bathroom", name: "Bathroom",    emoji: "🛁", action: "We wash our hands and brush our teeth in the bathroom.",
        objects: [["🚽","toilet","🧒🚽🧻","We use the toilet, then flush and wash our hands."],["🪥","toothbrush — brush morning and night","🧒🪥✨","We brush our teeth in the morning and at night."],["🧼","soap — wash your hands","🧼🙌💧","We rub soap on our hands and wash with water."]],
        quiz: { q: "What do we do in the bathroom?", a: ["Brush our teeth 🪥", "Ride a bike 🚲", "Take a nap 😴"] } },
      { id: "kitchen",  name: "Kitchen",     emoji: "🍳", action: "Grown-ups cook food in the kitchen.",
        objects: [["🍳","stove — hot! only grown-ups","🧑‍🍳🍳🔥","A grown-up cooks food on the stove. Hot — only grown-ups!"],["🧊","fridge — keeps food cold","🧒🧊🥛","The fridge keeps food cold, like milk and fruit."],["🥣","bowl — for mixing","🧑‍🍳🥣🥄","We mix yummy things in the bowl."]],
        quiz: { q: "What happens in the kitchen?", a: ["Cooking food 🍳", "Sleeping 😴", "Playing soccer ⚽"] } },
      { id: "dining",   name: "Dining Room", emoji: "🍽️", action: "We eat together in the dining room.",
        objects: [["🍽️","table — we sit and eat","👨‍👩‍👧🍽️😋","The family eats together at the table."],["🪑","chair","🧒🪑🍽️","We sit on the chair to eat."],["🥛","milk — yum","🧒🥛💪","We drink milk to grow strong."]],
        quiz: { q: "What do we do in the dining room?", a: ["Eat food 🍽️", "Take a bath 🛁", "Drive a car 🚗"] } },
      { id: "living",   name: "Living Room", emoji: "🛋️", action: "We play and rest together in the living room.",
        objects: [["🛋️","sofa — sit and relax","👨‍👩‍👧🛋️📖","We sit on the sofa and read together."],["📚","books — story time","🧒📚😊","We read storybooks. So many adventures!"],["🧩","puzzle — play together","🧒🧩🎉","We build the puzzle piece by piece. You did it!"]],
        quiz: { q: "What do we do in the living room?", a: ["Play and rest 🧩", "Brush teeth 🪥", "See the doctor 🩺"] } },
    ],
  },
  school: {
    name: "My School", emoji: "🏫", unlocked: true,
    helpers: ["teacher", "principal", "nurse", "counselor"],
    rooms: [
      { id: "classroom", name: "Classroom",   emoji: "📚", action: "We learn in the classroom. The teacher teaches here.",
        objects: [["🖍️","crayons — for drawing","🧒🖍️🌈","We draw colorful pictures with crayons."],["📚","books — for learning","👩‍🏫📚🧒","The teacher reads books with us to learn."],["🪑","your desk","🧒🪑✏️","We sit at our desk to learn and write."]],
        quiz: { q: "What do we do in the classroom?", a: ["Learn 📚", "Sleep 😴", "Cook 🍳"] } },
      { id: "cafeteria", name: "Cafeteria",   emoji: "🍎", action: "We eat lunch in the cafeteria.",
        objects: [["🍎","apple — a healthy snack","🧒🍎😋","We eat a crunchy apple. Yum!"],["🥪","lunch tray","🧒🥪🍽️","We carry our lunch on the tray to the table."],["🪑","long tables — sit with friends","🧒🧒🪑","We sit with friends at the long tables."]],
        quiz: { q: "What do we do in the cafeteria?", a: ["Eat lunch 🍎", "See the dentist 🦷", "Sleep 😴"] } },
      { id: "playground", name: "Playground", emoji: "🛝", action: "We play outside at recess on the playground.",
        objects: [["🛝","slide — wheee!","🧒🛝😄","We climb up and slide down. Wheee!"],["🏀","ball — take turns","🧒🏀🧒","We take turns throwing the ball with friends."],["🌳","tree — nice shade","🌳🐦☀️","The tree gives us cool shade. Birds live there!"]],
        quiz: { q: "What do we do on the playground?", a: ["Play 🛝", "Do homework ✏️", "Take a bath 🛁"] } },
      { id: "office",    name: "School Office", emoji: "🏢", action: "The office is where the principal works. You can come here for help any time.",
        objects: [["🖥️","the front desk — say your name here","🧒🖥️🙋","We say our name at the front desk to get help."],["📞","phone — the office can call your family","🧑‍💼📞👨‍👩‍👧","The office can call your family on the phone."],["🚪","the principal's door — knock, it is okay!","🧒🚪🧑‍💼","We knock on the principal's door. Come in!"]],
        quiz: { q: "Who works in the school office?", a: ["The principal 🧑‍💼", "A firefighter 👩‍🚒", "A dog 🐶"] } },
      { id: "nurseroom", name: "Nurse's Office", emoji: "🩹", action: "The nurse's office is where the nurse helps you feel better.",
        objects: [["🩹","band-aids","🧑‍⚕️🩹🧒","The nurse puts a band-aid on an ouchie."],["🛏️","rest bed — lie down if you feel sick","🧒🛏️😌","We rest on the bed when we feel sick."],["🌡️","thermometer — checks if you are hot","🧑‍⚕️🌡️🧒","The nurse checks if you are too hot with the thermometer."]],
        quiz: { q: "When do we go to the nurse's office?", a: ["When we are hurt or feel sick 🩹", "When we want candy 🍬", "When it is time to sing 🎵"] } },
    ],
  },
  library: {
    name: "Library", emoji: "📖", unlocked: true,
    helpers: ["librarian"],
    rooms: [
      { id: "readingroom", name: "Reading Room", emoji: "📚", action: "The library is full of books! We read quietly and use soft voices here.",
        objects: [["📚","books — so many stories to read","🧒📚🤫","We pick a book and read quietly."],["🪑","comfy chair — sit and read","🧒🪑📖","We sit in the comfy chair to read."],["🌍","globe — see the whole world","🧒🌍👀","We spin the globe and see the whole world."]],
        quiz: { q: "How do we talk in the library?", a: ["With a quiet voice 🤫", "Shouting loud 📢", "Singing songs 🎤"] } },
      { id: "checkout", name: "Checkout Desk", emoji: "💳", action: "To take a book home, bring it to the librarian at the checkout desk. Beep! Now it is yours to borrow.",
        objects: [["📖","a book to borrow — bring it to the desk","🧒📖👩‍🦳","We bring the book to the librarian to borrow it."],["💳","library card — shows the book is yours to borrow","🧒💳📖","We show our library card. Now the book is ours to borrow!"],["🖨️","scanner — beep! all checked out","👩‍🦳🖨️✅","The librarian scans the book. Beep! All checked out."]],
        quiz: { q: "How do we take a book home?", a: ["Check it out at the desk 💳", "Hide it in our bag 🙈", "Just run home with it 🏃"] } },
    ],
  },
  clinic: {
    name: "Doctor's Office", emoji: "🩺", unlocked: true,
    helpers: ["doctor"],
    rooms: [
      { id: "waiting", name: "Waiting Room", emoji: "🪑", action: "We sit in the waiting room until it is our turn to see the doctor.",
        objects: [["🪑","waiting chairs — sit until your name is called","🧒🪑⏰","We sit and wait for our turn."],["📚","picture books — read while you wait","🧒📚😌","We read picture books while we wait."],["🧸","toy box — play quietly while waiting","🧒🧸🤫","We play quietly with the toys while waiting."]],
        quiz: { q: "What do we do in the waiting room?", a: ["Wait for our turn 🪑", "See the fire truck 🚒", "Take a bath 🛁"] } },
      { id: "examroom", name: "Doctor's Room", emoji: "🩺", action: "The doctor checks your body to keep you healthy. You can tell the doctor if something hurts.",
        objects: [["🩺","stethoscope — listens to your heart, thump-thump","🧑‍⚕️🩺🧒","The doctor listens to your heart with the stethoscope. Thump-thump!"],["⚖️","scale — checks how you have grown","🧒⚖️📏","We stand on the scale to see how much we grew."],["🛏️","exam bed — sit up here for your checkup","🧒🛏️🧑‍⚕️","We sit on the exam bed for our checkup."]],
        quiz: { q: "What does the doctor do?", a: ["Helps your body stay healthy 🩺", "Teaches math 📐", "Drives a bus 🚌"] } },
    ],
  },
  firestation: {
    name: "Fire Station", emoji: "🚒", unlocked: true,
    helpers: ["firefighter"],
    rooms: [
      { id: "garage", name: "Truck Garage", emoji: "🚒", action: "The big red fire truck lives in the garage, ready to zoom out and help!",
        objects: [["🚒","fire truck — it zooms to help people","👩‍🚒🚒🔥","Firefighters drive the truck fast to help people."],["🧯","fire extinguisher — puts out small fires","👩‍🚒🧯🔥","A firefighter sprays the extinguisher to put out small fires."],["🔔","alarm bell — RING! time to go help","🔔👩‍🚒🏃","RING! When the bell rings, firefighters run to help."]],
        quiz: { q: "What does the fire truck do?", a: ["Zooms out to help people 🚒", "Delivers pizza 🍕", "Sleeps all day 😴"] } },
      { id: "gearroom", name: "Gear Room", emoji: "⛑️", action: "Firefighters keep their helmets, coats and boots ready to put on super fast.",
        objects: [["⛑️","helmet — keeps a firefighter's head safe","👩‍🚒⛑️🛡️","The firefighter wears the helmet to stay safe."],["🧥","fire coat — strong and heat-proof","👩‍🚒🧥🔥","The big coat keeps the fire's heat away."],["🥾","boots — jump in and go!","👩‍🚒🥾💨","Jump into the boots and GO!"]],
        quiz: { q: "Why do firefighters wear helmets?", a: ["To keep their heads safe ⛑️", "Because they are pretty 🎀", "To hear music 🎧"] } },
    ],
  },
  police: {
    name: "Police Station", emoji: "🚓", unlocked: true,
    helpers: ["officer"],
    rooms: [
      { id: "frontdesk", name: "Front Desk", emoji: "🛡️", action: "The police officer helps people at the front desk. Police officers are safe helpers you can always ask for help.",
        objects: [["🛡️","badge — it means 'I am here to help you'","👮🛡️😊","The badge means: I am here to help you."],["📻","radio — officers talk to each other to help fast","👮📻👮","Officers talk on the radio to bring help fast."],["📞","phone — people call when they need help","🧑📞👮","People call the police phone when they need help."]],
        quiz: { q: "What do police officers do?", a: ["Help people stay safe 🛡️", "Make cookies 🍪", "Fly airplanes ✈️"] } },
      { id: "safecorner", name: "Safe Corner", emoji: "🗺️", action: "If you are ever lost, find a police officer. You wait in the safe corner while they find your family.",
        objects: [["🗺️","town map — helps find the way home","👮🗺️🏠","The officer looks at the map to find your home."],["🧸","waiting teddy — a cozy friend while you wait","🧒🧸😌","You hug the waiting teddy until your family comes."],["🥤","water cup — helpers make sure you are okay","🧒🥤💧","Helpers give you water. You are okay."]],
        quiz: { q: "What do you do if you are lost?", a: ["Find a police officer 👮", "Hide where no one can see 🙈", "Go with a stranger 🚶"] } },
    ],
  },
};

/* ---------------- Mode 2: My Helping Hand lessons ---------------- */
HH.HAND_INTRO = [
  "Everyone needs helpers. Helpers keep us safe.",
  "Pick 5 helpers — one for each finger of your hand!",
  "Pick helpers from DIFFERENT places. Some at home, some at school.",
  "If one helper cannot help you, you go to the NEXT finger. Keep telling!",
];

HH.FEELINGS = {
  intro: "Your body talks to you! When something is wrong, your body gives you the UH-OH feeling.",
  signs: [
    { emoji: "💓", text: "Your heart beats fast" },
    { emoji: "😖", text: "Your tummy hurts" },
    { emoji: "🤲", text: "Your hands feel shaky" },
    { emoji: "😢", text: "You want to cry" },
    { emoji: "🙈", text: "You want to hide" },
  ],
  lesson: "The uh-oh feeling is a message: GO TELL A HELPER. You are not in trouble for feeling it. Your feelings are never wrong.",
  quiz: { q: "You get the uh-oh feeling. What do you do?",
          a: ["Go tell a helper on my hand 🖐️", "Keep it inside forever 🤐", "Nothing — feelings do not matter 🚫"] },
};

HH.SECRETS = {
  intro: "Some secrets are HAPPY surprises. Some secrets feel BAD. Let's learn the difference!",
  rule: "A happy surprise will be told soon and makes people smile. A bad secret makes your tummy feel uh-oh — and someone says 'never tell.' Bad secrets are for TELLING a helper.",
  items: [
    { text: "We got Mom a surprise gift! Keep it secret until her birthday on Sunday.", emoji: "🎁", safe: true,
      why: "This is a happy surprise. Everyone will smile on Sunday!" },
    { text: "Do not tell anyone I pushed you, or you will be in big trouble.", emoji: "😠", safe: false,
      why: "Someone said 'never tell' about something that hurt you. Tell a helper. You will NOT be in trouble." },
    { text: "Shh! We are planning a surprise party for Grandma!", emoji: "🎉", safe: true,
      why: "A party surprise is a happy secret. Grandma will laugh and clap!" },
    { text: "This is our secret game. Never ever tell your mom.", emoji: "🤫", safe: false,
      why: "A game you must hide from Mom is NOT a real game. Tell a helper right away." },
  ],
};

/* ---------------- Mode 3: scenarios ----------------
   Flow per scenario: SEE the situation → FEEL (spot uh-oh) →
   REACT (choose No/Go) → TELL (pick the right helper+place;
   some scenarios script the first helper as busy → practice
   KEEP TELLING) → AFFIRM (never your fault + sticker).
   tier "A" = peers/strangers. tier "B" = adults/home — abstracted,
   reviewPending until clinical sign-off. */
HH.SCENARIOS = [
  {
    id: "ball", tier: "A", place: "school", room: "playground", emoji: "🏀",
    title: "The Ball Taker",
    setup: "Every day at recess, a big kid grabs the ball out of your hands. He calls you 'too slow' and laughs.",
    feelQ: "How does your body feel?",
    feelA: ["Uh-oh feeling — tummy hurts 😖", "Super happy 😄"],
    reactQ: "What can you do FIRST?",
    reactA: ["Say 'STOP. I do not like that.' and walk away 🚶", "Grab him and push him back 😠", "Hide and never play again 🙈"],
    reactWhy: "Strong words + walking away keeps YOU safe. Hurting back can hurt you more.",
    tellTo: ["teacher"], keepTelling: false,
    tellPrompt: "Now GO and TELL. Who is the best helper at recess?",
    resolve: "Your teacher listens to every word. She talks to the kid and watches recess now. The ball is for sharing again.",
  },
  {
    id: "cookies", tier: "A", place: "school", room: "cafeteria", emoji: "🍪",
    title: "The Lunch Grabber",
    setup: "At lunch, a girl takes the cookies from your lunchbox every single day. She whispers: 'Don't tell, or else.'",
    feelQ: "She said 'don't tell.' Is this a happy surprise or a bad secret?",
    feelA: ["A bad secret — I should tell 🗣️", "A happy surprise 🎁"],
    reactQ: "What can you do?",
    reactA: ["Hold my lunchbox and go sit near a helper 🚶", "Give her my whole lunch forever 😞", "Cry alone and tell no one 😢"],
    reactWhy: "'Don't tell' is exactly when we DO tell. You did nothing wrong.",
    tellTo: ["teacher", "principal"], keepTelling: true,
    busyLine: "You tell the lunch aide. He is very busy and does not hear you. Oh no!",
    keepLine: "One helper could not help. Do we give up? NO! We go to the NEXT helper on our hand!",
    tellPrompt: "Who do you tell next?",
    resolve: "The principal thanks you for telling. 'You were brave to keep telling,' she says. Lunch is safe now — and your cookies are yours.",
  },
  {
    id: "leftout", tier: "A", place: "school", room: "playground", emoji: "⛔",
    title: "You Can't Play",
    setup: "Every day, some kids say 'You can't play with us!' and laugh at you. It happens again and again.",
    feelQ: "How does your body feel?",
    feelA: ["Sad and uh-oh 😢", "Nothing — it is fine 😐"],
    reactQ: "What can you do?",
    reactA: ["Find another friend or a helper 🚶", "Beg them every day 😞", "Say mean things back 😠"],
    reactWhy: "Being left out on purpose, again and again, is a kind of bullying. It is okay to tell.",
    tellTo: ["counselor", "teacher"], keepTelling: false,
    tellPrompt: "Who is a great helper for friend problems?",
    resolve: "The counselor listens. 'Everyone deserves to play,' he says. He helps your class learn about including everyone.",
  },
  {
    id: "poker", tier: "A", place: "school", room: "classroom", emoji: "✏️",
    title: "The Pencil Poker",
    setup: "In class, a boy pokes your back with a pencil when the teacher is not looking. It hurts. He says you are 'telling tales' if you speak.",
    feelQ: "He says telling is bad. Is he right?",
    feelA: ["No. Telling about being hurt is ALWAYS okay 🗣️", "Should I stay quiet? 🤐"],
    reactQ: "What can you do?",
    reactA: ["Say 'Stop!' and raise my hand for the teacher ✋", "Poke him back harder ✏️", "Never go to school again 🙈"],
    reactWhy: "Telling a helper about being hurt is not tattling. It is being safe.",
    tellTo: ["teacher", "mom"], keepTelling: true,
    busyLine: "Your teacher is helping another kid and says 'one minute' — but the bell rings and everyone leaves.",
    keepLine: "The first try did not work. Keep telling! Who else is on your hand?",
    goLine: "School is over. Time to go home. Let's find Mom and tell her!",
    tellPrompt: "Who can you tell at home?",
    resolve: "You tell Mom everything at home. Mom hugs you and calls the school. The poking stops. Telling twice worked!",
  },
  {
    id: "follower", tier: "A", place: "school", room: "playground", emoji: "🧍",
    title: "The Stranger at the Fence",
    setup: "A person you do not know stands at the playground fence. He asks you to come closer and says he has candy for you.",
    feelQ: "How does your body feel?",
    feelA: ["Uh-oh! Something is wrong 💓", "Excited about candy 🍬"],
    reactQ: "What do you do?",
    reactA: ["NO — GO — TELL: step back and run to a helper 🏃", "Go closer to see the candy 🍬", "Just wave and stay there 👋"],
    reactWhy: "We never go with someone we do not know. No. Go. Tell. Fast feet!",
    tellTo: ["teacher", "principal"], keepTelling: false,
    tellPrompt: "You ran away — great job! Now tell a helper right away. Who?",
    resolve: "Your teacher acts fast and tells the principal. The grown-ups keep everyone safe. 'You did EXACTLY the right thing,' they say.",
  },
  /* ---------- Tier B: adults & home — CLINICAL REVIEW PENDING ---------- */
  {
    id: "aide", tier: "B", reviewPending: true, place: "school", room: "classroom", emoji: "💪",
    title: "The Grabbing Grown-Up",
    setup: "A grown-up helper at school grabs your arm hard when you are slow. It hurts. She says: 'If you tell, you will lose recess.'",
    feelQ: "A grown-up did this. Is it still okay to tell?",
    feelA: ["YES. Grown-ups are not allowed to hurt me 🗣️", "Are grown-ups always right? 🤔"],
    reactQ: "What is true?",
    reactA: ["My body belongs to me. Hurting me is not allowed — even for grown-ups 💙", "Was it my fault for being slow? 🤔", "Will I lose recess if I tell? 😨"],
    reactWhy: "No one is allowed to hurt you. Not kids. Not grown-ups. Not even grown-ups whose job is to help. And telling can NEVER get you in trouble.",
    tellTo: ["teacher", "principal", "mom"], keepTelling: true,
    busyLine: "You tell one grown-up, but nothing changes. The grabbing happens again.",
    keepLine: "When nothing changes, we do NOT stop. We tell the NEXT helper. And the next. Keep telling until it stops!",
    tellPrompt: "Who else can you tell?",
    resolve: "You keep telling — and Mom and the principal BOTH listen. The grown-ups fix it. 'Thank you for telling us. It was never your fault.'",
  },
  {
    id: "cousin", tier: "B", reviewPending: true, place: "house", room: "living", emoji: "🎮",
    title: "Not a Real Game",
    setup: "A big cousin hits you when no one is looking. He laughs and says 'it's just a game!' But it hurts, and it does not feel like a game.",
    feelQ: "He says it is a game. What does YOUR body say?",
    feelA: ["Uh-oh. It hurts. It is NOT a game 😖", "Games hurt sometimes, it is fine 😐"],
    reactQ: "What is true?",
    reactA: ["If it hurts and feels bad, it is not a game — I can tell 💙", "Is it okay because it is family? 🤔", "Do I have to keep playing? 😨"],
    reactWhy: "A real game feels fun for EVERYONE. If it hurts you, you can say NO and tell — even about family.",
    tellTo: ["mom", "dad", "grandma"], keepTelling: false,
    tellPrompt: "Who at home can you tell?",
    resolve: "Grandma listens to everything. 'Telling me was right,' she says. The grown-ups make it stop. You are safe.",
  },
  {
    id: "scaryhome", tier: "B", reviewPending: true, place: "school", room: "nurseroom", emoji: "🌧️",
    title: "When Home Feels Scary",
    setup: "Someone at home yells at you and scares you almost every day. They say you are bad. Your tummy hurts a lot.",
    feelQ: "Is it your fault when a grown-up scares you?",
    feelA: ["NO. It is never my fault 💙", "Did I do something wrong? 😟"],
    reactQ: "Your home helpers cannot help this time. Where else are helpers?",
    reactA: ["At school! Teachers, the nurse, the counselor 🏫", "Is there nowhere else? 😢", "Should I keep it secret? 🤐"],
    reactWhy: "This is why your hand has helpers from DIFFERENT places. If home does not feel safe, school helpers can help you.",
    tellTo: ["teacher", "nurse", "counselor"], keepTelling: true,
    busyLine: "It is hard to find the words the first time, and the moment passes.",
    keepLine: "That is okay. Trying to tell counts. Try again — pick another helper. Helpers WANT to listen.",
    tellPrompt: "Who at school will you tell?",
    resolve: "The nurse sits with you and listens to every word. 'You are not bad. You are brave,' she says. 'Grown-ups will help now.' And they do.",
  },
  /* ---------- Wave 2 (2026-07-05): community safety + being-a-friend ---------- */
  {
    id: "lost", tier: "A", place: "library", room: "readingroom", emoji: "🧭",
    title: "Lost!",
    setup: "You are at the library. You look up — you cannot see your grown-up anywhere. Everything feels too big.",
    feelQ: "How does your body feel?",
    feelA: ["Uh-oh feeling — scared and shaky 💓", "Does it matter? 🤔"],
    reactQ: "What do you do FIRST?",
    reactA: ["Stay where you are and find a worker to help 🧍", "Run outside to search the street? 🏃", "Hide under a table? 🙈"],
    reactWhy: "Stay put and ask a helper. Grown-ups can find you much faster when you stay inside and tell a worker.",
    tellTo: ["librarian", "officer"], keepTelling: true,
    busyLine: "The librarian holds your hand. 'You are safe with me. Police officers are the BEST at finding families!'",
    keepLine: "Helpers can take you to MORE helpers. That is their job!",
    goLine: "The librarian walks you to the police station. Let's find the police officer!",
    tellPrompt: "Who can help when you are lost?",
    resolve: "The police officer smiles. 'You did everything right — you stayed put and told helpers.' Very soon your grown-up is there, hugging you tight.",
  },
  {
    id: "friend", tier: "A", place: "school", room: "playground", emoji: "🤝",
    title: "Help a Friend",
    setup: "At recess, some kids laugh at your friend and say she cannot play. Your friend looks very sad.",
    feelQ: "Your friend is being left out. How does that feel?",
    feelA: ["My tummy says uh-oh — this is not kind 😟", "Is it funny? 🤔"],
    reactQ: "What can YOU do for your friend?",
    reactA: ["Stand next to my friend and say 'Come play with me!' 🤝", "Laugh along with the kids? 😬", "Look away and do nothing? 🙈"],
    reactWhy: "Being a friend is brave. You can also get a grown-up — telling for a FRIEND is helping, not tattling.",
    tellTo: ["teacher", "counselor"], keepTelling: false,
    tellPrompt: "Who can you tell to help your friend?",
    resolve: "The teacher thanks you for speaking up for your friend. Your friend smiles at you. Helping a friend feels GOOD.",
  },
  {
    id: "alarm", tier: "A", place: "house", room: "living", emoji: "🚨",
    title: "The Loud Alarm",
    setup: "BEEP! BEEP! BEEP! The smoke alarm is very loud. It hurts your ears. Something might be burning.",
    feelQ: "The alarm is loud and scary. What does it tell you?",
    feelA: ["Go outside fast — the alarm means GO! 🏃", "Should I hide under my bed? 🛏️"],
    reactQ: "What do we do when the smoke alarm rings?",
    reactA: ["Walk out fast with my family and stay outside 🚪", "Stop to pack my toys? 🧸", "Hide in the closet? 🙈"],
    reactWhy: "Never hide from an alarm. Loud is okay — it is the sound of keeping you SAFE. Get out, stay out.",
    tellTo: ["mom", "firefighter"], keepTelling: true,
    busyLine: "Outside, Mom hugs you. 'Perfect! You came out right away.' The fire truck arrives — WEE-OO WEE-OO!",
    keepLine: "Firefighters always check that everyone is safe. Let's go tell the firefighter!",
    goLine: "Let's visit the fire station and tell the firefighter what you did!",
    tellPrompt: "Who checks that everyone is safe?",
    resolve: "The firefighter gives you a high five. 'You are a safety star! Out fast, stay out, never hide.' The grown-ups take care of everything else.",
  },
  {
    id: "different", tier: "A", place: "school", room: "playground", emoji: "🌟",
    title: "Just Being Me",
    setup: "You flap your hands when you are happy. Some kids point and laugh: 'Why do you do that? Weird!'",
    feelQ: "The kids laughed at you. How does your body feel?",
    feelA: ["Sad and uh-oh 😢", "Does laughing mean it is fine? 🤔"],
    reactQ: "What is TRUE?",
    reactA: ["There is nothing wrong with me. Everybody's body is different 🌟", "Do I have to stop being me? 😟", "Should I hide my happy hands forever? 🤐"],
    reactWhy: "Flapping, spinning, humming — bodies do different things. Different is not wrong. The unkind laughing is the problem, not you.",
    tellTo: ["counselor", "teacher"], keepTelling: false,
    tellPrompt: "Who helps when kids are unkind?",
    resolve: "The counselor says: 'I love how you know yourself. We will help the class learn that everyone is different — and that is what makes friends interesting.'",
  },
  {
    id: "touch", tier: "B", place: "house", room: "living", emoji: "🩱",
    title: "My Body Is Mine",
    setup: "Someone wants to touch the private parts of your body — the parts your swimsuit covers. They say: 'It is a secret game.'",
    feelQ: "Private parts are private. Is this a real game?",
    feelA: ["NO. My swimsuit parts are PRIVATE 🩱", "Is it a game if they say so? 🤔"],
    reactQ: "What can you say and do?",
    reactA: ["Say 'NO! STOP!' big and loud, and move away 🗣️", "Do I have to be polite and stay? 😟", "Should I keep the secret game secret? 🤐"],
    reactWhy: "Your body belongs to YOU. No one may touch your private parts — not kids, not grown-ups, not family. A big loud NO is always allowed.",
    tellTo: ["mom", "nurse"], keepTelling: true,
    busyLine: "Mom listens to every word. And guess what? You can tell MORE helpers too — the more helpers know, the safer you are.",
    keepLine: "Keep telling until grown-ups help. You will NEVER be in trouble for telling.",
    goLine: "At school, the nurse is a safe helper too. Let's tell her!",
    tellPrompt: "Who do you tell?",
    resolve: "You told Mom AND the nurse. They both say: 'Thank you for telling. You did nothing wrong. We will keep you safe.' And they do.",
  },
  {
    id: "secretgift", tier: "B", place: "house", room: "living", emoji: "🎁",
    title: "The Secret Present",
    setup: "A grown-up you know gives you candy and whispers: 'Do not tell your mom. This is our little secret.'",
    feelQ: "A present you must keep secret — happy surprise or bad secret?",
    feelA: ["A bad secret — presents should never be secret 🗣️", "Is it okay because it is candy? 🤔"],
    reactQ: "What is true about presents and secrets?",
    reactA: ["Safe grown-ups never ask me to keep secrets from Mom 💙", "Do I owe them a secret because they gave me candy? 🤔", "Should I keep just this one little secret? 🤐"],
    reactWhy: "A safe grown-up NEVER says 'do not tell your mom.' That is exactly when we tell.",
    tellTo: ["mom", "dad"], keepTelling: false,
    tellPrompt: "Who do you tell about the secret present?",
    resolve: "Mom says: 'Thank you for telling me — you did just right. Presents are never secrets.' You feel light and safe again.",
  },
];

/* ---------------- in-world enactment data ----------------
   Discovery "find & do" tasks replace quiz cards: Nilu asks, the
   child WALKS to the right room and taps the glowing target object.
   task = { ask, roomId, objIndex, praise } */
HH.FIND_TASKS = {
  house: [
    { ask: "Where do we sleep? Walk there and tap the bed!", roomId: "bedroom", objIndex: 0, praise: "Yes! We sleep in the bedroom! 😴" },
    { ask: "Time to brush our teeth! Find the toothbrush!", roomId: "bathroom", objIndex: 1, praise: "Yes! We brush teeth in the bathroom! 🪥" },
    { ask: "Grown-ups cook food somewhere. Find the stove!", roomId: "kitchen", objIndex: 0, praise: "Yes! Cooking happens in the kitchen! 🍳" },
    { ask: "Where do we eat together? Tap the table!", roomId: "dining", objIndex: 0, praise: "Yes! We eat in the dining room! 🍽️" },
    { ask: "Let's play a puzzle! Where do we play and rest?", roomId: "living", objIndex: 2, praise: "Yes! We play in the living room! 🧩" },
  ],
  school: [
    { ask: "Where do we learn? Walk there and tap the books!", roomId: "classroom", objIndex: 1, praise: "Yes! We learn in the classroom! 📚" },
    { ask: "It is lunch time! Find your lunch tray!", roomId: "cafeteria", objIndex: 1, praise: "Yes! We eat lunch in the cafeteria! 🍎" },
    { ask: "Recess time! Find the slide!", roomId: "playground", objIndex: 0, praise: "Yes! We play on the playground! 🛝" },
    { ask: "Where does the principal work? Find the front desk!", roomId: "office", objIndex: 0, praise: "Yes! The office is where the principal works! 🏢" },
    { ask: "You feel sick. Where can you rest? Find the rest bed!", roomId: "nurseroom", objIndex: 1, praise: "Yes! The nurse helps you in the nurse's office! 🩹" },
  ],
  library: [
    { ask: "So many stories! Find the books in the Reading Room!", roomId: "readingroom", objIndex: 0, praise: "Yes! Libraries are full of books! 📚" },
    { ask: "You want to take a book home. Find the book at the Checkout Desk!", roomId: "checkout", objIndex: 0, praise: "Yes! First we bring the book to the desk! 📖" },
    { ask: "Now check it out! Find the scanner — beep!", roomId: "checkout", objIndex: 2, praise: "Beep! The book is checked out. Now you can take it home! 🎉" },
  ],
  clinic: [
    { ask: "We wait our turn first. Find the waiting chairs!", roomId: "waiting", objIndex: 0, praise: "Yes! We wait in the waiting room! 🪑" },
    { ask: "The doctor listens to your heart. Find the stethoscope!", roomId: "examroom", objIndex: 0, praise: "Thump-thump! The stethoscope hears your heart! 🩺" },
    { ask: "Time for your checkup! Find the exam bed!", roomId: "examroom", objIndex: 2, praise: "Yes! You sit up there and the doctor checks you! 🛏️" },
  ],
  firestation: [
    { ask: "Where is the big red fire truck? Go find it!", roomId: "garage", objIndex: 0, praise: "There it is! The fire truck zooms out to help people! 🚒" },
    { ask: "Firefighters need their helmets. Find one in the Gear Room!", roomId: "gearroom", objIndex: 0, praise: "Yes! Helmets keep firefighters safe! ⛑️" },
    { ask: "RING RING! Find the alarm bell!", roomId: "garage", objIndex: 2, praise: "Ring! When the bell rings, firefighters go help! 🔔" },
  ],
  police: [
    { ask: "Police officers wear a special badge. Find it!", roomId: "frontdesk", objIndex: 0, praise: "Yes! A badge means 'I am here to help you'! 🛡️" },
    { ask: "If you are lost, where do you wait? Find the waiting teddy in the Safe Corner!", roomId: "safecorner", objIndex: 1, praise: "Yes! You wait in the safe corner and police find your family! 🧸" },
    { ask: "Officers talk to each other to help fast. Find the radio!", roomId: "frontdesk", objIndex: 1, praise: "Yes! The radio calls more helpers super fast! 📻" },
  ],
};

/* short speech-bubble lines for scenario actors (in-world, ≤7 words) */
HH.SCENARIO_ACTORS = {
  ball:     { emoji: "🧒", name: "A big kid", bubble: "Give me the ball! You're too slow!" },
  cookies:  { emoji: "👧", name: "A girl", bubble: "Give me your cookies. Don't tell!" },
  leftout:  { emoji: "🧒", name: "Kids", bubble: "You can't play with us!" },
  poker:    { emoji: "🧒", name: "A boy", bubble: "*poke poke* Don't be a tattletale!" },
  follower: { emoji: "🧍", name: "Stranger", bubble: "Come closer! I have candy…" },
  aide:     { emoji: "🧑", name: "The grown-up", bubble: "Hurry up! *grabs arm* Don't tell!" },
  cousin:   { emoji: "🧒", name: "Cousin", bubble: "It's just a game! *hits*" },
  scaryhome:{ emoji: "🌧️", name: "At home", bubble: "…yelling again…" },
  friend:    { emoji: "🧒", name: "Some kids", bubble: "Ha ha! You can't play with us!" },
  different: { emoji: "🧒", name: "Some kids", bubble: "Why do you flap like that? Weird!" },
  secretgift:{ emoji: "🧑", name: "A grown-up you know", bubble: "Shh… do not tell your mom!" },
};

/* which helper stands in which room (placeId -> roomId -> helperId) */
HH.HELPER_SPOTS = {
  house:  { kitchen: "mom", living: "dad", dining: "grandma" },
  school: { classroom: "teacher", office: "principal", nurseroom: "nurse", cafeteria: "counselor" },
  library:     { checkout: "librarian" },
  clinic:      { examroom: "doctor" },
  firestation: { garage: "firefighter" },
  police:      { frontdesk: "officer" },
};

HH.AFFIRMATIONS = [
  "Telling is brave. 💙",
  "It is NEVER your fault.",
  "Your body belongs to you.",
  "Helpers want to keep you safe.",
  "If one helper cannot help — tell the next one. Keep telling!",
  "You are never in trouble for telling.",
];

/* ---------------- Getting Ready: appointment-prep walkthroughs ----------------
   ADDED 2026-07-11 — desensitization / predictability rehearsals for common
   appointments (doctor, dentist, haircut). These are NOT safety scenarios:
   there are no wrong answers and no danger. The child walks through exactly
   what will happen — what they will SEE, HEAR and FEEL — with ONE gentle
   coping tool practiced inside each walkthrough:
     doctor  = 3 slow breaths        (coping: "breath")
     dentist = raise-your-hand pause (coping: "hand")
     haircut = squeeze-hands trick   (coping: "squeeze")
   Same language rules as the rest of this file: short literal sentences,
   present tense, never scary, first-person-supportive. Individually gated
   behind per-item adult sign-off like every other section (Tier A level).
   step = { label, emoji, text, coping?, copingPrompt?, copingDone? } */
HH.PREP_TITLE = "Getting Ready 🩺";
HH.PREP_SUB = "Practice what happens at an appointment — step by step, so nothing is a surprise.";
HH.PREP_DONE_LINE = "You knew everything that would happen. You were so brave!";
HH.PREP = [
  {
    id: "doctorvisit", title: "Doctor Visit", emoji: "🩺", place: "clinic",
    intro: "Let's practice a doctor visit! I will show you everything that happens. No surprises.",
    steps: [
      { label: "See", emoji: "🪑",
        text: "First we sit in the waiting room. The waiting room has chairs and books. We wait for our turn." },
      { label: "Hear", emoji: "📣",
        text: "Someone calls your name. That is how you know it is your turn. You walk with your grown-up." },
      { label: "See", emoji: "📏",
        text: "Next we see how big you are growing! You stand on the scale, then stand tall by the wall. Easy!" },
      { label: "See", emoji: "🚪",
        text: "Then we go to a little room and sit on the soft exam bed. The doctor comes to see you there." },
      { label: "Feel + Practice", emoji: "🫁", coping: "breath",
        text: "The doctor listens to your heart with a little circle. The circle feels a little cold. It only takes a few seconds.",
        copingPrompt: "While the doctor listens, we take 3 slow breaths. Tap the circle to breathe with me!",
        copingDone: "Three slow breaths! Your body feels calm. You can use slow breaths any time." },
      { label: "See", emoji: "👂",
        text: "The doctor looks in your ears with a tiny light. It does not hurt. It tickles a little bit." },
      { label: "All done", emoji: "🌟",
        text: "All done! The doctor says you are growing great. You get a sticker!" },
    ],
  },
  {
    id: "dentistvisit", title: "Dentist Visit", emoji: "🦷", place: "clinic",
    intro: "Let's practice a dentist visit! I will show you everything that happens. No surprises.",
    steps: [
      { label: "See", emoji: "🪑",
        text: "At the dentist there is a big special chair. The chair moves up and down slowly. You get to ride it!" },
      { label: "See", emoji: "💡",
        text: "There is a bright light so the dentist can see your teeth. You can close your eyes if it is too bright. That is okay!" },
      { label: "Feel", emoji: "🪞",
        text: "The dentist counts your teeth with a tiny mirror. One, two, three… It does not hurt. It just feels a little funny." },
      { label: "Practice", emoji: "✋", coping: "hand",
        text: "Here is your special tool: if you want a break, you raise your hand. The dentist stops and waits for you.",
        copingPrompt: "Let's practice one time. Tap the hand to raise your hand!",
        copingDone: "You raised your hand! The dentist stops and waits. You can do that any time you need a pause." },
      { label: "Hear", emoji: "🪥",
        text: "The tickly toothbrush makes a buzzing sound. Bzzz! It tickles your teeth. Remember — you can raise your hand to pause!" },
      { label: "Do", emoji: "💧",
        text: "Then you get a little cup of water. You rinse and spit into the tiny sink. Whoosh!" },
      { label: "All done", emoji: "✨",
        text: "All done! Your teeth are clean and shiny. You get to pick a prize!" },
    ],
  },
  {
    id: "haircut", title: "Haircut", emoji: "💇", place: "house",
    intro: "Let's practice getting a haircut! I will show you everything that happens. No surprises.",
    steps: [
      { label: "See", emoji: "🦸",
        text: "At the haircut you sit in a big chair. You wear a cape — like a superhero! The cape keeps hair off your clothes." },
      { label: "Feel", emoji: "💦",
        text: "The hair helper sprays a little water on your hair. The water feels a little cold. It is just a tiny sprinkle." },
      { label: "Practice", emoji: "🤲", coping: "squeeze",
        text: "Here is your special tool: the squeeze-hands trick. If a feeling gets big, you squeeze your own hands together… and let go.",
        copingPrompt: "Let's practice! Tap the hands to squeeze… and let go.",
        copingDone: "Squeeze… and let go! Your hands help your body feel calm. You can do that any time in the chair." },
      { label: "Hear", emoji: "✂️",
        text: "The scissors make a snip-snip sound near your ears. The scissors never touch you. Only your hair gets cut — and hair does not feel anything." },
      { label: "Feel", emoji: "🪶",
        text: "Little hairs fall down like soft feathers. Sometimes it feels itchy. Itchy is normal. You can use your squeeze-hands trick." },
      { label: "See", emoji: "🪞",
        text: "Then you look in the mirror. You see your brand-new haircut. Looking good!" },
      { label: "All done", emoji: "🎉",
        text: "All done! The cape comes off. You shake off the itchy hairs." },
    ],
  },
];

/* ---------------- My Stickers (pure display, no new mechanics) ---------------- */
HH.STICKER_BOOK = {
  title: "My Stickers",
  empty: "Play and practice to earn your first sticker! 🌟",
  countText(n) {
    if (!n || n <= 0) return "You have no stickers yet. Keep playing!";
    return "You have " + n + " sticker" + (n === 1 ? "" : "s") + "!";
  },
};

/* ---------------- first-run movement tutorial (interiors) ---------------- */
HH.TUTORIAL_TEXT = "Use this stick to walk! 🕹️";

/* ---------------- spaced re-practice nudge (Practice menu) ---------------- */
HH.REVIEW_PROMPT = {
  banner(title) { return "Let's practice " + title + " again! 💪"; },
  button: "Let's go!",
};

/* ---------------- Grown-Ups Corner (parent-gated) ---------------- */
HH.GROWNUPS = {
  what: [
    "This game teaches the evidence-based safety triad: RECOGNIZE the warning feeling, REACT (say no / move away), REPORT to a trusted adult.",
    "Your child builds a 'Helping Hand' — five trusted adults across different settings — and practices the single most protective behavior known: KEEP TELLING until someone helps.",
    "Safe vs. unsafe secrets: surprises are okay; secrets that feel bad or come with 'never tell' are always for telling.",
    "Abuse is never depicted. Scenarios show only the situation's edge and the child's feeling, then rehearse the telling.",
  ],
  disclosure: [
    "Stay calm. Your reaction teaches them whether telling is safe.",
    "Believe them. False reports from young children are rare.",
    "Say: 'Thank you for telling me. This is not your fault. I will help you.'",
    "Do not interrogate or ask leading questions — professionals will do that properly.",
    "Do not confront the person yourself first. Report it.",
    "Write down what was said, in the child's words, with the date.",
  ],
  report: [
    ["Emergency / child in immediate danger", "Call 911"],
    ["Childhelp National Child Abuse Hotline (24/7, call or text)", "1-800-422-4453"],
    ["Crisis support (call or text)", "988"],
    ["California: contact your county Child Protective Services (CPS) hotline", "search '<your county> CPS hotline'"],
  ],
  note: "Teachers, aides, coaches and clinicians are mandated reporters in California. If a child discloses to you at school, follow your district's reporting procedure — reporting is your legal duty, not a judgment call.",
};

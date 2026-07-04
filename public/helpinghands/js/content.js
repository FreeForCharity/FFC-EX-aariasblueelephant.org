/* =====================================================================
   Belu's Helping Hands — curriculum content
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

// Phase 4 (Tier B: adult/home scenarios) is authored below but DISABLED
// per AJ 2026-07-04 — ship peer-bullying tier first, add Tier B after
// clinical review. Flip to true to enable in the scenario picker.
HH.ENABLE_TIER_B = false;

// SHA-256 of the entry password. The game is unlisted + gated until
// clinical review is complete.
HH.GATE_HASH = "d3d8d42d366ada9307d6eb08ba21c5ae7df56007fadbf07a44d23774e8a85170";

/* ---------------- helper people (friend cards) ---------------- */
HH.HELPERS = {
  mom:       { emoji: "👩", name: "Mom",             where: "home",   line: "I am your mom. You can tell me anything. I will always listen." },
  dad:       { emoji: "👨", name: "Dad",             where: "home",   line: "I am your dad. If something feels wrong, come to me." },
  grandma:   { emoji: "👵", name: "Grandma",         where: "home",   line: "I am Grandma. I love you. You can always talk to me." },
  teacher:   { emoji: "👩‍🏫", name: "Ms. Lee",        where: "school", line: "I am your teacher, Ms. Lee. My job is to help you learn AND stay safe." },
  principal: { emoji: "🧑‍💼", name: "Principal Rivera", where: "school", line: "I am the principal. I work in the school office. Big problems come to me!" },
  nurse:     { emoji: "🧑‍⚕️", name: "Nurse Joy",      where: "school", line: "I am the school nurse. If you are hurt or scared, my door is open." },
  counselor: { emoji: "🧑‍🦱", name: "Counselor Sam",  where: "school", line: "I am the school counselor. Talking about feelings is my favorite job." },
  librarian: { emoji: "👩‍🦳", name: "Ms. Pat",        where: "library", line: "I am the librarian. I help you find books and check them out." },
  doctor:    { emoji: "👨‍⚕️", name: "Doctor Kim",     where: "clinic", line: "I am a doctor. I help your body feel better. You can tell me if something hurts." },
  firefighter:{ emoji: "👩‍🚒", name: "Firefighter Max", where: "firestation", line: "I am a firefighter. If there is danger, we come fast to help!" },
  officer:   { emoji: "👮", name: "Officer Ruby",    where: "police", line: "I am a police officer. Helping people stay safe is my whole job." },
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
        objects: [["🛏️","bed — we sleep here"],["🧸","teddy — a cozy friend"],["🌙","lamp — soft light for night"]],
        quiz: { q: "What do we do in the bedroom?", a: ["Sleep 😴", "Cook food 🍳", "Wash the car 🚗"] } },
      { id: "bathroom", name: "Bathroom",    emoji: "🛁", action: "We wash our hands and brush our teeth in the bathroom.",
        objects: [["🚽","toilet"],["🪥","toothbrush — brush morning and night"],["🧼","soap — wash your hands"]],
        quiz: { q: "What do we do in the bathroom?", a: ["Brush our teeth 🪥", "Ride a bike 🚲", "Take a nap 😴"] } },
      { id: "kitchen",  name: "Kitchen",     emoji: "🍳", action: "Grown-ups cook food in the kitchen.",
        objects: [["🍳","stove — hot! only grown-ups"],["🧊","fridge — keeps food cold"],["🥣","bowl — for mixing"]],
        quiz: { q: "What happens in the kitchen?", a: ["Cooking food 🍳", "Sleeping 😴", "Playing soccer ⚽"] } },
      { id: "dining",   name: "Dining Room", emoji: "🍽️", action: "We eat together in the dining room.",
        objects: [["🍽️","table — we sit and eat"],["🪑","chair"],["🥛","milk — yum"]],
        quiz: { q: "What do we do in the dining room?", a: ["Eat food 🍽️", "Take a bath 🛁", "Drive a car 🚗"] } },
      { id: "living",   name: "Living Room", emoji: "🛋️", action: "We play and rest together in the living room.",
        objects: [["🛋️","sofa — sit and relax"],["📚","books — story time"],["🧩","puzzle — play together"]],
        quiz: { q: "What do we do in the living room?", a: ["Play and rest 🧩", "Brush teeth 🪥", "See the doctor 🩺"] } },
    ],
  },
  school: {
    name: "My School", emoji: "🏫", unlocked: true,
    helpers: ["teacher", "principal", "nurse", "counselor"],
    rooms: [
      { id: "classroom", name: "Classroom",   emoji: "📚", action: "We learn in the classroom. Ms. Lee teaches here.",
        objects: [["🖍️","crayons — for drawing"],["📚","books — for learning"],["🪑","your desk"]],
        quiz: { q: "What do we do in the classroom?", a: ["Learn 📚", "Sleep 😴", "Cook 🍳"] } },
      { id: "cafeteria", name: "Cafeteria",   emoji: "🍎", action: "We eat lunch in the cafeteria.",
        objects: [["🍎","apple — a healthy snack"],["🥪","lunch tray"],["🪑","long tables — sit with friends"]],
        quiz: { q: "What do we do in the cafeteria?", a: ["Eat lunch 🍎", "See the dentist 🦷", "Sleep 😴"] } },
      { id: "playground", name: "Playground", emoji: "🛝", action: "We play outside at recess on the playground.",
        objects: [["🛝","slide — wheee!"],["🏀","ball — take turns"],["🌳","tree — nice shade"]],
        quiz: { q: "What do we do on the playground?", a: ["Play 🛝", "Do homework ✏️", "Take a bath 🛁"] } },
      { id: "office",    name: "School Office", emoji: "🏢", action: "The office is where Principal Rivera works. You can come here for help any time.",
        objects: [["🖥️","the front desk — say your name here"],["📞","phone — the office can call your family"],["🚪","the principal's door — knock, it is okay!"]],
        quiz: { q: "Who works in the school office?", a: ["The principal 🧑‍💼", "A firefighter 👩‍🚒", "A dog 🐶"] } },
      { id: "nurseroom", name: "Nurse's Office", emoji: "🩹", action: "The nurse's office is where Nurse Joy helps you feel better.",
        objects: [["🩹","band-aids"],["🛏️","rest bed — lie down if you feel sick"],["🌡️","thermometer — checks if you are hot"]],
        quiz: { q: "When do we go to the nurse's office?", a: ["When we are hurt or feel sick 🩹", "When we want candy 🍬", "When it is time to sing 🎵"] } },
    ],
  },
  library:     { name: "Library",      emoji: "📖", unlocked: false, comingSoon: "We will learn how to check out books soon!" },
  clinic:      { name: "Doctor's Office", emoji: "🩺", unlocked: false, comingSoon: "We will visit Doctor Kim soon!" },
  firestation: { name: "Fire Station", emoji: "🚒", unlocked: false, comingSoon: "We will meet Firefighter Max soon!" },
  police:      { name: "Police Station", emoji: "🚓", unlocked: false, comingSoon: "We will meet Officer Ruby soon!" },
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
    setup: "Every day at recess, a kid named Kai grabs the ball out of your hands. He calls you 'too slow' and laughs.",
    feelQ: "How does your body feel?",
    feelA: ["Uh-oh feeling — tummy hurts 😖", "Super happy 😄"],
    reactQ: "What can you do FIRST?",
    reactA: ["Say 'STOP. I do not like that.' and walk away 🚶", "Grab him and push him back 😠", "Hide and never play again 🙈"],
    reactWhy: "Strong words + walking away keeps YOU safe. Hurting back can hurt you more.",
    tellTo: ["teacher"], keepTelling: false,
    tellPrompt: "Now GO and TELL. Who is the best helper at recess?",
    resolve: "Ms. Lee listens to every word. She talks to Kai and watches recess now. The ball is for sharing again.",
  },
  {
    id: "cookies", tier: "A", place: "school", room: "cafeteria", emoji: "🍪",
    title: "The Lunch Grabber",
    setup: "At lunch, Mia takes the cookies from your lunchbox every single day. She whispers: 'Don't tell, or else.'",
    feelQ: "Mia said 'don't tell.' Is this a happy surprise or a bad secret?",
    feelA: ["A bad secret — I should tell 🗣️", "A happy surprise 🎁"],
    reactQ: "What can you do?",
    reactA: ["Hold my lunchbox and go sit near a helper 🚶", "Give her my whole lunch forever 😞", "Cry alone and tell no one 😢"],
    reactWhy: "'Don't tell' is exactly when we DO tell. You did nothing wrong.",
    tellTo: ["teacher", "principal"], keepTelling: true,
    busyLine: "You tell the lunch aide. He is very busy and does not hear you. Oh no!",
    keepLine: "One helper could not help. Do we give up? NO! We go to the NEXT helper on our hand!",
    tellPrompt: "Who do you tell next?",
    resolve: "Principal Rivera thanks you for telling. 'You were brave to keep telling,' she says. Lunch is safe now — and your cookies are yours.",
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
    resolve: "Counselor Sam listens. 'Everyone deserves to play,' he says. He helps your class learn about including everyone.",
  },
  {
    id: "poker", tier: "A", place: "school", room: "classroom", emoji: "✏️",
    title: "The Pencil Poker",
    setup: "In class, Leo pokes your back with a pencil when the teacher is not looking. It hurts. He says you are 'telling tales' if you speak.",
    feelQ: "Leo says telling is bad. Is he right?",
    feelA: ["No. Telling about being hurt is ALWAYS okay 🗣️", "Yes, I should stay quiet 🤐"],
    reactQ: "What can you do?",
    reactA: ["Say 'Stop!' and raise my hand for the teacher ✋", "Poke him back harder ✏️", "Never go to school again 🙈"],
    reactWhy: "Telling a helper about being hurt is not tattling. It is being safe.",
    tellTo: ["teacher", "mom"], keepTelling: true,
    busyLine: "Ms. Lee is helping another kid and says 'one minute' — but the bell rings and everyone leaves.",
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
    resolve: "Ms. Lee acts fast and tells Principal Rivera. The grown-ups keep everyone safe. 'You did EXACTLY the right thing,' they say.",
  },
  /* ---------- Tier B: adults & home — CLINICAL REVIEW PENDING ---------- */
  {
    id: "aide", tier: "B", reviewPending: true, place: "school", room: "classroom", emoji: "💪",
    title: "The Grabbing Grown-Up",
    setup: "A grown-up helper at school grabs your arm hard when you are slow. It hurts. She says: 'If you tell, you will lose recess.'",
    feelQ: "A grown-up did this. Is it still okay to tell?",
    feelA: ["YES. Grown-ups are not allowed to hurt me 🗣️", "No, grown-ups are always right 🤐"],
    reactQ: "What is true?",
    reactA: ["My body belongs to me. Hurting me is not allowed — even for grown-ups 💙", "It is my fault for being slow 😞", "I will lose recess if I tell 😨"],
    reactWhy: "No one is allowed to hurt you. Not kids. Not grown-ups. Not even grown-ups whose job is to help. And telling can NEVER get you in trouble.",
    tellTo: ["teacher", "principal", "mom"], keepTelling: true,
    busyLine: "You tell one grown-up, but nothing changes. The grabbing happens again.",
    keepLine: "When nothing changes, we do NOT stop. We tell the NEXT helper. And the next. Keep telling until it stops!",
    tellPrompt: "Who else can you tell?",
    resolve: "You keep telling — and Mom and Principal Rivera BOTH listen. The grown-ups fix it. 'Thank you for telling us. It was never your fault.'",
  },
  {
    id: "cousin", tier: "B", reviewPending: true, place: "house", room: "living", emoji: "🎮",
    title: "Not a Real Game",
    setup: "A big cousin hits you when no one is looking. He laughs and says 'it's just a game!' But it hurts, and it does not feel like a game.",
    feelQ: "He says it is a game. What does YOUR body say?",
    feelA: ["Uh-oh. It hurts. It is NOT a game 😖", "Games hurt sometimes, it is fine 😐"],
    reactQ: "What is true?",
    reactA: ["If it hurts and feels bad, it is not a game — I can tell 💙", "Family can hit me if it is a joke 😞", "I have to keep playing 😨"],
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
    feelA: ["NO. It is never my fault 💙", "Yes, I must be bad 😞"],
    reactQ: "Your home helpers cannot help this time. Where else are helpers?",
    reactA: ["At school! Teachers, the nurse, the counselor 🏫", "Nowhere. Only home helpers count 😢", "I should keep it secret 🤐"],
    reactWhy: "This is why your hand has helpers from DIFFERENT places. If home does not feel safe, school helpers can help you.",
    tellTo: ["teacher", "nurse", "counselor"], keepTelling: true,
    busyLine: "It is hard to find the words the first time, and the moment passes.",
    keepLine: "That is okay. Trying to tell counts. Try again — pick another helper. Helpers WANT to listen.",
    tellPrompt: "Who at school will you tell?",
    resolve: "Nurse Joy sits with you and listens to every word. 'You are not bad. You are brave,' she says. 'Grown-ups will help now.' And they do.",
  },
];

/* ---------------- in-world enactment data ----------------
   Discovery "find & do" tasks replace quiz cards: Belu asks, the
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
    { ask: "Where does Principal Rivera work? Find the front desk!", roomId: "office", objIndex: 0, praise: "Yes! The office is where the principal works! 🏢" },
    { ask: "You feel sick. Where can you rest? Find the rest bed!", roomId: "nurseroom", objIndex: 1, praise: "Yes! Nurse Joy helps you in the nurse's office! 🩹" },
  ],
};

/* short speech-bubble lines for scenario actors (in-world, ≤7 words) */
HH.SCENARIO_ACTORS = {
  ball:     { emoji: "🧒", name: "Kai",  bubble: "Give me the ball! You're too slow!" },
  cookies:  { emoji: "👧", name: "Mia",  bubble: "Give me your cookies. Don't tell!" },
  leftout:  { emoji: "🧒", name: "Kids", bubble: "You can't play with us!" },
  poker:    { emoji: "🧒", name: "Leo",  bubble: "*poke poke* Don't be a tattletale!" },
  follower: { emoji: "🧍", name: "Stranger", bubble: "Come closer! I have candy…" },
  aide:     { emoji: "🧑", name: "The grown-up", bubble: "Hurry up! *grabs arm* Don't tell!" },
  cousin:   { emoji: "🧒", name: "Cousin", bubble: "It's just a game! *hits*" },
  scaryhome:{ emoji: "🌧️", name: "At home", bubble: "…yelling again…" },
};

/* which helper stands in which room (placeId -> roomId -> helperId) */
HH.HELPER_SPOTS = {
  house:  { kitchen: "mom", living: "dad", dining: "grandma" },
  school: { classroom: "teacher", office: "principal", nurseroom: "nurse", cafeteria: "counselor" },
};

HH.AFFIRMATIONS = [
  "Telling is brave. 💙",
  "It is NEVER your fault.",
  "Your body belongs to you.",
  "Helpers want to keep you safe.",
  "If one helper cannot help — tell the next one. Keep telling!",
  "You are never in trouble for telling.",
];

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

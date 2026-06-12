/* Aaria's Block Craft 3D — game data: blocks, blueprints, animals, language content */
window.ABC = {};

/* ============================== NON-PROFIT BRANDING ============================== */
ABC.BRAND = {
  org: "Aaria's Blue Elephant",
  tagline: 'Building a New Inclusive World',
  url: 'https://aariasblueelephant.org',
  mascot: 'Bella the Blue Elephant',
};

/* ============================== BLOCK TYPES ============================== */
/* Each block: name, emoji, base color, pattern fn drawn on a 64x64 canvas. */
ABC.BLOCK_DEFS = {
  grass:   { name:'Grass',        emoji:'🌱', color:'#6abe30', top:'#7ed957', pat:'speck',  speck:'#5aa327' },
  dirt:    { name:'Dirt',         emoji:'🟫', color:'#9b6a3c', pat:'speck',  speck:'#7d5530' },
  wood:    { name:'Tree Wood',    emoji:'🪵', color:'#8a5a2b', pat:'rings' },
  plank:   { name:'Plank',        emoji:'🧱', color:'#d9a05b', pat:'planks' },
  brick:   { name:'Brick',        emoji:'🟥', color:'#c0584b', pat:'bricks' },
  stone:   { name:'Stone',        emoji:'🪨', color:'#9aa0a6', pat:'speck',  speck:'#7f868d' },
  glass:   { name:'Glass',        emoji:'🪟', color:'#bfeaff', pat:'glass',  alpha:0.45 },
  sand:    { name:'Sand',         emoji:'🏖️', color:'#f1d99b', pat:'speck',  speck:'#dcc27e' },
  snow:    { name:'Snow',         emoji:'⛄', color:'#f5fbff', pat:'speck',  speck:'#dceefc' },
  leaf:    { name:'Leaves',       emoji:'🍃', color:'#3f9b3f', pat:'speck',  speck:'#2f7d2f' },
  flower:  { name:'Flower Block', emoji:'🌸', color:'#ffd6e7', pat:'flowers' },
  rainbow: { name:'Rainbow',      emoji:'🌈', color:'#ff80ab', pat:'rainbow' },
  star:    { name:'Star Glow',    emoji:'⭐', color:'#ffe066', pat:'stars',  glow:true },
  water:   { name:'Water',        emoji:'💧', color:'#74c0fc', pat:'waves',  alpha:0.7 },
  red:     { name:'Cherry Red',   emoji:'🍒', color:'#fa5252', pat:'plain' },
  blue:    { name:'Elephant Blue',emoji:'🐘', color:'#3d9be9', pat:'plain' },
  yellow:  { name:'Sunny Yellow', emoji:'🌟', color:'#ffd43b', pat:'plain' },
  black:   { name:'Night Black',  emoji:'⬛', color:'#343a40', pat:'plain' },
  white:   { name:'Cloud White',  emoji:'⬜', color:'#f1f3f5', pat:'plain' },
  gold:    { name:'Golden Brick', emoji:'🟨', color:'#e7b416', pat:'bricks', glow:true },
  slab:    { name:'Half Slab',    emoji:'▬', color:'#d9a05b', pat:'planks', shape:'slab' },
  wedge:   { name:'Triangle',     emoji:'🔺', color:'#c0584b', pat:'bricks', shape:'wedge', rotates:true },
  pillar:  { name:'Round Pillar', emoji:'⚪', color:'#f1f3f5', pat:'plain',  shape:'pillar' },
  door:    { name:'Cute Door',    emoji:'🚪', color:'#8a5a2b', pat:'door',   shape:'pane', rotates:true },
  pane:    { name:'Window Pane',  emoji:'🪟', color:'#bfeaff', pat:'glass',  alpha:0.5, shape:'pane', rotates:true },
  knob:    { name:'Golden Handle',emoji:'🔘', color:'#ffd43b', pat:'plain',  shape:'knob', glow:true },
  stair:   { name:'Stairs',       emoji:'🪜', color:'#d9a05b', pat:'planks', shape:'stair', rotates:true },
  slimeGreen:  { name:'Green Slime',  emoji:'🟢', color:'#7be042', pat:'slime', alpha:0.85, locked:true },
  slimePink:   { name:'Pink Slime',   emoji:'🩷', color:'#ff8fc8', pat:'slime', alpha:0.85, locked:true },
  slimePurple: { name:'Purple Slime', emoji:'🟣', color:'#b388ff', pat:'slime', alpha:0.85, locked:true },
  slimeBlue:   { name:'Blue Slime',   emoji:'🔵', color:'#5dc8f5', pat:'slime', alpha:0.85, locked:true },
  oreo:        { name:'Oreo Cookie',  emoji:'🍪', color:'#2b2118', pat:'oreo',  locked:true },
  oreoPink:    { name:'Berry Oreo',   emoji:'🍓', color:'#2b2118', pat:'oreoPink', locked:true },
};

/* Hotbar order (unlocked-by-default first) */
ABC.HOTBAR_ORDER = ['grass','dirt','wood','plank','brick','gold','stone','glass','sand','snow',
  'leaf','flower','rainbow','star','water','red','blue','yellow','black','white',
  'slab','wedge','stair','pillar','door','pane','knob',
  'slimeGreen','slimePink','slimePurple','slimeBlue','oreo','oreoPink'];

/* Color themes 🎨 — sky & world moods */
ABC.THEMES = [
  { key:'sunny',  ico:'☀️', label:'Sunny Day',   sky:0x9fdcff, grass:0xffffff },
  { key:'sunset', ico:'🌅', label:'Sunset',      sky:0xffb29a, grass:0xffe3cf },
  { key:'night',  ico:'🌙', label:'Starry Night',sky:0x32406e, grass:0xaabbe0 },
  { key:'candy',  ico:'🍭', label:'Candy Land',  sky:0xe9c8ff, grass:0xffd9ee },
];

/* Surprise pocket 🎁 — one surprise per day; saying what you found takes it out */
ABC.SURPRISES = [
  { ico:'⭐', s:'I found three shiny stars in my bag!', grant:'stars' },
  { ico:'🦋', s:'A little butterfly was sleeping in my bag!', grant:'butterfly' },
  { ico:'🍪', s:'I found a sweet dough heart inside!', grant:'cutout' },
  { ico:'🌀', s:'My bag is full of magic word power!', grant:'portal' },
  { ico:'💖', s:'There are two kindness hearts for me!', grant:'hearts' },
];

/* Village market 🏪 — learn asking, paying and thanking */
ABC.SHOP_GOODS = [
  { ico:'🍎', label:'Apple Basket', price:2, word:'the apple basket', grant:'apples' },
  { ico:'🎈', label:'Magic Balloon', price:3, word:'a magic balloon', grant:'balloon' },
  { ico:'⭐', label:'Lamp Blocks',  price:4, word:'three glowing lamp blocks', grant:'lamps' },
  { ico:'🍪', label:'Cookie Treat', price:2, word:'a cookie treat', grant:'cookie' },
];

/* Cookie cutters for the playdough/slime 🍪 */
ABC.CUTTERS = [
  { shape:'star',   ico:'⭐', label:'Star Cutter' },
  { shape:'heart',  ico:'❤️', label:'Heart Cutter' },
  { shape:'flower', ico:'🌸', label:'Flower Cutter' },
  { shape:'circle', ico:'⚪', label:'Circle Cutter' },
];

/* ============================== BLUEPRINTS ============================== */
/* Helpers build arrays of cells {x,y,z,t} (relative, y=0 sits on ground top). */
ABC.buildBlueprints = function () {
  const box = (cells, x1,y1,z1, x2,y2,z2, t, hollow) => {
    for (let x=x1;x<=x2;x++) for (let y=y1;y<=y2;y++) for (let z=z1;z<=z2;z++) {
      if (hollow && x>x1&&x<x2 && z>z1&&z<z2 && y>y1&&y<y2) continue;
      cells.push({x,y,z,t});
    }
  };
  const cell = (cells,x,y,z,t)=>cells.push({x,y,z,t});

  /* ---- COZY HOME: 7 wide (x 0..6), 5 deep (z 0..4) ---- */
  const homeWalls=[], homeWindows=[], homeRoof=[];
  box(homeWalls, 0,0,0, 6,0,4, 'plank');                 // floor
  for (let y=1;y<=3;y++) {                               // walls
    for (let x=0;x<=6;x++) { cell(homeWalls,x,y,0,'brick'); cell(homeWalls,x,y,4,'brick'); }
    for (let z=1;z<=3;z++) { cell(homeWalls,0,y,z,'brick'); cell(homeWalls,6,y,z,'brick'); }
  }
  // door gap front-center (remove 2 cells) -> filter
  const homeWallsF = homeWalls.filter(c=>!(c.z===0 && c.x===3 && (c.y===1||c.y===2)));
  // windows: swap some bricks to glass (front + sides)
  const winSpots = [[1,2,0],[5,2,0],[0,2,2],[6,2,2],[3,2,4]];
  const homeWallsFinal = homeWallsF.filter(c=>!winSpots.some(w=>w[0]===c.x&&w[1]===c.y&&w[2]===c.z));
  winSpots.forEach(w=>cell(homeWindows,w[0],w[1],w[2],'glass'));
  cell(homeWindows,3,3,0,'star');                        // glowing lamp over the door
  for (let i=0;i<4;i++)                                  // pyramid-ish roof
    for (let x=-1+i;x<=7-i;x++) for (let z=-1+i;z<=5-i;z++)
      if (x===-1+i||x===7-i||z===-1+i||z===5-i||i===3) cell(homeRoof,x,4+i,z,'wood');

  /* ---- RAINBOW CAR: 6 long (x), 3 wide (z) ---- */
  const carWheels=[], carBody=[], carCabin=[];
  [[1,0],[1,2],[4,0],[4,2]].forEach(([x,z])=>cell(carWheels,x,0,z,'black'));
  box(carBody, 0,1,0, 5,1,2, 'red');                     // chassis
  cell(carBody,5,1,1,'yellow'); cell(carBody,0,1,1,'yellow'); // lights
  box(carCabin, 1,2,0, 4,2,2, 'red');
  const carCabinFinal = carCabin.map(c=>{
    if ((c.x===2||c.x===3)&&(c.z===0||c.z===2)) return {...c,t:'glass'};
    if ((c.x===1||c.x===4)&&c.z===1) return {...c,t:'glass'};
    return c;
  });
  cell(carCabinFinal,2,3,1,'rainbow'); cell(carCabinFinal,3,3,1,'rainbow'); // rainbow roof stripe

  /* ---- ROCKET + LAUNCH PAD: pad 7x7, rocket 3x3 tube ---- */
  const padCells=[], rocketBody=[], rocketNose=[];
  box(padCells, -2,0,-2, 4,0,4, 'stone');
  [[-2,-2],[4,-2],[-2,4],[4,4]].forEach(([x,z])=>{ cell(padCells,x,1,z,'stone'); cell(padCells,x,2,z,'star'); });
  for (let y=1;y<=5;y++) box(rocketBody, 0,y,0, 2,y,2, y===3?'rainbow':'white', false);
  const rocketBodyF = rocketBody.map(c=> (c.y===2 && c.x===1 && c.z===0) ? {...c,t:'glass'} : c); // porthole
  [[-1,1,1],[3,1,1],[1,1,-1],[1,1,3]].forEach(p=>cell(rocketBodyF,p[0],p[1],p[2],'red')); // fins
  box(rocketNose, 0,6,0, 2,6,2, 'red');
  cell(rocketNose,1,7,1,'yellow');

  /* ---- BLUE ELEPHANT STATUE (the non-profit mascot, BIG!) ---- */
  const eleBody=[], eleHead=[], eleTrunk=[];
  [[0,0],[0,2],[4,0],[4,2]].forEach(([x,z])=>{ cell(eleBody,x,0,z,'blue'); cell(eleBody,x,1,z,'blue'); });
  box(eleBody, 0,2,0, 4,4,2, 'blue');                    // body
  cell(eleBody,-1,3,1,'blue');                           // tail
  box(eleHead, 5,3,0, 7,5,2, 'blue');                    // head
  box(eleHead, 6,4,-1, 7,5,-1, 'blue');                  // big ears
  box(eleHead, 6,4,3, 7,5,3, 'blue');
  cell(eleTrunk,8,3,1,'blue'); cell(eleTrunk,8,2,1,'blue'); cell(eleTrunk,8,1,1,'blue'); // trunk
  cell(eleTrunk,9,1,1,'blue');                           // trunk tip curls up
  cell(eleTrunk,8,2,0,'white'); cell(eleTrunk,8,2,2,'white'); // tusks
  cell(eleTrunk,7,5,0,'star'); cell(eleTrunk,7,5,2,'star');   // sparkly eyes

  /* ---- TWO-STOREY VILLA: 8 wide, 6 deep, staircase inside ---- */
  const vFloor1=[], vFloor2=[], vRoof=[];
  box(vFloor1, 0,0,0, 7,0,5, 'plank');                          // ground floor
  for (let y=1;y<=2;y++) {                                      // walls floor 1 (wood look)
    for (let x=0;x<=7;x++) { cell(vFloor1,x,y,0,'wood'); cell(vFloor1,x,y,5,'wood'); }
    for (let z=1;z<=4;z++) { cell(vFloor1,0,y,z,'wood'); cell(vFloor1,7,y,z,'wood'); }
  }
  const vF1 = vFloor1.filter(c=>!(c.z===0 && c.x===3 && (c.y===1||c.y===2)));
  cell(vF1,3,1,0,'door');                                       // front door
  [[1,2,0],[6,2,0],[0,2,2],[7,2,3]].forEach(w=>cell(vF1,w[0],w[1],w[2],'pane'));
  // staircase up (along east wall inside)
  cell(vF1,6,1,4,'stair'); cell(vF1,6,2,3,'stair'); cell(vF1,6,3,2,'stair');
  box(vFloor2, 0,3,0, 7,3,5, 'plank');                          // upper floor
  const vF2 = vFloor2.filter(c=>!(c.x===6 && (c.z===2||c.z===3)));  // stair opening
  for (let y=4;y<=5;y++) {                                      // walls floor 2 (white)
    for (let x=0;x<=7;x++) { vF2.push({x,y,z:0,t:'white'}); vF2.push({x,y,z:5,t:'white'}); }
    for (let z=1;z<=4;z++) { vF2.push({x:0,y,z,t:'white'}); vF2.push({x:7,y,z,t:'white'}); }
  }
  const vF2Final = vF2.filter(c=>!([[2,5,0],[5,5,0],[0,5,3],[7,5,3],[3,5,5],[4,5,5]].some(w=>w[0]===c.x&&w[1]===c.y&&w[2]===c.z)));
  [[2,5,0],[5,5,0],[0,5,3],[7,5,3],[3,5,5],[4,5,5]].forEach(w=>vF2Final.push({x:w[0],y:w[1],z:w[2],t:'pane'}));
  for (let i=0;i<3;i++)                                          // gabled wedge roof
    for (let x=-1+0;x<=8;x++) {
      cell(vRoof,x,6+i,i,'wedge'); cell(vRoof,x,6+i,5-i,'wedge');
      if (i===2) cell(vRoof,x,6+i,2,'brick'), cell(vRoof,x,6+i,3,'brick');
    }
  cell(vRoof,3,6,0,'star');                                      // porch light

  return {
    villa: {
      id:'villa', title:'🏡 Two-Storey Villa', emoji:'🏡',
      site:{x:16, z:-22},
      stages:[
        { name:'Ground Floor & Stairs', cells:vF1 },
        { name:'Upstairs & Windows', cells:vF2Final },
        { name:'Pointy Roof & Light', cells:vRoof },
      ],
    },
    home: {
      id:'home', title:'🏠 Cozy Home', emoji:'🏠',
      site:{x:8, z:-14},
      stages:[
        { name:'Floor & Walls', cells:homeWallsFinal },
        { name:'Windows & Lamp', cells:homeWindows },
        { name:'Roof', cells:homeRoof },
      ],
    },
    car: {
      id:'car', title:'🚗 Rainbow Car', emoji:'🚗',
      site:{x:-14, z:-12},
      stages:[
        { name:'Wheels', cells:carWheels },
        { name:'Car Body & Lights', cells:carBody },
        { name:'Cabin, Windows & Rainbow Roof', cells:carCabinFinal },
      ],
    },
    rocket: {
      id:'rocket', title:'🚀 Rocket & Launch Pad', emoji:'🚀',
      site:{x:-2, z:18},
      stages:[
        { name:'Launch Pad & Light Towers', cells:padCells },
        { name:'Rocket Body & Fins', cells:rocketBodyF },
        { name:'Nose Cone & Beacon', cells:rocketNose },
      ],
    },
    elephant: {
      id:'elephant', title:'🐘 Blue Elephant Statue', emoji:'🐘',
      site:{x:22, z:22},
      stages:[
        { name:'Legs & Body', cells:eleBody },
        { name:'Head & Big Ears', cells:eleHead },
        { name:'Trunk, Tusks & Eyes', cells:eleTrunk },
      ],
    },
  };
};

/* ============================== ANIMALS ============================== */
ABC.ANIMAL_DEFS = {
  bunny:    { kind:'bunny',    label:'Bunny',        emoji:'🐰', cute:true,  body:'#f5f0f6', accent:'#ffc9de', size:1.0, speed:1.6, hop:true },
  cat:      { kind:'cat',      label:'Kitty Cat',    emoji:'🐱', cute:true,  body:'#f7a96b', accent:'#ffffff', size:1.0, speed:1.2 },
  puppy:    { kind:'puppy',    label:'Puppy',        emoji:'🐶', cute:true,  body:'#c98d5a', accent:'#8a5a2b', size:1.1, speed:1.8 },
  butterfly:{ kind:'butterfly',label:'Butterfly',    emoji:'🦋', cute:true,  body:'#b197fc', accent:'#ffd43b', size:0.6, speed:1.4, fly:true },
  trex:     { kind:'trex',     label:'T-Rex',        emoji:'🦖', dino:true,  body:'#5fa650', accent:'#3f7d33', size:2.2, speed:1.0 },
  trice:    { kind:'trice',    label:'Triceratops',  emoji:'🦕', dino:true,  body:'#d98e4a', accent:'#a86430', size:2.0, speed:0.8 },
  longneck: { kind:'longneck', label:'Long-Neck Dino', emoji:'🦕', dino:true, body:'#7fb6d9', accent:'#5a93b8', size:2.6, speed:0.7 },
  mammoth:  { kind:'mammoth',  label:'Woolly Mammoth', emoji:'🦣', dino:true, body:'#8a6a4f', accent:'#5e4534', size:2.2, speed:0.8 },
  capy:     { kind:'capy',    label:'Round Capybara', emoji:'🦫', cute:true, round:true,
              body:'#b98a5e', accent:'#8a5f3a', size:2.0, speed:0.7 },
  penguin:  { kind:'penguin', label:'Round Penguin',  emoji:'🐧', cute:true, round:true,
              body:'#2f3640', accent:'#ffffff', size:1.6, speed:0.9 },
  panda:    { kind:'panda',   label:'Round Panda',    emoji:'🐼', cute:true, round:true,
              body:'#f5f5f5', accent:'#2b2b2b', size:1.9, speed:0.7 },
  elephant: { kind:'elephant', label:'Blue Elephant', emoji:'🐘', cute:true, special:true,
              body:'#3d9be9', accent:'#2a7fc7', size:2.0, speed:0.9 },
  puzzleEle:{ kind:'puzzleEle',label:'Rainbow Elephant', emoji:'🐘🌈', cute:true, special:true,
              body:'#69db7c', accent:'#b197fc', size:1.4, speed:1.0, rainbow:true },
};
ABC.ANIMAL_NAMES = ['Sparkle','Mochi','Buttercup','Pebble','Twinkle','Coco','Maple','Sunny','Berry','Waffles','Pickle','Daisy','Rocky','Luna','Biscuit','Jellybean'];

/* ============================== LANGUAGE / COMMUNICATION CONTENT ============================== */
/* Use {player} anywhere — it becomes the child's name (default Aaria). Keep text SHORT. */
ABC.PRAISE = [
  'Wonderful words, {player}! 🌟', 'Beautiful sentence! 💖', 'Amazing! ✨',
  'Super talking! 🎉', 'Your words are magic! 🪄',
];
ABC.COACH_NAMING = [
  'Good naming! 😊 Which one tells us <b>more</b>?',
  'Yes! Now pick the one that <b>describes</b> it.',
];
ABC.COACH_WRONG = [
  'Look again! 👀 Which one fits our picture?',
  'Almost! Try again. 💛',
];

/* Each prompt: scene text, emoji, options [{t,q}] q: best | name | off. Keep text SHORT. */
ABC.PROJECT_PROMPTS = {
  villa: {
    intro: { emoji:'🏡', scene:'A BIG project! What are we building?',
      options:[
        { t:'A big two-storey villa with real stairs inside!', q:'best' },
        { t:'House.', q:'name' },
        { t:'I like ice cream.', q:'off' } ] },
    stages:[
      { emoji:'🪜', scene:'Ground floor done! What is inside?',
        options:[
          { t:'The wooden stairs go up to the second floor!', q:'best' },
          { t:'Stairs.', q:'name' },
          { t:'The cat says meow.', q:'off' } ] },
      { emoji:'🪟', scene:'The upstairs is built! Tell me about it:',
        options:[
          { t:'The white upstairs has windows all around to see far away!', q:'best' },
          { t:'Up.', q:'name' },
          { t:'I wear shoes.', q:'off' } ] },
      { emoji:'🏡', scene:'Your villa is DONE! How does it look?',
        options:[
          { t:'My big villa has two floors, stairs and a pointy roof!', q:'best' },
          { t:'Done.', q:'name' },
          { t:'Rain is wet.', q:'off' } ] },
    ],
  },
  home: {
    intro: { emoji:'🏠', scene:'What are we building?',
      options:[
        { t:'A cozy home with brick walls and a glowing lamp.', q:'best' },
        { t:'House.', q:'name' },
        { t:'I like bananas.', q:'off' } ] },
    stages:[
      { emoji:'🧱', scene:'The walls are up! Tell me about them:',
        options:[
          { t:'The strong brick walls have a doorway in the middle.', q:'best' },
          { t:'Walls.', q:'name' },
          { t:'The fish swims.', q:'off' } ] },
      { emoji:'🪟', scene:'Windows are in! What do you see?',
        options:[
          { t:'The shiny windows let the sunlight come inside.', q:'best' },
          { t:'Window.', q:'name' },
          { t:'My shoe is red.', q:'off' } ] },
      { emoji:'🏠', scene:'Our home is FINISHED! How does it look?',
        options:[
          { t:'Our cozy home has a pointy roof and a glowing lamp!', q:'best' },
          { t:'Done.', q:'name' },
          { t:'The car is blue.', q:'off' } ] },
    ],
  },
  car: {
    intro: { emoji:'🚗', scene:'Vroom vroom! What is our plan?',
      options:[
        { t:'A shiny red car with a rainbow roof!', q:'best' },
        { t:'Car.', q:'name' },
        { t:'I see a cloud.', q:'off' } ] },
    stages:[
      { emoji:'⚫', scene:'Wheels are ready! Tell me about them:',
        options:[
          { t:'Four round black wheels to roll fast!', q:'best' },
          { t:'Wheels.', q:'name' },
          { t:'I brush my teeth.', q:'off' } ] },
      { emoji:'🚗', scene:'The car body is on! What do you notice?',
        options:[
          { t:'The red body has bright yellow lights in front.', q:'best' },
          { t:'Red.', q:'name' },
          { t:'Birds live in trees.', q:'off' } ] },
      { emoji:'🌈', scene:'Beep beep — DONE! Describe our car:',
        options:[
          { t:'Our rainbow car has glass windows to look out of!', q:'best' },
          { t:'Finished.', q:'name' },
          { t:'I want juice.', q:'off' } ] },
    ],
  },
  rocket: {
    intro: { emoji:'🚀', scene:'Astronaut {player}, what is our mission?',
      options:[
        { t:'Build a tall rocket so it can fly to space!', q:'best' },
        { t:'Rocket.', q:'name' },
        { t:'The dog says woof.', q:'off' } ] },
    stages:[
      { emoji:'🪨', scene:'Launch pad ready! Tell mission control:',
        options:[
          { t:'The strong stone pad has glowing lights on each corner.', q:'best' },
          { t:'Pad.', q:'name' },
          { t:'I like to swim.', q:'off' } ] },
      { emoji:'🚀', scene:'The rocket is standing tall! What do you see?',
        options:[
          { t:'The tall white rocket has red fins and a round window.', q:'best' },
          { t:'Tall.', q:'name' },
          { t:'The cookie is yummy.', q:'off' } ] },
      { emoji:'🧑‍🚀', scene:'Ready! What happens at zero?',
        options:[
          { t:'Our rocket will blast off high into the sky!', q:'best' },
          { t:'Up.', q:'name' },
          { t:'My socks are warm.', q:'off' } ] },
    ],
    launch: { emoji:'🚀', scene:'LAUNCH TIME! What does an astronaut say?',
      options:[
        { t:'Three, two, one… BLAST OFF! Up, up into space!', q:'best' },
        { t:'Go.', q:'name' },
        { t:'Time for bed.', q:'off' } ] },
  },
  elephant: {
    intro: { emoji:'🐘', scene:'Let’s build a friend like Bella! What are we making?',
      options:[
        { t:'A giant blue elephant with big flappy ears!', q:'best' },
        { t:'Elephant.', q:'name' },
        { t:'I eat cereal.', q:'off' } ] },
    stages:[
      { emoji:'🦵', scene:'The body is up! Tell me about it:',
        options:[
          { t:'The big blue body stands on four strong legs.', q:'best' },
          { t:'Blue.', q:'name' },
          { t:'The sun is hot.', q:'off' } ] },
      { emoji:'👂', scene:'Look at that head! What do you see?',
        options:[
          { t:'The elephant has two giant flappy ears!', q:'best' },
          { t:'Ears.', q:'name' },
          { t:'I have a spoon.', q:'off' } ] },
      { emoji:'🐘', scene:'Our Blue Elephant is DONE! How does it look?',
        options:[
          { t:'Our blue elephant curls its long trunk up happily!', q:'best' },
          { t:'Done.', q:'name' },
          { t:'Rain falls down.', q:'off' } ] },
    ],
  },
};

/* Animal emotion scenarios. sceneTpl uses {name} {label}. Keep text SHORT. */
ABC.EMOTIONS = [
  { key:'sad', emoji:'😢',
    sceneTpl:'{name} the {label} is sitting all alone with teary eyes.',
    feelingQ:'How does {name} feel?',
    options:[
      { t:'{name} feels sad because nobody is playing with them.', q:'best' },
      { t:'Sad.', q:'name' },
      { t:'{name} is an airplane.', q:'off' } ],
    kindActs:[
      { ico:'🤗', label:'Give a hug', say:'You gave {name} a warm hug. {name} feels loved!' },
      { ico:'🎈', label:'Invite to play', say:'“Come play with me!” Now {name} is bouncing with joy!' },
      { ico:'🎵', label:'Sing a song', say:'Your song made {name} smile again!' } ] },
  { key:'hungry', emoji:'🍽️',
    sceneTpl:'{name} the {label} is looking at an empty bowl.',
    feelingQ:'What is wrong?',
    options:[
      { t:'{name} is hungry because the bowl is empty.', q:'best' },
      { t:'Hungry.', q:'name' },
      { t:'{name} has a hat.', q:'off' } ],
    kindActs:[
      { ico:'🥕', label:'Share a carrot', say:'Munch munch! {name} loves the crunchy carrot!' },
      { ico:'🍓', label:'Give berries', say:'{name} gobbles the juicy berries. Yummy!' },
      { ico:'💧', label:'Bring water', say:'{name} takes a big cool drink. Ahh!' } ] },
  { key:'scared', emoji:'😨',
    sceneTpl:'{name} the {label} heard loud thunder and is hiding.',
    feelingQ:'How does {name} feel?',
    options:[
      { t:'{name} is scared because the thunder was so loud.', q:'best' },
      { t:'Scared.', q:'name' },
      { t:'{name} likes pizza.', q:'off' } ],
    kindActs:[
      { ico:'🫂', label:'Say "You are safe"', say:'“You are safe with me.” {name} stopped shaking!' },
      { ico:'🧸', label:'Share a teddy', say:'{name} hugs the teddy and feels brave!' },
      { ico:'🌬️', label:'Breathe together', say:'In… out… {name} feels calm now. Great idea!' } ] },
  { key:'happy', emoji:'😄',
    sceneTpl:'{name} the {label} is jumping in the flowers!',
    feelingQ:'What do you see?',
    options:[
      { t:'{name} is happy and jumping in the flowers.', q:'best' },
      { t:'Happy.', q:'name' },
      { t:'The moon is far.', q:'off' } ],
    kindActs:[
      { ico:'🎉', label:'Dance together', say:'You danced together! Sharing joy is wonderful!' },
      { ico:'💬', label:'Say "I’m happy for you!"', say:'Kind words make joy grow bigger!' },
      { ico:'🌼', label:'Make a flower crown', say:'{name} loves the flower crown!' } ] },
  { key:'sleepy', emoji:'😴',
    sceneTpl:'{name} the {label} is yawning a big yawn.',
    feelingQ:'What does {name} need?',
    options:[
      { t:'{name} is sleepy and needs a cozy rest.', q:'best' },
      { t:'Sleepy.', q:'name' },
      { t:'{name} drives a truck.', q:'off' } ],
    kindActs:[
      { ico:'🛏️', label:'Make a leaf bed', say:'{name} snuggles into the soft leaf bed. Comfy!' },
      { ico:'🤫', label:'Be very quiet', say:'Shhh… you tip-toed away. So thoughtful!' },
      { ico:'🎶', label:'Hum a lullaby', say:'Your lullaby sent {name} to dreamland…' } ] },
];

/* Slime Lab content */
ABC.SLIME = {
  colors:[
    { key:'slimeGreen',  ico:'🟢', label:'Lime Green',  word:'green'  },
    { key:'slimePink',   ico:'🩷', label:'Bubblegum Pink', word:'pink' },
    { key:'slimePurple', ico:'🟣', label:'Magic Purple', word:'purple' },
    { key:'slimeBlue',   ico:'🔵', label:'Ocean Blue',   word:'blue'  } ],
  mixins:[
    { ico:'✨', label:'Sparkly Glitter', word:'sparkly glitter' },
    { ico:'🫧', label:'Foam Beads',      word:'crunchy foam beads' },
    { ico:'🌟', label:'Star Confetti',   word:'tiny star confetti' } ],
  describe: (colorWord, mixWord) => ({
    emoji:'🫙', scene:'Your slime is ready! Tell me about it:',
    options:[
      { t:`My ${colorWord} slime is squishy, with ${mixWord} inside!`, q:'best' },
      { t:'Slime.', q:'name' },
      { t:'The bus stops here.', q:'off' } ] }),
};

/* Oreo Kitchen content */
ABC.OREO = {
  creams:[
    { ico:'🤍', label:'Classic Vanilla', word:'fluffy white vanilla', css:'#fdf6e3' },
    { ico:'🍓', label:'Strawberry',      word:'sweet pink strawberry', css:'#ffb3c6' },
    { ico:'🌿', label:'Cool Mint',       word:'cool green mint', css:'#a7e8bd' } ],
  toppings:[
    { ico:'🌈', label:'Rainbow Sprinkles', word:'rainbow sprinkles' },
    { ico:'🍫', label:'Choco Drizzle',     word:'chocolate drizzle' },
    { ico:'⭐', label:'Sugar Stars',       word:'shiny sugar stars' } ],
  describe: (creamWord, topWord) => ({
    emoji:'🍪', scene:'Chef {player}, your cookie is done! Tell us about it:',
    options:[
      { t:`I made a giant Oreo with ${creamWord} cream and ${topWord} on top!`, q:'best' },
      { t:'Cookie.', q:'name' },
      { t:'Rain falls down.', q:'off' } ] }),
};

/* Tutorial prompt — given by Bella the Blue Elephant, the game's guide 💙 */
ABC.TUTORIAL_PROMPT = {
  emoji:'🐘💙', scene:'Hi {player}! I’m Bella! 🐘💙 Here, our WORDS make magic. Which sentence tells about our world?',
  options:[
    { t:'I see a sunny sky and soft green grass.', q:'best' },
    { t:'Grass.', q:'name' },
    { t:'I have two hands.', q:'off' } ],
};

/* Kind Words real-world missions 💌 — practice saying things to real people */
ABC.MISSION_PEOPLE = [
  { ico:'👩', label:'Mom' }, { ico:'👨', label:'Dad' },
  { ico:'🧑‍🤝‍🧑', label:'A Friend' }, { ico:'👵', label:'Grandma' },
];
ABC.MISSION_PHRASES = [
  'I like your dress!', 'I am feeling happy today!', 'Today is a rainy day.',
  'Thank you for helping me!', 'Your hair looks nice!', 'I love you!',
  'Can we play together?', 'The sky is so blue today!',
  'I built a rocket in my game!', 'You make the best snacks!',
  'I am feeling a little tired.', 'Look, I made a giant Oreo!',
];

/* Animals sometimes have something — practice ASKING for it (requesting) 🥕 */
ABC.ANIMAL_WANTS = [
  { ico:'🥕', word:'the crunchy carrot' },
  { ico:'🍎', word:'the juicy red apple' },
  { ico:'🎾', word:'the bouncy ball' },
  { ico:'🌸', word:'the pretty flower' },
  { ico:'🍪', word:'a yummy cookie' },
  { ico:'🫧', word:'the shiny bubbles' },
];

/* Show & Tell sentences (assembled word-by-word in the Sentence Builder) */
ABC.SHOWTELL_SENTENCES = [
  'I built something amazing all by myself!',
  'Look at my big colorful creation!',
  'I made this with my own two hands!',
  'My building is tall and super cool!',
];

/* Today's Adventures — 3 focus quests per day 📋 */
ABC.QUEST_DEFS = [
  { key:'build',  ico:'🏗️', label:'Finish one build stage' },
  { key:'animal', ico:'💖', label:'Help an animal friend feel better' },
  { key:'words',  ico:'💬', label:'Do Kind Words, Slime Lab or Oreo Kitchen' },
];

/* Wormhole portal — the reward for using expressive language 🌀 */
ABC.PORTAL = {
  NEED: 5,                                  // expressive successes to open it
  homePos: { x:-7, z:-10 },                 // near spawn
  islandPos: { x:36, y:25, z:40 },          // secret Sky Island (south edge, clear of the rainbow)
};

ABC.KIND_MILESTONES = {
  5:'💖 5 hearts! Flowers are blooming because of your kindness!',
  10:'💖 10 hearts! A new animal friend heard how kind you are and came to visit!',
  20:'💖🐘 20 hearts! Bella the Blue Elephant is SO proud — you are Building a New Inclusive World!',
};

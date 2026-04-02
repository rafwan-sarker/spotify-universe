// Generate demo-galaxy.json with 200 real songs
// Position computation: genre centroid + random offset (gaussian-like spread)
const fs = require("fs");
const path = require("path");

// Seeded pseudo-random for reproducibility
let seed = 42;
function seededRandom() {
  seed = (seed * 16807 + 0) % 2147483647;
  return (seed - 1) / 2147483646;
}

// Box-Muller transform for gaussian-like distribution
function gaussianRandom(mean, stddev) {
  const u1 = seededRandom();
  const u2 = seededRandom();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stddev;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

const genres = [
  { id: "pop", name: "Pop", color: [1.0, 0.4, 0.7], centroid: [30, 0, 10] },
  {
    id: "rock",
    name: "Rock",
    color: [0.9, 0.2, 0.2],
    centroid: [-25, 5, -20],
  },
  {
    id: "hiphop",
    name: "Hip-Hop",
    color: [0.6, 0.2, 0.9],
    centroid: [0, -15, 30],
  },
  {
    id: "electronic",
    name: "Electronic",
    color: [0.1, 0.8, 0.9],
    centroid: [-10, 20, -15],
  },
  {
    id: "rnb",
    name: "R&B",
    color: [0.9, 0.6, 0.1],
    centroid: [20, -10, -25],
  },
  {
    id: "indie",
    name: "Indie",
    color: [0.4, 0.9, 0.4],
    centroid: [-20, -5, 25],
  },
];

const songs = {
  pop: [
    ["Blinding Lights", "The Weeknd"],
    ["Anti-Hero", "Taylor Swift"],
    ["Levitating", "Dua Lipa"],
    ["bad guy", "Billie Eilish"],
    ["Watermelon Sugar", "Harry Styles"],
    ["Stay", "The Kid LAROI & Justin Bieber"],
    ["Shape of You", "Ed Sheeran"],
    ["As It Was", "Harry Styles"],
    ["Save Your Tears", "The Weeknd"],
    ["Dont Start Now", "Dua Lipa"],
    ["Cruel Summer", "Taylor Swift"],
    ["Starboy", "The Weeknd"],
    ["drivers license", "Olivia Rodrigo"],
    ["Peaches", "Justin Bieber"],
    ["Dance Monkey", "Tones and I"],
    ["Shivers", "Ed Sheeran"],
    ["Flowers", "Miley Cyrus"],
    ["Kill Bill", "SZA"],
    ["Heat Waves", "Glass Animals"],
    ["Uptown Funk", "Bruno Mars"],
    ["24K Magic", "Bruno Mars"],
    ["Physical", "Dua Lipa"],
    ["good 4 u", "Olivia Rodrigo"],
    ["Vampire", "Olivia Rodrigo"],
    ["About Damn Time", "Lizzo"],
    ["Espresso", "Sabrina Carpenter"],
    ["Shake It Off", "Taylor Swift"],
    ["New Rules", "Dua Lipa"],
    ["Someone Like You", "Adele"],
    ["Rolling in the Deep", "Adele"],
    ["Easy On Me", "Adele"],
    ["Butter", "BTS"],
    ["Dynamite", "BTS"],
    ["positions", "Ariana Grande"],
    ["7 rings", "Ariana Grande"],
  ],
  rock: [
    ["Everlong", "Foo Fighters"],
    ["Do I Wanna Know?", "Arctic Monkeys"],
    ["Under the Bridge", "Red Hot Chili Peppers"],
    ["Creep", "Radiohead"],
    ["Mr. Brightside", "The Killers"],
    ["Seven Nation Army", "The White Stripes"],
    ["Bohemian Rhapsody", "Queen"],
    ["Smells Like Teen Spirit", "Nirvana"],
    ["Come As You Are", "Nirvana"],
    ["Californication", "Red Hot Chili Peppers"],
    ["The Pretender", "Foo Fighters"],
    ["505", "Arctic Monkeys"],
    ["Karma Police", "Radiohead"],
    ["Yellow", "Coldplay"],
    ["The Scientist", "Coldplay"],
    ["Viva la Vida", "Coldplay"],
    ["Black Hole Sun", "Soundgarden"],
    ["Hysteria", "Muse"],
    ["Supermassive Black Hole", "Muse"],
    ["Take Me Out", "Franz Ferdinand"],
    ["Reptilia", "The Strokes"],
    ["Last Nite", "The Strokes"],
    ["Someday", "The Strokes"],
    ["Are You Gonna Be My Girl", "Jet"],
    ["In Bloom", "Nirvana"],
    ["Wish You Were Here", "Pink Floyd"],
    ["Comfortably Numb", "Pink Floyd"],
    ["Thunder", "Imagine Dragons"],
    ["Believer", "Imagine Dragons"],
    ["Radioactive", "Imagine Dragons"],
  ],
  hiphop: [
    ["HUMBLE.", "Kendrick Lamar"],
    ["Gods Plan", "Drake"],
    ["See You Again", "Tyler, The Creator"],
    ["No Role Modelz", "J. Cole"],
    ["SICKO MODE", "Travis Scott"],
    ["Hotline Bling", "Drake"],
    ["Alright", "Kendrick Lamar"],
    ["EARFQUAKE", "Tyler, The Creator"],
    ["DNA.", "Kendrick Lamar"],
    ["Money Trees", "Kendrick Lamar"],
    ["m.A.A.d city", "Kendrick Lamar"],
    ["Started From the Bottom", "Drake"],
    ["Mask Off", "Future"],
    ["Congratulations", "Post Malone"],
    ["Rockstar", "Post Malone"],
    ["Sunflower", "Post Malone & Swae Lee"],
    ["Old Town Road", "Lil Nas X"],
    ["MONTERO", "Lil Nas X"],
    ["Big Pimpin", "JAY-Z"],
    ["Juicy", "The Notorious B.I.G."],
    ["Lose Yourself", "Eminem"],
    ["Without Me", "Eminem"],
    ["In Da Club", "50 Cent"],
    ["Nonstop", "Drake"],
    ["Passionfruit", "Drake"],
    ["Middle Child", "J. Cole"],
    ["Power", "Kanye West"],
    ["Stronger", "Kanye West"],
    ["Runaway", "Kanye West"],
    ["goosebumps", "Travis Scott"],
    ["Praise The Lord", "A$AP Rocky"],
    ["XO Tour Llif3", "Lil Uzi Vert"],
    ["Bad and Boujee", "Migos"],
    ["Lucid Dreams", "Juice WRLD"],
    ["Robbery", "Juice WRLD"],
  ],
  electronic: [
    ["Around the World", "Daft Punk"],
    ["Strobe", "Deadmau5"],
    ["Say My Name", "ODESZA"],
    ["Never Be Like You", "Flume"],
    ["Midnight City", "M83"],
    ["Get Lucky", "Daft Punk"],
    ["One More Time", "Daft Punk"],
    ["Lean On", "Major Lazer & DJ Snake"],
    ["Scary Monsters and Nice Sprites", "Skrillex"],
    ["Bangarang", "Skrillex"],
    ["Levels", "Avicii"],
    ["Wake Me Up", "Avicii"],
    ["Titanium", "David Guetta & Sia"],
    ["Faded", "Alan Walker"],
    ["Alone", "Marshmello"],
    ["Roses", "The Chainsmokers"],
    ["Closer", "The Chainsmokers"],
    ["Something Just Like This", "The Chainsmokers & Coldplay"],
    ["Innerbloom", "RUFUS DU SOL"],
    ["Alive", "RUFUS DU SOL"],
    ["You & Me", "Disclosure"],
    ["Latch", "Disclosure & Sam Smith"],
    ["Tennis Court", "Flume Remix"],
    ["Hyperreal", "Flume"],
    ["Ghosts n Stuff", "Deadmau5"],
    ["Divinity", "Porter Robinson"],
    ["Shelter", "Porter Robinson & Madeon"],
    ["All We Need", "ODESZA"],
    ["Line of Sight", "ODESZA"],
    ["Cola", "CamelPhat & Elderbrook"],
    ["Opus", "Eric Prydz"],
    ["Insomnia", "Faithless"],
    ["Sandstorm", "Darude"],
    ["Blue", "Eiffel 65"],
    ["Core", "RL Grime"],
  ],
  rnb: [
    ["Thinkin Bout You", "Frank Ocean"],
    ["Kiss Me More", "Doja Cat & SZA"],
    ["Best Part", "Daniel Caesar & H.E.R."],
    ["Good Days", "SZA"],
    ["Call Out My Name", "The Weeknd"],
    ["Nights", "Frank Ocean"],
    ["Pink + White", "Frank Ocean"],
    ["Self Control", "Frank Ocean"],
    ["After Hours", "The Weeknd"],
    ["The Hills", "The Weeknd"],
    ["Often", "The Weeknd"],
    ["Snooze", "SZA"],
    ["Love Galore", "SZA"],
    ["Shirt", "SZA"],
    ["Japanese Denim", "Daniel Caesar"],
    ["Get You", "Daniel Caesar"],
    ["Focus", "H.E.R."],
    ["Damage", "H.E.R."],
    ["Come Through", "H.E.R."],
    ["Woman", "Doja Cat"],
    ["Say So", "Doja Cat"],
    ["Trip", "Ella Mai"],
    ["Boo'd Up", "Ella Mai"],
    ["Location", "Khalid"],
    ["Young Dumb & Broke", "Khalid"],
    ["Talk", "Khalid"],
    ["Streets", "Doja Cat"],
    ["On My Mind", "Jorja Smith"],
    ["Blue Lights", "Jorja Smith"],
    ["Exchange", "Bryson Tiller"],
  ],
  indie: [
    ["The Less I Know the Better", "Tame Impala"],
    ["Chamber of Reflection", "Mac DeMarco"],
    ["Skinny Love", "Bon Iver"],
    ["Motion Sickness", "Phoebe Bridgers"],
    ["Electric Feel", "MGMT"],
    ["Let It Happen", "Tame Impala"],
    ["Borderline", "Tame Impala"],
    ["Breathe Deeper", "Tame Impala"],
    ["Salad Days", "Mac DeMarco"],
    ["My Kind of Woman", "Mac DeMarco"],
    ["Holocene", "Bon Iver"],
    ["re: Stacks", "Bon Iver"],
    ["Kyoto", "Phoebe Bridgers"],
    ["I Know the End", "Phoebe Bridgers"],
    ["Kids", "MGMT"],
    ["Time Moves Slow", "BADBADNOTGOOD"],
    ["Something", "Men I Trust"],
    ["Numb", "Men I Trust"],
    ["Show Me How", "Men I Trust"],
    ["Myth", "Beach House"],
    ["Space Song", "Beach House"],
    ["Silver Soul", "Beach House"],
    ["Feels Like We Only Go Backwards", "Tame Impala"],
    ["Do You Realize??", "The Flaming Lips"],
    ["Sweater Weather", "The Neighbourhood"],
    ["Apocalypse", "Cigarettes After Sex"],
    ["K.", "Cigarettes After Sex"],
    ["Dissolve", "Absofacto"],
    ["Heat Above", "Greta Van Fleet"],
    ["Take a Slice", "Glass Animals"],
    ["Youth", "Glass Animals"],
    ["Agnes", "Glass Animals"],
    ["Warm Glow", "Hippo Campus"],
    ["Buttercup", "Hippo Campus"],
    ["Riptide", "Vance Joy"],
  ],
};

// Generate star entries
let counter = 1;
const stars = [];

for (const genre of genres) {
  const genreSongs = songs[genre.id];
  for (const [name, artist] of genreSongs) {
    const id = "demo-" + String(counter).padStart(3, "0");
    const [cx, cy, cz] = genre.centroid;
    const position = [
      round2(cx + gaussianRandom(0, 5)),
      round2(cy + gaussianRandom(0, 5)),
      round2(cz + gaussianRandom(0, 5)),
    ];
    const size = round2(0.3 + seededRandom() * 1.7);
    const brightness = round2(0.5 + seededRandom() * 0.5);
    stars.push({
      id,
      name,
      artist,
      genre: genre.id,
      position,
      size,
      brightness,
    });
    counter++;
  }
}

const data = {
  version: 1,
  description: "Demo galaxy with ~200 curated songs across 6 genres",
  genres,
  stars,
};

const outPath = path.resolve(__dirname, "../src/data/demo-galaxy.json");
fs.writeFileSync(outPath, JSON.stringify(data, null, 2) + "\n");
console.log("Generated " + stars.length + " stars across " + genres.length + " genres");

// Validate
const genreCounts = {};
for (const s of stars) {
  genreCounts[s.genre] = (genreCounts[s.genre] || 0) + 1;
}
console.log("Genre distribution:", JSON.stringify(genreCounts));

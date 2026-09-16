// One-off: replaces caroleProfile with real data (overwrites the placeholder
// demo sections from scripts/seed.js entirely).
//
// Usage: node scripts/seed-carole-real.js <path-to-service-account-key.json> <userId>

const admin = require('firebase-admin');
const path = require('path');
const { randomUUID } = require('crypto');

const [, , keyPathArg, userIdArg] = process.argv;

if (!keyPathArg || !userIdArg) {
  console.error('Usage: node scripts/seed-carole-real.js <path-to-service-account-key.json> <userId>');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(require(path.resolve(keyPathArg))),
});

const userId = userIdArg;
const db = admin.firestore();
const now = admin.firestore.Timestamp.now();

const keyValue = (pairs) => pairs.map(([key, value]) => ({ id: randomUUID(), key, value }));
const notes = (texts) => texts.map((text) => ({ id: randomUUID(), text }));
const checklist = (texts) => texts.map((text) => ({ id: randomUUID(), text, checked: false }));

const sections = [
  {
    id: randomUUID(),
    title: 'Apparel',
    order: 0,
    type: 'keyValue',
    items: keyValue([
      ['Shirt', 'M'],
      ['Leggings', 'S'],
      ['Long Sleeve', 'L'],
      ['Casual Shoes', '10.5'],
    ]),
  },
  {
    id: randomUUID(),
    title: 'Earrings',
    order: 1,
    type: 'keyValue',
    items: keyValue([
      ['Metal', 'Full gold or titanium/surgical steel (preferably full gold)'],
      ['Birthstone', 'Aquamarine/Bloodstone'],
    ]),
  },
  {
    id: randomUUID(),
    title: 'Birthday 2027',
    order: 2,
    type: 'notes',
    items: notes(['Mini tats and piercings party']),
  },
  {
    id: randomUUID(),
    title: 'Appreciate Her / Make Her Life Easier',
    order: 3,
    type: 'notes',
    items: notes([]),
  },
  {
    id: randomUUID(),
    title: 'Date Ideas',
    order: 4,
    type: 'notes',
    items: notes(['Dance class', 'Museum of Illusions', "McDonald's"]),
  },
  {
    id: randomUUID(),
    title: 'Rough Day?',
    order: 5,
    type: 'notes',
    items: notes([
      'Food/snacks/shitty romcom or comedy',
      "Don't ask, just do it",
      "She doesn't need to help you figure out how to help her",
    ]),
  },
  {
    id: randomUUID(),
    title: 'Gifts',
    order: 6,
    type: 'checklist',
    items: checklist([
      'Ugg Sandals',
      'YSL',
      'Halara jumpsuit',
      'Abercrombie and Fitch clothes',
      'Boots',
      'Knix boxers',
      'Cozy Co robes',
      'Head spa thing',
      'Ring watch',
      'Rothys.com',
      'Crew neck',
      'Floss threaders',
      'Get the gym back up',
      'Boob cake for bday',
      'Shirt — LOTR',
      'Pizza party for bday',
      'Ask friends to suggest a song that reminds them of her and a note to go with it',
    ]),
  },
];

db.collection('caroleProfile')
  .doc(userId)
  .set({ sections, updatedAt: now })
  .then(() => {
    console.log(`Replaced Carole profile with ${sections.length} sections.`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

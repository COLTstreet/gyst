// One-off dev utility: populates Firestore with realistic starter data for
// one user, using the Admin SDK (bypasses security rules, same as Cloud
// Functions do). Not deployed anywhere — run locally only.
//
// Usage: node scripts/seed.js <path-to-service-account-key.json> <userId>

const admin = require('firebase-admin');
const path = require('path');

const [, , keyPathArg, userIdArg] = process.argv;

if (!keyPathArg || !userIdArg) {
  console.error('Usage: node scripts/seed.js <path-to-service-account-key.json> <userId>');
  process.exit(1);
}

const keyPath = path.resolve(keyPathArg);
const userId = userIdArg;

admin.initializeApp({
  credential: admin.credential.cert(require(keyPath)),
});

const db = admin.firestore();
const now = admin.firestore.Timestamp.now();

function daysFromNow(days, hours = 9) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hours, 0, 0, 0);
  return admin.firestore.Timestamp.fromDate(d);
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function seedTasks() {
  const tasks = [
    {
      title: 'Take out recycling',
      priority: 'low',
      status: 'open',
      dueDate: daysFromNow(-1),
      tags: ['home'],
    },
    {
      title: 'Buy milk',
      priority: 'low',
      status: 'open',
      dueDate: daysFromNow(0),
      tags: ['errands'],
    },
    {
      title: 'Call dentist',
      priority: 'medium',
      status: 'open',
      dueDate: daysFromNow(1),
      tags: [],
    },
    {
      title: 'Finish GYST scaffolding',
      priority: 'high',
      status: 'open',
      dueDate: daysFromNow(3),
      notes: 'Still need Calendar OAuth flow and push notification wiring.',
      tags: ['gyst'],
    },
    {
      title: 'Renew car registration',
      priority: 'medium',
      status: 'completed',
      dueDate: daysFromNow(-3),
      tags: ['errands'],
    },
  ];

  for (const task of tasks) {
    await db.collection('tasks').add({
      userId,
      notes: null,
      updatedAt: now,
      createdAt: now,
      ...task,
    });
  }
  console.log(`Seeded ${tasks.length} tasks`);
}

async function seedLists() {
  const lists = [
    {
      name: 'Groceries',
      items: [
        { id: 'g1', text: 'Milk', checked: false, order: 0 },
        { id: 'g2', text: 'Eggs', checked: false, order: 1 },
        { id: 'g3', text: 'Coffee', checked: true, order: 2 },
        { id: 'g4', text: 'Bananas', checked: false, order: 3 },
      ],
    },
    {
      name: 'Hardware Store',
      items: [
        { id: 'h1', text: 'Lightbulbs', checked: false, order: 0 },
        { id: 'h2', text: 'Duct tape', checked: false, order: 1 },
        { id: 'h3', text: 'Batteries (AA)', checked: true, order: 2 },
      ],
    },
  ];

  for (const list of lists) {
    await db.collection('lists').add({
      userId,
      updatedAt: now,
      createdAt: now,
      ...list,
    });
  }
  console.log(`Seeded ${lists.length} lists`);
}

async function seedReminders() {
  const reminders = [
    {
      message: 'Take vitamins',
      triggerAt: daysFromNow(0, new Date().getHours() + 2),
      status: 'pending',
      recurrence: { frequency: 'daily', interval: 1 },
    },
    {
      message: 'Pay credit card bill',
      triggerAt: daysFromNow(5),
      status: 'pending',
      recurrence: null,
    },
    {
      message: "Mom's birthday — call her",
      triggerAt: daysFromNow(14),
      status: 'pending',
      recurrence: { frequency: 'yearly', interval: 1 },
    },
  ];

  for (const reminder of reminders) {
    await db.collection('reminders').add({
      userId,
      createdAt: now,
      ...reminder,
    });
  }
  console.log(`Seeded ${reminders.length} reminders`);
}

async function seedDailyNote() {
  const docId = `${userId}_${todayKey()}`;
  await db
    .collection('dailyNotes')
    .doc(docId)
    .set({
      userId,
      date: todayKey(),
      entries: [
        {
          id: 'n1',
          text: 'Started building GYST today — feeling good about the scaffold.',
          timestamp: admin.firestore.Timestamp.now(),
          createdVia: 'manual',
        },
        {
          id: 'n2',
          text: 'Remember to check Firebase billing before deploying functions.',
          timestamp: admin.firestore.Timestamp.now(),
          createdVia: 'manual',
        },
      ],
      createdAt: now,
      updatedAt: now,
    });
  console.log('Seeded today\'s daily note');
}

async function seedCaroleProfile() {
  await db
    .collection('caroleProfile')
    .doc(userId)
    .set({
      sections: [
        {
          id: 's1',
          title: 'Sizes',
          order: 0,
          type: 'keyValue',
          items: [
            { id: 'k1', key: 'Shirt', value: 'M' },
            { id: 'k2', key: 'Pants', value: '8' },
            { id: 'k3', key: 'Shoe', value: '8.5' },
            { id: 'k4', key: 'Ring', value: '6' },
          ],
        },
        {
          id: 's2',
          title: 'Gift Ideas',
          order: 1,
          type: 'checklist',
          items: [
            { id: 'c1', text: 'Cozy robe', checked: false },
            { id: 'c2', text: 'Le Creuset dutch oven', checked: false },
            { id: 'c3', text: 'Concert tickets', checked: true },
          ],
        },
        {
          id: 's3',
          title: 'Date Ideas',
          order: 2,
          type: 'notes',
          items: [
            { id: 'd1', text: 'Sunset picnic at the park' },
            { id: 'd2', text: 'Try that new ramen place downtown' },
            { id: 'd3', text: 'Weekend hiking trip' },
          ],
        },
        {
          id: 's4',
          title: 'Restaurant Orders',
          order: 3,
          type: 'notes',
          items: [
            { id: 'r1', text: 'Usually gets the salmon, no capers' },
            { id: 'r2', text: 'Loves their bread pudding for dessert' },
          ],
        },
      ],
      updatedAt: now,
    });
  console.log('Seeded Carole profile');
}

async function main() {
  console.log(`Seeding data for userId=${userId}...`);
  await seedTasks();
  await seedLists();
  await seedReminders();
  await seedDailyNote();
  await seedCaroleProfile();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

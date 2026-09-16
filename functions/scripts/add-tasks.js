// One-off: adds a batch of tasks for a user.
// Usage: node scripts/add-tasks.js <path-to-service-account-key.json> <userId>

const admin = require('firebase-admin');
const path = require('path');

const [, , keyPathArg, userIdArg] = process.argv;

if (!keyPathArg || !userIdArg) {
  console.error('Usage: node scripts/add-tasks.js <path-to-service-account-key.json> <userId>');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(require(path.resolve(keyPathArg))),
});

const userId = userIdArg;
const db = admin.firestore();
const now = admin.firestore.Timestamp.now();

const tasks = [
  {
    title: "Pilot's snacks/treats for classroom",
    priority: 'medium',
  },
  {
    title: "Add $200 to budget sheet for Lily's registry",
    priority: 'medium',
  },
  {
    title: 'Find topics of conversation and start them unprompted',
    priority: 'medium',
  },
  {
    title: "Pick photo for family wall @ Pilot's school",
    priority: 'medium',
  },
  {
    title: 'Research hotels & things to do for anniversary night away (Oct 10–11)',
    priority: 'medium',
    notes: 'Create a doc with findings once researched.',
  },
];

async function main() {
  for (const task of tasks) {
    await db.collection('tasks').add({
      userId,
      title: task.title,
      notes: task.notes ?? null,
      dueDate: null,
      priority: task.priority,
      status: 'open',
      tags: [],
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log(`Added ${tasks.length} tasks.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

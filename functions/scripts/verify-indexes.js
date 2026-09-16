const admin = require('firebase-admin');
const path = require('path');

const [, , keyPathArg, userIdArg] = process.argv;
admin.initializeApp({ credential: admin.credential.cert(require(path.resolve(keyPathArg))) });
const db = admin.firestore();
const uid = userIdArg;

async function test() {
  try {
    const snap = await db.collection('tasks').where('userId', '==', uid).orderBy('dueDate', 'asc').get();
    console.log('tasks query OK, docs:', snap.size);
  } catch (e) {
    console.log('tasks query FAILED:', e.message);
  }

  try {
    const snap = await db.collection('lists').where('userId', '==', uid).orderBy('createdAt', 'asc').get();
    console.log('lists query OK, docs:', snap.size);
  } catch (e) {
    console.log('lists query FAILED:', e.message);
  }

  try {
    const snap = await db.collection('reminders').where('userId', '==', uid).orderBy('triggerAt', 'asc').get();
    console.log('reminders query OK, docs:', snap.size);
  } catch (e) {
    console.log('reminders query FAILED:', e.message);
  }
}

test();

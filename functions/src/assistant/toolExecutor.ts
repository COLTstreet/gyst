import { FieldValue } from 'firebase-admin/firestore';
import { randomUUID } from 'node:crypto';
import { db } from '../shared/firestore';
import { createCalendarEvent } from '../calendar/createEvent';

type ToolHandler = (userId: string, input: Record<string, unknown>) => Promise<unknown>;

async function findOrCreateCaroleSection(
  userId: string,
  title: string,
  type: 'checklist' | 'notes' | 'keyValue',
): Promise<string> {
  const ref = db.collection('caroleProfile').doc(userId);
  const snap = await ref.get();
  const sections = (snap.data()?.['sections'] ?? []) as Array<{ id: string; title: string; type: string }>;

  const existing = sections.find((s) => s.title.toLowerCase() === title.toLowerCase());
  if (existing) return existing.id;

  const section = { id: randomUUID(), title, order: sections.length, type, items: [] };
  await ref.set({ sections: [...sections, section], updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return section.id;
}

async function addCaroleSectionItem(userId: string, sectionId: string, item: Record<string, unknown>): Promise<void> {
  const ref = db.collection('caroleProfile').doc(userId);
  const snap = await ref.get();
  const sections = (snap.data()?.['sections'] ?? []) as Array<{ id: string; items: unknown[] }>;

  const updated = sections.map((s) => (s.id === sectionId ? { ...s, items: [...s.items, item] } : s));
  await ref.update({ sections: updated, updatedAt: FieldValue.serverTimestamp() });
}

const handlers: Record<string, ToolHandler> = {
  async create_task(userId, input) {
    const ref = await db.collection('tasks').add({
      userId,
      title: input['title'],
      notes: input['notes'] ?? null,
      dueDate: input['dueDate'] ? new Date(input['dueDate'] as string) : null,
      priority: input['priority'] ?? 'medium',
      status: 'open',
      tags: input['tags'] ?? [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { taskId: ref.id };
  },

  async update_task(_userId, input) {
    const { taskId, ...changes } = input;
    if (changes['dueDate']) changes['dueDate'] = new Date(changes['dueDate'] as string);
    await db.collection('tasks').doc(taskId as string).update({ ...changes, updatedAt: FieldValue.serverTimestamp() });
    return { updated: true };
  },

  async delete_task(_userId, input) {
    await db.collection('tasks').doc(input['taskId'] as string).delete();
    return { deleted: true };
  },

  async create_list(userId, input) {
    const ref = await db.collection('lists').add({
      userId,
      name: input['name'],
      items: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { listId: ref.id };
  },

  async add_list_item(_userId, input) {
    const listRef = db.collection('lists').doc(input['listId'] as string);
    const snap = await listRef.get();
    const items = (snap.data()?.['items'] ?? []) as Array<{ order: number }>;
    const item = { id: randomUUID(), text: input['text'], checked: false, order: items.length };
    await listRef.update({ items: [...items, item], updatedAt: FieldValue.serverTimestamp() });
    return { itemId: item.id };
  },

  async update_list_item(_userId, input) {
    const listRef = db.collection('lists').doc(input['listId'] as string);
    const snap = await listRef.get();
    const items = (snap.data()?.['items'] ?? []) as Array<{ id: string }>;
    const updated = items.map((item) =>
      item.id === input['itemId'] ? { ...item, ...('text' in input ? { text: input['text'] } : {}), ...('checked' in input ? { checked: input['checked'] } : {}) } : item,
    );
    await listRef.update({ items: updated, updatedAt: FieldValue.serverTimestamp() });
    return { updated: true };
  },

  async create_reminder(userId, input) {
    const ref = await db.collection('reminders').add({
      userId,
      message: input['message'],
      triggerAt: new Date(input['triggerAt'] as string),
      status: 'pending',
      recurrence: input['recurrence'] ?? null,
      createdAt: FieldValue.serverTimestamp(),
    });
    return { reminderId: ref.id };
  },

  async cancel_reminder(_userId, input) {
    await db.collection('reminders').doc(input['reminderId'] as string).delete();
    return { cancelled: true };
  },

  async create_calendar_event(userId, input) {
    return createCalendarEvent(userId, {
      summary: input['summary'] as string,
      description: input['description'] as string | undefined,
      startDateTime: input['startDateTime'] as string,
      endDateTime: input['endDateTime'] as string,
    });
  },

  async add_gift_idea(userId, input) {
    const sectionId = await findOrCreateCaroleSection(userId, 'Gift Ideas', 'checklist');
    await addCaroleSectionItem(userId, sectionId, { id: randomUUID(), text: input['idea'], checked: false });
    return { sectionId };
  },

  async mark_gift_purchased(userId, input) {
    const ref = db.collection('caroleProfile').doc(userId);
    const snap = await ref.get();
    const sections = (snap.data()?.['sections'] ?? []) as Array<{ id: string; items: Array<{ id: string }> }>;
    const updated = sections.map((s) =>
      s.id === input['sectionId']
        ? { ...s, items: s.items.map((item) => (item.id === input['itemId'] ? { ...item, checked: true } : item)) }
        : s,
    );
    await ref.update({ sections: updated, updatedAt: FieldValue.serverTimestamp() });
    return { marked: true };
  },

  async add_date_idea(userId, input) {
    const sectionId = await findOrCreateCaroleSection(userId, 'Date Ideas', 'notes');
    await addCaroleSectionItem(userId, sectionId, { id: randomUUID(), text: input['idea'] });
    return { sectionId };
  },

  async add_carole_note(userId, input) {
    const sectionId = await findOrCreateCaroleSection(userId, 'Notes', 'notes');
    await addCaroleSectionItem(userId, sectionId, { id: randomUUID(), text: input['note'] });
    return { sectionId };
  },

  async add_to_carole_section(userId, input) {
    await addCaroleSectionItem(userId, input['sectionId'] as string, {
      id: randomUUID(),
      ...(input['item'] as Record<string, unknown>),
    });
    return { added: true };
  },

  async add_daily_note(userId, input) {
    const date = (input['date'] as string) ?? new Date().toISOString().slice(0, 10);
    const docId = `${userId}_${date}`;
    const ref = db.collection('dailyNotes').doc(docId);
    const entry = { id: randomUUID(), text: input['text'], timestamp: FieldValue.serverTimestamp(), createdVia: 'assistant' };

    const snap = await ref.get();
    if (snap.exists) {
      // serverTimestamp() sentinels can't live inside arrayUnion payloads.
      await ref.update({ entries: FieldValue.arrayUnion({ ...entry, timestamp: new Date() }), updatedAt: FieldValue.serverTimestamp() });
    } else {
      await ref.set({
        userId,
        date,
        entries: [{ ...entry, timestamp: new Date() }],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    return { date };
  },

  async get_daily_notes(userId, input) {
    const date = (input['date'] as string) ?? new Date().toISOString().slice(0, 10);
    const snap = await db.collection('dailyNotes').doc(`${userId}_${date}`).get();
    return snap.exists ? snap.data() : { entries: [] };
  },
};

export async function executeTool(
  userId: string,
  toolName: string,
  input: Record<string, unknown>,
): Promise<unknown> {
  const handler = handlers[toolName];
  if (!handler) {
    throw new Error(`Unknown tool: ${toolName}`);
  }
  return handler(userId, input);
}

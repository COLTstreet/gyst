import type Anthropic from '@anthropic-ai/sdk';

type Tool = Anthropic.Tool;

/**
 * Context (current tasks/lists/reminders) is injected directly into the
 * prompt by buildCurrentContext(), so these tools are action-only — no
 * read/list tools, except get_daily_notes since notes are deliberately left
 * out of context injection to avoid prompt bloat.
 */
export function buildToolDefinitions(): Tool[] {
  return [
    {
      name: 'create_task',
      description: 'Create a new task.',
      input_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          notes: { type: 'string' },
          dueDate: { type: 'string', description: 'ISO 8601 date/time' },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] },
          tags: { type: 'array', items: { type: 'string' } },
        },
        required: ['title'],
      },
    },
    {
      name: 'update_task',
      description:
        'Update an existing task. Also used to mark a task complete or reopen it via the status field.',
      input_schema: {
        type: 'object',
        properties: {
          taskId: { type: 'string' },
          title: { type: 'string' },
          notes: { type: 'string' },
          dueDate: { type: 'string', description: 'ISO 8601 date/time' },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] },
          status: { type: 'string', enum: ['open', 'completed'] },
          tags: { type: 'array', items: { type: 'string' } },
        },
        required: ['taskId'],
      },
    },
    {
      name: 'delete_task',
      description: 'Permanently delete a task. Destructive — requires user confirmation.',
      input_schema: {
        type: 'object',
        properties: {
          taskId: { type: 'string' },
          title: { type: 'string', description: 'For the confirmation prompt.' },
        },
        required: ['taskId'],
      },
    },
    {
      name: 'create_list',
      description: 'Create a new named list (e.g. a grocery list).',
      input_schema: {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
      },
    },
    {
      name: 'add_list_item',
      description: 'Add an item to an existing list.',
      input_schema: {
        type: 'object',
        properties: {
          listId: { type: 'string' },
          text: { type: 'string' },
        },
        required: ['listId', 'text'],
      },
    },
    {
      name: 'update_list_item',
      description: 'Update or check/uncheck an existing list item.',
      input_schema: {
        type: 'object',
        properties: {
          listId: { type: 'string' },
          itemId: { type: 'string' },
          text: { type: 'string' },
          checked: { type: 'boolean' },
        },
        required: ['listId', 'itemId'],
      },
    },
    {
      name: 'create_reminder',
      description: 'Create a standalone reminder (message + trigger time), optionally recurring.',
      input_schema: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          triggerAt: { type: 'string', description: 'ISO 8601 date/time' },
          recurrence: {
            type: 'object',
            properties: {
              frequency: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'yearly'] },
              interval: { type: 'number' },
            },
          },
        },
        required: ['message', 'triggerAt'],
      },
    },
    {
      name: 'cancel_reminder',
      description: 'Cancel (delete) a pending reminder. Destructive — requires user confirmation.',
      input_schema: {
        type: 'object',
        properties: {
          reminderId: { type: 'string' },
          message: { type: 'string', description: 'For the confirmation prompt.' },
        },
        required: ['reminderId'],
      },
    },
    {
      name: 'add_gift_idea',
      description: "Add a gift idea to Carole's page.",
      input_schema: {
        type: 'object',
        properties: {
          idea: { type: 'string' },
        },
        required: ['idea'],
      },
    },
    {
      name: 'mark_gift_purchased',
      description: 'Mark a gift idea on ​Carole’s page as purchased.',
      input_schema: {
        type: 'object',
        properties: {
          sectionId: { type: 'string' },
          itemId: { type: 'string' },
        },
        required: ['sectionId', 'itemId'],
      },
    },
    {
      name: 'add_date_idea',
      description: "Add a date idea to Carole's page.",
      input_schema: {
        type: 'object',
        properties: { idea: { type: 'string' } },
        required: ['idea'],
      },
    },
    {
      name: 'add_carole_note',
      description: "Add a freeform note to Carole's page.",
      input_schema: {
        type: 'object',
        properties: { note: { type: 'string' } },
        required: ['note'],
      },
    },
    {
      name: 'add_to_carole_section',
      description:
        "Generic write to any user-defined section on Carole's page, by section id and item shape.",
      input_schema: {
        type: 'object',
        properties: {
          sectionId: { type: 'string' },
          item: { type: 'object', description: 'Shape depends on the section type.' },
        },
        required: ['sectionId', 'item'],
      },
    },
    {
      name: 'add_daily_note',
      description: "Append a freeform entry to a day's notes.",
      input_schema: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'YYYY-MM-DD, defaults to today.' },
          text: { type: 'string' },
        },
        required: ['text'],
      },
    },
    {
      name: 'get_daily_notes',
      description: "Read a day's notes. Not included in standard context injection to avoid prompt bloat.",
      input_schema: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'YYYY-MM-DD, defaults to today.' },
        },
      },
    },
  ];
}

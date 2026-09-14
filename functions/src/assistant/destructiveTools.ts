export const DESTRUCTIVE_TOOLS = new Set(['delete_task', 'cancel_reminder']);

export function isDestructiveTool(toolName: string): boolean {
  return DESTRUCTIVE_TOOLS.has(toolName);
}

/** Human-readable description shown in the confirmation prompt, e.g. "Delete task \"Buy milk\"?" */
export function describeDestructiveAction(toolName: string, input: Record<string, unknown>): string {
  switch (toolName) {
    case 'delete_task':
      return `Delete task "${input['title'] ?? input['taskId']}"?`;
    case 'cancel_reminder':
      return `Cancel reminder "${input['message'] ?? input['reminderId']}"?`;
    default:
      return `Run ${toolName}?`;
  }
}

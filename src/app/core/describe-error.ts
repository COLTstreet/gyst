import { FirebaseError } from 'firebase/app';

/** Human-readable summary for the global error toast — see GlobalErrorHandler. */
export function describeError(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'permission-denied':
        return "You don't have permission to do that.";
      case 'unavailable':
        return "You're offline — this will retry once you're back online.";
      case 'not-found':
        return "That item couldn't be found — it may have already been deleted.";
      case 'messaging/permission-blocked':
        return 'Notifications are blocked in your browser settings.';
      case 'messaging/failed-service-worker-registration':
        return 'Could not set up push notifications on this device.';
      default:
        return error.message || `Something went wrong (${error.code}).`;
    }
  }

  if (error instanceof Error) {
    return error.message || 'Something went wrong.';
  }

  return 'Something went wrong.';
}

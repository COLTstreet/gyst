import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';

/** Callable Functions verify the ID token automatically; this just extracts the uid or rejects. */
export function requireUserId(request: CallableRequest): string {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Sign in required.');
  }
  return uid;
}

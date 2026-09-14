import { google } from 'googleapis';
import { db } from '../shared/firestore';

export interface CreateEventInput {
  summary: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
}

/**
 * Write-only: events.insert only, scope calendar.events. No event listing,
 * update, or delete — see GYST_PROJECT_BRIEF.md's Google OAuth + Calendar Flow.
 */
export async function createCalendarEvent(userId: string, input: CreateEventInput): Promise<{ eventId: string; htmlLink: string | null }> {
  const userSnap = await db.collection('users').doc(userId).get();
  const refreshToken = userSnap.data()?.['googleRefreshToken'];
  if (!refreshToken) {
    throw new Error('Google Calendar is not connected for this user.');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env['GOOGLE_OAUTH_CLIENT_ID'],
    process.env['GOOGLE_OAUTH_CLIENT_SECRET'],
  );
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  const { data } = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: input.summary,
      description: input.description,
      start: { dateTime: input.startDateTime },
      end: { dateTime: input.endDateTime },
    },
  });

  return { eventId: data.id ?? '', htmlLink: data.htmlLink ?? null };
}

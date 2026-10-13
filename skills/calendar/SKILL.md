---
name: calendar
description: Use for ANY request about the team's shared Out of Office / remote calendar. Logging or checking remote days, OOO or time off, who is out or remote, schedule availability, "mark me remote", "mark me OOO", "I'm out next week", Friday remote default. Has the calendar ID and the naming, visibility, and dedupe rules. Without it, Google Calendar calls hit the wrong (primary) calendar.
---

# Team Out of Office calendar

The team logs remote and out-of-office days on one shared Google Calendar. Set up by Justin Lui on 2026-10-12.

- **Name:** Out of Office (OOO)
- **Calendar ID:** `c_0bbff91effcac8269b76134b86d65cef16de427958ebfdf28ebbaa181fe4e84f@group.calendar.google.com`
- **Timezone:** America/Los_Angeles

## Access

Claude's Google account `claudescorecard@scorecard.io` has writer access. The calendar does NOT appear in `list_calendars`. Always pass `calendar_id` explicitly to every Google Calendar tool call. A call with no `calendar_id` hits the primary calendar, which is the wrong one.

Call the Google Calendar connector tools directly if they are in the session. Otherwise do the calendar work through a worker session that has them.

## Event conventions

- All-day events only.
- Remote: title `Remote - <first name>`, visibility free (transparent).
- Out of office: title `OOO - <first name>`, visibility busy (opaque).
- A multi-day absence is ONE multi-day all-day event. The end date is exclusive (Mon to Wed inclusive ends Thu).
- Use `notificationLevel` NONE.
- Dedupe: list that day's events before creating. Do not create a second event for the same person and day.
- Never change the times of existing timed events.

## Defaults

The team is remote on Fridays by default. Generic untitled `Remote` events, such as the weekly Friday series, mean remote for everyone. Leave them alone. Only log per-person entries for exceptions (for example someone is OOO on a Friday, or remote on a Tuesday).

## Who to log

- Log what a person asks for in their own message.
- Log what Justin Lui asks for, including for other people.
- If someone only mentions plans in passing, or a teammate says it about someone else, confirm with that person in the thread first. Justin directing it counts as confirmation.
- Teammates also post remote and OOO news in #sf. When asked to catch up, check there.

## Attendees

Justin asked to add the person as an attendee on events Claude creates. Teammate emails are not available by default (Slack user search returns an email only for an exact email query). Ask for the email, or skip the attendee and say so.

## Reply

Reply once, in the thread, with what was created: title, dates, and free or busy.

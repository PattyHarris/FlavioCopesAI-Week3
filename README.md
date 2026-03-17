# Let's Split It!

Shared expense tracker built with React, Node.js, and Supabase.

## Stack

- React + Vite frontend
- Express server for local/prod hosting
- Supabase Auth + Postgres with Row Level Security

## Local setup

1. Create a Supabase project.
2. In the Supabase SQL editor, run [`supabase/schema.sql`](./supabase/schema.sql).
3. Copy [`.env.example`](./.env.example) to `.env`.
4. Fill in:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - or `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `PORT`
5. Install dependencies:

```bash
npm install
```

6. Start the client and server:

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Server health check: `http://localhost:3001/api/health`

If you only want to work on the frontend first, run:

```bash
npm run dev:client
```

## Render deployment

- Build command: `npm install && npm run build`
- Start command: `npm start`
- Set the same environment variables from `.env.example`

The Express server serves the built React app from `client/dist`.

## Data model

- `profiles`: user profile data tied to Supabase Auth
- `groups`: expense groups
- `group_members`: membership records
- `group_invitations`: pending invites by email
- `expenses`: expense headers
- `expense_splits`: per-user split amounts in integer cents
- `settlements`: payments between members
- `group_messages`: simple group chat/messages

All money values are stored as integer cents.

## Current status

This project now includes a working full-stack prototype of "Let's Split It!" with:

- public landing page, sign-up page, and sign-in page
- protected dashboard (`My Groups`) and group details page
- Supabase Auth session persistence
- group creation and scoped group visibility by membership
- email-based group invitations stored in Supabase
- automatic invitation claiming when an invited user signs in with the matching email
- pending invite visibility on the group details page
- invite revoke flow for inviters and group owners
- expense entry with integer-cent storage
- equal and exact split support
- automatic balance calculation and settlement recording
- group messages
- expense deletion from the UI

## Session summary

Work completed in this session includes:

- scaffolded the React frontend, Express server, and Supabase schema
- configured Vite to read environment variables from the repo root `.env`
- documented local setup, build, and Render deployment
- fixed multiple Supabase RLS issues, including recursive membership policies and owner visibility on newly created groups
- added action feedback banners for invite, expense, settlement, and message flows
- added background polling so invites and group membership changes appear without manual refresh
- improved the add-expense dialog behavior for equal vs exact splits
- improved modal overflow behavior and removed the sticky header so content is not hidden during scrolling
- added a UI delete flow for expenses with a custom confirmation dialog
- added a pending invites section and revoke flow for group invitations
- updated landing-page behavior so the app title returns to the landing page and the header reflects signed-in state

## Testing notes

Verified during local testing:

- sign-up and sign-in work against Supabase
- invitation flow works when Supabase email confirmation is disabled or the invited auth user is manually confirmed
- unregistered invited users can sign up and automatically join the invited group
- already signed-in users receive new group invitations via background sync without manual refresh
- frontend production build succeeds with `npm --workspace client run build`

Known caveat:

- if Supabase email confirmation is enabled, user sign-in still depends on the external confirmation email flow completing correctly in Supabase

## Known limitations

- Invite flow currently stores pending invitations in `group_invitations`, but it does not send a real email invite from the app itself.
- Invite success means the invitation row was saved; the invited user is added only when they sign in with the same email address.
- Pending invites can now be viewed and revoked, but there is still no resend flow.
- Active members and pending invites are shown in the same area of the group page rather than in a more structured membership management view.
- Background refresh for invites and membership changes currently uses polling rather than Supabase realtime subscriptions.
- Email-confirmation-enabled testing still depends on Supabase mail delivery and redirect configuration.
- Expense editing is not implemented yet; current cleanup flows support delete and recreate.
- Group deletion still uses the browser confirm dialog, while expense deletion uses a custom in-app dialog.

## UI polish targets

- Improve invite messaging so the UI clearly distinguishes `invite saved`, `user joined`, and `pending until sign-in`.
- Improve the pending invite section with clearer status styling, resend support, and tighter alignment with the member list.
- Replace polling with realtime updates for groups, members, invitations, expenses, and messages.
- Add inline balance explanations that show how each member's net amount was derived.
- Improve mobile spacing and density on the group details page, especially in the two-column desktop layout collapsing to one column.
- Add edit support for expense descriptions and split details with the same confirmation/polish level as delete.
- Add a more intentional icon set across the app so action controls and feature cards use a consistent visual language.

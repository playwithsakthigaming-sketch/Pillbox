# Team Pillbox EMS — FiveM RP Site

## Original Problem Statement
"i am in team Pillbox fivem rp besed ems system, homw page, staffs, staff click to show experience, id card genarator with join application"

Iteration 3 adds: Discord webhook for applications, admin add/remove/edit staff, rename ID card route to `/idcard`.

## Architecture
- **Frontend**: React (CRA + craco), React Router, Framer Motion, Tailwind, shadcn/ui, sonner toasts, lucide-react, html-to-image.
- **Backend**: FastAPI + Motor (async MongoDB).
- **Theme**: Dark tactical EMS with blue `#2A6DF4` accent. Pillbox logo at `/public/assets/pillbox-logo.webp` used across Navbar, Footer, Hero, ID card, favicon.
- **Auth**: Header-based admin token (`X-Admin-Token`). No user accounts on the public site.

## User Personas
- FiveM RP players reading the roster.
- Recruits filling the join application.
- Members generating a custom ID card.
- Department admins managing staff & reviewing applications.

## Core Requirements (static)
- Home, Roster (with detail modal), ID card generator (PNG export), Join application.
- Admin console to add/remove/edit staff and review applications.
- New application sent to Discord (webhook) when configured.

## Implemented (latest)
- Public endpoints: `GET /api/staff`, `GET /api/staff/{id}`, `POST /api/applications`, `GET /api/applications/status/{ref}` (full UUID or 8-char prefix), `GET /api/stats`.
- Admin endpoints (require `X-Admin-Token`): `POST /api/admin/login`, `GET /api/admin/applications`, `POST /api/admin/staff`, `PATCH /api/admin/staff/{id}`, `DELETE /api/admin/staff/{id}`, `PATCH /api/admin/applications/{id}` (status ∈ {accepted, rejected, interview, pending}).
- Discord webhook: new submissions + every status change post a rich embed to `DISCORD_WEBHOOK_URL`. Empty → graceful no-op.
- Discord bot DM: when applicant provides `discord_user_id` and status changes to accepted/interview/rejected, the bot DMs them (via `DISCORD_BOT_TOKEN`). Fire-and-forget, never blocks the request.
- Frontend routes: `/`, `/staff`, `/idcard`, `/apply`, `/status`, `/admin`.
- Apply form: optional Discord User ID field. Success screen shows large 8-char REF with copy-to-clipboard + "Check My Status" link.
- Status page (`/status`): public lookup by Ref ID — color-coded status badge (pending/interview/accepted/rejected), command note, timestamps.
- Admin Applications tab: status badge + 4 action buttons (Accept/Interview/Reject/Re-open) + per-card message textarea.
- Tested end-to-end (29/29 backend, all frontend flows green).

## Backlog
- **P2**: Discord slash-command bot (alternative to webhook) for `/staff-add`, `/staff-remove`.
- **P2**: Department announcements / dispatch log on Home.
- **P2**: Application status workflow (pending → interview → accepted/rejected).
- **P3**: Member self-service portal with login.

## Credentials
- `ADMIN_TOKEN=pillbox-admin-2026` (set in `backend/.env`, also in `/app/memory/test_credentials.md`).
- `DISCORD_WEBHOOK_URL=""` — empty by default; paste your webhook URL into `backend/.env` and restart backend to enable Discord notifications.

# Team Pillbox EMS — FiveM RP Site

## Original Problem Statement
"i am in team Pillbox fivem rp besed ems system, homw page, staffs, staff click to show experience, id card genarator with join application"

## Architecture
- React (CRA + craco) frontend with React Router, Framer Motion, Tailwind, shadcn/ui, sonner toasts, lucide-react icons, html-to-image for PNG export.
- FastAPI backend with Motor (async MongoDB), seeded staff roster on startup.
- Public site, no auth.
- Theme: dark tactical EMS with **blue** primary (`#2A6DF4`) — updated from red after user request, plus official Pillbox logo wired into Navbar, Footer, Hero, ID card & favicon.

## User Personas
- FiveM RP players browsing the department site and reading the roster.
- Prospective recruits filling the join application.
- Existing members generating a custom ID card.

## Core Requirements (static)
- Home page with hero, stats, marquee, CTAs.
- Staff roster with detail modal showing experience, certifications, specialties.
- ID card generator with live preview and PNG download.
- Join application form persisted to MongoDB.

## Implemented (2026-02)
- Backend: `/api/staff`, `/api/staff/{id}`, `/api/applications` (POST + GET), `/api/stats`. Seeded 8 staff.
- Frontend pages: Home (`/`), Roster (`/staff`), ID Card (`/id-card`), Apply (`/apply`).
- Components: Navbar, Footer, StaffCard, StaffDetailModal (MDT terminal style), IdCard (vertical badge with barcode + logo), Hero with logo.
- Blue color scheme migration completed (replaces previous red EMS accent).
- Logo at `/frontend/public/assets/pillbox-logo.webp` used in Navbar, Footer, Hero badge, ID card top stripe, favicon.
- Tested end-to-end via testing_agent_v3 — all flows green.

## Backlog
- **P1**: Admin view to review applications (currently API exists, UI does not).
- **P2**: Discord webhook for application submissions.
- **P2**: Member login + edit-own-profile portal.
- **P2**: Department announcements / dispatch log feed on Home.

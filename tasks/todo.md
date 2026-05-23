# Summer Buddy Up Integration Checklist

## Phase 1: Database Migration
- [x] Create PostgreSQL schema script `supabase/create_summer_buddy_up.sql` with tables for `teams`, `sub_coaches`, `students`, and `check_ins`.
- [x] Define relational constraints, indexes, and Row-Level Security (RLS) policies.
- [x] Implement database client interfaces for the new tables in `lib/database/types.ts`.
- [x] Update `lib/database/SupabaseProvider.ts` with Supabase API query functions for teams, sub-coaches, students, and check-ins.

## Phase 2: Local Simulation Layer (Offline Testing)
- [x] Create `lib/database/SimulatedProvider.ts` to implement `IDatabaseProvider` methods on top of `localStorage` for sandbox testing.
- [x] Update `lib/database/index.ts` to check for `abe_use_simulation` and route database calls to `SimulatedProvider` or `SupabaseProvider`.
- [x] Integrate a Simulation Control Panel (`components/DevSimulationPanel.tsx`) that lets developers switch logins (Head Coach, Sub-Coach 1/2, Admin, Guest) and toggle database simulation mode.

## Phase 3: Registration Wizard (React + Tailwind)
- [x] Create `components/SummerBuddyUpRegistration.tsx` with a stepped layout (basics, sub-coaches, students, legal).
- [x] Enforce client-side validation guardrails (3:1 Peer Mentor to Inclusion Buddy ratio).
- [x] Enforce LUSD/Tracy school district physical ceremony award locking to `IN_PERSON_ONLY`.
- [x] Enforce the 9-student limit (hide add button, show warning tooltip).
- [x] Link wizard submission to team database creation.

## Phase 4: Dashboard Gatekeeper & waivers
- [x] Create `components/SummerBuddyUpDashboard.tsx` with the team dashboard layout.
- [x] Enforce the waiver modal overlay if a logged-in sub-coach has not accepted consent.
- [x] Enforce team status transition logic (transition to `ACTIVE` when all sub-coaches accept waiver consent).
- [x] Add the WhatsApp/SMS manual invite link copy section.
- [x] Mask contact information (phone/email) if the sub-coach has not accepted consent.

## Phase 5: Milestone Progress Check-Ins
- [x] Render 4 milestones (July 15, July 30, August 15, August 30) on the team dashboard.
- [x] Disable check-in submission if team is `PENDING_CONSENT`.
- [x] Implement unlisted YouTube URL check-in form with summary and empathy logs.
- [x] Implement flexible date routing (allow submitting any milestone regardless of past deadlines, verify 2/4 for eligibility).

## Phase 6: Tab Integration & Admin Console
- [x] Update `pages/CircleOfFriends.tsx` to add a premium tab bar switching between "Voices of the Herd" and "Summer Buddy Up".
- [x] Handle unauthenticated views (show a beautiful program page with login CTA).
- [x] Handle admin view inside "Summer Buddy Up" to let board members see all teams and check-in submissions.
- [x] Verify everything locally across multiple simulated identities.

## Phase 7: Cohort Dashboard Navigation & Simulated Login Routing
- [x] Add a direct sidebar/mobile menu link for **Summer Buddy Up** inside `pages/Dashboard.tsx`.
- [x] Handle click redirection on path-based nav items in `pages/Dashboard.tsx`.
- [x] Modify simulated login default redirect in `pages/Login.tsx` to go to `/circle-of-friends?tab=summer-buddy-up`.

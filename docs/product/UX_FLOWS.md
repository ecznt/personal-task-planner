# Personal Task Planner — UX Flows and Information Architecture

| Field | Value |
| --- | --- |
| Status | Approved — Stage 3 complete; Stage 4 domain decisions reconciled |
| Planning stage | Stage 3 — UX flows and information architecture |
| Product scope | MVP |
| Document language | English |
| Last updated | 2026-07-19 |
| Implementation status | Not started |

This document defines navigation, routes, interaction flows, responsive behavior, state handling, and accessibility expectations. It does not define application code, React components, APIs, persistence schemas, or visual styling specifications.

## UX principles

- **UXP-001 — Today first:** The default authenticated destination emphasizes personal daily planning and execution.
- **UXP-002 — Context-preserving capture:** Task creation should inherit the current Area or Project when possible while keeping Area selection explicit and correct.
- **UXP-003 — One Task, consistent state:** The same Task may appear in several views but must communicate the same state and must not be duplicated within one result set.
- **UXP-004 — Progressive disclosure:** Quick capture asks for the minimum valid information; advanced fields remain available without blocking capture.
- **UXP-005 — Canonical global language:** Global status interactions use To Do, In Progress, and Completed canonical groups.
- **UXP-006 — Flexible local workflow:** An Area may expose its own status columns, with every Area status mapped to exactly one canonical group.
- **UXP-007 — Reversible before irreversible:** Archive, Trash, restore, and destructive confirmations make recovery and consequences visible.
- **UXP-008 — Private by default:** Missing and unauthorized personal resources use the same non-disclosing experience.
- **UXP-009 — Keyboard and touch parity:** Core outcomes must not depend on drag-and-drop, hover, or a pointer.
- **UXP-010 — Turkish-first clarity:** Initial labels and messages are Turkish; this English document describes meaning rather than final localized copy.

## 1. Information architecture

### IA-001 — Top-level structure

```text
Public
├── Product introduction
├── Privacy information
├── Terms information
└── Authentication
    ├── Login
    ├── Registration
    ├── Email verification
    ├── Password recovery
    └── Google authentication return

Authenticated application
├── Today
├── Tasks
│   ├── Global List
│   ├── Global Kanban
│   └── Task detail
├── Areas
│   ├── Area list
│   └── Area detail
│       ├── Overview
│       ├── List
│       ├── Area Kanban
│       ├── Projects
│       └── Area workflow settings
├── Projects
│   ├── Project list
│   └── Project detail
├── Search
├── Notifications
├── Archive
├── Trash
└── Settings
    ├── Profile
    ├── Preferences
    ├── Notifications
    ├── Authentication
    └── Account
```

### IA-002 — Object hierarchy

```text
User private space
└── Area (required Task context)
    ├── Area statuses (optional local workflow; canonical mapping required)
    ├── Project (optional Task grouping)
    │   └── Task
    └── Task (directly under Area)
        ├── Labels
        ├── Checklist items
        ├── Recurrence
        └── Reminders
```

Labels are discoverable and reusable within the user's private space. A Task never loses its Area context, including when it belongs to a Project.

**PRD traceability:** FR-011, FR-017–FR-026, FR-031–FR-033, PRV-001–PRV-003.

## 2. Public routes

| Route | Purpose | Authenticated behavior | PRD references |
| --- | --- | --- | --- |
| `/` | Concise product introduction and entry to login or registration. | Offer “Open application” and route to Today. | G-001, G-007, FR-083–FR-086 |
| `/privacy` | Explain private-by-default behavior and relevant data handling. | Remains accessible without leaving the account. | PRV-001–PRV-010 |
| `/terms` | Present applicable product terms. | Remains accessible without leaving the account. | PRV-010 |

Public routes must not reveal whether a particular user, Area, Project, or Task exists.

## 3. Authentication routes

| Route | Purpose | PRD references |
| --- | --- | --- |
| `/login` | Email/password and Google login entry. | FR-003, FR-005, AC-001 |
| `/register` | Email/password registration and Google registration entry. | FR-001, FR-005, AC-001 |
| `/verify-email` | Verification-pending explanation and resend action. | FR-002, AC-001 |
| `/forgot-password` | Password-reset request. | FR-004, AC-001 |
| `/reset-password` | Set a new password from a valid recovery action. | FR-004, AC-001 |
| `/auth/google/return` | User-facing return state for Google success, cancellation, or failure. | FR-005–FR-007, PRV-005 |

An authenticated user who visits login or registration is redirected to their last valid authenticated destination, defaulting to Today.

## 4. Authenticated application routes

| Route | Primary purpose | Presentation notes |
| --- | --- | --- |
| `/app/today` | Daily planning and execution. | Default authenticated destination. |
| `/app/tasks` | Global List. | Search, filters, automatic sorting, selection. |
| `/app/kanban` | Global Kanban. | Canonical status groups; manual ordering within groups. |
| `/app/tasks/:taskId` | Task detail. | Desktop side panel; compact layouts use a full-screen page. |
| `/app/areas` | Area list. | Active Areas by default. |
| `/app/areas/:areaId` | Area overview and List. | Area context is persistent across tabs. |
| `/app/areas/:areaId/kanban` | Area-specific Kanban. | Area statuses when configured; canonical defaults otherwise. |
| `/app/areas/:areaId/projects` | Projects in one Area. | Preserves Area context. |
| `/app/areas/:areaId/workflow` | Area status configuration. | Every status requires one canonical mapping. |
| `/app/projects` | Global Project list. | Grouped or filtered by Area. |
| `/app/projects/:projectId` | Project detail and Task list. | Displays owning Area prominently. |
| `/app/search` | Full search results. | Current user's active content only by default. |
| `/app/notifications` | Notification center. | Unread and read states. |
| `/app/archive` | Archived Tasks, Projects, and Areas. | Type filters and restore actions. |
| `/app/trash` | Trashed Tasks, Projects, and Areas. | Expiry visibility, restore, permanent deletion. |
| `/app/settings/profile` | User-visible profile information. | No collaboration profile concepts. |
| `/app/settings/preferences` | Language, time zone, and display preferences. | Turkish initial language. |
| `/app/settings/notifications` | In-app notification preferences. | No email, SMS, or native push settings in MVP. |
| `/app/settings/authentication` | Sign-in methods and password actions. | Reflects available account methods. |
| `/app/settings/account` | Account deletion and privacy entry points. | Destructive action is isolated from routine settings. |

All authenticated object routes apply the same ownership rule: a missing identifier and an identifier owned by another user produce the same non-disclosing “Content unavailable” experience.

**PRD traceability:** FR-011–FR-012, FR-059–FR-086, NFR-001, PRV-001–PRV-002, AC-002, AC-014.

## 5. Desktop navigation

### NAV-001 — Shell

```text
┌──────────────────┬──────────────────────────────────────────────┐
│ Brand            │ Search        Notifications      User menu  │
│ + New Task       ├──────────────────────────────────────────────┤
│ Today            │ Page title / context / view actions          │
│ Tasks            │                                              │
│ Kanban           │ Main content                                 │
│ Areas            │                                              │
│ Projects         │                                              │
│ Archive          │                                              │
│ Trash            │                                              │
│ Settings         │                                              │
└──────────────────┴──────────────────────────────────────────────┘
```

- The persistent left sidebar contains Today, Tasks, Kanban, Areas, Projects, Archive, Trash, and Settings.
- A prominent “New Task” action is available from the sidebar.
- Search and notifications are available from the top utility region.
- The sidebar may collapse to icons at medium widths but retains accessible names and tooltips.
- Area and Project detail pages display breadcrumbs that preserve ownership context.
- The current destination is indicated visually and programmatically.

**PRD traceability:** FR-059–FR-069, FR-083–FR-086, NFR-010–NFR-011, A11Y-003–A11Y-005.

## 6. Mobile navigation

### NAV-002 — Compact shell

```text
┌──────────────────────────────┐
│ Page title       Search  Bell│
│                              │
│ Main content                 │
│                        (+)   │
├──────────────────────────────┤
│ Today │ Tasks │ Kanban │ More│
└──────────────────────────────┘
```

- Bottom navigation contains Today, Tasks, Kanban, and More.
- More opens a full-height navigation sheet containing Areas, Projects, Archive, Trash, and Settings.
- A persistent create action opens quick Task creation.
- Search and notification entry points remain available from the top bar.
- Detail experiences use full-screen routes rather than narrow side panels.
- Opening and dismissing More restores focus to its trigger.

**PRD traceability:** FR-085–FR-086, NFR-010, A11Y-002–A11Y-003, A11Y-010, AC-012.

## 7. Onboarding flow

### UXF-001 — First authenticated entry

1. After successful authentication and required email verification, the system checks whether onboarding is complete.
2. The welcome step explains the private personal workspace and the Area → optional Project → Task model.
3. The time-zone step proposes the current device time zone but requires the user to confirm or change the account time zone.
4. The sample-data step presents two equally clear choices: “Create sample data” and “Start empty.”
5. If sample data is selected, the confirmation states that examples are private, editable, archivable, and removable.
6. The system creates the selected starting state and opens Today.
7. A short contextual hint points to New Task and Areas; it is dismissible and does not block use.
8. Returning users do not repeat completed onboarding, but relevant help remains available from Settings.

Failure behavior:

- If sample creation fails, the user remains signed in, receives a retry option, and may continue empty.
- Repeating a failed confirmation must not create duplicate sample data.

**PRD traceability:** FR-013–FR-016, FR-045–FR-046, SC-001, AC-003, RA-001, RA-007, PRV-003.

## 8. Login and registration

### UXF-002 — Email/password registration

1. The user opens Registration.
2. The form requests email, password, and password confirmation, with clear requirements and inline guidance.
3. The user accepts the required terms and submits.
4. Success leads to the email-verification pending state.
5. The verification state offers resend with restrained feedback and a way to change the email by restarting registration.
6. Following a valid verification action confirms success and continues to onboarding.

### UXF-003 — Email/password login

1. The user opens Login.
2. The user enters email and password or chooses Google.
3. Invalid credentials produce one generic error that does not reveal which field identifies an account.
4. An unverified account receives a safe verification-pending path without exposing information to unauthenticated probes.
5. Success returns the user to the requested valid application route or Today.

### UXF-004 — Password recovery

1. The user selects “Forgot password.”
2. The user submits an email address.
3. The response is identical whether or not an account exists.
4. A valid recovery action opens Reset Password.
5. The user enters and confirms a new password.
6. Success returns to Login with confirmation; expired or invalid actions offer a new request.

**PRD traceability:** FR-001–FR-004, FR-007, FR-012, NFR-002, NFR-013, A11Y-006, AC-001, AC-014.

## 9. Google authentication

### UXF-005 — Google sign-in or registration

1. The user chooses “Continue with Google” from Login or Registration.
2. Before leaving, the interface communicates that Google is used only for authentication.
3. The user completes, cancels, or fails the provider interaction.
4. Success signs in an existing linked identity or creates the appropriate account without duplicating that identity.
5. A new account continues to onboarding; an existing account returns to the requested valid route or Today.
6. Cancellation returns to the initiating route without showing an alarming error.
7. Provider or linking failures show a retry action and a safe alternative email/password path when available.

**PRD traceability:** FR-005–FR-007, PRV-005, RA-008, AC-001.

## 10. Today view

### UXF-006 — Daily planning and execution

```text
Today · [account-local date]
[Quick add]  [Filter]  [Sort]

Overdue (count)
  Task · overdue reason · Area / Project · priority

Planned today (count)
  Task · planned time · due badge if also due · Area / Project

Due today, not already shown (count)
  Task · due time · Area / Project

Completed today (collapsed)
```

1. The user lands on Today after authentication unless returning to another valid route.
2. The page displays the account-local date and makes the active time zone discoverable.
3. Overdue Tasks appear first, followed by Tasks planned today and then Tasks due today that are not already displayed.
4. A Task matching several reasons appears once and displays all applicable reason badges.
5. Completed-today Tasks appear in a collapsed section that the user may expand.
6. The user can change status, complete a checklist item, edit dates, open Task detail, or create a Task without leaving Today.
7. Quick creation defaults the planned date to today but requires an Area; the user may remove the planned date before saving.
8. Today supports the applicable filters and automatic sorting without turning into a separate data store or manual list.
9. Empty Today states offer New Task and navigation to Tasks without implying that no work exists elsewhere.

Default ordering within each section is planned/due time ascending, then priority, then title. The user may switch to another automatic sort.

**PRD traceability:** UN-004, PP-003, FR-039–FR-046, FR-059, FR-061–FR-064, NFR-005, SC-003, SC-009, AC-009, RA-002.

## 11. Area list and detail

### UXF-007 — Area list

1. The user opens Areas and sees active Areas only by default.
2. Each Area row/card shows its name and concise counts for active Tasks, Projects, and overdue Tasks.
3. The user creates an Area with a name; optional presentation choices are deferred to visual design.
4. Selecting an Area opens its Overview.
5. Row actions provide rename, Archive, and Move to Trash with consequence-aware confirmation.
6. Empty state explains that every Task requires an Area and offers Create Area.

### UXF-008 — Area detail

1. The header shows the Area name, actions, and tabs for Overview/List, Kanban, Projects, and Workflow.
2. Overview/List shows Tasks directly in the Area and Tasks in its Projects, with clear Project context.
3. New Task inherits the Area; Project remains optional.
4. New Project inherits the Area.
5. Workflow settings allow creating, renaming, reordering, and retiring Area statuses.
6. Every Area status must be mapped to To Do, In Progress, or Completed before it can be saved.
7. The Area must retain at least one status in each canonical group and one default status per group; consequences of retiring a status with Tasks are explained and require reassignment.
8. Archive and Trash flows describe the approved Domain behavior: descendants affected by a parent cascade retain lifecycle provenance, and restore reverses only effects from that cascade.

**PRD traceability:** FR-017–FR-026, FR-034–FR-040, FR-063–FR-064, FR-073–FR-082, FR-087–FR-090, RA-001, RA-004, AC-004, AC-011.

## 12. Project list and detail

### UXF-009 — Project list

1. The user opens Projects and sees active Projects grouped by Area by default.
2. Search and Area filters reduce the list without exposing other users' Projects.
3. New Project requires Area selection unless entered from an Area context.
4. Each Project shows its Area and concise active/completed Task counts.
5. Row actions provide rename, Archive, and Move to Trash with consequence-aware confirmation.

### UXF-010 — Project detail

1. The header displays Project name and owning Area, with the Area linking back to context.
2. The Task list shows only Tasks in this Project.
3. New Task inherits both Project and Area.
4. Editing Area moves the Project and all its Tasks atomically; each Task preserves its canonical group through the target Area's default status.
5. Archive and Trash actions explain impact on contained Tasks before confirmation.

**PRD traceability:** FR-020–FR-026, FR-063–FR-064, FR-073–FR-082, AC-004, AC-011.

## 13. Task creation and editing

### UXF-011 — Quick Task creation

1. The user selects New Task from the shell or a contextual create action.
2. Desktop opens a focused quick-create dialog; mobile opens a full-screen create page.
3. The form initially displays title, Area, optional Project, planned date/time, due date/time, and priority.
4. Area is preselected from Area/Project context or the user's most recent valid Area; otherwise the user must select it.
5. Project choices are limited to the selected Area. Changing Area clears an incompatible Project and explains the change.
6. The user may expand Details to add description, labels, checklist, recurrence, and reminders.
7. Save validates title, Area, date/reminder dependencies, Project compatibility, and status validity.
8. Success closes the dialog or navigates back, announces creation, and places the Task consistently in applicable views.

### UXF-012 — Task detail and editing

1. Selecting a Task opens a side panel on wide desktop layouts and a full-screen route on compact layouts.
2. The detail surface shows title, status, Area/Project context, description, planned and due dates, priority, labels, checklist, recurrence, reminders, and lifecycle actions.
3. Area-specific contexts show the Task's Area status; global contexts additionally communicate its canonical group.
4. Changes save explicitly or through clearly communicated field-level save behavior; unsaved changes receive exit protection.
5. Moving to another Area requires selecting a valid target Project or no Project and a valid target Area status.
6. Completing the Task updates the canonical group to Completed and selects the applicable Area completed status.
7. Reopening requires an active Area status mapped to To Do or In Progress.
8. Archive and Trash remain separated from ordinary editing actions.

### UXF-013 — Recurrence editing

1. The user chooses Calendar based or Completion based; the two modes are mutually exclusive for one recurrence definition.
2. Calendar-based presets include daily, weekdays, weekly, monthly, yearly, and custom interval/rule.
3. Completion-based presets include a user-selected number of days, weeks, or months after completion.
4. A plain-language summary previews the rule and account time zone before save.
5. A series has at most one open occurrence; completing it creates the next occurrence.
6. Calendar-based recurrence chooses the first eligible future slot and skips missed slots; completion-based recurrence calculates from completion.
7. Editing an existing recurrence distinguishes “this occurrence” from “this and future occurrences” when both are valid.
8. Stopping recurrence affects future generation and does not silently rewrite completed history.

### UXF-014 — Reminder editing

1. The user adds a reminder and chooses whether it relates to planned or due date/time.
2. Presets include at time, 5 minutes before, 15 minutes before, 1 hour before, 1 day before, 1 week before, and custom.
3. Multiple reminders are listed chronologically and can be edited or removed independently.
4. When a required date or time is absent, the form explains what must be added and does not silently schedule the reminder.
5. A preview shows the resulting account-local reminder time.

**PRD traceability:** FR-018–FR-019, FR-022–FR-025, FR-027–FR-058, FR-073–FR-080, NFR-005–NFR-006, NFR-012–NFR-013, SC-002–SC-005, AC-005–AC-008, RA-002–RA-005.

## 14. Global List

### UXF-015 — List review and automatic sorting

1. The user opens Tasks and sees active Tasks from all Areas and Projects.
2. Each row communicates title, Area, optional Project, canonical status, Area status when helpful, priority, planned/due state, labels, and checklist progress without requiring every field to be visible at once.
3. The user selects one automatic sort: planned date, due date, priority, title, created time, updated time, or canonical status.
4. Date sorts place missing dates last by default; the user may reverse direction.
5. The default sort is planned date ascending, then due date ascending, then priority; undated Tasks appear after dated Tasks.
6. Sorting never changes Task data or Kanban manual order.
7. The user may select Tasks for bulk actions.
8. Opening a Task preserves the current query, filters, sort, and scroll context on return.

**PRD traceability:** FR-039–FR-040, FR-044, FR-059, FR-063–FR-072, NFR-005, SC-003, SC-006, AC-006, AC-010.

## 15. Global Kanban

### UXF-016 — Canonical workflow board

1. The user opens Global Kanban.
2. The board displays exactly three canonical groups: To Do, In Progress, and Completed.
3. Tasks from all Areas appear under the canonical group mapped from their Area status.
4. Each card shows Area and optional Project context so equal titles remain distinguishable.
5. The user manually reorders cards within a canonical group; this order is independent of List automatic sorting.
6. Moving a card between canonical groups selects the destination Area's default status for that canonical group.
7. An Area workflow cannot be saved without a valid default in each canonical group; an invalid legacy state blocks the move and links to workflow repair.
8. Keyboard and action-menu alternatives provide the same reorder and status-change outcomes as drag-and-drop.
9. Filters narrow visible cards without rewriting manual order.

**PRD traceability:** FR-034–FR-040, FR-060, FR-063, FR-067–FR-069, FR-087–FR-090, NFR-005, A11Y-002, A11Y-008, AC-006.

## 16. Area-specific Kanban

### UXF-017 — Local workflow board

1. The user opens Kanban within an Area.
2. If the Area has configured statuses, the board shows those statuses as columns in the Area-defined order.
3. If the Area has no customization, the board shows default statuses corresponding to To Do, In Progress, and Completed.
4. Each column communicates its canonical group without relying on color alone.
5. The user manually reorders Tasks within a column and moves Tasks between Area status columns; Area-board order is independent of Global Kanban order.
6. A move updates both the Area status and its derived canonical group.
7. Tasks within Projects remain on the Area board and display Project context.
8. Workflow configuration is available to the Area owner through an explicit settings action.
9. Keyboard and action-menu alternatives support moving to a named status and positioning before or after another Task.

**PRD traceability:** FR-017–FR-024, FR-034–FR-040, FR-060, FR-087–FR-090, NFR-005, A11Y-004, A11Y-008, AC-004, AC-006.

## 17. Search and filters

### UXF-018 — Global search

1. The user focuses Search from the shell or uses the keyboard shortcut.
2. A lightweight search surface suggests only the current user's active Tasks and offers “View all results.”
3. The full Search route shows Task results with Area/Project context.
4. Search covers Task title and description in MVP; label matching is included through filters.
5. Empty results offer clear-filter and New Task actions.
6. Archived and trashed content remain excluded unless the user searches within their dedicated views.
7. Search never suggests or confirms another user's content.

### UXF-019 — Filters

1. The user opens filters inline on wide layouts or in a full-height sheet on compact layouts.
2. Core filters include Area, Project, canonical status, Area status when one Area is selected, priority, labels, planned date state, due date state, and overdue state.
3. Filters combine using explicit AND behavior across categories and OR behavior among multiple values in one category.
4. Active filters appear as removable tokens and show a count on the filter trigger.
5. Clear All restores the unfiltered active-content view.
6. Returning from Task detail preserves the active search and filters for the session.

**PRD traceability:** FR-063–FR-069, NFR-001, NFR-005, SC-006, AC-002, AC-010.

## 18. Bulk actions

### UXF-020 — Multi-Task update

1. The user enters selection mode from Global List, an Area List, Search, or another supported collection.
2. Selected count and visible selection scope remain explicit.
3. Available actions include status change, label add/remove, Archive, and Move to Trash.
4. Global status change uses a canonical group and applies the default mapped Area status for each selected Task.
5. Area-scoped status change allows selection of an Area-specific status.
6. Actions that cannot apply coherently to the full selection are disabled with an explanation or require narrowing the selection.
7. Archive and Trash actions show the number and type of affected Tasks and require confirmation.
8. Completion reports full success, partial failure, or failure without silently dropping items; failed Tasks remain selected for retry.
9. Leaving selection mode restores normal navigation and focus.

**PRD traceability:** FR-036, FR-067–FR-072, FR-073–FR-076, NFR-005, NFR-013, SC-006, AC-010, AC-014.

## 19. Notifications

### UXF-021 — Notification center

1. The shell displays a notification entry with an unread count that has an accessible text alternative.
2. Opening the entry shows recent unread reminders in a panel on wide layouts and a full-screen route on compact layouts.
3. Each reminder identifies the Task, reminder reason, relevant date/time, and Area/Project context.
4. Selecting a valid reminder opens Task detail and marks the notification read.
5. The user may mark one notification or all visible notifications as read.
6. A notification whose Task is no longer available displays a generic unavailable state without leaking ownership information.
7. Empty state explains that date-based in-app reminders will appear here.

**PRD traceability:** FR-054–FR-058, NFR-005–NFR-006, A11Y-004, A11Y-009, SC-005, AC-008.

## 20. Archive and Trash

### UXF-022 — Archive

1. The user opens Archive and sees archived Tasks, Projects, and Areas with type filters.
2. Each item communicates its original Area/Project context when valid.
3. Restore previews the destination and any parent dependency.
4. If a valid parent is unavailable, the interface requests a coherent restore choice instead of guessing.
5. Restored content leaves Archive and returns to applicable active views.

### UXF-023 — Trash and retention

1. The user opens Trash and sees trashed Tasks, Projects, and Areas grouped by deletion date by default.
2. Each item displays days remaining before automatic permanent deletion.
3. Restore previews the expected parent relationship and requests a choice if the original destination cannot be restored.
4. Manual permanent deletion uses a separate destructive confirmation that names the item type, explains irreversibility, and does not use preselected consent.
5. The interface reflects automatic expiry but does not imply that client-side presence controls deletion timing.
6. After restore or permanent deletion, focus moves to a predictable location and an accessible result announcement is made.

The Domain Model defines cascade provenance, prior-state restoration, coherent destination choices, the 30-day deadline, and permanent parent-deletion effects.

**PRD traceability:** FR-026, FR-063, FR-073–FR-082, NFR-007, NFR-013, PRV-006–PRV-008, SC-007, AC-011, AC-014, RA-004, RA-009.

## 21. Settings

### UXF-024 — Preferences

1. Profile contains only personal account presentation fields required by the MVP.
2. Preferences allows account time-zone selection and displays Turkish as the initial interface language.
3. Changing time zone previews its effect on a representative date/time and requires confirmation when existing timed Tasks or reminders may display differently.
4. Notification settings govern in-app reminder presentation only.

### UXF-025 — Authentication settings

1. The user can see available sign-in methods without exposing reusable credentials.
2. Email/password users can start a password-change or recovery flow.
3. Provider errors use safe, actionable messaging.

### UXF-026 — Account deletion

1. Delete Account appears in a separated danger area.
2. The user receives a summary of affected personal data and the difference between Trash expiry and account deletion.
3. The user confirms identity through an appropriate re-authentication step.
4. Final confirmation requires an explicit action and communicates irreversibility.
5. Completion signs the user out and shows a neutral confirmation page.
6. Operational deletion timing, backup behavior, and evidence remain Privacy/Architecture decisions and must be disclosed before implementation readiness.

**PRD traceability:** FR-004, FR-008–FR-010, FR-045–FR-046, FR-057–FR-058, FR-083–FR-084, PRV-004–PRV-007, NFR-011–NFR-012, AC-001, RA-009.

## 22. Empty states

| ID | Context | Required message and action | PRD references |
| --- | --- | --- | --- |
| ES-001 | No Areas | Explain that every Task needs an Area; offer Create Area. | FR-018–FR-019, RA-001 |
| ES-002 | Area without Tasks | Offer New Task with Area preselected and optional New Project. | FR-020–FR-023 |
| ES-003 | No Projects | Explain that Projects are optional; offer New Project without blocking direct Tasks. | FR-020–FR-022 |
| ES-004 | Today empty | State that nothing is planned, due, or overdue today; offer New Task and Tasks navigation. | FR-061–FR-062 |
| ES-005 | List empty | Distinguish no Tasks from no matching filtered Tasks. | FR-059, FR-069 |
| ES-006 | Kanban empty | Offer New Task and retain visible status columns. | FR-060 |
| ES-007 | Search empty | Echo safe search context; offer Clear filters and New Task. | FR-065–FR-069 |
| ES-008 | Notifications empty | Explain where date-based reminders will appear. | FR-054–FR-057 |
| ES-009 | Archive empty | Explain Archive as recoverable inactive storage. | FR-073–FR-074 |
| ES-010 | Trash empty | Explain 30-day Trash recovery without implying hidden content. | FR-075–FR-079 |

Empty states must not fabricate sample data after onboarding and must not expose counts or names belonging to another user.

## 23. Loading states

- **LS-001:** Initial route loading preserves the application shell where safe and gives a perceivable page-level progress state.
- **LS-002:** List and board loading use shape-preserving placeholders without presenting fake readable Task content.
- **LS-003:** Task save, bulk actions, authentication, restore, and destructive actions prevent accidental duplicate submission while retaining understandable status.
- **LS-004:** Background refresh does not clear currently visible content or unexpectedly reset selection, sorting, filters, or scroll position.
- **LS-005:** Operations exceeding immediate feedback show a progress message and preserve an escape path when cancellation is safe.
- **LS-006:** Loading indicators have accessible status text and do not rely on animation alone.

**PRD traceability:** NFR-005, NFR-008, NFR-013, A11Y-009.

## 24. Error states

| ID | Error category | UX behavior | Recovery |
| --- | --- | --- | --- |
| ER-001 | Validation | Associate message with the field and provide a summary for multi-field errors. | Correct and resubmit without losing valid input. |
| ER-002 | Connectivity | Preserve unsaved input and explain that the result is not confirmed. | Retry explicitly. |
| ER-003 | Conflict/stale state | Explain that content changed and show refreshed state without silently overwriting. | Review and reapply intended change. |
| ER-004 | Partial bulk failure | Report succeeded and failed counts. | Keep failures selected for retry. |
| ER-005 | Provider failure | Use provider-neutral, safe language. | Retry or choose another available sign-in method. |
| ER-006 | Expired action | Explain that the verification/recovery action expired. | Request a new action. |
| ER-007 | Unexpected failure | Show a stable, non-sensitive reference and preserve navigation. | Retry, return, or seek help when available. |

Errors must not expose stack traces, internal identifiers, credentials, or another user's content.

**PRD traceability:** FR-007, FR-055, FR-072, NFR-004, NFR-013, A11Y-006, A11Y-009, AC-014.

## 25. Permission and isolation failures

### UXF-027 — Non-disclosing unavailable state

1. A user requests an Area, Project, Task, reminder, notification, archived item, or trashed item by an identifier not available to them.
2. The system does not reveal whether the object is missing, belongs to another user, was deleted, or is otherwise unavailable.
3. The page shows one generic “Content unavailable” state in Turkish with navigation back to a safe owned destination.
4. Search, breadcrumbs, recent history, counts, and notifications do not retain or reveal unauthorized names or metadata.
5. Mutating actions produce the same non-disclosing outcome and do not partially apply.
6. Authentication loss redirects to Login while preserving only a safe return destination.

This is not an invitation to request access: collaboration and access-request workflows are outside MVP.

**PRD traceability:** FR-011–FR-012, FR-066, NFR-001–NFR-004, PRV-001–PRV-002, PRV-008, SC-008, AC-002, AC-014.

## 26. Responsive behavior

| Range | UX mode | Navigation | Detail behavior | Collection behavior |
| --- | --- | --- | --- | --- |
| Compact: below 768 px | Touch-first single-column | Bottom navigation plus More | Full-screen routes | Lists remain primary; Kanban scrolls horizontally by complete columns with a status picker alternative. |
| Medium: 768–1199 px | Flexible content with reduced chrome | Collapsible sidebar or compact rail | Full-screen or wide overlay based on available space | Filters use sheets; boards preserve usable column width. |
| Wide: 1200 px and above | Persistent multi-region layout | Expanded sidebar | Side panel over preserved context | List density and multiple Kanban columns use available width. |

- Core actions remain available in every range, though placement may change.
- No core journey requires horizontal page scrolling; horizontal movement inside an explicitly labeled Kanban region is permitted with non-drag alternatives.
- Touch targets, text enlargement, virtual keyboard behavior, safe areas, and reduced motion are considered in interaction specifications.
- Responsive transitions preserve logical reading order, focus, current selection, filters, and unsaved input.
- Final browser support and quantitative performance targets remain Architecture-stage decisions.

**PRD traceability:** FR-085–FR-086, NFR-008–NFR-010, NFR-014, A11Y-007, A11Y-010, SC-009, AC-012.

## 27. Keyboard and accessibility expectations

### Keyboard interaction

- **KB-001:** Tab and Shift+Tab follow visible logical order; no keyboard trap is permitted.
- **KB-002:** Enter activates the primary action; Space toggles applicable checkboxes and selection controls.
- **KB-003:** Escape closes the topmost dismissible surface and restores focus to its trigger; it does not discard unsaved changes without warning.
- **KB-004:** `/` focuses global search when focus is not already in an editable field.
- **KB-005:** A documented New Task shortcut may be offered, but it must not fire while the user is typing.
- **KB-006:** Kanban cards can move through an action menu and keyboard controls that name the destination status and position.
- **KB-007:** Bulk selection and actions are fully keyboard operable.

### Accessibility behavior

- **AX-001:** Core flows target WCAG 2.2 Level AA.
- **AX-002:** Page titles, landmarks, headings, dialog names, form labels, and status messages communicate structure programmatically.
- **AX-003:** Focus is moved only when necessary and is restored after dialogs, sheets, and panels close.
- **AX-004:** Status, priority, due state, unread state, destructive state, and canonical mapping use text or icon labels in addition to color.
- **AX-005:** Drag-and-drop always has an equivalent menu or keyboard operation.
- **AX-006:** Validation identifies the affected field, explains correction, and preserves entered values.
- **AX-007:** Dynamic success, error, save, reminder, and bulk-action results use appropriate assistive announcements without excessive interruption.
- **AX-008:** Turkish copy is concise, consistent, and capable of expansion when another language requires more space.
- **AX-009:** Reduced-motion preferences are respected for non-essential motion.
- **AX-010:** Text enlargement and reflow do not remove required actions or information.

**PRD traceability:** A11Y-001–A11Y-010, NFR-010–NFR-013, AC-013–AC-014.

## PRD-to-UX traceability summary

| UX area | Primary PRD coverage |
| --- | --- |
| Public/authentication routes and flows | FR-001–FR-012, PRV-005, AC-001–AC-002 |
| Onboarding | FR-013–FR-016, FR-045–FR-046, AC-003 |
| Areas and Projects | FR-017–FR-026, AC-004 |
| Task creation/detail | FR-027–FR-058, AC-005, AC-007–AC-008 |
| Today/List/Kanban | FR-034–FR-040, FR-059–FR-064, FR-087–FR-090, AC-006, AC-009 |
| Search/filter/bulk | FR-065–FR-072, AC-010 |
| Archive/Trash | FR-073–FR-082, AC-011 |
| Localization/responsive UX | FR-083–FR-086, AC-012 |
| Privacy/isolation failures | NFR-001–NFR-004, PRV-001–PRV-003, PRV-008, AC-002, AC-014 |
| Accessibility and interaction states | NFR-005, NFR-008, NFR-010–NFR-014, A11Y-001–A11Y-010, AC-013–AC-014 |

## PRD requirements without a direct UX counterpart

The following requirements remain valid but are primarily verified through Domain, Data, Architecture, security, operations, or backlog traceability rather than a distinct screen or interaction:

- **NFR-002:** Secure authentication internals beyond safe visible outcomes.
- **NFR-003:** Protection of data in transit.
- **NFR-004:** Sensitive logging restrictions beyond non-sensitive error presentation.
- **NFR-006:** Duplicate prevention and recovery integrity for recurrence and reminders.
- **NFR-009:** Quantitative performance and availability targets.
- **NFR-015:** Requirement-to-backlog traceability.
- **AC-015:** Cross-document contradiction removal at implementation readiness.
- **PRV-004:** Data minimization beyond visible disclosures.
- **PRV-009:** Diagnostic-content minimization.
- **PRV-010:** Privacy review governance.

The following requirements have visible UX states and depend on Domain, Data, or Architecture rules. Resolved Stage 4 rules and remaining handoffs are distinguished below:

- **FR-006:** External identity uniqueness and explicit account linking are resolved in Domain Analysis; provider configuration remains for Architecture.
- **FR-050–FR-053:** Recurrence identity, generation, and history guarantees are enforced by the approved Stage 4 domain rules rather than by a separate screen.
- **FR-079:** Automatic permanent deletion after 30 days.
- **NFR-007:** Structural recoverability after parent lifecycle actions is enforced by the approved Stage 4 domain rules.
- **NFR-012:** Date-only, timed-instant, and future recurrence time-zone semantics are resolved in Domain Analysis; storage representation remains for Data Design.
- **PRV-007:** Operational account-deletion timing and backup treatment.

## PRD points that still require decisions beyond UX

| PRD question | UX decision in this document | Remaining decision owner |
| --- | --- | --- |
| OQ-001 — Navigation and responsive model | Resolved for IA, desktop/mobile navigation, and responsive ranges. | Visual design may refine presentation without changing hierarchy. |
| OQ-002 — Recurrence choices | UX presets and mode-selection flow defined. | Resolved in Domain Analysis: one open occurrence, completion-triggered generation, fixed calendar pattern, and no backfill. |
| OQ-003 — Reminder choices | Presets, custom choice, dependency validation, and preview defined. | Domain/Architecture must define scheduling and delivery guarantees. |
| OQ-004 — Sorting and filters | Global List sorting and filter semantics defined. | Domain/API must preserve these observable semantics. |
| OQ-005 — Parent lifecycle effects | Confirmation, preview, and coherent restore expectations defined. | Resolved in Domain Analysis through cascade provenance and prior-state restoration. |
| OQ-006 — Recurrence history | “This occurrence” and “future occurrences” concepts exposed. | Domain versioning and historical meaning resolved; Data Design must define representation. |
| OQ-007 — Account deletion | Confirmation and visible completion flow defined. | Privacy/Architecture must define timing, backups, and evidence. |
| OQ-008 — Support policy | Responsive ranges defined. | Architecture must define browser, performance, and availability targets. |
| OQ-009 — Stage placement | Resolved: UX is Stage 3 after approved Product Requirements Stage 2. | None. |

## UX risks and assumptions

| ID | Type | Statement | Response or validation point |
| --- | --- | --- | --- |
| UXRA-001 | Risk | Area-specific statuses can make global status meaning ambiguous. | Require exactly one canonical mapping and display it in workflow settings. |
| UXRA-002 | Risk | Global bulk status changes can hide which Area status is chosen. | Use the Area's declared default status, disclose that rule, and explain invalid mappings. |
| UXRA-003 | Risk | Desktop side panels may obscure deep Task editing. | Preserve a direct full-page route and use full-screen detail on compact layouts. |
| UXRA-004 | Risk | Horizontal Kanban interaction is difficult on compact screens. | Provide named status navigation and action-menu movement in addition to scrolling and drag. |
| UXRA-005 | Risk | Today categories can duplicate the same Task. | Apply one-row display with multiple reason badges and deterministic section precedence. |
| UXRA-006 | Risk | Parent lifecycle confirmations may misstate cascade or restore scope. | Derive the copy from the Stage 4 cascade-provenance and coherent-restore rules. |
| UXRA-007 | Assumption | The selected desktop sidebar and mobile bottom navigation cover MVP destinations without excessive nesting. | Validate with route walkthroughs before visual design approval. |
| UXRA-008 | Assumption | Planned-date-first default sorting best supports personal planning. | Validate during usability walkthroughs; retain alternative automatic sorts. |

## Stage 3 approval criteria

Stage 3 may be approved only when:

- **UX-AC-001:** Information architecture and route ownership are accepted without conflict with the PRD.
- **UX-AC-002:** Desktop and mobile navigation models are accepted.
- **UX-AC-003:** Global canonical groups and Area-specific mapped statuses are reconciled in both PRD and Project Master.
- **UX-AC-004:** Every primary journey has step-by-step behavior and PRD traceability.
- **UX-AC-005:** Empty, loading, error, permission, isolation, responsive, keyboard, and accessibility behaviors are accepted.
- **UX-AC-006:** Requirements without direct UX counterparts are explicitly handed to later stages.
- **UX-AC-007:** Remaining Domain, Privacy, Data, and Architecture decisions are listed and not silently resolved.
- **UX-AC-008:** No application code, React component, API design, database schema, or visual implementation artifact has been created.

## Next-stage entry criteria

Domain Analysis may begin only after:

- the user explicitly approves this UX document or its revisions;
- PRD status-model changes are approved as part of the UX phase;
- Area status mapping, recurrence, lifecycle, time-zone, and reminder handoffs are carried forward with stable references;
- no contradiction remains between `PROJECT_MASTER.md`, `PRD.md`, and this document.

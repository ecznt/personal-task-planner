# Personal Task Planner — Product Requirements Document

| Field | Value |
| --- | --- |
| Status | Draft — ready for phase approval |
| Planning stage | Product definition (referred to as Planning Phase 2 in the initiating request) |
| Product scope | MVP |
| Document language | English |
| Last updated | 2026-07-19 |
| Implementation status | Not started |

This document defines product behavior and outcomes. It intentionally avoids implementation architecture, API design, database design, and technical schemas.

## Problem statement

Individuals often distribute their work across notes, calendars, reminders, and generic task lists. This makes it difficult to connect day-to-day actions with stable areas of responsibility, optional projects, deadlines, recurring obligations, and a clear view of what requires attention today. Existing collaborative products may also introduce team-oriented concepts and complexity that are unnecessary for personal planning.

The product must provide a private, structured, and responsive web experience in which each user can capture, organize, plan, review, and complete their own work without exposing it to other users or requiring organization and collaboration concepts.

## Product vision

Create a focused personal work-tracking and planning application that combines durable organization through Areas and optional Projects with practical daily execution through Today, List, and Kanban views. The product should remain simple enough for individual use while serving as a learning vehicle for current product-development and software-engineering practices.

## Target users

- **TU-001 — Individual knowledge worker:** A person managing professional and personal responsibilities without team workflows.
- **TU-002 — Structured personal planner:** A person who wants tasks organized under stable responsibility areas and optional outcome-oriented projects.
- **TU-003 — Daily execution user:** A person who primarily needs to identify, update, and complete the work relevant today.

The MVP is multi-user at the system level but personal at the product level. Each account has an isolated private data space.

## User needs

- **UN-001:** Capture work quickly without first creating a Project.
- **UN-002:** Keep every Task connected to a meaningful Area of responsibility.
- **UN-003:** Group related Tasks into an optional Project when additional structure is useful.
- **UN-004:** Understand what is planned, due, overdue, or relevant today.
- **UN-005:** Track actionable detail through descriptions, priorities, labels, and checklists.
- **UN-006:** Manage repeated obligations without recreating Tasks manually.
- **UN-007:** Review the same work through List and Kanban views.
- **UN-008:** Find and update multiple Tasks efficiently.
- **UN-009:** Remove inactive work without immediately losing it.
- **UN-010:** Receive timely in-app reminders based on Task dates.
- **UN-011:** Access the product on desktop and mobile-sized web interfaces.
- **UN-012:** Trust that other users cannot see or act on personal data.

## Product principles

- **PP-001 — Personal first:** Optimize workflows for a single person's planning and execution, not team coordination.
- **PP-002 — Structured without unnecessary ceremony:** Require an Area for context while keeping Projects optional.
- **PP-003 — Daily clarity:** Make today's planned, due, and overdue work easy to identify.
- **PP-004 — Progressive detail:** Allow quick Task capture and optional enrichment with additional fields.
- **PP-005 — Private by default:** Treat every user's planning data as private and isolated.
- **PP-006 — Recoverable actions:** Prefer Archive, Trash, restore, and clear warnings over accidental permanent loss.
- **PP-007 — Consistent across views:** A change made in one view must be reflected in all other relevant views.
- **PP-008 — Accessible and responsive:** Core workflows must remain usable across supported screen sizes and input methods.
- **PP-009 — Localized by design:** Deliver the first interface in Turkish while preserving future localization readiness.

## MVP goals

- **G-001:** Let an authenticated user create a private planning structure based on Areas, optional Projects, and Tasks.
- **G-002:** Support reliable capture, scheduling, prioritization, recurrence, reminder, and completion workflows.
- **G-003:** Provide Today, List, and Kanban views over the same user-owned Task data.
- **G-004:** Provide search, filtering, and basic bulk actions for efficient personal work management.
- **G-005:** Provide reversible removal through Archive and time-limited Trash.
- **G-006:** Reduce first-use friction through an optional, user-confirmed sample-data onboarding step.
- **G-007:** Provide email/password and Google authentication while maintaining strict cross-account data isolation.
- **G-008:** Deliver a responsive Turkish web interface that is ready for additional languages.

## Non-goals

- **NG-001:** Team membership, shared workspaces, delegation, comments, mentions, or real-time collaboration.
- **NG-002:** Organization or enterprise administration.
- **NG-003:** Billing, subscriptions, plans, or payments.
- **NG-004:** Native mobile applications.
- **NG-005:** Public Task, Project, or Area sharing.
- **NG-006:** GraphQL in the first version.
- **NG-007:** Email, SMS, or native push notifications in the MVP.
- **NG-008:** Advanced portfolio, resource-capacity, or team-performance management.
- **NG-009:** Calendar, email, or third-party productivity integrations beyond Google authentication.
- **NG-010:** User-data export in the MVP; it remains a future consideration.

## Personas

### PER-001 — Structured Planner

Maintains several ongoing areas of responsibility and uses Projects only when a defined body of work benefits from grouping. Values predictable organization, dates, recurrence, and weekly review.

**Primary needs:** hierarchy, List view, filtering, recurring Tasks, Archive, and reliable restore behavior.

### PER-002 — Daily Executor

Starts from Today, captures Tasks quickly, changes status through Kanban, and relies on reminders and priority to decide what to do next.

**Primary needs:** fast capture, Today views, Kanban, reminders, checklist progress, and bulk updates.

### PER-003 — Multi-device Individual

Uses the same private account from desktop and mobile-sized browsers and expects a consistent, accessible experience without other users seeing their planning data.

**Primary needs:** responsive layout, account security, data isolation, and consistent state across views.

## Primary user journeys

### JRN-001 — Register and start with sample data

1. The user creates an account with email/password or Google.
2. The system establishes a private account data space.
3. The user is offered sample data and explicitly chooses whether to create it.
4. The user enters the product with either the sample structure or an empty private structure.

### JRN-002 — Capture a Task directly in an Area

1. The user selects an Area.
2. The user creates a Task without selecting a Project.
3. The user optionally adds details, dates, priority, labels, checklist items, recurrence, and reminders.
4. The Task becomes visible in all applicable views.

### JRN-003 — Plan work through a Project

1. The user creates or opens a Project within an Area.
2. The user adds Tasks to that Project.
3. The user reviews and updates those Tasks without losing their Area context.

### JRN-004 — Plan and execute today

1. The user opens a Today-focused view.
2. The user sees relevant planned, due, and overdue Tasks with clear distinctions.
3. The user updates priority or status, works through checklist items, and completes Tasks.

### JRN-005 — Manage work on Kanban

1. The user opens the Kanban view.
2. Tasks are organized into the fixed statuses To Do, In Progress, and Completed.
3. The user moves a Task to another status.
4. The status change appears consistently in List, Today, search, and filtered results.

### JRN-006 — Configure recurring work and reminders

1. The user configures either calendar-based or completion-based recurrence.
2. The user adds one or more date-based in-app reminders.
3. The system creates future occurrences according to the selected recurrence behavior without duplicates.
4. The system presents reminders at their configured times.

### JRN-007 — Find and update several Tasks

1. The user searches or filters Tasks.
2. The user selects multiple results.
3. The user applies an available bulk action.
4. The system confirms and consistently reflects the changes.

### JRN-008 — Archive, trash, restore, or permanently remove work

1. The user archives inactive work or moves it to Trash.
2. Archived content remains recoverable and excluded from active views by default.
3. Trashed content remains restorable during the 30-day retention period.
4. Content remaining in Trash is permanently deleted after 30 days.

## Feature groups

| ID | Feature group | MVP outcome |
| --- | --- | --- |
| FG-001 | Authentication and account lifecycle | Private access through email/password or Google, with account recovery, verification, and deletion. |
| FG-002 | Onboarding | Optional user-confirmed sample data for the first-use experience. |
| FG-003 | Areas and Projects | Required Area context with optional Project grouping. |
| FG-004 | Task management | Capture, enrich, status-track, complete, and organize Tasks. |
| FG-005 | Dates, recurrence, and reminders | Separate planning and deadline dates, two recurrence modes, and multiple in-app reminders. |
| FG-006 | Today, List, and Kanban views | Complementary views over the same private Task data. |
| FG-007 | Search, filters, and bulk actions | Efficient discovery and multi-Task maintenance. |
| FG-008 | Archive and Trash | Recoverable removal with automatic Trash expiry. |
| FG-009 | Localization and responsive experience | Turkish-first, i18n-ready, accessible responsive web use. |
| FG-010 | Privacy and isolation | Enforced ownership boundaries for all personal planning data. |

## User stories

- **US-001:** As a new user, I want to register with email and password so that I can create a private planning account.
- **US-002:** As a user, I want to authenticate with Google so that I can access my account without managing another password.
- **US-003:** As an email/password user, I want to reset a forgotten password so that I can recover access.
- **US-004:** As a new user, I want to choose whether sample data is created so that I can learn the product without being forced to keep examples.
- **US-005:** As a user, I want to create Areas so that every Task has a stable responsibility context.
- **US-006:** As a user, I want to create a Project within an Area so that I can group related Tasks when useful.
- **US-007:** As a user, I want to create a Task directly under an Area so that simple work does not require a Project.
- **US-008:** As a user, I want to place a Task in an Area's Project so that related work stays grouped.
- **US-009:** As a user, I want to add a description, priority, labels, and checklist so that a Task contains enough execution context.
- **US-010:** As a user, I want separate planned and due dates so that I can distinguish when I intend to work from when work is due.
- **US-011:** As a user, I want calendar-based recurrence so that Tasks can repeat on a fixed schedule.
- **US-012:** As a user, I want completion-based recurrence so that the next Task can depend on when I finish the current one.
- **US-013:** As a user, I want multiple in-app reminders on a Task so that I can receive timely prompts before important dates.
- **US-014:** As a user, I want to view Tasks due, planned, or overdue around today so that I know what needs attention.
- **US-015:** As a user, I want a List view so that I can scan and sort work efficiently.
- **US-016:** As a user, I want a Kanban view with fixed statuses so that I can update workflow state visually.
- **US-017:** As a user, I want to search my Tasks so that I can find work by remembered content.
- **US-018:** As a user, I want to combine filters so that I can narrow work by relevant properties.
- **US-019:** As a user, I want to apply basic actions to several Tasks so that routine maintenance is efficient.
- **US-020:** As a user, I want to archive inactive Areas, Projects, and Tasks so that active views remain focused.
- **US-021:** As a user, I want to restore trashed content within 30 days so that accidental removal is recoverable.
- **US-022:** As a user, I want clear warning before permanent deletion so that I understand irreversible outcomes.
- **US-023:** As a user, I want to use the product in Turkish so that the initial experience matches the intended locale.
- **US-024:** As a user, I want a responsive web experience so that core workflows work on desktop and mobile-sized screens.
- **US-025:** As a user, I want my data hidden from every other user so that my planning remains private.
- **US-026:** As a user, I want to delete my account so that I can permanently leave the service and remove my personal data.

## Functional requirements

### Authentication and account lifecycle

- **FR-001:** The system shall allow a person to create an account using email and password.
- **FR-002:** The system shall require email-address verification for email/password accounts.
- **FR-003:** The system shall allow a verified email/password user to sign in and sign out.
- **FR-004:** The system shall provide a password-reset flow for email/password accounts.
- **FR-005:** The system shall allow a person to authenticate using Google.
- **FR-006:** The system shall prevent one external identity from unintentionally creating multiple accounts for the same sign-in method.
- **FR-007:** The system shall clearly communicate authentication and account-recovery errors without exposing another account's existence or data.
- **FR-008:** The system shall allow an authenticated user to request deletion of their account.
- **FR-009:** The account-deletion flow shall require explicit confirmation and explain that the result is permanent.
- **FR-010:** The system shall end the user's authenticated access when account deletion is completed.
- **FR-011:** All personal planning data shall be scoped to the authenticated owner.
- **FR-012:** Unauthenticated users shall not be able to access private application views or personal planning data.

### Onboarding

- **FR-013:** The system shall present first-time users with a clear choice to create sample data or start empty.
- **FR-014:** Sample data shall be created only after the user explicitly confirms the choice.
- **FR-015:** Created sample data shall belong only to the current user and behave like ordinary editable data.
- **FR-016:** Declining sample data shall not block access to the application.

### Areas and Projects

- **FR-017:** The system shall allow a user to create, view, rename, archive, restore, trash, and recover their own Areas.
- **FR-018:** Every Task shall belong to exactly one Area while it is active.
- **FR-019:** The system shall prevent a Task from existing without an Area.
- **FR-020:** The system shall allow a user to create a Project within one of their Areas.
- **FR-021:** Every Project shall belong to exactly one Area.
- **FR-022:** A Project shall be optional when creating or editing a Task.
- **FR-023:** A Task assigned to a Project shall also retain the Area context of that Project.
- **FR-024:** The system shall prevent a Task from being assigned to a Project outside the Task's Area.
- **FR-025:** The system shall allow a user to move a Task between their Areas, with Project membership reconciled through an explicit user choice.
- **FR-026:** The system shall clearly communicate how archiving or trashing an Area or Project affects its contained work before confirming the action.

### Task management

- **FR-027:** The system shall allow a user to create, view, edit, and complete their own Tasks.
- **FR-028:** A Task shall have a user-visible title.
- **FR-029:** A Task may have a description.
- **FR-030:** A Task may have a priority.
- **FR-031:** A Task may have zero or more labels.
- **FR-032:** A Task may have a checklist containing zero or more items.
- **FR-033:** The user shall be able to add, edit, reorder, complete, and remove checklist items.
- **FR-034:** A Task shall use one of the fixed statuses To Do, In Progress, or Completed.
- **FR-035:** A newly created Task shall start in To Do unless the user explicitly selects another allowed status.
- **FR-036:** The system shall allow status changes from Task detail, List, Kanban, Today, search, and filtered contexts where editing is offered.
- **FR-037:** Completing a Task shall make its completed state visible across all applicable views.
- **FR-038:** Reopening a completed Task shall return it to an active fixed status selected by the user.
- **FR-039:** The same Task shall not be duplicated merely because it appears in multiple views.
- **FR-040:** Changes made to a Task in one view shall appear consistently in every other applicable view.

### Dates, recurrence, and reminders

- **FR-041:** A Task may have an independent planned date and optional planned time.
- **FR-042:** A Task may have an independent due date and optional due time.
- **FR-043:** A Task may use either, both, or neither planned and due dates.
- **FR-044:** The system shall distinguish planned, due, and overdue states in applicable views.
- **FR-045:** Date and time interpretation shall use the user's account time zone.
- **FR-046:** The user shall be able to set and change their account time zone.
- **FR-047:** A Task may have a calendar-based recurrence rule.
- **FR-048:** A Task may instead have a completion-based recurrence rule.
- **FR-049:** A recurring Task shall clearly display its recurrence behavior.
- **FR-050:** The system shall create future recurring occurrences according to the selected mode without creating duplicate occurrences for the same recurrence event.
- **FR-051:** Completion-based recurrence shall schedule the next occurrence from the completed occurrence according to the user's rule.
- **FR-052:** Calendar-based recurrence shall preserve its calendar schedule independently of completion timing.
- **FR-053:** The user shall be able to stop or change recurrence for future occurrences without rewriting historical completed occurrences.
- **FR-054:** A Task may have multiple user-defined in-app reminders tied to its planned or due date and time.
- **FR-055:** The system shall prevent a reminder that requires a time from being silently scheduled when the relevant Task time is absent.
- **FR-056:** The system shall present due reminders in an in-app notification experience.
- **FR-057:** The user shall be able to identify unread notifications and mark them as read.
- **FR-058:** The system shall not send email, SMS, or native push reminders in the MVP.

### Views and work discovery

- **FR-059:** The system shall provide a List view of the user's Tasks.
- **FR-060:** The system shall provide a Kanban view organized by the fixed statuses To Do, In Progress, and Completed.
- **FR-061:** The system shall provide Today-focused views that identify Tasks planned today, due today, and overdue.
- **FR-062:** Today-focused views shall distinguish the reason each Task is included.
- **FR-063:** Active views shall exclude archived and trashed content by default.
- **FR-064:** The user shall be able to navigate from a displayed Task to its Area and, when present, its Project context.
- **FR-065:** The system shall provide search over the current user's Task content.
- **FR-066:** Search results shall never include another user's content.
- **FR-067:** The system shall provide filters for core Task properties, including Area, Project, status, priority, labels, and relevant date state.
- **FR-068:** The system shall allow supported filters to be combined.
- **FR-069:** The system shall allow the user to clear active search and filter criteria.
- **FR-070:** The system shall allow multiple Tasks to be selected in supported collection views.
- **FR-071:** Basic bulk actions shall include status change, label change, Archive, and move to Trash.
- **FR-072:** A bulk action shall identify its scope and request confirmation when it can remove content from active views.

### Archive and Trash

- **FR-073:** The user shall be able to archive and restore their own Tasks, Projects, and Areas.
- **FR-074:** Archived content shall remain stored and recoverable but shall be excluded from active views by default.
- **FR-075:** The user shall be able to move their own Tasks, Projects, and Areas to Trash.
- **FR-076:** Trashed content shall be excluded from active views.
- **FR-077:** The user shall be able to review Trash and see when each item is scheduled for permanent deletion.
- **FR-078:** The user shall be able to restore content during its Trash retention period.
- **FR-079:** Content shall be permanently deleted after 30 days in Trash.
- **FR-080:** The user shall be warned before manually triggering permanent deletion before the automatic expiry date.
- **FR-081:** Restore behavior shall preserve valid Area, Project, Task, label, checklist, recurrence, and date relationships.
- **FR-082:** When a parent item and its contained items are affected together, the system shall communicate the scope and preserve a coherent result on restore.

### Localization and responsive behavior

- **FR-083:** The initial user interface shall be available in Turkish.
- **FR-084:** User-facing content provided by the product shall be capable of supporting additional interface languages in the future.
- **FR-085:** Core MVP journeys shall be available through a responsive web interface on desktop and mobile-sized screens.
- **FR-086:** Responsive presentation shall preserve the meaning and availability of core actions rather than hiding required functionality without an alternative.

## Non-functional requirements

- **NFR-001 — Data isolation:** Authorization shall be enforced for every operation involving user-owned Areas, Projects, Tasks, labels, checklists, reminders, notifications, archived content, and trashed content.
- **NFR-002 — Secure authentication:** Authentication and account-recovery behavior shall follow current security guidance and shall not expose credentials or reusable authentication secrets to unauthorized parties.
- **NFR-003 — Transport privacy:** Authentication and personal planning data shall be protected while transmitted in production environments.
- **NFR-004 — Sensitive logging:** Logs and user-visible errors shall not disclose passwords, authentication secrets, or unnecessary personal Task content.
- **NFR-005 — Consistency:** Successful changes shall be represented consistently across Today, List, Kanban, search, filters, Archive, Trash, and notifications.
- **NFR-006 — Recurrence integrity:** Repeated processing or recovery from an interrupted operation shall not create duplicate recurring occurrences or duplicate reminders.
- **NFR-007 — Recoverability:** A recoverable Archive or Trash operation shall retain enough product context to restore a coherent user-owned structure.
- **NFR-008 — Responsiveness:** Common interactive workflows shall provide prompt progress, success, empty, and error feedback under the agreed MVP operating profile.
- **NFR-009 — Measurability:** Quantitative performance and availability targets shall be agreed during solution architecture before implementation readiness is approved.
- **NFR-010 — Responsive usability:** Core journeys shall remain usable without horizontal page scrolling at the supported viewport ranges defined during UX planning.
- **NFR-011 — Localization readiness:** User-facing interface text, dates, times, pluralization, and validation feedback shall support locale-specific presentation.
- **NFR-012 — Time-zone consistency:** Stored and displayed Task timing shall preserve the intended instant or local date semantics when the user's account time zone changes.
- **NFR-013 — Error recovery:** Expected validation, authorization, connectivity, and conflict failures shall provide understandable guidance without destructive side effects.
- **NFR-014 — Browser support definition:** The supported browser matrix shall be decided and documented during UX and architecture planning before implementation begins.
- **NFR-015 — Testable acceptance:** Every MVP functional requirement shall be traceable to one or more backlog acceptance criteria before implementation readiness approval.

## Privacy expectations

- **PRV-001:** A user's planning content is private by default and unavailable to every other ordinary user.
- **PRV-002:** The product shall not provide public sharing, cross-user search, or shared Areas, Projects, or Tasks in the MVP.
- **PRV-003:** Sample onboarding data shall be private to the account that requested it.
- **PRV-004:** The product shall collect only account and authentication information needed for the declared MVP experience.
- **PRV-005:** Google authentication shall not imply access to unrelated Google account content.
- **PRV-006:** The product shall clearly communicate Trash retention and permanent-deletion behavior.
- **PRV-007:** Account deletion shall permanently remove the user's personal planning data according to a disclosed deletion process.
- **PRV-008:** Archived data remains private user data and shall receive the same access protection as active data.
- **PRV-009:** Product diagnostics shall minimize collection of titles, descriptions, checklist text, and other user-authored planning content.
- **PRV-010:** Privacy-sensitive defaults and disclosures shall be reviewed before implementation readiness approval.

## Accessibility expectations

- **A11Y-001:** The MVP shall target WCAG 2.2 Level AA for core user journeys.
- **A11Y-002:** Core workflows shall be operable using a keyboard without requiring pointer-only interaction.
- **A11Y-003:** Focus order and visible focus indication shall remain understandable in forms, dialogs, menus, List, and Kanban interactions.
- **A11Y-004:** Status, priority, date state, notification state, and validation state shall not be communicated by color alone.
- **A11Y-005:** Interactive controls shall have programmatically determinable names, roles, and states.
- **A11Y-006:** Forms shall provide associated labels and actionable validation guidance.
- **A11Y-007:** Text and essential controls shall meet applicable contrast requirements and remain usable when text is enlarged.
- **A11Y-008:** Kanban status changes shall have an accessible alternative to drag-and-drop.
- **A11Y-009:** Dynamic success, error, reminder, and status feedback shall be exposed to assistive technologies without causing disruptive focus changes.
- **A11Y-010:** Responsive layouts shall preserve logical reading and focus order.

## Success criteria

- **SC-001:** A new user can authenticate, make an explicit sample-data choice, and reach a usable private planning state without administrative assistance.
- **SC-002:** A user can create an Area and then create a Task either directly in the Area or inside one of its Projects.
- **SC-003:** A user can plan and complete work through Today, List, and Kanban without inconsistent Task state between views.
- **SC-004:** Both calendar-based and completion-based recurrence produce the expected next occurrence without duplication.
- **SC-005:** Multiple configured reminders can be surfaced in-app at the intended account-local times.
- **SC-006:** Search, combined filtering, and basic bulk actions support routine multi-Task maintenance.
- **SC-007:** Archive and 30-day Trash workflows allow intended recovery and prevent silent permanent loss.
- **SC-008:** Cross-account access attempts reveal no user-owned planning content.
- **SC-009:** All core MVP journeys are usable in Turkish across the approved desktop and mobile-sized viewport ranges.
- **SC-010:** Core journeys meet the approved accessibility acceptance checks.
- **SC-011:** Every accepted MVP requirement is represented in the delivery backlog with traceable acceptance criteria before implementation begins.

No adoption or retention KPI is set for the initial personal-use MVP. Usage metrics may be defined after a testable build exists and only with an explicit privacy decision.

## MVP acceptance criteria

- **AC-001:** Email/password registration, email verification, sign-in, sign-out, password reset, Google authentication, and confirmed account deletion satisfy their defined user journeys.
- **AC-002:** Automated and exploratory authorization checks demonstrate that one user cannot read or mutate another user's data.
- **AC-003:** First-use onboarding offers sample data, creates it only after confirmation, and permits starting empty.
- **AC-004:** Every active Task has exactly one Area; a Task may have no Project or one Project within that Area.
- **AC-005:** Task title, description, planned date/time, due date/time, priority, labels, checklist, status, recurrence, and reminders satisfy the applicable functional requirements.
- **AC-006:** The fixed statuses To Do, In Progress, and Completed behave consistently in Task detail, List, Today, and Kanban.
- **AC-007:** Calendar-based and completion-based recurrence are verifiably distinct and do not generate duplicate occurrences.
- **AC-008:** Multiple Task reminders appear in-app at the intended times using the user's account time zone.
- **AC-009:** Today views distinguish planned today, due today, and overdue inclusion reasons.
- **AC-010:** Search, core filters, combined filters, multi-selection, and the defined bulk actions work only over the current user's content.
- **AC-011:** Tasks, Projects, and Areas can be archived, trashed, restored, and permanently deleted according to the 30-day Trash policy.
- **AC-012:** The Turkish responsive interface supports every primary journey at the UX-approved viewport ranges.
- **AC-013:** Accessibility review confirms the core journeys against the approved WCAG 2.2 AA target.
- **AC-014:** User-visible errors and destructive confirmations are understandable and do not disclose other users' information.
- **AC-015:** The product, domain, data, API, architecture, UX, and backlog documents contain no unresolved contradiction that blocks implementation.

## Risks and assumptions

| ID | Type | Statement | Response or validation point |
| --- | --- | --- | --- |
| RA-001 | Risk | Required Area ownership may add friction to quick capture. | UX planning must provide a low-friction Area selection or remembered context without weakening the rule. |
| RA-002 | Risk | Separate planned and due dates can be misunderstood. | UX planning must give each date a distinct label and Today inclusion explanation. |
| RA-003 | Risk | Supporting two recurrence modes increases conceptual and testing complexity. | Domain planning must define occurrence identity, completion effects, editing scope, and edge cases. |
| RA-004 | Risk | Parent Archive, Trash, restore, and deletion can produce confusing child-item outcomes. | Domain planning must define lifecycle propagation and restoration invariants before data design. |
| RA-005 | Risk | Multiple reminders and time-zone changes can create late, early, or duplicate notifications. | Domain and architecture stages must define deterministic time semantics and delivery guarantees. |
| RA-006 | Risk | Fixed Kanban statuses may be too restrictive for some future users. | Keep custom workflows outside MVP and revisit only with observed need. |
| RA-007 | Risk | Optional sample data may be mistaken for real user content. | UX must clearly identify the choice and make generated examples safely editable or removable. |
| RA-008 | Risk | Google authentication availability depends on external provider configuration and policy. | Validate provider prerequisites before implementation readiness. |
| RA-009 | Risk | A 30-day Trash window may conflict with later backup or account-deletion policies. | Reconcile retention, backups, and deletion semantics during data and architecture planning. |
| RA-010 | Assumption | Each account represents one individual and has one private planning space. | Revisit only if future collaboration or multiple spaces enter scope. |
| RA-011 | Assumption | The fixed statuses are sufficient for MVP personal workflow. | Validate during UX walkthroughs and initial usability testing. |
| RA-012 | Assumption | In-app notifications are sufficient for MVP reminder validation. | Email and push delivery remain outside MVP. |

## Open questions

These questions do not change the accepted MVP boundary, but must be resolved in the named planning stages:

- **OQ-001 — UX:** What exact navigation model and responsive breakpoints best support Today, Areas, Projects, List, Kanban, Archive, Trash, and notifications?
- **OQ-002 — UX/Domain:** Which recurrence presets and custom rule options are required to express the two approved recurrence modes?
- **OQ-003 — UX/Domain:** Which reminder offsets and absolute-time choices are offered, and how are invalid reminders explained?
- **OQ-004 — UX:** What default sorting, grouping, and filter controls are offered in each view?
- **OQ-005 — Domain:** What are the exact lifecycle effects when a parent Area or Project is archived, trashed, restored, or permanently deleted?
- **OQ-006 — Domain/Data:** How are historical recurring occurrences related to their recurrence definition when future behavior changes?
- **OQ-007 — Privacy/Architecture:** What operational delay, backup treatment, and confirmation evidence apply to permanent account deletion?
- **OQ-008 — UX/Architecture:** Which browsers, viewport ranges, and quantitative performance targets form the release support policy?
- **OQ-009 — Product governance:** Will UX become a newly numbered stage before Domain Analysis, or remain an activity within the existing planning sequence?

The PRD is decision-complete for its MVP product boundary. It remains a draft until the user explicitly approves this phase. The questions above are deliberate handoffs and may not be silently resolved in later stages.

## Future considerations

- **FC-001:** Shared work, delegation, comments, mentions, teams, and organizations.
- **FC-002:** User-defined Task statuses and customizable Kanban workflows.
- **FC-003:** Native mobile applications and native push notifications.
- **FC-004:** Email reminders and calendar or productivity integrations.
- **FC-005:** User-data export and import.
- **FC-006:** Multiple personal workspaces or profiles within one account.
- **FC-007:** Advanced saved searches, reusable filter presets, dashboards, and planning analytics.
- **FC-008:** Attachments, rich content, and external links beyond the MVP description capability.
- **FC-009:** Billing or paid plans if the product ever expands beyond personal learning use.
- **FC-010:** Additional interface languages after the Turkish MVP.

## UX phase entry criteria

The next UX planning phase may begin only when:

- **UX-GATE-001:** The user explicitly approves this PRD or requests and approves its revisions.
- **UX-GATE-002:** Every product decision in this PRD is reflected without contradiction in `docs/PROJECT_MASTER.md`.
- **UX-GATE-003:** The planning-stage numbering and placement of UX relative to Domain Analysis are explicitly confirmed.
- **UX-GATE-004:** Open UX questions are carried forward with stable IDs and none is silently assumed.
- **UX-GATE-005:** No production application code or technical schema has been introduced during the PRD phase.

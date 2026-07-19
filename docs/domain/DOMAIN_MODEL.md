# Personal Task Planner — Domain Model and Business Rules

| Field | Value |
| --- | --- |
| Status | Approved — Stage 4 completed |
| Planning stage | Stage 4 — Domain analysis |
| Product scope | MVP |
| Document language | English |
| Last updated | 2026-07-19 |
| Implementation status | Not started |

This document defines the domain language, ownership boundaries, invariants, lifecycle rules, recurrence behavior, and allowed business operations for the MVP. It is intentionally independent of database tables, Prisma models, API payloads, framework classes, and migration design.

## 1. Domain scope and principles

- **DM-P-001 — Personal planning boundary:** Each User has one private planning space. Collaboration, shared ownership, delegated access, teams, and organizations do not exist in the MVP.
- **DM-P-002 — Owner-first authorization:** Every operation on user-owned domain state begins from the authenticated User and verifies ownership before reading or changing an aggregate.
- **DM-P-003 — Required Area context:** Every existing Task belongs to exactly one Area, regardless of whether it is active, archived, or in Trash.
- **DM-P-004 — Optional Project context:** A Task may have no Project. When it has one, the Task and Project belong to the same Area and User.
- **DM-P-005 — Independent state dimensions:** Task workflow status and content lifecycle are separate. Completing a Task does not archive it; archiving or trashing a Task does not complete it.
- **DM-P-006 — Canonical global meaning:** Every AreaStatus maps to exactly one immutable CanonicalStatus. Global views derive state from the canonical mapping; Area views may use local statuses.
- **DM-P-007 — Recoverable lifecycle:** Archive and Trash are distinct. Archive has no automatic expiry. Trash is restorable for 30 days and then becomes permanently deleted.
- **DM-P-008 — One open recurrence occurrence:** A recurrence series never has more than one Task occurrence whose canonical status is not Completed.
- **DM-P-009 — No recurrence backfill:** Missed calendar slots do not create historical Tasks. Only the next eligible future occurrence is created after the current occurrence is completed.
- **DM-P-010 — Consistent time semantics:** Date-only values preserve their account-local calendar date. Timed values preserve their instant and are displayed in the User's current account time zone.

## 2. Ubiquitous language

| Term | Domain meaning |
| --- | --- |
| User | One individual account and the root owner of one private planning space. |
| AuthenticationIdentity | One verified or verifiable sign-in method linked to a User, such as email/password or Google. |
| Area | A durable responsibility context required by every Task. |
| Project | An optional grouping of Tasks contained by one Area. |
| Task | One actionable work occurrence. A recurring series produces Tasks; the series itself is not a Task. |
| AreaStatus | A User-defined or default workflow status within one Area. |
| CanonicalStatus | One of the fixed global groups: To Do, In Progress, or Completed. |
| Label | A reusable User-owned classification that may be assigned to Tasks. |
| TaskLabel | The association that assigns one Label to one Task. |
| ChecklistItem | An ordered actionable item contained by one Task. |
| RecurrenceSeries | The identity and future-generation context shared by recurring Task occurrences. |
| RecurrenceRule | The active calendar-based or completion-based rule used by a RecurrenceSeries. |
| TaskReminder | A Task-owned instruction to surface an in-app reminder relative to a planned or due instant. |
| Notification | The User-owned in-app record produced when a TaskReminder becomes due. |
| Archive | Recoverable inactive storage without automatic deletion. |
| Trash | Recoverable removal with a 30-day permanent-deletion deadline. |
| Open occurrence | The one Task in a RecurrenceSeries whose CanonicalStatus is To Do or In Progress. |
| Historical occurrence | A completed or permanently deleted Task that no longer controls future recurrence generation. |

## 3. Conceptual consistency boundaries

These boundaries identify where invariants must be enforced together. They do not prescribe transactions, database structure, services, or framework modules.

| Boundary | Root concept | Contained or coordinated concepts | Required consistency |
| --- | --- | --- | --- |
| Account | User | AuthenticationIdentity and account preferences | Identity uniqueness, explicit linking, usable sign-in method, time-zone ownership. |
| Area workflow | Area | AreaStatus | At least one status and exactly one default per CanonicalStatus. |
| Project | Project | Area reference | Same owner and one Area; atomic Area move with contained Task reconciliation. |
| Task | Task | ChecklistItem, TaskLabel, TaskReminder, lifecycle and workflow state | Required Area, compatible Project, valid AreaStatus, date and completion invariants. |
| Recurrence | RecurrenceSeries | RecurrenceRule and current open Task reference | At most one open occurrence, rule versioning, idempotent next-occurrence generation. |
| Notification | Notification | TaskReminder and Task references | Owner consistency, idempotent creation, read state, privacy-safe invalid target behavior. |

Cross-boundary commands such as moving a Project, trashing an Area, or generating a recurring occurrence are single logical domain operations. They must either preserve every stated invariant or return an explicit failure; implementation-level transaction boundaries are decided later.

## 4. Ownership and isolation rules

- **BR-OWN-001:** User is the ultimate owner of every AuthenticationIdentity, Area, Project, Task, AreaStatus, Label, TaskLabel, ChecklistItem, RecurrenceSeries, RecurrenceRule, TaskReminder, and Notification in their private planning space.
- **BR-OWN-002:** Ownership is immutable. Content may move within one User's planning space but cannot be transferred to another User.
- **BR-OWN-003:** A Project owner must equal its Area owner.
- **BR-OWN-004:** A Task owner must equal its Area owner and, when present, its Project owner.
- **BR-OWN-005:** An AreaStatus owner is derived through its Area. A Task using that status must belong to the same Area.
- **BR-OWN-006:** A TaskLabel may exist only when its Task and Label have the same owner.
- **BR-OWN-007:** ChecklistItem and TaskReminder ownership is derived from their Task. RecurrenceRule ownership is derived from its RecurrenceSeries; RecurrenceSeries ownership equals every occurrence owner.
- **BR-OWN-008:** Notification ownership must equal the owner of its source TaskReminder and Task.
- **BR-OWN-009:** Reads, writes, bulk operations, lifecycle operations, recurrence generation, and relationship changes must apply ownership checks at every aggregate boundary they cross.
- **BR-OWN-010:** A missing resource and a resource owned by another User produce the same non-disclosing domain outcome.
- **BR-OWN-011:** A bulk command evaluates ownership and invariants for every selected item. An item that fails does not receive a partial mutation; successful and failed item counts may be reported without disclosing foreign content.
- **BR-OWN-012:** Sample onboarding content is ordinary User-owned domain content and receives no privileged or shared status.

## 5. Domain concepts

### 5.1 User

| Aspect | Definition |
| --- | --- |
| Purpose | Own one private planning space, account preferences, and authentication identities. |
| Ownership | Self-owned account root; never owned by another domain concept. |
| Required properties | Stable User identity; account email contact; account time zone; onboarding state; account lifecycle state. |
| Optional properties | User-facing display name. No team, organization, public profile, or billing properties exist in MVP. |
| Invariants | One private planning space per User; a valid account time zone is always present; another User cannot be granted planning-space access; a deleted User cannot authenticate or own retained active planning data. |
| State transitions | Onboarding Pending → Completed; Account Active → Deletion Confirmed → Permanently Deleted. Operational deletion processing may occur between confirmation and completion, but access ends no later than logical completion. |
| Allowed operations | Confirm onboarding choice; change time zone; manage eligible identities; request and confirm account deletion; operate owned aggregates. |
| Forbidden operations | Share ownership; join an organization; transfer aggregates to another User; restore a permanently deleted account through ordinary product flows. |
| Related requirements | FR-008–FR-016, FR-045–FR-046, NFR-001, PRV-001–PRV-010, AC-001–AC-003. |

Account deletion is logically distinct from moving content to Trash. Confirmed account deletion applies to all personal planning data and identities; backup erasure timing and operational evidence remain Architecture and Privacy decisions.

### 5.2 AuthenticationIdentity

| Aspect | Definition |
| --- | --- |
| Purpose | Represent one sign-in method linked to exactly one User. |
| Ownership | Directly owned by one User. |
| Required properties | Identity type; provider-scoped unique subject or normalized email identity; verification state; enabled state. Email/password identity additionally requires a non-reusable credential verifier. |
| Optional properties | Provider email snapshot; last successful authentication time; disable reason. Reusable credentials and provider tokens are not domain-visible properties. |
| Invariants | A provider subject belongs to at most one User; one AuthenticationIdentity belongs to exactly one User; an unverified email/password identity cannot complete ordinary sign-in; a User cannot remove or disable their last usable sign-in identity. |
| State transitions | Email/password: Pending Verification → Active → Disabled. Google: Active → Disabled. Disabled → Active requires a valid recovery or relinking flow. Identity linking is Pending Confirmation → Linked or Rejected. |
| Allowed operations | Verify email; authenticate; reset password through a valid recovery action; explicitly link or unlink an eligible identity after re-authentication; disable a compromised method. |
| Forbidden operations | Automatic account linking solely because Google and an existing account report the same email; linking while unauthenticated; exposing credential-verifier or provider-token material; linking one provider subject to multiple Users. |
| Related requirements | FR-001–FR-007, FR-010, NFR-002–NFR-004, PRV-004–PRV-005, AC-001. |

- **BR-AUTH-001:** When a Google identity's verified email matches an existing account, the system does not auto-link. The person must authenticate to that existing account and explicitly confirm linking.
- **BR-AUTH-002:** Authentication and recovery responses do not confirm whether an unrelated identity exists.
- **BR-AUTH-003:** Identity unlinking is forbidden if it would leave the User without a usable authentication method.

### 5.3 Area

| Aspect | Definition |
| --- | --- |
| Purpose | Provide the mandatory durable responsibility context for Tasks and contain optional Projects and one local workflow. |
| Ownership | Directly owned by one User. |
| Required properties | Owner; user-visible name; lifecycle state; ordered AreaStatus collection with canonical mappings and defaults. |
| Optional properties | None required by the approved MVP. Presentation metadata may be added only through a later product decision. |
| Invariants | Name is non-blank; owner never changes; at least one AreaStatus exists for each CanonicalStatus; exactly one default AreaStatus exists per CanonicalStatus; active Tasks and Projects cannot have an effectively inactive Area. |
| State transitions | Active ↔ Archived; Active or Archived → Trashed; Trashed → prior coherent state through restore; Trashed → Permanently Deleted after confirmation or retention expiry. |
| Allowed operations | Create; rename; manage workflow statuses; create Projects and Tasks; archive; restore; move to Trash; restore from Trash; permanently delete from Trash. |
| Forbidden operations | Transfer ownership; remove the final status of a canonical group; expose the Area to another User; permanently delete an active or merely archived Area without first using the Trash flow. |
| Related requirements | FR-017–FR-026, FR-063–FR-064, FR-073–FR-082, FR-087–FR-090, NFR-001, NFR-007, AC-004, AC-011. |

### 5.4 Project

| Aspect | Definition |
| --- | --- |
| Purpose | Optionally group related Tasks within one Area. |
| Ownership | Directly owned by one User and contained by exactly one Area owned by that User. |
| Required properties | Owner; Area; user-visible name; lifecycle state. |
| Optional properties | None required by the approved MVP. |
| Invariants | Name is non-blank; Project has exactly one Area; Project owner equals Area owner; every member Task has the same Area and owner. |
| State transitions | Active ↔ Archived; Active or Archived → Trashed; Trashed → prior coherent state or an explicitly selected active Area through restore; Trashed → Permanently Deleted. Active Project Area A → active Project Area B through an atomic move. |
| Allowed operations | Create; rename; add or remove compatible Tasks; atomically move to another owned active Area; archive; restore; move to Trash; permanently delete from Trash. |
| Forbidden operations | Exist without an Area; contain a Task from another Area or User; move without reconciling every contained Task; remain active beneath an archived or trashed Area. |
| Related requirements | FR-020–FR-026, FR-063–FR-064, FR-073–FR-082, NFR-001, NFR-007, AC-004, AC-011. |

- **BR-PROJ-001:** Moving a Project to another Area is one atomic domain command affecting the Project and all its Tasks.
- **BR-PROJ-002:** Each contained Task retains Project membership and is assigned the target Area's default AreaStatus for its existing CanonicalStatus.
- **BR-PROJ-003:** The move fails without partial changes if the target Area is not active, ownership differs, required canonical defaults are invalid, or any Task cannot be reconciled.

### 5.5 Task

| Aspect | Definition |
| --- | --- |
| Purpose | Represent one actionable work occurrence and the unit shown consistently across Today, List, Kanban, search, Archive, and Trash. |
| Ownership | Directly owned by one User; belongs to exactly one owned Area and optionally one compatible Project. |
| Required properties | Owner; Area; title; AreaStatus; derived CanonicalStatus; workflow state; lifecycle state; stable occurrence identity. |
| Optional properties | Project; description; planned date with optional time; due date with optional time; priority; Labels through TaskLabels; ChecklistItems; RecurrenceSeries membership; TaskReminders; completion time; independent Global and Area Kanban ordering positions. |
| Invariants | Title is non-blank; exactly one Area is always present; Project is absent or belongs to the same Area and User; AreaStatus belongs to the Task's Area; CanonicalStatus equals the AreaStatus mapping; Completed requires a completion time; To Do or In Progress has no completion time; due cannot precede planned when both exist; active Task parents are effectively active. |
| State transitions | Workflow: To Do ↔ In Progress; To Do or In Progress → Completed; Completed → To Do or In Progress through an explicit active AreaStatus. Lifecycle: Active ↔ Archived; Active or Archived → Trashed; Trashed → prior coherent state; Trashed → Permanently Deleted. Area move and Project reassignment are explicit relationship transitions. |
| Allowed operations | Create; view; edit approved fields; assign compatible Project; move Area with explicit Project and status reconciliation; change AreaStatus; complete; reopen; manage labels/checklist/reminders/recurrence; archive; restore; trash; permanently delete from Trash. |
| Forbidden operations | Remove Area; assign a foreign or cross-Area Project, AreaStatus, Label, or recurrence series; mutate content while Trashed other than restore or permanent deletion; treat archive as completion; create a second open occurrence in the same RecurrenceSeries. |
| Related requirements | FR-018–FR-019, FR-022–FR-058, FR-059–FR-082, FR-087–FR-090, NFR-001, NFR-005–NFR-007, AC-004–AC-011. |

- **BR-TASK-001:** Creating a Task requires one active owned Area. Project remains optional.
- **BR-TASK-002:** A new Task uses the selected AreaStatus or the Area's default To Do status.
- **BR-TASK-003:** Moving a non-recurring Task to another Area clears an incompatible Project unless the User explicitly selects a Project in the target Area. The Task uses an explicitly selected target AreaStatus or the target default for its existing CanonicalStatus.
- **BR-TASK-004:** Moving a recurring open occurrence requires an explicit scope: this occurrence only, or this and future occurrences. Historical occurrences never move implicitly.
- **BR-TASK-005:** Completing a Task does not require every ChecklistItem to be completed; checklist progress and Task completion are independent and the UI may warn without blocking.
- **BR-TASK-006:** Reopening selects an active AreaStatus mapped to To Do or In Progress and clears the completion time.
- **BR-TASK-007:** List sorting never mutates Task ordering. Global Kanban and Area Kanban maintain independent manual orders.

### 5.6 CanonicalStatus

| Aspect | Definition |
| --- | --- |
| Purpose | Provide stable global workflow meaning across all Areas. |
| Ownership | System-defined reference concept; not User-owned. |
| Required properties | One fixed value and its fixed global order. Values are To Do, In Progress, and Completed. |
| Optional properties | Localized display text; localization does not change identity or meaning. |
| Invariants | Exactly three values exist; values cannot be renamed, added, removed, or reordered by a User; Completed is the only completed canonical group. |
| State transitions | None; CanonicalStatus is immutable classification. Task transitions occur through AreaStatus changes. |
| Allowed operations | Read; map AreaStatus; group Tasks in Global Kanban; filter and report. |
| Forbidden operations | User creation, deletion, renaming, custom canonical groups, or direct ownership. |
| Related requirements | FR-034–FR-040, FR-060, FR-067, FR-088–FR-090, AC-006. |

### 5.7 AreaStatus

| Aspect | Definition |
| --- | --- |
| Purpose | Express one Area's local workflow while preserving canonical global meaning. |
| Ownership | Owned through exactly one Area and ultimately its User. |
| Required properties | Area; non-blank name; one CanonicalStatus mapping; local order; active or retired state; default designation when applicable. |
| Optional properties | None required by the approved MVP. |
| Invariants | Belongs to one Area; maps to exactly one CanonicalStatus; name is unique within its Area under the product's normalized comparison; every Area has at least one active status and exactly one active default for each CanonicalStatus. |
| State transitions | Active ↔ Retired only through a valid workflow change. Canonical mapping may change only when all affected Tasks are atomically reassigned or remain semantically valid. |
| Allowed operations | Create; rename; reorder; change canonical mapping with reconciliation; designate as canonical default; retire after selecting a replacement for assigned Tasks. |
| Forbidden operations | Cross-Area assignment; deletion or retirement while Tasks still reference it without reassignment; removal of the last active status or default in a CanonicalStatus; use by an effectively inactive Task creation flow. |
| Related requirements | FR-034–FR-038, FR-060, FR-087–FR-090, NFR-005, AC-006. |

- **BR-STATUS-001:** A newly created Area receives three default AreaStatuses mapped one-to-one to To Do, In Progress, and Completed.
- **BR-STATUS-002:** Global Kanban displays CanonicalStatus groups only. Moving across global groups chooses the Task Area's default AreaStatus for the target group.
- **BR-STATUS-003:** Area Kanban displays active AreaStatuses in Area-defined order. Moving a Task updates both AreaStatus and its derived CanonicalStatus.
- **BR-STATUS-004:** A status retirement command includes a replacement AreaStatus from the same Area and canonical group for every affected Task.
- **BR-STATUS-005:** Bulk global status changes resolve the target default separately for each Task's Area.

### 5.8 Label

| Aspect | Definition |
| --- | --- |
| Purpose | Provide a reusable User-owned classification for Tasks. |
| Ownership | Directly owned by one User. |
| Required properties | Owner; non-blank display name; normalized uniqueness key. |
| Optional properties | None required by the approved MVP. |
| Invariants | Label name is unique within one User's private space under normalized comparison; ownership never changes. |
| State transitions | Active → Deleted. Label has no independent Archive or Trash lifecycle in MVP. |
| Allowed operations | Create; rename; assign to owned Tasks; remove from Tasks; delete. |
| Forbidden operations | Assign to another User's Task; create duplicate normalized names; delete a Task as a side effect of deleting a Label. |
| Related requirements | FR-031, FR-067, FR-071, FR-081, NFR-001, AC-005, AC-010. |

Deleting a Label removes its TaskLabel associations but does not delete or otherwise change its Tasks.

### 5.9 TaskLabel

| Aspect | Definition |
| --- | --- |
| Purpose | Represent assignment of one Label to one Task without changing either concept's identity. |
| Ownership | Derived jointly from Task and Label; both must have the same User. |
| Required properties | Task reference; Label reference. |
| Optional properties | None. |
| Invariants | Task and Label owners match; the Task–Label pair is unique; association inherits Task visibility and isolation. |
| State transitions | Absent → Assigned → Removed. |
| Allowed operations | Assign; remove; add or remove in supported bulk commands. |
| Forbidden operations | Duplicate assignment; cross-owner association; survival after either endpoint is permanently deleted. |
| Related requirements | FR-031, FR-067, FR-071, NFR-001, AC-005, AC-010. |

### 5.10 ChecklistItem

| Aspect | Definition |
| --- | --- |
| Purpose | Represent one ordered execution step inside a Task. |
| Ownership | Contained by one Task and owned by that Task's User. |
| Required properties | Parent Task; non-blank text; position; completion state. |
| Optional properties | Completion time. |
| Invariants | Position is unique within the Task's current checklist order; completion time exists only when completed; ChecklistItem cannot outlive its Task; lifecycle and privacy follow the Task. |
| State transitions | Open ↔ Completed; Existing → Removed. Reordering changes position without changing completion state. |
| Allowed operations | Add; edit text; reorder; complete; reopen; remove. |
| Forbidden operations | Move to another User's Task; archive or trash independently; survive permanent Task deletion. |
| Related requirements | FR-032–FR-033, FR-081, NFR-001, AC-005. |

### 5.11 RecurrenceSeries

| Aspect | Definition |
| --- | --- |
| Purpose | Preserve recurrence identity, current rule, and the one-open-occurrence invariant across generated Tasks. |
| Ownership | Directly owned by one User; Area and optional Project context for future occurrences must remain owned by that User. |
| Required properties | Owner; active RecurrenceRule; current generation state; rule version; series lifecycle state; reference to the current open occurrence when one exists. |
| Optional properties | Ended time; pause reason; reference to the most recently completed occurrence. |
| Invariants | At most one open occurrence; every occurrence has the same owner; completed historical occurrences remain identifiable; future context always resolves to one Area and an optional compatible Project; retrying generation cannot create a duplicate scheduled event. |
| State transitions | Active → Paused → Active; Active or Paused → Stopped; Active occurrence completion → Next Occurrence Pending → Active with new occurrence; Stopped is terminal for future generation. |
| Allowed operations | Change future rule through a new version; pause through Archive or Trash; resume after coherent restore; stop future recurrence; generate one next occurrence after completion. |
| Forbidden operations | Generate while an open occurrence exists; backfill missed occurrences; rewrite completed occurrence history; change owner; resume under invalid or inactive parents. |
| Related requirements | FR-047–FR-053, NFR-005–NFR-007, NFR-012, SC-004, AC-007, RA-003. |

### 5.12 RecurrenceRule

| Aspect | Definition |
| --- | --- |
| Purpose | Define how a RecurrenceSeries selects the next eligible occurrence date. |
| Ownership | Owned through one RecurrenceSeries and ultimately one User. |
| Required properties | Mode; positive interval or valid calendar pattern; recurrence anchor; effective rule version; account-local schedule meaning. |
| Optional properties | Selected weekdays; day of month; month and day; local time when the anchor is timed. No count-based or end-date termination is required by MVP. |
| Invariants | Mode is exactly Calendar Based or Completion Based; one active rule version per active series; the rule always yields a deterministic next eligible date; Calendar Based remains anchored to its calendar pattern rather than completion delay; Completion Based is anchored to completion. |
| State transitions | Draft → Active; Active → Superseded by a future rule version; Active → Stopped. Historical rule versions are immutable. |
| Allowed operations | Create; preview; replace for this and future occurrences; stop; evaluate the next eligible slot after completion. |
| Forbidden operations | Apply two modes simultaneously; mutate historical occurrence meaning; use a non-positive interval; create a second open occurrence; generate missed historical Tasks. |
| Related requirements | FR-047–FR-053, NFR-006, NFR-012, SC-004, AC-007, RA-003. |

Calendar rules support these approved UX meanings:

| Rule family | Domain meaning |
| --- | --- |
| Daily | Every positive number of calendar days. |
| Weekdays | Monday through Friday in the User's current account time zone. |
| Weekly | Every positive number of weeks on at least one selected weekday. |
| Monthly | Every positive number of months on the selected day; a missing day clamps to that month's last valid day. |
| Yearly | Every positive number of years on the selected month and day; an invalid leap-day occurrence clamps to the month's last valid day. |
| Custom calendar | A valid combination of frequency, positive interval, and the selections required by that frequency. |
| Completion based | A positive number of days, weeks, or months after completion; month arithmetic clamps to the target month's last valid day. |

- **BR-REC-001:** Both Calendar Based and Completion Based recurrence remain in MVP.
- **BR-REC-002:** A recurring Task requires at least one planned or due value. Planned is the recurrence anchor when present; otherwise due is the anchor.
- **BR-REC-003:** When both planned and due values exist, their relative offset is preserved in the next occurrence.
- **BR-REC-004:** Completing the open occurrence is the only event that may request generation of the next occurrence.
- **BR-REC-005:** Calendar Based mode selects the first rule slot strictly after the later of the completed occurrence's recurrence anchor and its completion instant. Missed slots are skipped and never backfilled.
- **BR-REC-006:** Completion Based mode calculates the next anchor from the completion instant using its positive interval.
- **BR-REC-007:** The next occurrence is generated exactly once, even when completion or recovery processing is retried.
- **BR-REC-008:** The next occurrence copies the series' future template fields, Area, compatible Project, Labels, recurrence context, and reminder definitions. ChecklistItem text and order are copied with completion reset to Open. Notifications are never copied.
- **BR-REC-009:** The next occurrence begins in the configured Area's default To Do AreaStatus.
- **BR-REC-010:** Editing “this occurrence” changes only the current Task. Editing “this and future occurrences” creates a new future rule/template version without rewriting completed history.
- **BR-REC-011:** Archiving or trashing the current occurrence or an ancestor pauses future generation and pending reminders. Restore resumes eligibility without backfill. Permanent deletion stops the series.
- **BR-REC-012:** A User time-zone change does not alter existing timed occurrence instants. Future Calendar Based slots are evaluated using the new account time zone after confirmation.

### 5.13 TaskReminder

| Aspect | Definition |
| --- | --- |
| Purpose | Define one in-app reminder relative to a Task's planned or due instant. |
| Ownership | Contained by one Task and owned by the same User. |
| Required properties | Task; anchor type of Planned or Due; offset or at-time rule; resolved scheduled instant; active state. |
| Optional properties | Custom offset; triggered time; cancellation reason. |
| Invariants | The referenced Task date includes a time; scheduled instant is deterministic; duplicate equivalent active reminders on one Task are not allowed; owner matches Task. |
| State transitions | Scheduled → Triggered; Scheduled → Paused → Scheduled; Scheduled or Paused → Cancelled. Triggered is terminal for that reminder occurrence. |
| Allowed operations | Create; edit; remove; pause through lifecycle propagation; trigger once; copy definition to a new recurring occurrence. |
| Forbidden operations | Schedule from a date without time; trigger more than once; send email, SMS, or native push; survive permanent Task deletion. |
| Related requirements | FR-054–FR-058, NFR-001, NFR-005–NFR-006, NFR-012, SC-005, AC-008. |

- **BR-REM-001:** Changing a reminder anchor date or time recalculates its scheduled instant.
- **BR-REM-002:** Archiving or trashing a Task or ancestor pauses pending reminders. Restore recalculates future reminders; elapsed reminder times are not replayed.
- **BR-REM-003:** Trigger processing is idempotent and creates at most one Notification for one TaskReminder occurrence.

Delivery polling, retry cadence, and operational latency are Architecture decisions; they cannot weaken these domain guarantees.

### 5.14 Notification

| Aspect | Definition |
| --- | --- |
| Purpose | Record one due in-app reminder and its read state for one User. |
| Ownership | Directly owned by one User; source TaskReminder and Task have the same owner. |
| Required properties | Owner; source TaskReminder occurrence; created time; read state; privacy-safe Task reference. |
| Optional properties | Read time; non-sensitive display snapshot while the Task remains available. |
| Invariants | One Notification per triggered TaskReminder occurrence; owner consistency; read time exists only when Read; no cross-user visibility. |
| State transitions | Unread → Read; Existing → Removed when required by permanent content or account deletion. MVP does not require Read → Unread. |
| Allowed operations | Create idempotently from a due reminder; list for owner; mark one or all visible Notifications read; follow an available owned Task reference. |
| Forbidden operations | Cross-owner access; creation without a due TaskReminder; disclosure of unavailable Task content; email, SMS, or native push delivery. |
| Related requirements | FR-056–FR-058, NFR-001, NFR-004–NFR-006, PRV-001, PRV-009, AC-008. |

When a Task is unavailable but not permanently deleted, an existing Notification may remain with a generic unavailable target. Permanent Task or User deletion removes related Notification content.

### 5.15 Archive state

| Aspect | Definition |
| --- | --- |
| Purpose | Represent recoverable inactive content without a deletion deadline. |
| Ownership | Part of the lifecycle of one User-owned Area, Project, or Task; contained concepts inherit effective availability. |
| Required properties | Archived state; archived time; lifecycle cause identifying direct or ancestor-triggered action; previous coherent state. |
| Optional properties | Initiating parent operation reference. |
| Invariants | Archive and Trash are mutually exclusive effective states; archived content remains owned and recoverable; archived content is excluded from active views; archive has no automatic expiry. |
| State transitions | Active → Archived; Archived → Active through restore; Archived → Trashed while preserving Archived as the pre-Trash state. |
| Allowed operations | Archive; view in Archive; restore; move to Trash. |
| Forbidden operations | Treat as completed; trigger reminders or recurrence generation while effectively archived; permanently delete directly without Trash. |
| Related requirements | FR-063, FR-073–FR-074, FR-081–FR-082, NFR-007, PRV-008, SC-007, AC-011. |

### 5.16 Trash state

| Aspect | Definition |
| --- | --- |
| Purpose | Represent recoverable removal before irreversible deletion. |
| Ownership | Part of the lifecycle of one User-owned Area, Project, or Task; cascade records retain the initiating owner and parent action. |
| Required properties | Trashed time; permanent-deletion deadline exactly 30 days later; previous coherent state; direct or ancestor lifecycle cause. |
| Optional properties | Initiating parent operation reference; restore destination chosen when the original parent is unavailable. |
| Invariants | Trashed content is excluded from active and Archive views; deadline is not silently extended by a later parent action; restore is allowed only before permanent deletion; permanently deleted content cannot be restored through product flows. |
| State transitions | Active or Archived → Trashed; Trashed → previous coherent Active or Archived state; Trashed → Permanently Deleted by explicit confirmation or automatic expiry. |
| Allowed operations | View in Trash; restore to a coherent owned parent context; permanently delete after explicit confirmation; expire automatically at deadline. |
| Forbidden operations | Ordinary editing, status changes, reminder triggering, recurrence generation, ownership transfer, restoration after permanent deletion. |
| Related requirements | FR-075–FR-082, NFR-007, PRV-006–PRV-008, SC-007, AC-011, RA-004, RA-009. |

## 6. Workflow state rules

| From | To | Preconditions | Effects |
| --- | --- | --- | --- |
| To Do | In Progress | Target active AreaStatus maps to In Progress. | Clear completion time; update both Area and Global Kanban state. |
| To Do | Completed | Target active AreaStatus maps to Completed. | Set completion time; request next recurrence generation when eligible. |
| In Progress | To Do | Target active AreaStatus maps to To Do. | Clear completion time. |
| In Progress | Completed | Target active AreaStatus maps to Completed. | Set completion time; request next recurrence generation when eligible. |
| Completed | To Do | User selects an active To Do AreaStatus. | Clear completion time; if a successor occurrence already exists, reopening is rejected until recurrence consistency is resolved. |
| Completed | In Progress | User selects an active In Progress AreaStatus. | Clear completion time; same recurrence guard applies. |
| Any canonical group | Same canonical group | Target AreaStatus differs but maps to the same group. | Local workflow changes; global canonical group remains unchanged. |

- **BR-WF-001:** Global Kanban status changes are commands to a CanonicalStatus and resolve through the Task Area's default AreaStatus.
- **BR-WF-002:** Area Kanban status changes name the exact target AreaStatus.
- **BR-WF-003:** A Task cannot be reopened when its RecurrenceSeries already has another open occurrence. The User must keep history completed or explicitly stop/remove the successor through a valid future workflow.
- **BR-WF-004:** Workflow changes are unavailable while a Task is effectively Archived or Trashed.

## 7. Date and time rules

- **BR-TIME-001:** A planned or due value may be absent, a date-only value, or a timed instant with an account-local presentation.
- **BR-TIME-002:** Date-only values retain the same calendar date when the User changes account time zone.
- **BR-TIME-003:** Timed values retain the same instant when the User changes account time zone; only their displayed local date and time may change.
- **BR-TIME-004:** When both planned and due values exist, due must not precede planned. Date-only values compare by calendar date, timed values by instant, and mixed values compare using their account-local calendar boundaries.
- **BR-TIME-005:** Today is determined using the User's current account-local date.
- **BR-TIME-006:** A non-completed Task is overdue when its due date is before Today or its due instant is before now. Completed, Archived, and Trashed Tasks are excluded from the active overdue set.
- **BR-TIME-007:** For a nonexistent local time during a daylight-saving transition, calendar recurrence advances by the transition gap to the next valid instant. For an ambiguous local time, it selects the earlier valid instant. The plain-language recurrence preview must reflect the effective result.
- **BR-TIME-008:** Adding a time to a date-only value interprets that local time in the current account time zone. Removing a time preserves the currently displayed account-local date.
- **BR-TIME-009:** A TaskReminder cannot be active unless its selected anchor has a time.

## 8. Parent lifecycle propagation

### 8.1 Propagation matrix

| Command | Direct target | Descendant effect |
| --- | --- | --- |
| Archive Area | Area becomes Archived. | Active Projects and Tasks become archived by the same cascade. Independently archived descendants keep their independent cause. Pending reminders and recurrence generation pause. |
| Restore Area from Archive | Area returns to Active. | Only descendants archived by that cascade return to their recorded prior state. Independently archived descendants remain archived. |
| Trash Area | Area becomes Trashed with a 30-day deadline. | Projects and Tasks not already independently trashed join the cascade with the same deadline and recorded prior state. Existing earlier Trash deadlines are not extended. |
| Restore Area from Trash | Area returns to its recorded Active or Archived state. | Only descendants trashed by that cascade return to their recorded prior state. Independently trashed descendants remain in Trash. |
| Archive Project | Project becomes Archived. | Active member Tasks become archived by the same cascade; pending reminders and recurrence generation pause. |
| Restore Project from Archive | Project returns to Active when its Area permits it. | Only Tasks archived by that cascade return to their prior state. |
| Trash Project | Project becomes Trashed. | Member Tasks join the cascade with the same deadline unless already independently trashed earlier. |
| Restore Project from Trash | Project returns to a coherent state and Area. | Only Tasks trashed by that cascade return to their prior state. |
| Archive or Trash Task | Only the Task lifecycle changes. | ChecklistItems and TaskLabels inherit visibility; pending reminders pause; recurrence series pauses. Labels remain active reusable concepts. |
| Permanently delete Area or Project | Target is removed. | All still-contained descendants are permanently deleted in the same logical operation because their required parent invariants cannot survive. |
| Permanently delete Task | Task is removed. | ChecklistItems, TaskLabels, TaskReminders, Task-owned recurrence continuation, and related Notification content are removed. Labels are retained. |

### 8.2 Restore rules

- **BR-LC-001:** A parent cascade records which descendants it affected and each affected descendant's prior direct lifecycle state.
- **BR-LC-002:** Restoring a parent reverses only the effects caused by that parent operation.
- **BR-LC-003:** A lifecycle action never extends an existing earlier Trash deadline.
- **BR-LC-004:** No Area, Project, or Task may be effectively Active beneath an Archived or Trashed required parent.
- **BR-LC-005:** Restoring a Project whose original Area is unavailable requires either restoring the Area chain or atomically selecting another active owned Area.
- **BR-LC-006:** Restoring a Task whose original Project is unavailable requires restoring that Project, choosing another compatible active Project, or restoring directly under its active Area.
- **BR-LC-007:** Restoring a Task whose Area is unavailable requires restoring the Area chain or atomically selecting another active owned Area and a compatible optional Project.
- **BR-LC-008:** A restore that changes Area maps workflow state through the target Area's default AreaStatus for the Task's existing CanonicalStatus.
- **BR-LC-009:** Automatic and manual permanent deletion have identical domain effects; manual deletion additionally requires explicit confirmation.
- **BR-LC-010:** Account deletion is not a 30-day Trash operation and cannot be used as a restore path for planning content.

## 9. Recurrence generation examples

| Scenario | Decision-complete result |
| --- | --- |
| Weekly Monday occurrence due July 6 is completed on July 20. | Generate only the first Monday strictly after July 20. Do not create July 13 or July 20 backfill Tasks. |
| Weekly Monday occurrence scheduled July 20 is completed early on July 19. | Generate the Monday after the current July 20 anchor, not a second occurrence for July 20. |
| Every 2 days after completion is completed July 20 at 10:00. | Generate one next occurrence anchored two calendar days after completion, preserving the rule's account-local time meaning. |
| Monthly on day 31 reaches February. | Use February's last valid day. |
| Calendar occurrence is archived before completion. | Pause reminders and future generation. Restore does not backfill; completion later generates the next future eligible slot. |
| Completion is retried after an interrupted request. | Return the already-created next occurrence or the same successful result; do not create another Task. |
| Completed historical occurrence receives a future-rule edit. | Historical meaning remains unchanged; only the current open and future occurrence template/rule version may change under the selected scope. |

## 10. Allowed and forbidden cross-concept operations

| Operation | Allowed result | Forbidden result |
| --- | --- | --- |
| Create Task | One owned Area, optional same-Area Project, valid AreaStatus. | Area-less Task or cross-owner/cross-Area Project. |
| Move Task Area | Atomic Area, Project, and AreaStatus reconciliation. | Retaining an incompatible Project or local status. |
| Move Project Area | Atomic Project and all Task moves with canonical-preserving target defaults. | Partial Project move or historical owner change. |
| Configure Area workflow | Valid names, order, mapping, and one default per canonical group. | Missing canonical group/default or in-use status removal without reassignment. |
| Complete recurring Task | Complete once and generate at most one next occurrence. | Schedule-driven overlap, backfill, or duplicate successor. |
| Edit recurrence | Explicit current-only or current-and-future scope. | Silent rewrite of completed history. |
| Archive | Recoverable inactive state with cascade provenance. | Completion, deletion, or continued reminder delivery as a side effect. |
| Trash | Recoverable 30-day state with coherent cascade. | Ordinary editing or silent deadline extension. |
| Restore | Prior coherent state or explicit valid destination. | Active child beneath inactive parent or guessed destination. |
| Permanent delete | Only from Trash; cascade required dependants; remove personal content. | Restore after deletion or orphaned required relationships. |
| Link identity | Re-authenticated explicit confirmation. | Email-match auto-linking or cross-user provider subject. |

## 11. Requirements traceability

| Domain rule area | Primary requirements and UX references |
| --- | --- |
| Ownership and privacy | FR-011–FR-012, FR-066, NFR-001–NFR-004, PRV-001–PRV-005, PRV-008–PRV-009, AC-002, UXF-027. |
| Authentication identities | FR-001–FR-007, FR-010, AC-001, UXF-002–UXF-005, UXF-025. |
| Area–Project–Task hierarchy | FR-017–FR-026, AC-004, UXF-007–UXF-012. |
| Workflow statuses | FR-034–FR-040, FR-060, FR-087–FR-090, AC-006, UXF-015–UXF-017, UXF-020. |
| Dates and Today | FR-041–FR-046, FR-061–FR-062, NFR-012, AC-009, UXF-006, UXF-011–UXF-012, UXF-024. |
| Recurrence | FR-047–FR-053, NFR-006, SC-004, AC-007, UXF-013. |
| Reminders and Notifications | FR-054–FR-058, NFR-006, SC-005, AC-008, UXF-014, UXF-021. |
| Archive, Trash, restore, deletion | FR-026, FR-063, FR-073–FR-082, NFR-007, PRV-006–PRV-008, SC-007, AC-011, UXF-022–UXF-023. |
| Labels and checklist | FR-031–FR-033, FR-067, FR-071, AC-005, AC-010, UXF-011–UXF-012, UXF-019–UXF-020. |

## 12. Resolved domain decisions

| ID | Decision | Resolution |
| --- | --- | --- |
| DR-001 | Recurrence modes | Preserve both Calendar Based and Completion Based recurrence. |
| DR-002 | Open occurrence policy | Permit at most one open occurrence per RecurrenceSeries. |
| DR-003 | Generation trigger | Generate the next occurrence only after current completion. |
| DR-004 | Missed calendar slots | Skip missed slots; never backfill historical Tasks. |
| DR-005 | Calendar anchor | Select the first rule slot after the later of completion and the current occurrence anchor. |
| DR-006 | Parent lifecycle | Cascade Archive and Trash with provenance; restore only cascade effects. |
| DR-007 | Permanent parent deletion | Permanently delete required descendants in the same logical operation. |
| DR-008 | Project Area move | Move Project and all Tasks atomically; map each Task through canonical defaults. |
| DR-009 | Date-only semantics | Preserve account-local calendar dates across time-zone changes. |
| DR-010 | Timed semantics | Preserve instants and redisplay them in the new account time zone. |
| DR-011 | Future calendar recurrence after time-zone change | Evaluate not-yet-generated slots in the new confirmed account time zone. |
| DR-012 | Authentication linking | Require authenticated explicit linking; do not auto-link by email match. |
| DR-013 | Archive versus Trash | Treat them as mutually distinct recoverable states; only Trash expires. |
| DR-014 | Ownership enforcement | Check ownership at every aggregate boundary and every bulk item. |

## 13. Remaining non-domain handoffs

The following items do not block this domain model and must not be silently decided here:

- Reminder polling frequency, job retry cadence, delivery latency target, and operational monitoring belong to Solution Architecture.
- Database constraints, identifiers, indexes, temporal storage representation, and deletion implementation belong to Data Design.
- REST resources, command shapes, idempotency keys, error payloads, and concurrency controls belong to API Design.
- Backup expiry, account-deletion operational timing, and deletion evidence belong to Privacy and Solution Architecture.
- Browser support, quantitative performance, availability, logging retention, and deployment topology belong to Solution Architecture.
- Exact Turkish wording and optional visual metadata belong to later UX refinement without changing these rules.

## 14. Domain risks and mitigations

| ID | Risk | Domain response |
| --- | --- | --- |
| DRA-001 | Calendar recurrence plus one-open-occurrence gating could surprise users after long delays. | Show a plain-language preview, generate the first future slot only, and never hide the no-backfill rule. |
| DRA-002 | Retrying completion could create duplicate occurrences. | Treat next-occurrence generation as idempotent for one series and completed occurrence. |
| DRA-003 | Parent lifecycle cascades could overwrite independent child choices. | Record lifecycle cause and prior state; reverse only effects from the matching cascade. |
| DRA-004 | Permanent parent deletion can remove children with later deadlines. | Make the confirmation name descendant scope and preserve the required-parent invariant. |
| DRA-005 | Time-zone changes can alter displayed timed dates. | Preserve instants, keep date-only values stable, preview changes, and apply the new zone only to future recurrence evaluation. |
| DRA-006 | Area workflow edits can orphan Task statuses. | Require replacement and default validation as part of one workflow command. |
| DRA-007 | Project moves can partially reconcile large Task sets. | Treat the move as one logical all-or-nothing operation and define implementation guarantees later. |
| DRA-008 | Email-based automatic linking could enable account takeover. | Require re-authenticated explicit identity linking. |

## 15. Stage 4 approval criteria

Stage 4 may be approved only when:

- **DOM-AC-001:** Every required domain concept has purpose, ownership, properties, invariants, transitions, operations, prohibitions, and requirement links.
- **DOM-AC-002:** Area–Project–Task ownership and compatibility rules have no contradiction with PRD or UX.
- **DOM-AC-003:** Canonical and Area-specific status behavior is decision-complete for Global and Area Kanban.
- **DOM-AC-004:** Recurrence modes, one-open-occurrence behavior, generation timing, no-backfill behavior, edit scope, and time-zone semantics are accepted.
- **DOM-AC-005:** Archive, Trash, cascading, restoration, retention, and permanent-deletion effects are accepted.
- **DOM-AC-006:** AuthenticationIdentity linking and User ownership rules are accepted.
- **DOM-AC-007:** Graphify findings are verified against source documents and any genuine disconnect is recorded.
- **DOM-AC-008:** No application code, Prisma schema, migration, API schema, or implementation-specific persistence design has been created.

## 16. Next-stage entry criteria

Data Design may begin only after:

- the user explicitly approves this Domain Model or its revisions;
- `docs/PROJECT_MASTER.md`, the PRD, UX flows, and this document contain no unresolved domain contradiction;
- Graphify outputs are regenerated from the complete approved planning corpus and reviewed;
- remaining Data, API, Privacy, and Architecture handoffs are preserved without being treated as settled domain rules.

# Personal Task Planner — Conceptual Data Model

| Field | Value |
| --- | --- |
| Status | Approved — Stage 5 completed; Stage 6 notification-preference amendment reconciled |
| Planning stage | Stage 5 — Data design |
| Product scope | MVP |
| Document language | English |
| Last updated | 2026-07-20 |
| Implementation status | Not started |

This document defines the conceptual and logical data model required to preserve the approved product, UX, and domain behavior. It defines data identities, relationships, ownership, lifecycle, integrity, ordering, retention, transaction boundaries, and concurrency expectations without creating a Prisma schema, migration, SQL statement, API contract, or production application code.

## 1. Modeling principles and conventions

- **Data belongs to one private User space.** Every user-owned record carries an explicit `userId`, including records whose ownership could otherwise be derived through a parent. The deliberate duplication supports isolation filters and same-owner referential constraints; it may never be used to permit ownership drift.
- **Identifiers are opaque and stable.** Primary identifiers are globally unique UUID values with no business meaning. Their exact generation mechanism is an implementation choice, but identifiers are never recycled or derived from names, email addresses, ordering, or timestamps.
- **Business keys are separate from primary keys.** Normalized email, provider subject, normalized Label name, AreaStatus name, recurrence occurrence number, and relationship pairs are candidate keys enforced independently of record identity.
- **Required hierarchy is protected by relationships, not only validation.** Task → Area is required; Project → Area is required; Task → Project is nullable but must match the Task's User and Area when present.
- **Soft lifecycle is explicit.** Active, Archived, and Trashed are stored states for Area, Project, and Task. Permanently Deleted means the authoritative row no longer exists.
- **History is immutable where meaning matters.** Completed recurrence occurrences keep the rule version that produced them. New future behavior creates a new version rather than rewriting history.
- **Time meanings are not conflated.** Date-only values and timed instants have different representations and invariants.
- **Data constraints are defense in depth.** Ownership checks in application behavior remain mandatory even when a candidate database constraint can also reject an invalid relationship.

## 2. Data decision register

Every Stage 5 data decision has a stable ID and is linked to its approved domain and product sources.

| ID | Data decision | Domain source | Requirement source |
| --- | --- | --- | --- |
| DD-001 | Use immutable, opaque, globally unique UUID primary identifiers for persisted entities; never use a mutable business value as a primary key. | DM-P-002, BR-OWN-002 | FR-011–FR-012, NFR-001 |
| DD-002 | Store `userId` on every user-owned entity, child record, and association record. | BR-OWN-001–BR-OWN-009 | FR-011, FR-066, NFR-001, PRV-001 |
| DD-003 | Use owner-inclusive candidate keys and relationships so a cross-user reference is invalid even when both opaque IDs exist. | BR-OWN-003–BR-OWN-008 | FR-011, NFR-001, AC-002 |
| DD-004 | Store one normalized primary email on User and enforce global uniqueness while the account exists or deletion is pending. Preserve the submitted form separately for display. | BR-AUTH-001–BR-AUTH-003 | FR-001–FR-007, NFR-002, AC-001 |
| DD-005 | Normalize email by trimming surrounding whitespace, applying Unicode normalization and case folding, and avoiding provider-specific dot or plus-address alias rules. | AuthenticationIdentity invariants | FR-001–FR-007, NFR-002 |
| DD-006 | Identify AuthenticationIdentity by a unique `(provider, providerSubject)` pair. A Google email snapshot is informational and is not an identity key. | BR-AUTH-001–BR-AUTH-003 | FR-005–FR-007, PRV-005 |
| DD-007 | A verified Google email matching an existing User cannot create another User and cannot auto-link; the identity is created only after re-authenticated explicit linking. | BR-AUTH-001 | FR-005–FR-007, NFR-002, AC-001 |
| DD-008 | Require exactly one Area for every retained Task, including Archived and Trashed Tasks. | DM-P-003, BR-TASK-001 | FR-018–FR-019, AC-004 |
| DD-009 | Keep Project nullable on Task, but when present require the same `userId` and `areaId` as the Task. | DM-P-004, BR-OWN-004 | FR-021–FR-025, AC-004 |
| DD-010 | Require every Task's AreaStatus to belong to the same User and Area; derive CanonicalStatus from the AreaStatus mapping rather than accepting an unrelated client value. | DM-P-006, BR-OWN-005, BR-STATUS-002–BR-STATUS-005 | FR-034–FR-040, FR-087–FR-090, AC-006 |
| DD-011 | Represent CanonicalStatus as the closed, immutable values To Do, In Progress, and Completed; it is not User-owned mutable data. | CanonicalStatus invariants, DR-003 | FR-034–FR-040, FR-060, FR-088–FR-090 |
| DD-012 | Store lifecycle state and lifecycle timestamps on Area, Project, and Task, with lifecycle operation/effect records preserving cascade cause and prior state. | DM-P-007, BR-LC-001–BR-LC-004 | FR-073–FR-082, NFR-007, AC-011 |
| DD-013 | Enforce the Trash deadline as exactly 30 days after first entry into Trash and never extend an earlier deadline through a later cascade. | BR-LC-003, Trash state invariants | FR-077–FR-080, PRV-006, AC-011 |
| DD-014 | Default required-parent referential behavior is restrictive. Permanent Area or Project deletion is an explicit logical operation that deletes required descendants before removing the parent. | DR-007, BR-LC-009 | FR-079–FR-082, NFR-007, AC-011 |
| DD-015 | Restoring a Task never guesses a replacement parent. It restores the available parent chain or atomically records an explicit compatible destination chosen by the User. | BR-LC-005–BR-LC-008 | FR-078, FR-081–FR-082, NFR-007 |
| DD-016 | A Task cannot remain restorable after its required Area or containing Project was permanently deleted; permanent parent deletion removes still-contained Tasks in the same logical operation. | BR-LC-005–BR-LC-009 | FR-079–FR-082, AC-011 |
| DD-017 | Enforce Label name uniqueness per User using a normalized comparison key; do not scope Labels to Area or Project. | Label invariants | FR-031, FR-067, FR-071, AC-005 |
| DD-018 | Enforce one TaskLabel per `(userId, taskId, labelId)` and remove only associations when a Label is deleted. | BR-OWN-006, TaskLabel invariants | FR-031, FR-071, AC-005, AC-010 |
| DD-019 | Use a dense positive integer `position` unique within one Task for ChecklistItem ordering; reorder the affected checklist atomically. | ChecklistItem invariants | FR-032–FR-033, AC-005 |
| DD-020 | Store independent opaque sortable rank keys for Global and Area Kanban on Task. Global rank is scoped by User and CanonicalStatus; Area rank is scoped by Area and AreaStatus. | BR-TASK-007, BR-STATUS-002–BR-STATUS-003 | FR-060, FR-090, A11Y-008, AC-006 |
| DD-021 | Resolve equal or temporarily colliding Kanban rank keys deterministically by Task ID; do not rewrite List sorting fields or the other board's rank. | BR-TASK-007 | FR-059–FR-060, NFR-005, AC-006 |
| DD-022 | Store all audit and lifecycle timestamps as UTC instants. Store date-only planned/due values as calendar dates and timed values as instants, with mutually exclusive representations per field. | DM-P-010, BR-TIME-001–BR-TIME-009 | FR-041–FR-046, NFR-012, AC-009 |
| DD-023 | Give each RecurrenceSeries immutable ownership and one active RecurrenceRuleVersion reference; historical Task occurrences retain their producing rule version. | DR-001–DR-005, BR-REC-010 | FR-047–FR-053, NFR-006, AC-007 |
| DD-024 | Link every recurring Task occurrence to its Series, producing rule version, occurrence number, and optional predecessor occurrence. Enforce unique occurrence number per Series and at most one successor per predecessor. | DM-P-008–DM-P-009, BR-REC-004–BR-REC-007 | FR-050–FR-053, NFR-006, AC-007 |
| DD-025 | Enforce at most one open occurrence per RecurrenceSeries through a database-enforceable conditional uniqueness rule or an equivalent serialized consistency mechanism. | DM-P-008, BR-WF-003 | FR-050, NFR-006, SC-004 |
| DD-026 | Complete a recurring Task, create or recover its one successor, copy its versioned template children, and update the Series pointer in one transaction. | BR-REC-004–BR-REC-009 | FR-050–FR-053, NFR-006, AC-007 |
| DD-027 | Treat the completed predecessor as the idempotency identity for successor generation; retry returns the existing successor rather than creating another Task. | BR-REC-007, DRA-002 | FR-050, NFR-006, SC-004 |
| DD-028 | Keep TaskReminder owned by one Task and create at most one Notification per triggered TaskReminder through a unique source relationship. | BR-REM-001–BR-REM-003, Notification invariants | FR-054–FR-057, NFR-006, AC-008 |
| DD-029 | Require a timed planned/due anchor for an active reminder and persist the resolved scheduled instant; recalculate it atomically when its source instant changes. | BR-TIME-009, BR-REM-001 | FR-054–FR-055, NFR-012, AC-008 |
| DD-030 | Revoke account access immediately after confirmed deletion, then execute an idempotent physical purge of the User, identities, and all owned primary data through a durable AccountDeletionProcess. | User lifecycle, BR-LC-010 | FR-008–FR-010, PRV-007, AC-001 |
| DD-031 | Keep only a privacy-minimized, non-content deletion process receipt after primary purge for the operational period later approved by Privacy/Architecture; do not retain email, titles, descriptions, or credentials in it. | User deletion handoff | PRV-004, PRV-007, PRV-009 |
| DD-032 | Add a monotonically increasing version to concurrency-sensitive aggregate roots and Task; stale mutations fail rather than silently overwrite newer state. | Cross-boundary consistency rules | NFR-005–NFR-007, NFR-013 |
| DD-033 | Treat each bulk item as its own atomic mutation unless a business command explicitly spans multiple items; report partial batch outcomes without partial mutation inside an item. | BR-OWN-011 | FR-070–FR-072, NFR-013, AC-010 |
| DD-034 | Use explicit transactional boundaries for Area workflow creation/change, Project Area moves, parent lifecycle cascades, coherent restore, recurring completion, and reminder triggering. | Conceptual consistency boundaries, BR-PROJ-001–BR-PROJ-003 | FR-026, FR-050, FR-073–FR-082, FR-087–FR-090 |
| DD-035 | Treat candidate indexes as workload hypotheses to validate with query plans; ownership-leading and lifecycle-leading indexes are mandatory candidates, not substitutes for authorization. | BR-OWN-009 | FR-059–FR-079, NFR-001, NFR-008 |
| DD-036 | Persist `inAppReminderNotificationsEnabled` as a required default-true User preference. At a reminder's due boundary, atomically read the current preference and resolve Scheduled to Triggered with one Notification or Suppressed without one; never backfill Suppressed reminders. | BR-NOTIF-001–BR-NOTIF-003 | FR-091–FR-093, AC-016 |

## 3. Entities and relationships

### 3.1 Relationship overview

| Parent or source | Relationship | Child or target | Cardinality | Required? | Integrity meaning |
| --- | --- | --- | --- | --- | --- |
| User | owns | AuthenticationIdentity | 1 → 1..n | User must retain at least one usable identity while active. | Identity provider key is globally unique; ownership is immutable. |
| User | owns | Area | 1 → 0..n | No | All Areas are private to one User. |
| Area | contains | AreaStatus | 1 → 3..n active statuses | Yes | At least one active status and exactly one default for each CanonicalStatus. |
| Area | contains | Project | 1 → 0..n | Yes for Project | Project cannot exist without one Area. |
| Area | contains | Task | 1 → 0..n | Yes for Task | Task cannot exist without one Area in any recoverable lifecycle state. |
| Project | groups | Task | 1 → 0..n | No for Task | Nullable; when present, User and Area match. |
| AreaStatus | classifies | Task | 1 → 0..n | Yes for Task | Status belongs to the same Area and maps to one CanonicalStatus. |
| User | owns | Label | 1 → 0..n | No | Label names are unique per User after normalization. |
| Task | receives | Label through TaskLabel | n ↔ n | No | Each pair is unique and same-owner. |
| Task | contains | ChecklistItem | 1 → 0..n | No | Item cannot outlive Task and is ordered within it. |
| User | owns | RecurrenceSeries | 1 → 0..n | No | Series ownership never changes. |
| RecurrenceSeries | versions | RecurrenceRuleVersion | 1 → 1..n | Yes for recurring series | One version is active; historical versions are immutable. |
| RecurrenceSeries | produces | Task occurrence | 1 → 1..n | No for non-recurring Task | Every recurring Task identifies its producing version. |
| Task | contains | TaskReminder | 1 → 0..n | No | Reminder anchor must be a timed Task value. |
| TaskReminder | produces | Notification | 1 → 0..1 | No until triggered | Unique source prevents duplicate Notification. |
| LifecycleOperation | records | LifecycleEffect | 1 → 1..n | Yes | Effects identify the root action, affected item, and prior state. |
| AccountDeletionProcess | purges | User private space | 1 → 1 while pending | Yes while pending | User relationship is cleared or removed only at completed primary purge. |

### 3.2 Canonical reference values

CanonicalStatus is a closed reference set, not a user-editable entity collection:

| Stable value | Global order | Meaning |
| --- | --- | --- |
| `TO_DO` | 1 | Open work not yet in progress. |
| `IN_PROGRESS` | 2 | Open work currently in progress. |
| `COMPLETED` | 3 | Completed work; requires `completedAt`. |

The stored AreaStatus mapping is authoritative. A cached or projected canonical value may be used for query performance only if it is maintained in the same transaction as AreaStatus changes and can never disagree with the mapping.

## 4. Entity definitions

### 4.1 User

| Aspect | Conceptual definition |
| --- | --- |
| Primary identifier | `userId` — opaque UUID. |
| Ownership | Account root; not owned by another entity. |
| Required data | Primary email display value; normalized primary email; account time zone; `inAppReminderNotificationsEnabled` defaulting to true; onboarding state; account lifecycle state; creation/update timestamps; version. |
| Nullable data | Display name; onboarding completion time; deletion confirmation time; access revocation time. |
| Unique constraints | Normalized primary email is globally unique for retained or deletion-pending Users. |
| Relationships | Owns identities and all private planning entities; may have one active deletion process. |
| Lifecycle | Active → Deletion Confirmed / Access Revoked → Physically Deleted. |
| Source links | DD-001–DD-007, DD-030–DD-032, DD-036; BR-OWN-001–BR-OWN-002, BR-NOTIF-001–BR-NOTIF-003; FR-008–FR-016, FR-045–FR-046, FR-091–FR-093, PRV-007, AC-016. |

An email address remains reserved while deletion is pending. It becomes reusable only after the authoritative User and AuthenticationIdentity records are physically removed. Backup copies do not participate in live uniqueness checks.

### 4.2 AuthenticationIdentity

| Aspect | Conceptual definition |
| --- | --- |
| Primary identifier | `authenticationIdentityId` — opaque UUID. |
| Ownership | Required `userId`; exactly one User. |
| Required data | Provider; provider subject; verification state; enabled state; creation/update timestamps; version. |
| Nullable data | Provider email snapshot; normalized email for email/password identity; credential verifier for email/password only; last authenticated time; disabled time and reason. |
| Unique constraints | `(provider, providerSubject)` globally unique; at most one enabled email/password identity per normalized email; identity cannot be linked to two Users. |
| Relationships | Required User. Identity record is created for an existing account link only after explicit re-authenticated confirmation. |
| Delete effect | Removed with User. Credentials and provider tokens are never copied to deletion receipts or planning data. |
| Source links | DD-004–DD-007; BR-AUTH-001–BR-AUTH-003; FR-001–FR-007, NFR-002–NFR-004, PRV-005. |

Provider email snapshots are not unique because providers may change them and because they are not the provider's stable subject. Pending OAuth state, verification tokens, password-reset tokens, and sessions are security-supporting data whose expiry and storage belong to Architecture; they cannot weaken the relationships above.

### 4.3 Area

| Aspect | Conceptual definition |
| --- | --- |
| Primary identifier | `areaId` — opaque UUID. |
| Ownership | Required immutable `userId`. |
| Required data | Name; lifecycle state; creation/update timestamps; version. |
| Nullable data | Archive/Trash fields when their state applies; current lifecycle operation reference. |
| Unique constraints | No approved Area-name uniqueness rule. Owner-inclusive key `(userId, areaId)` supports child references. |
| Relationships | Owns AreaStatuses; required parent of Projects and Tasks; may be a lifecycle root. |
| Delete effect | Permanent deletion explicitly removes contained Projects, Tasks, AreaStatuses, and Task-owned dependants in one logical purge; Labels remain unless the User is deleted. |
| Source links | DD-002–DD-003, DD-008, DD-012–DD-016; BR-OWN-003, BR-LC-001–BR-LC-009; FR-017–FR-026, FR-073–FR-082. |

### 4.4 AreaStatus

| Aspect | Conceptual definition |
| --- | --- |
| Primary identifier | `areaStatusId` — opaque UUID. |
| Ownership | Required `userId` and `areaId`; owner derives from and must equal the Area owner. |
| Required data | Name; normalized name; CanonicalStatus mapping; positive position; active/retired state; default flag; creation/update timestamps; version. |
| Nullable data | Retirement time. |
| Unique constraints | Normalized name unique within Area; position unique among active statuses in Area; exactly one active default per `(areaId, CanonicalStatus)`. |
| Referential integrity | Task references `(userId, areaId, areaStatusId)`; retirement or mapping change is restricted until affected Tasks are atomically reassigned. |
| Delete effect | Historical removal is not required; retirement preserves identity. Permanent Area deletion removes statuses after dependent Tasks are removed. |
| Source links | DD-003, DD-010–DD-011, DD-034; BR-STATUS-001–BR-STATUS-005; FR-034–FR-040, FR-087–FR-090. |

### 4.5 Project

| Aspect | Conceptual definition |
| --- | --- |
| Primary identifier | `projectId` — opaque UUID. |
| Ownership | Required immutable `userId`; required `areaId` with the same User. |
| Required data | Name; lifecycle state; creation/update timestamps; version. |
| Nullable data | Archive/Trash fields; current lifecycle operation reference. |
| Unique constraints | No approved Project-name uniqueness rule. Candidate key `(userId, areaId, projectId)` enforces compatible Task references. |
| Relationships | Required Area; optional parent of Tasks; may be a lifecycle root. |
| Delete effect | Permanent deletion removes still-contained Tasks and their dependants in the same logical operation; it never nulls Project on those Tasks as a hidden substitute for the approved cascade. |
| Source links | DD-003, DD-009, DD-012–DD-016, DD-034; BR-PROJ-001–BR-PROJ-003; FR-020–FR-026, FR-073–FR-082. |

Moving a Project changes its `areaId` and the `areaId` and `areaStatusId` of all contained Tasks in one transaction. Each Task receives the target Area default for its existing CanonicalStatus; no partial move is committed.

### 4.6 Task

| Aspect | Conceptual definition |
| --- | --- |
| Primary identifier | `taskId` — opaque UUID and stable occurrence identity. |
| Ownership | Required immutable `userId`. |
| Required data | `areaId`; title; `areaStatusId`; lifecycle state; Global Kanban rank; Area Kanban rank; creation/update timestamps; version. |
| Nullable data | `projectId`; description; planned calendar date or planned instant; due calendar date or due instant; priority; completion time; recurrence fields; Archive/Trash fields; current lifecycle operation reference. |
| Unique constraints | Recurrence-specific occurrence and predecessor keys when recurring; no approved title uniqueness. |
| Relationships | Required Area and AreaStatus; optional compatible Project; Labels through TaskLabel; owned ChecklistItems and TaskReminders; optional RecurrenceSeries and producing version. |
| Delete effect | Permanent deletion removes ChecklistItems, TaskLabels, TaskReminders, related Notifications, and Task-owned recurrence continuation; Label records remain. |
| Source links | DD-001–DD-003, DD-008–DD-010, DD-018–DD-029, DD-032; BR-TASK-001–BR-TASK-007; FR-018–FR-082, NFR-005–NFR-007. |

Task relationship constraints use owner-inclusive shapes:

- `(userId, areaId)` must identify one owned Area.
- `(userId, areaId, projectId)` must identify one Project when `projectId` is present.
- `(userId, areaId, areaStatusId)` must identify one AreaStatus.
- `completedAt` is required exactly when the mapped CanonicalStatus is Completed.
- `plannedDate` and `plannedAt` are mutually exclusive; `dueDate` and `dueAt` are mutually exclusive.
- When both planned and due values exist, their approved domain comparison cannot place due before planned.

### 4.7 Label and TaskLabel

| Entity | Primary identifier | Required data | Nullable data | Unique and relationship constraints | Delete effect | Source links |
| --- | --- | --- | --- | --- | --- | --- |
| Label | `labelId` UUID | `userId`, display name, normalized name, timestamps, version | None | `(userId, normalizedName)` unique | Remove TaskLabel associations; Tasks remain unchanged. | DD-002–DD-003, DD-017–DD-018; FR-031, FR-067, FR-071, FR-081. |
| TaskLabel | `taskLabelId` UUID or the pair as candidate key | `userId`, `taskId`, `labelId`, creation time | None | `(userId, taskId, labelId)` unique; both endpoints have same User | Removed with Task or Label. | DD-002–DD-003, DD-018; BR-OWN-006; FR-031, FR-071. |

Label normalization uses the same stable product normalization function for creation, rename, search equality, and uniqueness. It trims surrounding whitespace, applies Unicode normalization and case folding, and does not merge merely similar words.

### 4.8 ChecklistItem

| Aspect | Conceptual definition |
| --- | --- |
| Primary identifier | `checklistItemId` — opaque UUID. |
| Ownership | Required `userId` and `taskId`; User must equal Task owner. |
| Required data | Non-blank text; positive integer position; completed flag; creation/update timestamps. |
| Nullable data | Completion time. |
| Unique constraints | `(userId, taskId, position)` unique; position values need not remain gapless after deletion but a reorder writes a deterministic sequence. |
| Referential integrity | Removed with Task; cannot be reparented across Users. |
| Concurrency | Checklist reorder checks Task version and rewrites affected positions atomically. |
| Source links | DD-002–DD-003, DD-019, DD-032; FR-032–FR-033, FR-081, AC-005. |

### 4.9 RecurrenceSeries

| Aspect | Conceptual definition |
| --- | --- |
| Primary identifier | `recurrenceSeriesId` — opaque UUID. |
| Ownership | Required immutable `userId`. |
| Required data | Series state; active rule version reference; next occurrence number; creation/update timestamps; version. |
| Nullable data | Current open Task reference; most recently completed Task reference; paused/stopped time and reason. |
| Unique constraints | Current open Task is unique to one Series and must point back to it; only one active rule version. |
| Relationships | Owns rule versions; produces Task occurrences; future context references one owned Area and optional compatible Project through the active versioned template. |
| Delete effect | Permanent deletion of the current occurrence or required parent stops future generation; completed historical Tasks may retain a historical, non-generating Series reference until their own deletion. |
| Source links | DD-023–DD-027, DD-032, DD-034; BR-REC-001–BR-REC-012; FR-047–FR-053, NFR-006. |

The Series pointer is an optimization and consistency guard, not the only proof of openness. The open-occurrence uniqueness invariant is enforced against Task occurrence state as well.

### 4.10 RecurrenceRuleVersion and future template

| Aspect | Conceptual definition |
| --- | --- |
| Primary identifier | `recurrenceRuleVersionId` — opaque UUID. |
| Ownership | Required `userId` and `recurrenceSeriesId`; User must equal Series owner. |
| Required data | Positive version number; mode; frequency/interval and required selections; recurrence anchor kind; effective time; versioned future template; creation time. |
| Nullable data | Selected weekdays; day of month; month/day; local time; superseded time; stop time. |
| Unique constraints | `(recurrenceSeriesId, versionNumber)` unique; at most one non-superseded active version. |
| Immutability | Once it has produced an occurrence, scheduling meaning and template snapshot are immutable. A future edit creates a later version. |
| Source links | DD-023–DD-027; BR-REC-001–BR-REC-012; FR-047–FR-053, NFR-006, NFR-012. |

The version-owned future template is a composite snapshot, not a separate user-visible Task. It contains:

- scalar Task fields to copy, including title, description, priority, planned/due offset meaning, and owned Area plus optional compatible Project;
- Label references owned by the same User;
- ordered checklist text templates without completion state;
- reminder definitions without trigger or Notification history.

The next occurrence always receives the target Area's current default To Do AreaStatus. Notifications, completed checklist state, lifecycle state, Kanban rank, completion time, and historical timestamps are never copied.

### 4.11 Task recurrence occurrence fields

A recurring Task carries these additional relationships:

| Field | Nullability | Integrity rule |
| --- | --- | --- |
| `recurrenceSeriesId` | Required for recurring Task; null otherwise | Same User as Task. |
| `recurrenceRuleVersionId` | Required for recurring Task | Belongs to the same Series and User. |
| `occurrenceNumber` | Required for recurring Task | Positive and unique within Series. |
| `predecessorTaskId` | Null only for the first occurrence | Same Series; unique when present, so a predecessor has at most one successor. |
| `generationKey` | Required for generated successors | Deterministically represents Series + predecessor; unique. |

The conceptual constraint “one open occurrence per Series” covers every non-Completed occurrence even if it is Archived or Trashed. Lifecycle state pauses generation; it does not make a second open occurrence permissible.

### 4.12 TaskReminder

| Aspect | Conceptual definition |
| --- | --- |
| Primary identifier | `taskReminderId` — opaque UUID. |
| Ownership | Required `userId` and `taskId`; same User as Task. |
| Required data | Anchor kind; offset/at-time meaning; resolved scheduled instant; reminder state; creation/update timestamps; version. |
| Nullable data | Custom offset; triggered time; paused time; suppressed time and reason; cancelled time and reason. |
| Unique constraints | Equivalent active reminder definition unique within Task; implementation normalization must distinguish anchor and offset. |
| Relationships | Required Task; optional one Notification after trigger. |
| Delete effect | Removed with Task; no independent Archive or Trash. |
| Source links | DD-028–DD-029, DD-032, DD-034; BR-REM-001–BR-REM-003; FR-054–FR-058, NFR-006. |

### 4.13 Notification

| Aspect | Conceptual definition |
| --- | --- |
| Primary identifier | `notificationId` — opaque UUID. |
| Ownership | Required `userId`; equal to TaskReminder and Task owner. |
| Required data | `taskReminderId`; `taskId`; created time; read state. |
| Nullable data | Read time; minimal non-sensitive display snapshot while target remains retained. |
| Unique constraints | `taskReminderId` unique, producing at most one Notification. |
| Referential integrity | Required same-owner TaskReminder and Task. Archived or Trashed Task remains referenced but opens a generic unavailable state. Permanent Task deletion removes the Notification. |
| Source links | DD-002–DD-003, DD-028, DD-034; BR-REM-003; FR-056–FR-058, NFR-004–NFR-006, PRV-009. |

### 4.14 LifecycleOperation and LifecycleEffect

| Entity | Purpose | Required data | Nullable data | Constraints |
| --- | --- | --- | --- | --- |
| LifecycleOperation | Identify one direct archive, trash, restore, or permanent-delete command and its root target. | `lifecycleOperationId`, `userId`, operation kind, root entity kind and owned root identity, started time, state, version. | Completed time; failure summary without user-authored content. | Root belongs to User; operation ID is unique and idempotent for one accepted command. |
| LifecycleEffect | Record one entity state change caused by an operation. | `lifecycleEffectId`, operation ID, `userId`, affected entity kind and identity, previous state, resulting state, effect time. | Previous archive time; previous Trash deadline; reversed time; replacement Area/Project selected on restore. | One effect per operation and affected entity; affected entity belongs to User; restore reverses only the matching effect. |

The target kind plus target identity is a conceptual typed reference. The physical schema must preserve referential integrity through explicit typed relationships or equally strong constraints; an unchecked free-form identifier is not acceptable.

Lifecycle records are operational provenance, not a general audit log. They contain identities, states, and timestamps but no Task title, description, checklist text, credential, or other unnecessary content.

**Source links:** DD-012–DD-016, DD-034; BR-LC-001–BR-LC-009; FR-073–FR-082, NFR-007, PRV-006–PRV-009.

### 4.15 AccountDeletionProcess

| Aspect | Conceptual definition |
| --- | --- |
| Primary identifier | `accountDeletionProcessId` — opaque UUID and idempotency identity. |
| Ownership | Required `userId` while primary purge is pending; no planning-data ownership after completion. |
| Required data | Requested time; confirmed time; access-revoked time; process state; last progress time; version. |
| Nullable data | Completed time; privacy-minimized failure category; User reference after completed purge. |
| Unique constraints | At most one non-completed process per User; repeated confirmation resolves to the same process. |
| Retention | Pending record persists until primary purge completes. A completed receipt contains no email or user-authored content and remains only for a duration later approved by Privacy/Architecture. |
| Source links | DD-030–DD-032; User lifecycle, BR-LC-010; FR-008–FR-010, PRV-004, PRV-007, PRV-009. |

## 5. Required and nullable relationship rules

| Relationship | Required/nullable decision | Invalid state prevented |
| --- | --- | --- |
| AuthenticationIdentity → User | Required until User purge. | Orphan sign-in method or cross-account identity. |
| Area → User | Required. | Unowned Area. |
| AreaStatus → Area/User | Both required and consistent. | Foreign workflow status. |
| Project → Area/User | Both required and consistent. | Area-less or foreign Project. |
| Task → Area/User | Both required in Active, Archived, and Trashed states. | Area-less retained Task. |
| Task → Project | Nullable; compatible triple required when present. | Cross-Area or cross-user membership. |
| Task → AreaStatus | Required compatible triple. | Status from another Area. |
| TaskLabel → Task/Label/User | Both endpoints required and same-owner. | Foreign Label assignment. |
| ChecklistItem → Task/User | Required. | Independent or cross-user checklist item. |
| RecurrenceRuleVersion → Series/User | Required. | Foreign or orphan rule history. |
| Recurring Task → Series/RuleVersion | Both required and consistent. | Occurrence without its historical meaning. |
| TaskReminder → Task/User | Required. | Reminder without owned Task. |
| Notification → TaskReminder/Task/User | Required while retained. | Duplicate or foreign notification target. |
| LifecycleEffect → Operation/User/typed target | Required while target is recoverable; finalized during purge. | Cascade without provenance or foreign effect. |

## 6. Unique constraints and candidate keys

| Scope | Candidate unique constraint | Purpose |
| --- | --- | --- |
| User | `normalizedPrimaryEmail` | One live private account per verified normalized email. |
| AuthenticationIdentity | `(provider, providerSubject)` | One provider identity linked to at most one User. |
| AreaStatus | `(userId, areaId, normalizedName)` | No duplicate local status name. |
| AreaStatus | `(areaId, CanonicalStatus)` where active default | Exactly one active default per canonical group. |
| AreaStatus | `(areaId, position)` for active statuses | Deterministic Area board column order. |
| Project relationship | `(userId, areaId, projectId)` | Compatible Task composite reference. |
| Task relationship | `(userId, areaId, taskId)` | Owner/Area-scoped references. |
| Label | `(userId, normalizedName)` | Reusable User-wide label uniqueness. |
| TaskLabel | `(userId, taskId, labelId)` | No duplicate assignment. |
| ChecklistItem | `(userId, taskId, position)` | One item per checklist position. |
| RecurrenceRuleVersion | `(recurrenceSeriesId, versionNumber)` | Stable immutable history. |
| Recurring Task | `(recurrenceSeriesId, occurrenceNumber)` | Stable occurrence sequence. |
| Recurring Task | `predecessorTaskId` when present | At most one successor per predecessor. |
| Recurring Task | `generationKey` when present | Retry-safe successor generation. |
| RecurrenceSeries open occurrence | `recurrenceSeriesId` for non-Completed occurrence | At most one open occurrence. |
| TaskReminder | normalized active `(taskId, anchorKind, offset)` | No equivalent duplicate active reminder. |
| Notification | `taskReminderId` | One Notification per trigger source. |
| LifecycleEffect | `(lifecycleOperationId, affectedEntityKind, affectedEntityId)` | One recorded effect per target per operation. |
| AccountDeletionProcess | `userId` for non-completed process | One active deletion process. |

Conditional uniqueness may require a physical database constraint not directly expressible in a future high-level schema. Stage 5 requires the invariant; the later Prisma/migration design must preserve it rather than silently weakening it.

## 7. Referential integrity and delete actions

### 7.1 Default relationship policy

- Required hierarchy relationships use restrictive deletion by default.
- Owned leaf and association records may use dependent removal only when the parent is already approved for permanent deletion.
- No relationship automatically transfers ownership or reparents a record.
- No Project deletion silently sets Task `projectId` to null; ordinary detachment is a separate explicit Task operation, while permanent Project deletion follows the approved descendant purge.
- No Area deletion can null Task or Project `areaId`.

### 7.2 Permanent-delete order

The logical delete order is dependent-first and idempotent:

1. stop or finalize relevant reminder and recurrence work;
2. remove Notifications sourced by affected TaskReminders;
3. remove TaskReminders, ChecklistItems, TaskLabels, recurrence template children, and lifecycle effects that cannot outlive the target;
4. remove affected Tasks;
5. remove Project children and Projects when applicable;
6. remove AreaStatuses and Areas when applicable;
7. remove remaining Labels only for User deletion, not for Area/Project/Task deletion;
8. remove AuthenticationIdentities and User for account deletion;
9. finalize the privacy-minimized AccountDeletionProcess receipt.

This is a logical dependency order, not SQL or a mandate for one giant transaction during account purge.

## 8. Archive and Trash representation

Area, Project, and Task share these conceptual lifecycle fields:

| Field | Active | Archived | Trashed |
| --- | --- | --- | --- |
| `lifecycleState` | `ACTIVE` | `ARCHIVED` | `TRASHED` |
| `archivedAt` | Null | Required | Retained only when the pre-Trash state was Archived |
| `trashedAt` | Null | Null | Required |
| `purgeAfter` | Null | Null | Required; exactly 30 days after first Trash entry |
| `currentLifecycleOperationId` | Optional latest direct operation | Required cause/provenance | Required cause/provenance |
| `version` | Required | Required | Required |

LifecycleEffect stores the prior coherent state and the operation that caused a descendant transition. Restoring a parent selects only effects with that operation ID and not already reversed. An earlier independent child Trash deadline is retained and is not overwritten by a later parent operation.

Permanently Deleted is not a lifecycle field value. It is the absence of the authoritative entity row after an approved permanent-delete operation completes.

## 9. Ordering fields

### 9.1 Checklist and AreaStatus ordering

- ChecklistItem uses a positive integer `position` scoped to Task.
- AreaStatus uses a positive integer `position` scoped to Area for active workflow columns.
- A reorder validates the complete affected set and commits positions atomically.
- Gaps are allowed after deletion; a deliberate reorder may normalize the sequence.
- Concurrent reorder checks the parent Task or Area version and returns a conflict rather than mixing two stale orders.

### 9.2 Kanban ordering

Task stores two independent opaque sortable values:

| Rank | Scope | Changes when | Must not change when |
| --- | --- | --- | --- |
| Global Kanban rank | `(userId, CanonicalStatus)` | Reordered in Global Kanban or moved between canonical groups. | Area Kanban-only reorder or List sort. |
| Area Kanban rank | `(areaId, areaStatusId)` | Reordered in Area Kanban or moved between Area statuses. | Global Kanban-only reorder or List sort. |

Rank values are not user-visible positions and need not be dense integers. A move calculates a value between neighboring cards where possible. Equal keys remain valid temporarily and sort by Task ID as a stable tie-breaker. Rebalancing is a maintenance write that preserves visible order and must not alter Task workflow or List sort semantics.

Archived and Trashed Tasks retain their last rank values for coherent restore. If restored into a different status or Area, a new rank is assigned at the destination without modifying the other board unnecessarily.

## 10. Timestamp and temporal-value strategy

### 10.1 System timestamps

- `createdAt`, `updatedAt`, lifecycle timestamps, completion timestamps, reminder schedules, Notification timestamps, and deletion-process timestamps are UTC instants.
- Database and application clocks must use a shared UTC interpretation; displayed values use the User's current account time zone.
- Mutable aggregate rows include `updatedAt` and `version`; correctness uses version, not timestamp precision.
- Historical recurrence rule versions keep `effectiveAt` and `supersededAt` as UTC instants.

### 10.2 Task planned and due values

Each planned/due concept has three states:

| Meaning | Calendar-date field | Instant field |
| --- | --- | --- |
| Absent | Null | Null |
| Date only | Required | Null |
| Timed | Null | Required |

The mutually exclusive fields avoid storing two authorities that can drift. A timed value's local date is derived for the current account time zone. A date-only value remains unchanged when the User changes time zone. Reminder anchors require the instant representation.

### 10.3 Recurrence calendar meaning

Calendar rule versions store local pattern components and optional local time, not a permanently frozen time zone for future evaluation. The User's confirmed current account time zone determines not-yet-generated calendar slots. The resulting Task occurrence stores a concrete date-only value or timed instant, preserving its historical meaning after later time-zone changes.

## 11. Recurrence and duplicate-successor prevention

Completing a recurring Task is concurrency-sensitive and follows one atomic transaction:

1. load the Task and RecurrenceSeries under a serialized/locked or equivalent conditional version check;
2. verify ownership, lifecycle eligibility, and that the Task is the Series' current open occurrence;
3. apply the Completed AreaStatus and `completedAt` once;
4. derive the deterministic generation key from Series and predecessor Task;
5. find an existing successor by predecessor/generation key or create exactly one from the active rule/template version;
6. create copied checklist, Label links, and reminder definitions without copying completion or Notification history;
7. set the successor as the Series' current open occurrence and advance the occurrence counter;
8. commit all changes together.

Database uniqueness on predecessor/generation key is the final duplicate guard when two workers race. A losing retry reads and returns the existing successor. The Series version and one-open-occurrence constraint prevent two different predecessors or workers from both becoming current.

Reopening a completed occurrence is rejected when a successor exists. Removing or stopping future recurrence is a separate explicit command and cannot bypass history or ownership constraints.

## 12. Reminder and Notification relationships

- A TaskReminder is a definition and schedule for one Task occurrence; recurring Tasks receive new reminder definitions for the new occurrence.
- A Notification is a delivery record for one triggered TaskReminder, not the recurring template.
- Resolving a due reminder reads the User's current `inAppReminderNotificationsEnabled` preference in the same transaction: Enabled transitions it to Triggered and inserts or finds its unique Notification; Disabled transitions it to Suppressed and creates none.
- Suppressed reminders are terminal delivery outcomes. Changing the User preference does not rewrite reminder definitions, existing Notifications, or prior Suppressed outcomes, and re-enabling does not backfill them.
- Archive or Trash pauses scheduled reminders but keeps their definitions; restore recalculates future schedules and does not replay elapsed reminders.
- Permanent Task deletion removes reminders and their Notifications. Archived or Trashed Tasks remain retained, so their Notification may remain but resolves to a generic unavailable target.
- Job polling cadence, retry delay, and latency target remain Architecture decisions; they do not change the unique source and ownership constraints.

**Source links:** DD-028–DD-029, DD-034, DD-036; BR-REM-001–BR-REM-003, BR-NOTIF-001–BR-NOTIF-003; FR-054–FR-058, FR-091–FR-093, NFR-006, AC-008, AC-016.

## 13. Authentication identity and email relationships

- User is the authority for the globally unique normalized primary email.
- Email/password AuthenticationIdentity uses the same normalized email as its provider subject and requires verification before ordinary sign-in.
- Google AuthenticationIdentity uses Google's stable provider subject; its email snapshot does not establish ownership and is not unique.
- When a Google verified email matches an existing User, no second User is inserted and no AuthenticationIdentity is linked automatically. A short-lived, security-controlled linking challenge may be created, but the durable identity row is linked only after the person re-authenticates to the existing User and explicitly confirms.
- Unlinking or disabling an identity is transactional and forbidden if no usable identity would remain.
- Account purge deletes all AuthenticationIdentities and credential verifiers before releasing the normalized primary email for future registration.

**Source links:** DD-004–DD-007, DD-030; BR-AUTH-001–BR-AUTH-003; FR-001–FR-010, NFR-002–NFR-004, PRV-005.

## 14. Delete and restore effects

### 14.1 Scenario matrix

| Scenario | Data decision | Transactional effect |
| --- | --- | --- |
| User confirms account deletion | Access is revoked immediately; primary data is physically purged idempotently. | Create/find AccountDeletionProcess and revoke access atomically; purge proceeds in retryable dependency-ordered batches or transactions; completion clears personal primary data. |
| Area moves to Trash | Area, eligible Projects, and eligible Tasks share the cascade deadline and operation provenance; earlier child deadlines remain. | One lifecycle operation records all effects atomically for the accepted command. |
| Area permanently deleted | Still-contained Projects and Tasks cannot survive because Area is required. | Explicit dependent-first purge; no Task/Project `areaId` is nulled. |
| Project moves to Trash | Member Tasks join the operation unless already independently Trashed earlier. | Project and affected Task lifecycle effects commit atomically. |
| Project permanently deleted | Still-contained Tasks are permanently deleted even though Task.project is conceptually nullable. | Explicit purge; no silent detach during permanent Project deletion. |
| Task restored and original Project is active | Restore prior Task state and retain Project. | Matching lifecycle effect is reversed. |
| Task restored while original Project is Archived or Trashed | User restores the Project chain, selects another active compatible Project, or explicitly restores directly under the active Area. | Selected Project/null, Area, AreaStatus, lifecycle state, and ranks change atomically. |
| Task restored after original Project was permanently deleted | This retained-Task state is forbidden; Project purge should already have deleted the Task. | Restore is blocked and integrity repair is raised if corrupted legacy data is found. |
| Task restored while original Area is Archived or Trashed | User restores the Area chain or selects another active owned Area plus optional compatible Project. | Destination relationships and canonical-preserving AreaStatus mapping commit atomically. |
| Task restored after original Area was permanently deleted | This retained-Task state is forbidden because Area purge deletes all Tasks. | Restore is impossible; corrupted data is not guessed into a destination. |
| Task restored into a different Area | Existing CanonicalStatus meaning is preserved through the target default AreaStatus; Project is absent or compatible. | Area, Project, AreaStatus, lifecycle, reminder eligibility, recurrence future context when selected, and Area rank are reconciled atomically. |

### 14.2 Account deletion boundary

Account deletion is a logical all-or-nothing product outcome but not required to be one unbounded physical database transaction. The approved model is:

1. atomically record confirmation, revoke all authenticated access, and create/find the deletion process;
2. execute retry-safe, dependency-ordered physical purge steps that never restore access;
3. mark primary purge completed only when no User-owned primary record remains;
4. retain only the approved privacy-minimized operational receipt, if any;
5. handle backup expiry and deletion evidence under the later Privacy/Architecture policy.

The product must not present primary deletion as completed while live primary planning rows remain queryable.

## 15. Candidate indexes

These are candidate logical access paths. Exact PostgreSQL index types, included columns, partial predicates, and measured necessity are validated later with representative query plans.

| Entity | Candidate key order | Supports |
| --- | --- | --- |
| AuthenticationIdentity | `(provider, providerSubject)` unique | Sign-in identity lookup. |
| User | `normalizedPrimaryEmail` unique | Registration and explicit-link collision detection. |
| Area | `(userId, lifecycleState, updatedAt)` | Owned active/archive/trash lists. |
| Project | `(userId, areaId, lifecycleState, updatedAt)` | Area and global Project lists. |
| AreaStatus | `(userId, areaId, activeState, position)` | Workflow and Area Kanban columns. |
| Task | `(userId, lifecycleState, plannedAt/plannedDate)` | Active List and Today planned queries. |
| Task | `(userId, lifecycleState, dueAt/dueDate)` | Today due/overdue queries. |
| Task | `(userId, areaId, lifecycleState, areaStatusId, areaKanbanRank)` | Area List and Area Kanban. |
| Task | `(userId, lifecycleState, canonical projection, globalKanbanRank)` | Global Kanban. |
| Task | `(userId, projectId, lifecycleState, updatedAt)` | Project detail. |
| Task | `(userId, recurrenceSeriesId, occurrenceNumber)` | Series history and uniqueness. |
| Task | `predecessorTaskId` unique when present | Duplicate successor prevention. |
| Task | `purgeAfter` for Trashed rows | Automatic Trash expiry. |
| Task search projection | owner-leading full-text search over title and description | Current User Task search; archived/trash scope remains explicit. |
| Label | `(userId, normalizedName)` unique | Label lookup and creation. |
| TaskLabel | `(userId, labelId, taskId)` plus pair uniqueness | Label filter and bulk changes. |
| ChecklistItem | `(userId, taskId, position)` unique | Ordered checklist load. |
| TaskReminder | `(state, scheduledAt)` and `(userId, taskId)` | Due scheduling and Task detail. |
| Notification | `(userId, readState, createdAt)` | Notification center and unread count. |
| LifecycleEffect | `(userId, lifecycleOperationId)` and typed target identity | Cascade restore and provenance. |
| AccountDeletionProcess | `(processState, lastProgressAt)` | Retry/recovery of incomplete primary purges. |

Every user-facing lookup begins with or is constrained by `userId`. A global worker index such as due reminders is allowed only for internal processing and still loads and validates owner consistency before mutation.

## 16. Cross-user access prevention

1. Every owned row contains `userId`.
2. Child and association relationships include `userId` in their candidate reference shape.
3. Task → Project and Task → AreaStatus include both `userId` and `areaId` compatibility.
4. TaskLabel, reminder, Notification, recurrence, and lifecycle records cannot join endpoints with different Users.
5. All collection indexes and query plans lead with or constrain owner scope before returning data.
6. Opaque identifiers prevent business information from being embedded in URLs, but identifier opacity is not treated as authorization.
7. Foreign-owned and missing identifiers produce the same no-row/non-disclosing result at later API and UX boundaries.
8. Background recurrence, reminder, Trash expiry, and account-deletion workers apply the same ownership constraints as interactive requests.
9. Bulk actions validate every Task independently and never disclose a foreign selection.
10. Database constraints, repository/query scoping, service authorization, and automated isolation tests are all required layers.

**Source links:** DD-001–DD-003, DD-008–DD-010, DD-018, DD-028; BR-OWN-001–BR-OWN-012; FR-011–FR-012, FR-066, NFR-001, PRV-001–PRV-003, AC-002.

## 17. Transaction boundaries

| Operation | Required atomic boundary | Failure behavior |
| --- | --- | --- |
| Create Area | Area plus three default AreaStatuses and defaults. | No Area without a valid workflow is committed. |
| Change Area workflow | Status inserts/updates/order/defaults plus all required Task reassignments. | No partial workflow or orphan Task status. |
| Create or edit Task | Task scalar changes plus Area/Project/AreaStatus validation and requested Label/checklist/reminder changes for that command. | Task remains at prior version on failure. |
| Move Project to another Area | Project, every contained Task Area/status relationship, and affected Area rank. | All-or-nothing; no partial move. |
| Move Task to another Area | Task Area, optional Project, AreaStatus, Area rank, reminder/recurrence future context under selected scope. | No incompatible relationship is committed. |
| Complete recurring Task | Completion, unique successor create/find, copied children, and Series pointer/version. | Retry returns one successor; no completed-without-consistent-Series split. |
| Resolve due reminder | Current User preference plus the TaskReminder terminal transition; when Enabled, unique Notification create/find. | Retry returns the committed Triggered/Notification or Suppressed outcome without creating a second result. |
| Change in-app Notification preference | User preference and User version. | The previous preference remains if the mutation fails. |
| Parent Archive/Trash/restore | Root lifecycle state, all matching descendant effects, reminder/recurrence pause/resume state. | No partial cascade is reported as successful. |
| Permanent Area/Project/Task deletion | Explicit dependent-first removal for the target scope. | Retry continues or confirms absence without creating orphans. |
| Kanban reorder | Moved Task rank/status and version validation; any necessary destination rank assignment. | Conflict preserves prior visible order and invites refresh/retry. |
| Checklist reorder | Affected ChecklistItem positions plus parent Task version. | No duplicate position or mixed order. |
| Bulk action | One transaction per Task unless the command has a parent-wide invariant. | Partial batch success allowed and reported; each Task is internally atomic. |
| Begin account deletion | Confirmation, access revocation, identity/session disable intent, and deletion process creation. | Account remains usable only if the begin transaction fails completely. |
| Complete account purge | Retryable dependency-ordered transactions under one durable process. | Access never reopens; process resumes until no primary owned data remains. |

## 18. Concurrency-sensitive operations

| Operation | Race | Required guard |
| --- | --- | --- |
| Recurring completion | Two requests generate two successors. | Task/Series version or row serialization plus unique predecessor and generation key. |
| Reminder trigger | Multiple workers create duplicate Notifications. | Conditional state transition plus unique `taskReminderId` on Notification. |
| Notification preference change versus reminder resolution | A reminder becomes due while the preference changes. | Serialize or conditionally order the User preference read and Scheduled transition; exactly one committed due-time outcome is Triggered-with-Notification or Suppressed-without-Notification. |
| Project Area move | Task edited while bulk move reconciles it. | Lock/serialize affected Project and Task set or reject stale versions; one atomic move. |
| AreaStatus retirement | Task changes into the retiring status during reassignment. | Serialize workflow version and affected status set; conditional Task updates. |
| Parent lifecycle cascade | Child is independently archived/trashed during parent action. | Lifecycle versions and operation/effect uniqueness; apply approved precedence without extending earlier deadlines. |
| Restore | Parent state changes after preview but before confirmation. | Revalidate parent and destination versions inside restore transaction. |
| Trash expiry versus restore | Expiry worker deletes while User restores. | Conditional transition based on current state, deadline, and version; exactly one outcome commits. |
| Global/Area Kanban reorder | Two clients insert at the same rank. | Task version, opaque ranks, deterministic Task-ID tie-breaker, optional later rebalance. |
| Checklist reorder | Two clients submit stale sequences. | Task version/revision and unique position constraint. |
| Identity linking | Two Users try to claim one provider subject. | Global provider-subject uniqueness plus re-authenticated link transaction. |
| Account deletion versus ordinary mutation | New content is added after deletion confirmation. | Access revocation first; deletion-pending User cannot start planning mutations. |

Optimistic concurrency is the default for ordinary personal edits. Explicit serialization or locking is reserved for the small set of invariants that cannot be preserved through version checks and unique constraints alone.

## 19. Data retention assumptions

| Data category | Retention decision |
| --- | --- |
| Active planning data | Retained until User changes lifecycle or deletes the account. No automatic inactivity expiry is approved. |
| Archived Area/Project/Task | Retained indefinitely until restored, moved to Trash, or account-deleted. |
| Trashed Area/Project/Task | Recoverable until `purgeAfter`, exactly 30 days after first Trash entry; then permanently removed. |
| Labels | Retained until explicitly deleted or User is deleted; Area/Project/Task deletion does not delete reusable Labels. |
| Completed recurrence history | Retained like ordinary Tasks under lifecycle rules; rule versions required by retained occurrences remain. |
| Notifications | Retained while their Task/Reminder remains and until an explicit future retention policy; removed by permanent Task or User deletion. |
| Lifecycle provenance | Retained while required to restore retained content; removed or privacy-minimized when target scope is permanently deleted. |
| Authentication identities and credentials | Retained only while User exists and identity is needed for account/security lifecycle; removed in primary account purge. |
| AccountDeletionProcess | Pending until purge completion; completed privacy-minimized receipt duration is deferred to Privacy/Architecture. |
| Backups | Backup expiry and deletion evidence are intentionally unresolved Architecture/Privacy decisions. Backups never restore a deleted account through ordinary product flows. |

## 20. Requirement and domain traceability summary

| Data area | Domain rules | Product requirements |
| --- | --- | --- |
| Identifiers, ownership, isolation | DM-P-001–DM-P-004, BR-OWN-001–BR-OWN-012 | FR-011–FR-025, FR-066, NFR-001, PRV-001–PRV-003, AC-002, AC-004 |
| Authentication and account deletion | BR-AUTH-001–BR-AUTH-003, User lifecycle, BR-LC-010 | FR-001–FR-010, NFR-002–NFR-004, PRV-004–PRV-007, AC-001 |
| Workflow and ordering | DM-P-005–DM-P-006, BR-TASK-007, BR-STATUS-001–BR-STATUS-005 | FR-034–FR-040, FR-059–FR-060, FR-087–FR-090, AC-006 |
| Dates and timestamps | DM-P-010, BR-TIME-001–BR-TIME-009 | FR-041–FR-046, FR-061–FR-062, NFR-012, AC-009 |
| Recurrence | DM-P-008–DM-P-009, BR-REC-001–BR-REC-012, BR-WF-003 | FR-047–FR-053, NFR-006, SC-004, AC-007 |
| Reminders and Notifications | BR-REM-001–BR-REM-003, BR-NOTIF-001–BR-NOTIF-003 | FR-054–FR-058, FR-091–FR-093, NFR-006, SC-005, AC-008, AC-016 |
| Archive, Trash, delete, restore | DM-P-007, BR-LC-001–BR-LC-010 | FR-073–FR-082, NFR-007, PRV-006–PRV-008, SC-007, AC-011 |
| Labels and checklists | BR-OWN-006–BR-OWN-007, Label/TaskLabel/ChecklistItem invariants | FR-031–FR-033, FR-067, FR-071, FR-081, AC-005, AC-010 |
| Transactions and concurrency | Conceptual consistency boundaries, BR-PROJ-001–BR-PROJ-003, BR-OWN-011 | FR-026, FR-050, FR-070–FR-082, FR-087–FR-090, NFR-005–NFR-007, NFR-013 |

## 21. Remaining non-data handoffs

The conceptual model is decision-complete for Stage 5 without silently deciding these later concerns:

- exact Prisma model syntax, migration ordering, constraint names, and any custom migration needed for conditional uniqueness;
- UUID generation location and library choice;
- physical PostgreSQL index types and final index set after query-plan measurement;
- authentication session, verification-token, recovery-token, and OAuth challenge storage/expiry;
- reminder polling cadence, retry delays, delivery latency, and operational monitoring;
- account deletion backup expiry, deletion evidence, and completed receipt retention duration;
- API idempotency-key transport, conflict payloads, and version precondition representation;
- deployment, availability, browser support, logging retention, and disaster recovery.

## 22. Data risks and responses

| ID | Risk | Data response |
| --- | --- | --- |
| DATA-R-001 | Redundant `userId` fields could drift from parent ownership. | Use owner-inclusive relationships and never update ownership; test invariant violations. |
| DATA-R-002 | ORM-level schema features may not directly express one-open-occurrence or one-active-default conditional uniqueness. | Preserve the invariant through an explicit database constraint or equally strong serialized mechanism in the future migration design. |
| DATA-R-003 | Cascade lifecycle provenance can become stale or overly broad. | Use operation/effect uniqueness, prior-state recording, and matching-operation restore only. |
| DATA-R-004 | Permanent Project deletion could be mistaken for nullable Task detachment. | Restrict default relationship deletion and require explicit descendant purge. |
| DATA-R-005 | Recurrence completion retries can generate duplicate Tasks. | Combine Series serialization/versioning with predecessor and generation-key uniqueness. |
| DATA-R-006 | Opaque Kanban ranks can collide or require rebalance. | Use deterministic Task-ID tie-breaks and a maintenance rebalance that preserves visible order. |
| DATA-R-007 | Global email uniqueness can lock an account during incomplete deletion. | Keep email reserved while purge is pending and make the deletion process observable/retryable without restoring access. |
| DATA-R-008 | Account deletion can leave data in secondary stores or backups. | Treat primary purge as Stage 5 scope and require Architecture/Privacy to define backup, logs, search projections, and evidence before implementation readiness. |
| DATA-R-009 | Full-text or worker indexes could bypass owner-first assumptions. | Keep user-facing search owner-leading; internal workers revalidate ownership before mutation. |
| DATA-R-010 | Restore preview can become stale before confirmation. | Revalidate destination, lifecycle, and version within the restore transaction. |
| DATA-R-011 | A reminder can race with a User preference change and be both delivered and treated as suppressed. | Couple the preference read to the conditional reminder-state transition and permit exactly one committed terminal outcome. |

## 23. Stage 5 approval criteria

Stage 5 may be approved only when:

- **DATA-AC-001:** Every conceptual entity has an identifier, ownership, required/nullable data, relationships, and lifecycle/delete behavior.
- **DATA-AC-002:** Task → Area, optional same-Area Project, same-Area AreaStatus, and all same-owner constraints are explicit.
- **DATA-AC-003:** User, Area, Project, and Task deletion/restore scenarios are coherent and contain no orphan fallback.
- **DATA-AC-004:** Label and email uniqueness scopes, Google identity linking, checklist order, and both Kanban ranks are accepted.
- **DATA-AC-005:** Recurrence rule history, one-open-occurrence enforcement, and duplicate-successor prevention are represented.
- **DATA-AC-006:** Reminder-to-Notification idempotency and ownership are represented.
- **DATA-AC-007:** Archive/Trash fields, lifecycle provenance, 30-day retention, transaction boundaries, and concurrency guards are accepted.
- **DATA-AC-008:** Candidate indexes and retention assumptions are documented without pretending that unmeasured physical tuning is complete.
- **DATA-AC-009:** Graphify domain → data links and ownerless-entity findings are verified against source documents.
- **DATA-AC-010:** No Prisma schema, migration, SQL, API schema, or production application code has been created.

## 24. Next-stage entry criteria

API Design may begin only after:

- the user explicitly approves this Data Model or its revisions;
- `docs/PROJECT_MASTER.md`, PRD, UX Flows, Domain Model, and this document have no unresolved data contradiction;
- the incremental Graphify graph includes this Data Model and its verified domain/ownership connections;
- later Architecture, Privacy, API, and physical-schema handoffs remain explicit rather than silently assumed.

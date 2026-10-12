# HabitFlow SaaS Security Specification

## 1. Data Invariants

1. **Tenant Isolation**: A user can only access habits, completions, and invitations associated with a tenant where they have verified membership (`tenant_members` or `tenants.ownerId`).
2. **Personal Workspace Privacy**: Personal tenants belong solely to `ownerId == request.auth.uid`. No cross-tenant reads or writes.
3. **No Update-Gaps / Shadow Fields**: Document updates must only affect allowlisted fields and must adhere to length and type validations (`isValid[Entity]`).
4. **Identity Spoofing Prevention**: On document creation, `creatorId`, `ownerId`, or `userId` must strictly match `request.auth.uid`.
5. **Role Escalation Protection**: Regular users cannot promote themselves to tenant `owner` or platform `admin`.
6. **Payment & Subscription Integrity**: Client cannot directly forge subscription statuses or payment approvals; these are generated and verified server-side or by verified tenant owners with required transaction IDs.
7. **Temporal Consistency**: Timestamps and immutable fields (`createdAt`, `ownerId`, `tenantId`) cannot be altered on update.
8. **Query Security**: All list queries are evaluated against `resource.data` ownership and membership to prevent cross-tenant scraping.

---

## 2. The "Dirty Dozen" Payloads (Adversarial Attack Payloads)

| # | Attack Vector | Payload / Target | Expected Result | Reason |
|---|---|---|---|---|
| 1 | Ghost Field Injection | `habits/{id}` with `{ ..., "isSuperAdmin": true }` | REJECTED | `hasOnly()` blueprint prevents unregistered shadow fields |
| 2 | Tenant Forgery | `habits/{id}` with `tenantId: "victim-tenant-id"` | REJECTED | Caller is not an authorized member of `victim-tenant-id` |
| 3 | Identity Spoofing | `habits/{id}` with `creatorId: "another-user-uid"` | REJECTED | `creatorId` must equal `request.auth.uid` |
| 4 | Immutable Field Tampering | Updating habit changing `tenantId` or `creatorId` | REJECTED | `incoming().tenantId == existing().tenantId` invariant |
| 5 | Path Variable Poisoning | Document write to `/habits/INVALID%20$$$` | REJECTED | `isValidId()` restricts characters to `^[a-zA-Z0-9_\-]+$` and `<= 128` chars |
| 6 | Denial of Wallet (Size Overflow)| Creating habit with name string of 1MB | REJECTED | `name.size() <= 120` size constraint enforced |
| 7 | Self-Assigned Platform Admin | Writing to `/admins/{auth.uid}` | REJECTED | Direct write to `/admins` is forbidden to non-superadmins |
| 8 | Unverified Cross-Tenant List | `list` on `/habits` across other tenants | REJECTED | Rule evaluates `resource.data.tenantId` / `creatorId` |
| 9 | Completion Value Tampering | `value: "not_a_number"` or negative infinity | REJECTED | `value is number && value >= 0` type and range validation |
| 10| Unauthenticated Read | `get` `/users/private-user-id` while logged out | REJECTED | `request.auth != null` mandatory gate |
| 11| PII Scrape Attack | `get` on another user's document in `/users` | REJECTED | Restricted to profile owner (`isOwner`) or admin |
| 12| Forged Subscription Activation | Client setDoc `/subscriptions/{tenantId}` status: 'active' | REJECTED | Validated owner and transaction reference required |

---

## 3. Test Runner Specification

Tested against the local and deployed Firestore rules emulator and security test suites in `firestore.rules.test.ts`.
All 12 attacks result in `PERMISSION_DENIED` status.

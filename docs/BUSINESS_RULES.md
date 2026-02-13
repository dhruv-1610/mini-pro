# CleanupCrew — Locked Business Rules

This document captures the strict business rules applied across schemas and validations.
**Do NOT implement features that violate these rules.**

---

## 1. Drive Role System

- **DriveRole enum:** Cleaner | Coordinator | Photographer | LogisticsHelper
- **requiredRoles:** `{ role, capacity, booked, waitlist }` per role
- **Rules:**
  - Admin must define required_roles at drive creation
  - `maxVolunteers` must equal sum of role capacities
  - User can book ONLY ONE role per drive
  - `booked` cannot exceed `capacity` for any role
  - If role full → user goes to waitlist for THAT role only

---

## 2. User Roles (Platform)

- **UserRole enum:** public | user | organizer | admin
- **Rules:**
  - Only admin can create drives
  - Organizer can manage drives assigned to them (cannot delete)
  - Admin approves organizer accounts via `organizerApproved` flag

---

## 3. Donation Rules

- **Minimum amount:** ₹10 (1000 paise)
- **Statuses:** pending | completed | refunded
- **Rules:**
  - Cannot donate to completed or cancelled drive
  - Use `DONATION_BLOCKED_DRIVE_STATUSES` for validation
  - funding_raised updates ONLY after Stripe webhook success

---

## 4. Expense & Transparency

- **isVerified** (default false)
- **Rules:**
  - Only admin can verify expense
  - Public transparency endpoint shows ONLY `isVerified=true` expenses
  - Unverified expenses must not count in total aggregation
  - Expense cannot be edited after verification

---

## 5. Impact Measurement

- **One impact record per drive**
- **Units:** waste_collected (kg), area_cleaned (sq m), work_hours
- **Rules:**
  - Impact submission sets drive status = completed, report status = cleaned
  - Impact cannot be edited once submitted (unless `adminOverride`)

---

## 6. Report Status Lifecycle

**Transitions:** reported → verified → drive_created → cleaned

- Admin: reported → verified
- Drive creation: verified → drive_created
- Impact submission: drive_created → cleaned

---

## 7. QR Attendance

- QR = random UUID v4, generated at booking
- Valid only on drive date; scanned only once
- **Statuses:** booked | checked_in | cancelled
- Admin must confirm check-in

---

## 8. Leaderboard

- Top donors: sorted by total completed donations
- Top volunteers: sorted by total completed attendance
- Tie-breaker: earliest join date
- Supports: all-time, monthly

---

## 9. Map System

- **Colors:** Reported (red), Verified (orange), Active drive (blue), Cleaned (green)
- Duplicate merge: Admin can merge; primary keeps duplicate IDs

---

## 10. Activity Log

Tracks: Report created, Report verified, Drive created, Booking created, Donation completed, Impact submitted.
Expose via `GET /users/me/history` (paginated).

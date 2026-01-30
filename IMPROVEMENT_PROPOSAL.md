# Nemesis Platform Improvement Proposal

## 1. Platform Supervision (Admin & Moderation)

**Current State:**
- The platform has a `PlatformSettings` model for global configurations.
- SuperAdmins can manage storage and assets.
- Stats are aggregated but offer high-level views only.
- **Gap:** No audit trail for admin actions. If a setting is changed or a user deleted, there is no record of who did it.
- **Gap:** Limited "moderation" workflow. No way to "flag" content or "suspend" users efficiently without direct DB access.

**Recommendations:**
1.  **Admin Activity Log:** Create an `AdminActivity` model to track critical actions (Target: User/Artwork, Action: Delete/Update, Actor: AdminID, Timestamp).
2.  **Moderation Dashboard:** A dedicated view for Admins to see reported content (needs a Report model) or flagged users.
3.  **User Suspension Flow:** Add `isActive` or `isSuspended` flags to `User` model with a reason field, reachable via Admin API.

## 2. Robustness (Reliability & Error Handling)

**Current State:**
- Basic `express-validator` usage.
- `try/catch` blocks in controllers with generic error passing.
- Rate limiting is well-implemented (`authLimiter`, `apiLimiter`).
- **Gap:** Error handling is repetitive. No standardized Error class (e.g., `new AppError('Not Found', 404)`).
- **Gap:** Logging is done via `console.error` and `morgan` (HTTP). No structured logging (JSON) for production observability.

**Recommendations:**
1.  **Centralized Error Class:** Implement `AppError` extending `Error` to standardize status codes and operational vs. programming errors.
2.  **Structured Logger:** Integrate `winston` for JSON logging with log levels (info, warn, error) to replace `console.log`.
3.  **Service Layer:** Refactor "Fat Controllers" (especially `artwork.routes.js`) into Services (`artwork.service.js`) to separate business logic from HTTP transport. This improves testability.

## 3. Database (Models & Queries)

**Current State:**
- `Artwork` model uses a custom N-gram solution for search.
- Basic indexes exist.
- **Gap:** The N-gram generation in `pre('save')` adds overhead. MongoDB Atlas Search (if available) or a dedicated Text Index is more scalable, but the current solution is acceptable for low-medium scale.
- **Gap:** Large aggregations in `platform.routes.js` might be slow on large datasets.

**Recommendations:**
1.  **Index Review:** Ensure compound indexes exist for common filter combos: `{ category: 1, price: 1 }` and `{ isForSale: 1, createdAt: -1 }`.
2.  **Lean Queries:** Continue using `.lean()` for read-only operations (currently being done, which is good).
3.  **Schema Validation:** Enforce stricter schemas for `video` metadata if that feature grows.

## 4. UI/UX & Design Consistency

**Current State:**
- Uses Shadcn/UI and Tailwind.
- **Gap:** Inconsistent "Empty States" (e.g., what users see when a gallery is empty).
- **Gap:** Loading states vary (spinners vs skeletons).
- **Gap:** Error feedback needs to be uniform (e.g., using `sonner` toasts consistently vs inline errors).

**Recommendations:**
1.  **Design System Audit:** Standardize feedback components.
2.  **Reusable Components:** Create `<EmptyState />` and `<PageSkeleton />` components.
3.  **User Flows:** specific improvements for the "Artist Application" flow to ensure clear feedback on status.

## 5. Implementation Plan

**Phase 1: Foundation (Robustness)**
- Setup `winston` and `AppError`.
- Refactor `artwork.routes.js` to `artwork.service.js`.

**Phase 2: Supervision**
- Implement `AdminActivity` log.
- Add "Suspend User" functionality.

**Phase 3: UI Polish**
- Implement standard `EmptyState` component.
- Apply to Gallery and Orders pages.

# Pagination Enhancement Plan (Feedback: 1 2 3...)

**UserManagementPage.jsx (already server-paginated):**
- Add `renderPageNumbers` function: Shows 1-5 buttons around current, ellipsis ..., Last.
- Replace pagination div with full bar: Prev [1 2 3 ... 10] Next.

**AllAdminStaffPage.jsx (currently client-side full load):**
- Add pagination states: pageNumber, pageSize, totalCount.
- Update `load` to `api.getAllAdminUsers(pageNumber, pageSize)` – extend API if needed, or client slice for now.
- From api.js: No paginated getAllAdminUsers yet; getShgMembers example shows ?pageNumber=&pageSize=.
- Implement client-side pagination first (slice rows), add server later.
- Add `renderPageNumbers` same as above.

**UI Pro Style:**
- Compact buttons: Active blue bg, hover scale/shadow, ellipsis styled.
- Responsive: Stack on mobile.

**Steps:**
1. Edit UserManagementPage.jsx: Add numbered pages.
2. Edit AllAdminStaffPage.jsx: Add client pagination + numbered buttons.
3. Test.

Proceed with edits.

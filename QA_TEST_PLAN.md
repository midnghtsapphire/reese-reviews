# QA TEST PLAN — Reese Reviews
**For human QA testers and AI agents. No coding knowledge required for most tests.**
**Test environment:** `npm run dev` → open http://localhost:5173 → click Business tab

---

## HOW TO RUN TESTS

### Setup
1. Open the app in a browser (Chrome or Edge recommended)
2. Open browser DevTools (F12) → Application → Local Storage → clear all `rr-*` keys to start fresh
3. Navigate to **Business** tab
4. For each test, follow the steps exactly, then check the expected result

### Reporting Bugs
When you find a bug, note:
- **Test ID** (e.g. TC-001)
- **Steps to reproduce** (exactly what you clicked)
- **Expected result** (what should have happened)
- **Actual result** (what actually happened)
- **Screenshot** if possible

---

## FEATURE AREAS

| Area | Test IDs | Priority |
|---|---|---|
| Vine Dashboard — Bulk Actions | TC-001 to TC-010 | P0 |
| Tax Center — Deadlines & Credits | TC-011 to TC-020 | P0 |
| Tax Center — Company Wizard | TC-021 to TC-030 | P0 |
| Tax Center — People & Businesses | TC-031 to TC-040 | P1 |
| Tax Center — Income Sources | TC-041 to TC-050 | P1 |
| Tax Center — Write-Offs | TC-051 to TC-060 | P1 |
| Smart Transaction Alerts | TC-061 to TC-075 | P0 |
| Plaid / Bank Transactions | TC-076 to TC-085 | P1 |
| Quarterly Estimates | TC-086 to TC-095 | P1 |
| Tax Changes Panel | TC-096 to TC-100 | P2 |
| Combo Flows (End-to-End) | TC-E01 to TC-E10 | P0 |
| Edge Cases | TC-X01 to TC-X15 | P2 |

---

## VINE DASHBOARD — BULK ACTIONS

### TC-001 — View Vine Queue Tab
1. Click **Business** → Click **Vine** sub-tab in ERP Tax Center
2. Click the **Queue** tab
**Expected:** List of Vine items with status badges. "Auto-Generate" button visible.

### TC-002 — Receive All Items
1. Go to Vine → Queue tab
2. Click **"Receive All"** button (purple toolbar)
**Expected:** All items without a received date get marked "received". Counter shows updated count. Toast or indicator confirms.

### TC-003 — Auto-Generate All Drafts
**Pre-condition:** At least one item is "received" without a draft.
1. Go to Vine → Queue tab
2. Click **"Auto-Generate All"** button
**Expected:** Draft reviews are generated for all received items without existing drafts. Items move to "in_progress" status.

### TC-004 — One-Click Receive and Generate All
1. Start with items in "pending" state (received = false)
2. Click **"Receive & Generate All"** button
**Expected:** All items are marked received AND drafts are auto-generated in a single click. This is the critical workflow — all Vine items go from pending to having a draft review in one action.

### TC-005 — View Generated Draft
1. After TC-004, click on any Vine item
2. View the draft review
**Expected:** Draft has a title, body text, and a star rating (1–5).

### TC-006 — Edit Draft
1. Open any draft
2. Click the review body text and type some changes
3. Click Save
**Expected:** `editedAt` timestamp updates. Changes persist after page refresh.

### TC-007 — Copy Draft to Clipboard
1. Open any draft
2. Click "Copy" button
**Expected:** Toast or confirmation: "Copied to clipboard." Paste into a text editor to verify.

### TC-008 — Mark Item Submitted
1. Open any draft with body and rating
2. Click "Mark Submitted" or equivalent button
**Expected:** `submittedAt` and `submittedDate` are set. Item status becomes `submitted`. Daily submission counter increments.

### TC-009 — Daily Counter
1. Submit 3 reviews in one session
**Expected:** Daily counter shows "3 today". Counter resets if you change the date in DevTools (advanced).

### TC-010 — Vine Item with Past Deadline
1. Check the queue for any item with a deadline in the past
**Expected:** Item shows `overdue` status badge in red/orange. Should appear at top of queue or highlighted.

---

## TAX CENTER — DEADLINES & CREDITS TAB

### TC-011 — Navigate to Deadlines Tab
1. Click **Business** → Tax Center ERP → **Deadlines** sub-tab
**Expected:** "NEW" amber badge visible on the tab. Tax calendar loads with at least 10 deadline entries.

### TC-012 — 30-Day Alert Banner
1. Navigate to Deadlines tab
**Expected:** If any deadline falls within the next 30 days, a yellow/amber alert banner appears at the top listing those deadlines.

### TC-013 — Urgency Badges
1. Look at any deadline entry
**Expected:** Each has a colored badge: "This Week" (red), "This Month" (amber), "Soon" (blue), "Upcoming" (gray), or "Past" (muted/gray-green).

### TC-014 — Expand Deadline Row
1. Click any deadline entry
**Expected:** Row expands to show full description, form references, and days-from-today countdown (e.g. "in 45 days" or "32 days ago").

### TC-015 — Filter Deadlines by Category
1. Look for filter buttons: Filing, Payment, Issuer, Election, Contribution, Planning
2. Click "Payment"
**Expected:** Only payment deadlines visible. Click "All" to reset.

### TC-016 — Credits Finder
1. Scroll down to Credits Finder section
2. Click each filter category: SE, Disability, Energy, Retirement, Care
**Expected:** Cards filter to show only matching credits.

### TC-017 — Credit Card Expand
1. Click any credit card (e.g. "Solar ITC 30%")
**Expected:** Card expands showing: benefit amount, form to file, action note, and source links.

### TC-018 — SE Tax Strategy Note
1. Look for "SE Tax Strategy" section
**Expected:** Explains why maxing SE tax is beneficial for SSDI filers (preserves SS wage record). Mentions QBSE + TurboTax SE + Gusto.

### TC-019 — Colorado Energy Note
1. Look for Colorado Energy section
**Expected:** LEAP (heating bills), LIWP (heat pump installation), HEEHRA (federal rebate up to $8,000) all mentioned with links.

### TC-020 — Heat Pump Credit Information
1. Look for heat pump / Form 5695 credit card
**Expected:** Shows 30% credit up to $2,000. Form 5695 Part II referenced. LIWP contact info visible.

---

## TAX CENTER — COMPANY WIZARD

### TC-021 — Open Wizard from People Tab
1. Click **Business** → Tax Center ERP → **People** sub-tab
2. Click "+ Add Business / Company" button (amber/gold, top right)
**Expected:** Modal dialog opens with "New Company / Business" header. Step 1 of 4 visible.

### TC-022 — Wizard Step 1 — Select Existing Filer
1. Open wizard
2. Click on "Revvel / Mom" (or any existing filer)
**Expected:** Row highlights with amber border + checkmark. "Next" button becomes active.

### TC-023 — Wizard Step 1 — Create New Filer
1. Open wizard
2. Click "+ Create a new filer profile"
3. Fill in: Name = "Test Person", Role = Primary Filer, Filing Status = Single
4. Click Next
**Expected:** Moves to Step 2.

### TC-024 — Wizard Step 2 — Business Info
1. In Step 2, fill in: Business Name = "Test Business LLC", EIN = "12-3456789"
2. Click "Sole Proprietorship" as the type
**Expected:** Row highlights. Schedule automatically updates to "Schedule C". Next button active.

### TC-025 — Wizard Step 2 — EIN Validation Display
1. Type an EIN
**Expected:** EIN field uses monospace font and allows hyphens. No validation error for any 9-digit EIN.

### TC-026 — Wizard Step 3 — Tax Schedule Selection
1. In Step 3, click through all schedule options
**Expected:** Only schedules compatible with the chosen business type are shown. (e.g. Rental business shows Schedule E; Sole Prop shows Schedule C and F.)

### TC-027 — Wizard Step 3 — Home Office Toggle
1. Check the "Home Office Eligible" checkbox
**Expected:** Checkbox is checkable. Description explains Form 8829 benefit.

### TC-028 — Wizard Step 4 — Review Screen
1. Complete Steps 1–3, land on Step 4
**Expected:** Summary shows all choices made. Amber tip at bottom says "After saving, go to Manage Income…"

### TC-029 — Wizard Completion
1. Complete all 4 steps, click "Add Business"
**Expected:** Success screen with green checkmark. Message says business was added. "Done" button closes modal. People tab refreshes showing the new business listed under the filer.

### TC-030 — Wizard Cancel
1. Open wizard, fill in Step 1, click "Cancel" (or X)
**Expected:** Modal closes without saving anything. No new person or business created.

---

## TAX CENTER — PEOPLE & BUSINESSES

### TC-031 — View Tax Filer List
1. Click People tab
**Expected:** 3 pre-loaded filers: Revvel / Mom, Reese / Daughter, Caresse. Each shows role, filing status, income count, and gross amount.

### TC-032 — Add Person Manually (from PeopleManager form)
1. Click "+ Add Person" button
2. Fill in: Name = "Jane Test", Role = Spouse, Filing Status = MFJ
3. Click "Add Person"
**Expected:** New person appears in list. Data persists on page refresh.

### TC-033 — Delete Person
1. Click the ✕ button next to any test person you created
2. Confirm the dialog
**Expected:** Person removed from list. Their income data is preserved (per the confirm message).

### TC-034 — Manage Income Button
1. Click "Manage Income" next to any filer
**Expected:** Navigates to Income tab with that person pre-selected.

### TC-035 — View Forms Button
1. Click "View Forms" next to any filer
**Expected:** Navigates to Tax Forms tab with that person's required forms calculated.

### TC-036 — Businesses Listed per Person
1. Expand or look at each filer card
**Expected:** "Revvel / Mom" shows 3 businesses. "Reese / Daughter" shows 0. "Caresse" shows 3.

### TC-037 — Add Business via Wizard (from People tab)
1. Click "+ Add Business / Company" (top of People tab)
2. Complete wizard for an existing filer
**Expected:** Business appears under that filer in the People list after wizard completion.

---

## TAX CENTER — INCOME SOURCES

### TC-041 — Add Income Source
1. Go to People tab → Click "Manage Income" for Caresse
2. Click "Add Income Source"
3. Fill in: Label = "Test 1099", Payer = "Test Company", Income Type = 1099-NEC, Amount = $1,000
4. Save
**Expected:** Income source appears in the list. Gross total updates.

### TC-042 — 1099-NEC Triggers Schedule C Badge
1. Add a 1099-NEC income source
2. Check "View Forms" for that person
**Expected:** Schedule C, Schedule SE, and Form 1040 are listed as required.

### TC-043 — SSA-1099 (Social Security)
1. Add income source with type = ssa_1099, Amount = $12,000
**Expected:** Only Form 1040 is triggered (not Schedule C — SS is passive income).

### TC-044 — Rental Income Triggers Schedule E
1. Add income source with type = rental, Amount = $500/mo
**Expected:** Schedule E appears in required forms.

### TC-045 — Reconciliation Toggle
1. Add an income source
2. Mark it as "Reconciled"
**Expected:** Reconciled badge appears on the row.

---

## TAX CENTER — WRITE-OFFS

### TC-051 — Add Write-Off
1. Go to Tax Center → any write-off manager
2. Add: Description = "Test Software", Vendor = "Adobe", Category = equipment, Amount = $59.99
**Expected:** Write-off appears. Deductible amount shows $59.99 (100%).

### TC-052 — Partial Deductible (Internet/Phone)
1. Add write-off: Category = internet, Amount = $80, Deductible % = 50
**Expected:** Deductible amount shows $40 (50% of $80).

### TC-053 — Meals 50% Rule
1. Add write-off: Category = meals_entertainment, Amount = $100
**Expected:** Default deductible % is 50. Deductible amount = $50.

### TC-054 — Mileage Calculator
1. Add write-off: Category = vehicle_mileage, Miles = 100
**Expected:** Amount auto-calculated: 100 × $0.67 = $67.00 (or current IRS rate).

### TC-055 — Heat Pump / Energy Category
1. Add write-off: Category = heat_pump, Amount = $3,200
**Expected:** Category is available in the dropdown. Deductible amount = $3,200.

---

## SMART TRANSACTION ALERTS (Keeper-Style)

### TC-061 — Alert Banner Visible in Transactions Tab
1. Go to Tax Center → Transactions tab
**Expected:** Smart Tax Alerts panel is visible at the top of the tab (even if empty — shows "No pending alerts").

### TC-062 — Rescan Button
1. Click "Rescan" in the alert panel header
**Expected:** Engine runs, count updates if new alerts found.

### TC-063 — Heat Pump Detection
1. Go to Transactions tab
2. Find a transaction with "heat pump" or "HVAC" in the merchant name (may be demo data)
   OR manually add a transaction via the manual entry feature
**Expected:** Alert fires with type = credit_eligible. Title mentions "Heat Pump / HVAC Equipment". Shows Form 5695 Part II reference.

### TC-064 — Solar Detection
1. Find or create a transaction with "Solar" or "Sunrun" in merchant name
**Expected:** Alert fires: "Solar Installation / Equipment — Form 5695 Part I — 30% no cap."

### TC-065 — EV Detection
1. Find or create transaction with "Tesla" or "Rivian"
**Expected:** Alert fires: "Electric Vehicle Purchase — Form 8936 — up to $7,500."

### TC-066 — Write-Off Detection (High Confidence)
1. Find a transaction at "Adobe" or "Dropbox" classified as "pending"
**Expected:** Alert fires with type = write_off. Suggests classifying as business.

### TC-067 — Large Unclassified Expense Alert
1. Find a pending transaction > $100 with no matched rules
**Expected:** Alert fires with type = paperwork. Says "save a receipt and classify."

### TC-068 — Alert Expand/Collapse
1. Click any alert row
**Expected:** Expands to show: full detail text, form reference, transaction date, action buttons, source URL.

### TC-069 — Alert Source Link
1. Expand a credit_eligible alert
2. Click "IRS Source" link
**Expected:** Opens IRS.gov page in a new tab.

### TC-070 — "Done" Action
1. Expand any alert
2. Click "Done" button (green checkmark)
**Expected:** Alert disappears from the "new" list. Status = "done".

### TC-071 — Dismiss Alert
1. Click the X button on any alert
**Expected:** Alert disappears. Not shown again unless "Rescan" is clicked (and it re-detects a new condition).

### TC-072 — "Dismiss All" Button
1. Have 3+ active alerts
2. Click "Dismiss all"
**Expected:** All alerts cleared. "No pending alerts" state shown.

### TC-073 — Navigate from Alert
1. Open a credit_eligible alert
2. Click "View Credits & Deadlines" action button
**Expected:** App navigates to the Deadlines tab.

### TC-074 — Alert Count Badge (Tab Header)
**Expected:** If `TaxAlertBadge` is wired to the Transactions tab label, it should show a count of new alerts.

### TC-075 — No Duplicate Alerts
1. Click "Rescan" multiple times
**Expected:** Same transaction never generates two identical alerts. Total alert count stays stable after first scan.

---

## PLAID / BANK TRANSACTIONS

### TC-076 — Transaction List Loads
1. Go to Tax Center → Transactions tab
**Expected:** List of demo transactions (or real Plaid transactions if connected). Each shows: date, merchant, amount, classification badge.

### TC-077 — Classify as Business
1. Find any "pending" transaction
2. Click "Business" classification button
**Expected:** Transaction turns green. Classification = "business". Tax deductible = true.

### TC-078 — Classify as Personal
1. Find any "pending" transaction
2. Click "Personal" classification button
**Expected:** Transaction turns gray. Not deductible.

### TC-079 — Sync to Expense Tracker
1. Classify several transactions as "Business"
2. Click "Sync All to Expenses" button
**Expected:** Transactions appear in Expense Tracker. `synced_to_expenses` = true on each.

### TC-080 — Filter by "Needs Review"
1. Click "Needs Review" filter tab
**Expected:** Only transactions with `needs_review = true` are shown.

### TC-081 — Filter by Amazon
1. Click "Amazon" filter tab
**Expected:** Only Amazon-related transactions visible.

### TC-082 — Search Transactions
1. Type "Adobe" in search box
**Expected:** Only transactions matching "Adobe" are shown.

### TC-083 — Credit Eligible Badge
1. Find a transaction that should trigger credit_eligible (HVAC, solar, EV)
**Expected:** Small badge or label shows on the transaction row.

### TC-084 — CSV Export
1. Click "Export CSV" button
**Expected:** File downloads. Open in Excel — should have columns: date, merchant, amount, classification, category, notes.

---

## QUARTERLY ESTIMATES

### TC-086 — Quarterly Calculator Loads
1. Go to Tax Center → Quarterly sub-tab
**Expected:** 4 quarters shown for selected tax year. Each shows: due date, estimated income, tax owed, amount paid, paid status.

### TC-087 — Add Income to Quarter
1. Click Q2 card
2. Enter estimated income = $3,000
**Expected:** Tax owed auto-calculates (approx 30–35% of net, including SE tax).

### TC-088 — Mark Quarter Paid
1. Enter payment amount + date for Q1
2. Toggle "Paid"
**Expected:** Quarter card shows green "Paid" badge. Total paid updates.

### TC-089 — Underpayment Warning
1. Set estimated income high but paid amount to $0
**Expected:** Warning appears about potential underpayment penalty.

### TC-090 — Year Selector
1. Change the year dropdown to 2024
**Expected:** Quarterly data for 2024 loads. Deadlines adjust for 2024.

---

## TAX CHANGES PANEL

### TC-096 — Panel Loads
1. Go to Deadlines tab
2. Scroll below the TaxDeadlinesCredits section
**Expected:** "Tax Changes & Updates — 2025/2026" card is visible.

### TC-097 — All Changes Listed
**Expected:** At least 11 change entries visible. Includes: Heat Pump §25C, Solar §25D, HEEHRA, SE tax, Solo 401(k), QBI sunset, standard deduction, SALT cap, ABLE age expansion, Colorado rate, LEAP.

### TC-098 — Filter by Category
1. Click "Energy" filter button
**Expected:** Only energy-related changes visible (Heat pump, Solar, HEEHRA, LEAP).

### TC-099 — Expand Change Entry
1. Click any change entry
**Expected:** Expands to show: detailed explanation, source citations (with clickable IRS links).

### TC-100 — Source Links Open
1. Expand any entry
2. Click a source link (e.g. "IRS — Energy Efficient Home Improvement Credit")
**Expected:** Opens correct IRS.gov page in new tab.

---

## COMBO FLOWS (End-to-End) {#e2e}

### TC-E01 — New Vine Reviewer Full Setup
**Scenario:** Someone just joined Amazon Vine. Set up everything from scratch.
1. Go to People tab → "+ Add Business / Company"
2. Wizard: Create new person "Jane Vine", Role = Primary, Filing = Single
3. Business: "Jane's Reviews", Type = Sole Prop, Schedule C, Home Office = yes
4. Go to Income tab → Add 1099-NEC: "$2,400, Amazon.com Services LLC"
5. Check Tax Forms tab
6. Go to Quarterly tab → Q1 estimate
**Expected:** Forms show Schedule C + SE + 8829 + 1040. Q1 estimate shows approximately $840 owed.

### TC-E02 — Vine Item → Review → Inventory → Capital Contribution
1. Check VineItem with received_date > 6 months ago
2. Generate review draft (or mark as submitted)
3. Go to Inventory → find the item
4. Change status to "donated"
5. Go to Financial → Capital Contributions
**Expected:** Item appears as a capital contribution to NoCo Nook. ETV = original Vine value. Gain/Loss shows null (not yet sold).

### TC-E03 — Bank Transaction → Write-Off Alert → Sync to Expense
1. Find a "pending" Adobe transaction in Transactions tab
2. Observe Smart Tax Alert: "Creative Software — Write-Off"
3. Click alert → "Classify as Business"
4. Transaction classification = business
5. Click "Sync All to Expenses"
**Expected:** Transaction in Expense Tracker as: category = software_subscriptions, 100% deductible.

### TC-E04 — Heat Pump Purchase Full Flow
1. Add a manual transaction: Merchant = "Carrier HVAC Services", Amount = $3,200, Date = today
2. Click Rescan on Alert Panel
3. Observe: credit_eligible alert fires for Form 5695 Part II
4. Navigate to Deadlines tab (via alert button)
5. Find heat pump credit card in Credits Finder
**Expected:** Alert shows up to $960 credit estimate (30% × $3,200). Credits tab shows "up to $2,000" credit. Source link to IRS.

### TC-E05 — Quarterly Tax with Multiple Income Sources
1. Add two income sources for one person: W-2 ($30,000) + 1099-NEC ($8,000)
2. Go to Quarterly tab
3. Check Q1 estimated tax
**Expected:** Q1 estimate reflects combined income. SE tax on $8K is roughly 15.3% = $1,224. Income tax bracket applies to $38K total. App should show combined estimate.

### TC-E06 — Year-End Write-Off Review
1. Set tax year to current year
2. Go to Transactions tab
3. Click "Rescan"
4. Check alert: large unclassified expenses
5. Classify all as business or personal
6. Sync to Expenses
**Expected:** Expense Tracker total deductions increase. Tax savings estimate updates.

### TC-E07 — Company Wizard with All 6 Business Types
1. Open wizard 6 times, creating: sole_prop, llc, s_corp, partnership, rental, gig
2. Each time choose the compatible schedule
**Expected:** All 6 business types successfully created. S-Corp shows schedule = none. Rental shows schedule_e.

### TC-E08 — Alert Dismiss and Re-trigger
1. Dismiss an alert for a transaction
2. Click Rescan
**Expected:** Same alert does NOT re-appear (dismissed alerts are permanent).

### TC-E09 — Multi-Person Tax Summary
1. Add income to all 3 default persons
2. Go to ERP home/overview
**Expected:** KPI cards show combined gross income, combined deductions, and combined net across all persons.

### TC-E10 — Deadline Reminder Workflow
1. Go to Deadlines tab
2. Find any upcoming deadline
3. Click the bell/reminder icon
4. Set a reminder
5. Snooze the reminder to next week
**Expected:** Reminder saved. Snooze date set. Active reminder count reflects this. On the snooze date (advance system clock to test), reminder becomes active again.

---

## EDGE CASES {#edge}

### TC-X01 — Zero ETV Item
1. Create a VineItem with estimated_value = 0
**Expected:** App doesn't crash. $0 ETV shows correctly. No division-by-zero errors.

### TC-X02 — Very Large ETV ($5,000+)
1. Create a VineItem with estimated_value = 5000
**Expected:** Tax estimate shows correctly. No overflow or display issues.

### TC-X03 — Empty Business Entity Name
1. Open Company Wizard Step 2
2. Leave Business Name blank
3. Try to click Next
**Expected:** "Next" button is disabled (grayed out). Cannot proceed without a name.

### TC-X04 — Delete Person with No Businesses
1. Add a new person with no businesses
2. Delete them
**Expected:** Deleted successfully. Other persons unaffected.

### TC-X05 — Quarterly Estimate with Zero Income
1. Enter $0 estimated income for a quarter
**Expected:** Tax owed shows $0. No NaN or undefined values.

### TC-X06 — Transaction with Zero Amount
1. Classify a $0 transaction as "business"
**Expected:** Sync to expenses creates $0 entry without crash.

### TC-X07 — Very Long Product Name
1. Add a VineItem with product_name = 300 characters
**Expected:** Name truncates or wraps gracefully in UI. No layout overflow.

### TC-X08 — All Alerts Dismissed Then Rescan
1. Dismiss all alerts
2. Click Rescan
**Expected:** Alerts that were dismissed do NOT return. Only genuinely new conditions fire.

### TC-X09 — Tax Year 2024 Deadlines
1. Change year selector to 2024
2. Go to Deadlines tab
**Expected:** Deadlines recalculate for 2024. All dates are in the past. All badges = "Past".

### TC-X10 — Invalid Date in VineItem
1. If manually editing localStorage, set received_date = "not-a-date"
**Expected:** App shows a graceful error or N/A, does not crash.

### TC-X11 — Empty Income Sources List
1. Start with a fresh person (no income sources)
2. Go to Tax Forms tab
**Expected:** "No required forms" or only Form 1040 shows. No crash.

### TC-X12 — Plaid Not Connected
1. Ensure no Plaid account is linked
2. Go to Transactions tab
**Expected:** Demo transactions show. Banner explains Plaid not connected.

### TC-X13 — Wizard Back Navigation
1. Open wizard, complete Steps 1–3, land on Step 4
2. Click "Back" twice
**Expected:** Returns to Step 2 with previous choices intact (name, type, EIN all still filled in).

### TC-X14 — Multiple Reminders Same Deadline
1. Set reminder for Q2 deadline
2. Try to set it again
**Expected:** Overwrites existing reminder (not creates duplicate).

### TC-X15 — Rapid Classification Toggle
1. Click Business → Personal → Business → Personal rapidly on one transaction
**Expected:** Final state is "Personal" (last click wins). No race condition or duplicate alerts.

---

## REGRESSION CHECKLIST (Run After Any Code Change)

Before marking any PR ready for review, confirm these still work:

- [ ] Business tab loads without JS errors in console
- [ ] Vine Queue shows items and auto-gen works
- [ ] Tax Persons list loads (Revvel, Reese, Caresse)
- [ ] Company Wizard opens, completes, and saves
- [ ] Deadlines tab loads with calendar entries
- [ ] Smart Alert panel shows in Transactions tab
- [ ] Build passes: `npm run build` exits 0
- [ ] No new TypeScript errors
- [ ] localStorage keys are not accidentally cleared by any new code
- [ ] `rr-tax-persons` persists after page refresh
- [ ] `rr-vine-review-drafts` persists after page refresh

---

## TEST DATA CHEAT SHEET

Use these values when you need fast test data:

| Field | Test Value |
|---|---|
| ASIN | `B08N5WRWNW` |
| EIN | `82-1234567` |
| Amazon Order ID | `113-2345678-9012345` |
| Vine ETV (small) | `29.99` |
| Vine ETV (large) | `249.99` |
| Income (1099-NEC) | `4521.00` |
| Business expense | `24.00` |
| HVAC merchant name | `Carrier HVAC Services` |
| Solar merchant name | `SunRun Solar Install` |
| EV merchant name | `Tesla Motor Sales` |
| Tax year (current) | `2025` |
| Person ID | `person-revvel` |
| Business ID | `biz-vine` |

---

*Last updated: 2026-03-27*
*See also: DATA_DICTIONARY.md for field definitions*

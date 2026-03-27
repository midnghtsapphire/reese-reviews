# DATA DICTIONARY — Reese Reviews
**Plain-English field reference for every data model in the app.**
Every field is explained as if the reader has never seen code before.
Includes: what it is, what values are allowed, what it means in practice, and test examples.

---

## HOW TO USE THIS DOCUMENT
- Find the section for the thing you want to understand (e.g. "VineItem", "TaxPerson")
- Each table row = one field on that record
- "Allowed values" tells you exactly what you can put in that field
- "Test example" shows you a real value you can type when testing

---

## TABLE OF CONTENTS
1. [VineItem — A product received through Amazon Vine](#vineitem)
2. [VineReviewDraft — The review being written for a Vine item](#vinereviewdraft)
3. [AmazonOrder — A product purchased from Amazon](#amazonorder)
4. [InventoryItem — Any product tracked in inventory](#inventoryitem)
5. [TaxPerson — A person on the tax return](#taxperson)
6. [BusinessEntity — A business attached to a person](#businessentity)
7. [IncomeSource — A paycheck, 1099, or income source](#incomesource)
8. [WriteOff — A business expense or deduction](#writeoff)
9. [QuarterlyEstimate — A quarterly tax payment](#quarterlyestimate)
10. [TaxDocument — An uploaded tax form or receipt](#taxdocument)
11. [BankTransaction — A bank transaction from Plaid](#banktransaction)
12. [ClassifiedTransaction — A bank transaction with tax analysis](#classifiedtransaction)
13. [PlaidAccount — A linked bank account](#plaidaccount)
14. [CapitalContribution — A Vine item donated to NoCo Nook](#capitalcontribution)
15. [CapitalContribution — A Vine item donated to NoCo Nook](#capitalcontribution)
16. [TaxAlert — A smart tax alert from the alert engine](#taxalert)
17. [DeadlineReminder — A user-set reminder for a tax deadline](#deadlinereminder)
18. [AppRecord — An app in the portfolio tracker](#apprecord)
19. [SocialAccount — A social media account for an app](#socialaccount)
20. [Expense — A business expense in the expense tracker](#expense)
21. [FinancialSummary — A period financial summary](#financialsummary)
22. [KEY ENUMERATIONS (type reference)](#enumerations)

---

## 1. VineItem {#vineitem}
**What it is:** A product that Audrey received through Amazon Vine for free in exchange for a review.
**Where it lives:** Supabase (planned) + localStorage `rr-vine-items`

| Field | Type | What it means | Allowed values | Test example |
|---|---|---|---|---|
| `id` | string | Unique ID for this item. Auto-generated. | Any string starting with `vine-` | `vine-abc123` |
| `asin` | string | Amazon's product ID number. Starts with B followed by 9 characters. | 10 characters, e.g. `B0ABCDEFGH` | `B08N5WRWNW` |
| `product_name` | string | The full name of the product as shown on Amazon. | Any text | `Keurig K-Mini Coffee Maker, Black` |
| `category` | string | The type of product (Amazon category). | Any text | `Kitchen & Dining` |
| `image_url` | string | URL to the product photo on Amazon. | Any URL | `https://images-na.ssl-images-amazon.com/…` |
| `received_date` | string | The date you physically got the item in the mail. Format: YYYY-MM-DD. | Date string | `2025-03-15` |
| `review_deadline` | string | The date by which you must submit your review. Amazon typically gives 30 days. | Date string | `2025-04-14` |
| `estimated_value` | number | The ETV — Estimated Tax Value. This is the dollar amount Amazon reports on your 1099-NEC as income. It's not what the item costs in stores — Amazon sets this. | Any number ≥ 0 | `49.99` |
| `review_status` | string | Where you are in the review process. | `pending` (not started), `in_progress` (draft exists), `submitted` (submitted to Amazon), `published` (live on Amazon), `overdue` (past deadline) | `in_progress` |
| `review_id` | string | The ID of the review draft linked to this item. Optional. | Any string or empty | `review-xyz789` |
| `vine_enrollment_date` | string | The date you were enrolled in the Vine program (not per-item — same for all). | Date string | `2024-01-01` |
| `notes` | string | Any notes you want to add. Free text. | Any text | `Tested for 2 weeks. Loud but functional.` |
| `template_used` | boolean | Whether the review was auto-generated using the AI template system. | `true` or `false` | `true` |

**What "ETV" means in plain English:** When Amazon sends you a free $50 coffee maker, they tell the IRS you received $50 of income. You owe taxes on that $50 even though you didn't get any cash. The ETV is that dollar amount.

---

## 2. VineReviewDraft {#vinereviewdraft}
**What it is:** The draft review being written for one Vine item. Tracks progress from receiving the item to submitting the review.
**Where it lives:** localStorage `rr-vine-review-drafts`

| Field | Type | What it means | Allowed values | Test example |
|---|---|---|---|---|
| `vineItemId` | string | The ID of the VineItem this draft belongs to. | Same as VineItem.id | `vine-abc123` |
| `title` | string | The headline of the review. Shown as the review title on Amazon. | Any text, ideally 50–150 chars | `Great coffee for small spaces — surprisingly quiet` |
| `body` | string | The full review text. | Any text, ideally 200–1000 words | `I tested this for two weeks in my small apartment…` |
| `rating` | number | The star rating 1–5. 0 means not set yet. | 0, 1, 2, 3, 4, 5 | `4` |
| `photoCount` | number | How many photos you're attaching to the review. Amazon allows up to 8. | 0–8 | `3` |
| `isReceived` | boolean | Whether the physical item has arrived at your door. You must receive it before you can generate/submit a review. | `true` or `false` | `true` |
| `generatedAt` | string or null | Timestamp of when the AI generated the review text. Null if never generated. | ISO timestamp or null | `2025-03-16T14:22:00.000Z` |
| `editedAt` | string or null | Timestamp of the last time you manually edited the review. | ISO timestamp or null | `2025-03-17T09:15:00.000Z` |
| `submittedAt` | string or null | Timestamp of when you submitted the review to Amazon Vine. | ISO timestamp or null | `2025-03-18T11:00:00.000Z` |
| `submittedDate` | string or null | Calendar date (not time) of submission. Used for the daily counter. | YYYY-MM-DD or null | `2025-03-18` |

---

## 3. AmazonOrder {#amazonorder}
**What it is:** A product you bought on Amazon (not a Vine item — something you paid for).
**Where it lives:** localStorage `reese-amazon-orders`

| Field | Type | What it means | Allowed values | Test example |
|---|---|---|---|---|
| `id` | string | Unique ID. Demo items start with `amz-`; imported items start with `import-`. | `amz-XXX` or `import-XXX` | `amz-001` |
| `amazon_order_id` | string | The order number Amazon assigned, shown in your order history. | Format: 3 digits - 7 digits - 7 digits | `113-2345678-9012345` |
| `asin` | string | Amazon product ID. | 10 characters | `B09W2SXKM2` |
| `product_name` | string | Full product name. | Any text | `Blue Yeti USB Microphone` |
| `category` | string | Product category. | Any text | `Electronics` |
| `image_url` | string | URL of product image. | URL | `https://…` |
| `purchase_date` | string | Date you bought it. | YYYY-MM-DD | `2025-02-10` |
| `price` | number | What you paid (in dollars). | Any number ≥ 0 | `129.99` |
| `quantity` | number | How many you ordered. | Integer ≥ 1 | `1` |
| `status` | string | Shipping/delivery status. | `pending`, `shipped`, `delivered`, `returned` | `delivered` |
| `review_status` | string | Whether you've reviewed this product. | `not_reviewed`, `draft`, `published` | `draft` |
| `review_id` | string | ID of the review if one exists. Optional. | Any string | `review-abc` |
| `affiliate_link` | string | Your Amazon affiliate link for this product (earns a commission). Optional. | URL with your associate tag | `https://amzn.to/3XXXXX` |
| `source` | string | Where this order came from. | `purchased` (you bought it), `vine` (free Vine item) | `purchased` |

---

## 4. InventoryItem {#inventoryitem}
**What it is:** Any physical product being tracked — whether purchased, received via Vine, or gifted. Tracks its entire life from acquisition to sale/donation/rental.
**Where it lives:** productLifecycleStore, localStorage `rr-product-lifecycle`

| Field | Type | What it means | Allowed values | Test example |
|---|---|---|---|---|
| `id` | string | Unique ID. | Any string | `inv-001` |
| `product_name` | string | Name of the product. | Any text | `Ring Video Doorbell 4` |
| `asin` | string | Amazon product ID. Optional (some items don't have ASINs). | 10 characters or empty | `B08GS2T6NB` |
| `category` | string | Product type. | Any text | `Smart Home` |
| `image_url` | string | Product photo URL. | URL | `https://…` |
| `source` | string | How you got it. | `purchased` (paid for it), `vine` (Amazon Vine freebie), `gifted` (gift), `sample` (brand sample) | `vine` |
| `acquisition_date` | string | Date you received or bought it. | YYYY-MM-DD | `2025-01-20` |
| `acquisition_cost` | number | What you paid (0 for Vine items). | Any number ≥ 0 | `0` |
| `estimated_value` | number | Current estimated worth. For Vine items, this is the ETV. | Any number ≥ 0 | `89.99` |
| `status` | string | What stage the product is in. See below. | See status values table | `reviewed` |
| `review_id` | string | ID of the linked review, if any. | Any string | `review-abc` |
| `reviewed_date` | string | Date the review was submitted. Optional. | YYYY-MM-DD | `2025-02-05` |
| `sale_price` | number | What you sold it for, if sold. | Any number ≥ 0 | `65.00` |
| `sale_date` | string | Date sold. | YYYY-MM-DD | `2025-03-01` |
| `sale_platform` | string | Where you sold it (eBay, Facebook Marketplace, etc.). | Any text | `eBay` |
| `rental_company` | string | If rented out, who rented it. | Any text | `NoCo Nook & Rentals` |
| `rental_start_date` | string | When rental started. | YYYY-MM-DD | `2025-02-01` |
| `rental_end_date` | string | When rental ended. | YYYY-MM-DD | `2025-04-01` |
| `rental_income` | number | Total rental income earned. | Any number ≥ 0 | `30.00` |
| `donation_date` | string | Date donated. | YYYY-MM-DD | `2025-04-15` |
| `donation_value` | number | Fair market value at time of donation (for tax purposes). | Any number ≥ 0 | `89.99` |
| `donation_recipient` | string | Who received the donation. | Any text | `NoCo Nook & Rentals` |
| `tax_deductible` | boolean | Whether this is deductible. | `true` or `false` | `false` |
| `tax_category` | string | Write-off category if deductible. | See WriteOffCategory enum | `other` |
| `notes` | string | Free text notes. | Any text | `Donated after 6-month hold for capital contribution` |

**Inventory Status Values:**

| Status | What it means |
|---|---|
| `in_use` | You're currently using/testing the product |
| `reviewed` | You've submitted the review to Amazon |
| `ready_to_resell` | Review done, could be sold/donated/rented |
| `listed_for_sale` | Currently listed for sale somewhere |
| `sold` | Sold to a buyer |
| `donated` | Donated to a charity or entity (e.g. capital contribution to NoCo Nook) |
| `rented_out` | Currently being rented out |
| `returned_from_rental` | Rental period ended, item returned |

---

## 5. TaxPerson {#taxperson}
**What it is:** A person whose taxes are tracked in the system. You can have multiple (e.g. Audrey, Reese, Caresse).
**Where it lives:** taxStore, localStorage `rr-tax-persons`

| Field | Type | What it means | Allowed values | Test example |
|---|---|---|---|---|
| `id` | string | Unique ID for this person. | Any string starting with `person-` | `person-revvel` |
| `name` | string | Display name. Can be nickname. | Any text | `Revvel / Mom` |
| `slug` | string | A short lowercase label used in code. No spaces — use hyphens. | Lowercase letters and hyphens only | `revvel` |
| `role` | string | Their role on the tax return. | `primary` (main filer), `spouse` (married filing jointly), `dependent` (claimed as dependent) | `primary` |
| `ssn_last4` | string | Last 4 digits of their Social Security Number. Optional — for your records only, never sent anywhere. | 4 digits | `4321` |
| `filing_status` | string | Their IRS filing status. | See Filing Status table below | `single` |
| `businesses` | array | List of business entities this person owns. Each item is a BusinessEntity (see below). | Array of BusinessEntity objects | `[]` |
| `notes` | string | Notes about this person's tax situation. | Any text | `Legally deaf, AUDHD. Vine income via Amazon.` |
| `created_at` | string | When this profile was created. Auto-set. | ISO timestamp | `2025-01-01T00:00:00.000Z` |
| `updated_at` | string | When this profile was last changed. Auto-set. | ISO timestamp | `2025-03-15T12:00:00.000Z` |

**Filing Status Values:**

| Status | What it means |
|---|---|
| `single` | Not married; file alone |
| `married_filing_jointly` | Married, combining income on one return (usually best) |
| `married_filing_separately` | Married but filing two separate returns |
| `head_of_household` | Single but supporting a dependent child/parent |
| `qualifying_widow` | Spouse died within 2 years, still have a dependent child |

---

## 6. BusinessEntity {#businessentity}
**What it is:** A business that belongs to a TaxPerson. One person can have multiple businesses.
**Where it lives:** Nested inside TaxPerson.businesses array

| Field | Type | What it means | Allowed values | Test example |
|---|---|---|---|---|
| `id` | string | Unique ID for this business. Auto-generated. | Any string starting with `biz-` | `biz-reese-ventures` |
| `name` | string | The legal or DBA name of the business. | Any text | `Reese Ventures LLC` |
| `ein` | string | Employer Identification Number — like a Social Security Number for a business. Optional. If not set, uses the owner's SSN. | 9 digits formatted as XX-XXXXXXX | `82-1234567` |
| `type` | string | The legal structure of the business. | See Business Type table below | `llc` |
| `schedule` | string | Which IRS tax schedule this business files on. Determines what tax form is used. | `schedule_c` (self-employment profit/loss), `schedule_e` (rental/partnership income), `schedule_f` (farm income), `none` (handled by separate return like S-Corp 1120-S) | `schedule_c` |
| `home_office_eligible` | boolean | Whether you use part of your home exclusively for this business. Enables the home office deduction (Form 8829). | `true` or `false` | `true` |
| `notes` | string | Notes about this business. | Any text | `DBA: ReeseReviews.com. Amazon affiliate + Vine review business.` |

**Business Type Values:**

| Type | What it means | Typical Schedule |
|---|---|---|
| `sole_prop` | You as an individual — no legal entity formed | Schedule C |
| `llc` | Limited Liability Company (protects personal assets) | Schedule C, E, or none |
| `s_corp` | S-Corporation (requires payroll for owner) | None (Form 1120-S) |
| `partnership` | Two or more owners together | Schedule E (Form 1065) |
| `rental` | Real estate rental property | Schedule E |
| `gig` | Platform gig work (DoorDash, Fiverr, Uber) | Schedule C |

---

## 7. IncomeSource {#incomesource}
**What it is:** One income stream for one person in one tax year. Examples: a W-2 from a job, a 1099-NEC from Amazon Vine, Social Security benefits.
**Where it lives:** taxStore, localStorage `rr-income-sources`

| Field | Type | What it means | Allowed values | Test example |
|---|---|---|---|---|
| `id` | string | Unique ID. Auto-generated. | Any string starting with `inc-` | `inc-revvel-vine-2025` |
| `person_id` | string | Which TaxPerson this income belongs to. | Must match a TaxPerson.id | `person-revvel` |
| `tax_year` | number | The year this income was earned. | 4-digit year | `2025` |
| `label` | string | A short human-readable name. | Any text | `Amazon Vine 1099-NEC` |
| `payer_name` | string | Who paid you. | Any text | `Amazon.com Services LLC` |
| `payer_ein` | string | The payer's EIN (found on the form they send you). Optional. | XX-XXXXXXX format | `91-1646860` |
| `income_type` | string | The type of income — determines which tax forms are needed. | See Income Type table below | `1099_nec` |
| `gross_amount` | number | The total amount earned before any deductions or taxes. | Any number ≥ 0 | `4521.00` |
| `federal_withheld` | number | Federal income tax already withheld (from box 2 on W-2, etc.). | Any number ≥ 0 | `0` |
| `state_withheld` | number | Colorado state income tax withheld. | Any number ≥ 0 | `0` |
| `ss_wages` | number | Social Security wages (W-2 box 3). Optional. | Any number ≥ 0 | `0` |
| `medicare_wages` | number | Medicare wages (W-2 box 5). Optional. | Any number ≥ 0 | `0` |
| `document_id` | string | ID of the uploaded tax document (W-2, 1099) if scanned. Optional. | Any string | `doc-001` |
| `business_entity_id` | string | Which business this income belongs to (for Schedule C/E). Optional. | Must match a BusinessEntity.id | `biz-vine` |
| `reconciled` | boolean | Whether you've confirmed this matches the paper form. | `true` or `false` | `false` |
| `notes` | string | Notes about this income source. | Any text | `Vine ETV — taxable as SE income` |
| `created_at` | string | When this record was created. Auto-set. | ISO timestamp | `2025-01-15T00:00:00.000Z` |
| `updated_at` | string | When last changed. Auto-set. | ISO timestamp | `2025-03-01T10:00:00.000Z` |

**Income Type Values:**

| Type | What it means | Forms triggered |
|---|---|---|
| `w2` | Regular job income (employer withholds taxes) | Form 1040 |
| `1099_nec` | Self-employment / freelance / Vine income | Schedule C + Schedule SE |
| `1099_misc` | Other miscellaneous income | Schedule C or 1040 |
| `1099_k` | Payment processor income (PayPal, Stripe, Venmo) | Schedule C |
| `1099_div` | Dividends from investments | Schedule D |
| `1099_int` | Interest from savings accounts | Form 1040 |
| `ssa_1099` | Social Security benefits (SSA-1099) | Form 1040 |
| `rental` | Rental income | Schedule E |
| `self_employ` | Self-employment income (general) | Schedule C + SE |
| `other` | Any other income | Form 1040 |

---

## 8. WriteOff {#writeoff}
**What it is:** A business expense you can deduct from your income to reduce your taxes. Each deduction needs to be "ordinary and necessary" for your business.
**Where it lives:** taxStore, localStorage `rr-write-offs`

| Field | Type | What it means | Allowed values | Test example |
|---|---|---|---|---|
| `id` | string | Unique ID. Auto-generated. | Any string starting with `wo-` | `wo-do-hosting-jan` |
| `person_id` | string | Which TaxPerson this expense belongs to. | Must match TaxPerson.id | `person-caresse` |
| `business_entity_id` | string | Which business this expense belongs to. Optional. | Must match BusinessEntity.id | `biz-reese-ventures` |
| `tax_year` | number | The year of the expense. | 4-digit year | `2025` |
| `date` | string | Date the expense was incurred. | YYYY-MM-DD | `2025-01-15` |
| `description` | string | What was purchased. | Any text | `DigitalOcean hosting — January` |
| `vendor` | string | Who you paid. | Any text | `DigitalOcean` |
| `category` | string | The IRS write-off category. Determines how it appears on your tax form. | See Write-Off Category table | `equipment` |
| `amount` | number | Total amount spent (in dollars). | Any number > 0 | `24.00` |
| `deductible_pct` | number | What percentage of this expense is business (vs personal). Home internet = 50% business, for example. | 0–100 | `100` |
| `deductible_amount` | number | The actual deductible dollar amount (amount × deductible_pct ÷ 100). Auto-calculated. | Auto-computed | `24.00` |
| `receipt_document_id` | string | ID of uploaded receipt. Optional. | Any string | `doc-receipt-123` |
| `mileage_miles` | number | If this is a vehicle expense, number of business miles. Optional. | Any number ≥ 0 | `120` |
| `mileage_rate` | number | IRS mileage rate (e.g. $0.67/mile for 2024). Optional. | Current IRS rate | `0.67` |
| `notes` | string | Notes. | Any text | `Monthly server costs for reesereviews.com` |
| `created_at` | string | Auto-set timestamp. | ISO timestamp | `2025-01-15T20:00:00.000Z` |

**Write-Off Category Values:**

| Category | What it includes | Deductible % |
|---|---|---|
| `home_office` | Dedicated workspace at home (sq ft ratio) | 100% |
| `supplies` | Paper, ink, pens, packaging materials | 100% |
| `internet` | Business portion of your internet bill | 50% |
| `phone` | Business portion of your phone bill | 50% |
| `shipping` | Postage, FedEx, UPS, packaging | 100% |
| `product_costs` | Cost of goods you resold | 100% |
| `vehicle_mileage` | Business driving at IRS rate ($0.67/mi for 2024) | 100% |
| `advertising` | Ads, social media tools, promotions | 100% |
| `professional_services` | Accountant, lawyer, bookkeeper | 100% |
| `equipment` | Computers, cameras, microphones, software | 100% |
| `education` | Courses, books, conferences | 100% |
| `meals_entertainment` | Business meals (only 50% deductible by IRS rule) | 50% |
| `other` | Anything else that's ordinary and necessary | 100% |
| `vehicle_actual` | Actual vehicle costs (gas, insurance, repairs) — alternative to mileage | varies |
| `vehicle_ev_purchase` | Electric vehicle purchase for business | 100% |
| `vehicle_trade_in` | Trade-in value of old vehicle | 100% |
| `health_insurance` | Self-employed health insurance premiums | 100% |
| `platform_fees` | Amazon seller fees, Etsy fees, payment processing | 100% |
| `licensing_certs` | Business licenses, certifications | 100% |
| `uniform_ppe` | Work uniforms not usable as regular clothing | 100% |
| `charitable_donations` | Donations (only itemized deduction, not SE deduction) | 100% |
| `retirement_contributions` | Solo 401(k), SEP-IRA contributions | 100% |
| `solar_energy` | Solar panel installation | 100% |
| `heat_pump` | Heat pump installation | 100% |

---

## 9. QuarterlyEstimate {#quarterlyestimate}
**What it is:** A record of each quarterly estimated tax payment you're supposed to make to the IRS. Because self-employed people don't have an employer withholding taxes, they pay 4 times a year.
**Where it lives:** taxStore, localStorage `rr-quarterly-estimates`

| Field | Type | What it means | Allowed values | Test example |
|---|---|---|---|---|
| `id` | string | Unique ID. | Any string | `qe-2025-q1` |
| `person_id` | string | Which person this estimate is for. | Must match TaxPerson.id | `person-caresse` |
| `tax_year` | number | Which tax year. | 4-digit year | `2025` |
| `quarter` | number | Which quarter (1 = Jan-Mar, 2 = Apr-Jun, 3 = Jul-Sep, 4 = Oct-Dec). | 1, 2, 3, or 4 | `2` |
| `due_date` | string | When the IRS requires this payment. | YYYY-MM-DD | `2025-06-16` |
| `estimated_income` | number | How much you expect to earn this quarter. | Any number ≥ 0 | `2500.00` |
| `estimated_tax_owed` | number | How much the app calculates you owe. Includes SE tax + income tax. | Any number ≥ 0 | `875.00` |
| `amount_paid` | number | How much you actually paid. | Any number ≥ 0 | `875.00` |
| `paid_date` | string | Date you made the payment. Optional. | YYYY-MM-DD | `2025-06-10` |
| `paid` | boolean | Whether you've paid this quarter. | `true` or `false` | `true` |
| `notes` | string | Notes. | Any text | `Paid via IRS Direct Pay` |

**Quarterly Due Dates (2025 tax year):**

| Quarter | Income period | Due date |
|---|---|---|
| Q1 | Jan 1 – Mar 31 | April 15, 2025 |
| Q2 | Apr 1 – May 31 | June 16, 2025 |
| Q3 | Jun 1 – Aug 31 | September 15, 2025 |
| Q4 | Sep 1 – Dec 31 | January 15, 2026 |

---

## 10. TaxDocument {#taxdocument}
**What it is:** An uploaded tax form or receipt (PDF, image, CSV). For example: your W-2, 1099-NEC, bank statements.
**Where it lives:** taxStore, localStorage `rr-tax-documents`

| Field | Type | What it means | Allowed values | Test example |
|---|---|---|---|---|
| `id` | string | Unique ID. | Any string starting with `doc-` | `doc-vine-1099-2025` |
| `person_id` | string | Which person this document belongs to. | Must match TaxPerson.id | `person-revvel` |
| `tax_year` | number | Which tax year this document is for. | 4-digit year | `2025` |
| `document_type` | string | What kind of tax document this is. | See Document Type table below | `1099_nec` |
| `file_name` | string | The original file name. | Any filename | `vine-1099-nec-2025.pdf` |
| `file_data_url` | string | The actual file contents as a data URL (for preview). | data: URL | `data:application/pdf;base64,…` |
| `file_size_bytes` | number | File size in bytes. | Any integer ≥ 0 | `102400` |
| `mime_type` | string | The file type. | `application/pdf`, `image/jpeg`, `image/png`, `text/csv` | `application/pdf` |
| `extracted_fields` | object | Key-value pairs of fields extracted from the document (by OCR or manually). | Any object with string values | `{"box1_nonemployee_comp": "4521.00", "payer_name": "Amazon.com"}` |
| `confirmed` | boolean | Whether you've confirmed the extracted data is correct. | `true` or `false` | `true` |
| `linked_income_source_id` | string | If this document matches an income source, the ID of that source. Optional. | Must match IncomeSource.id | `inc-revvel-vine-2025` |
| `uploaded_at` | string | When you uploaded this document. Auto-set. | ISO timestamp | `2025-02-01T10:00:00.000Z` |
| `notes` | string | Notes. | Any text | `Amazon Vine 1099-NEC for 2025` |

---

## 11. BankTransaction {#banktransaction}
**What it is:** A single purchase or deposit imported from your bank account via Plaid.
**Where it lives:** plaidClient.ts, localStorage `rr-plaid-txns`

| Field | Type | What it means | Allowed values | Test example |
|---|---|---|---|---|
| `id` | string | Internal unique ID. | Any string | `txn-001` |
| `plaid_transaction_id` | string | The ID Plaid (your bank connector) assigned to this transaction. | Any string | `abc123xyz` |
| `account_id` | string | Which bank account this transaction came from. | Must match PlaidAccount.id | `acct-checking-001` |
| `date` | string | Date of the transaction. | YYYY-MM-DD | `2025-03-10` |
| `amount` | number | **POSITIVE = money coming IN (income). NEGATIVE = money going OUT (expense).** | Any number | `-49.99` (you spent $49.99) |
| `merchant_name` | string | Name of the store or vendor. | Any text | `COSTCO WHOLESALE #1234` |
| `description` | string | Bank's description of the transaction. | Any text | `POS PURCHASE COSTCO WHOLESALE` |
| `category` | string | High-level category auto-detected. | See TransactionCategory table | `expense_supplies` |
| `tax_deductible` | boolean | Whether this was flagged as tax deductible. | `true` or `false` | `false` |
| `tax_write_off_category` | string | Write-off category if deductible. | See WriteOffCategory enum | `supplies` |
| `notes` | string | Your notes. | Any text | `` |
| `is_manual` | boolean | Whether you typed this in manually (vs Plaid import). | `true` or `false` | `false` |

---

## 12. ClassifiedTransaction {#classifiedtransaction}
**What it is:** A BankTransaction that has been analyzed by the smart classification engine. Has everything BankTransaction has plus tax analysis fields.
**Where it lives:** Same as BankTransaction — localStorage `rr-plaid-txns`

| Field | Type | What it means | Allowed values | Test example |
|---|---|---|---|---|
| *(All BankTransaction fields)* | | | | |
| `matched_rules` | array | Which automatic detection rules matched this transaction. Each rule explains why it was flagged. | Array of AutoFlagRule objects | `[{label: "Office Supplies", is_write_off: true, …}]` |
| `needs_review` | boolean | Whether a human should look at this transaction. True if the app isn't sure about the classification. | `true` or `false` | `true` |
| `user_classification` | string | Your final decision on this transaction. | `business` (deductible business expense), `personal` (not deductible), `vine_income` (Vine ETV income), `pending` (not decided yet) | `business` |
| `synced_to_expenses` | boolean | Whether this has been pushed to the Expense Tracker. | `true` or `false` | `false` |
| `receipt_url` | string | URL of attached receipt photo. Optional. | Any URL | `https://…` |
| `is_spontaneous` | boolean | Whether this looks like impulse spending (food delivery, streaming). Used to flag non-essential expenses. | `true` or `false` | `false` |
| `related_vine_asin` | string | ASIN of a Vine item this might relate to. Optional. | ASIN string | `B08N5WRWNW` |
| `credit_eligible` | boolean | **NEW** — Whether this purchase might qualify for a federal tax credit (solar, heat pump, EV, etc.). | `true` or `false` | `true` |

---

## 13. PlaidAccount {#plaidaccount}
**What it is:** A bank or credit card account you've linked to the app via Plaid.
**Where it lives:** plaidClient.ts, localStorage `rr-plaid-accounts`

| Field | Type | What it means | Allowed values | Test example |
|---|---|---|---|---|
| `id` | string | Internal ID. | Any string | `acct-001` |
| `plaid_account_id` | string | The ID Plaid assigned to this account. | Any string | `xyz789abc` |
| `institution_name` | string | Name of the bank or credit union. | Any text | `Chase Bank` |
| `account_name` | string | The name of the specific account. | Any text | `Chase Total Checking` |
| `account_type` | string | Type of account. | `checking`, `savings`, `credit`, `investment` | `checking` |
| `mask` | string | Last 4 digits of account number. | 4 digits | `4567` |
| `balance_current` | number | Current balance in dollars. | Any number | `2450.00` |
| `balance_available` | number | Available balance (after pending transactions). | Any number | `2300.00` |
| `currency` | string | Currency code. | Usually `USD` | `USD` |
| `status` | string | Connection status. | `connected`, `disconnected`, `pending`, `error` | `connected` |
| `last_synced` | string | When transactions were last pulled. | ISO timestamp | `2025-03-27T09:00:00.000Z` |

---

## 14. CapitalContribution {#capitalcontribution}
**What it is:** A record of a Vine product being donated/contributed to NoCo Nook & Rentals as a capital contribution. This is a specific tax strategy: after 6 months, the product can be transferred to the LLC at its ETV value.
**Where it lives:** capitalContributionStore.ts, localStorage `rr-capital-contributions`

| Field | Type | What it means | Allowed values | Test example |
|---|---|---|---|---|
| `id` | string | Unique ID. | Any string | `cc-001` |
| `vineItemId` | string | The VineItem this contribution came from. | Must match VineItem.id | `vine-abc123` |
| `asin` | string | Amazon product ID. | 10 characters | `B08GS2T6NB` |
| `productName` | string | Product name. | Any text | `Ring Video Doorbell 4` |
| `etv` | number | The ETV (Estimated Tax Value) — the original Vine income amount. This is the "cost basis" of the contribution. | Any number ≥ 0 | `89.99` |
| `dateReceived` | string | When the Vine item was received from Amazon. | YYYY-MM-DD | `2024-09-01` |
| `dateDonated` | string | When it was contributed to NoCo Nook (must be 6+ months after received). | YYYY-MM-DD | `2025-03-05` |
| `recipientEntityId` | string | Always NoCo Nook in this context. | `biz-noconook` | `biz-noconook` |
| `recipientEntityName` | string | Always NoCo Nook. | `NoCo Nook & Rentals` | `NoCo Nook & Rentals` |
| `storageFeesAccrued` | number | Any storage costs between receipt and donation (deductible). | Any number ≥ 0 | `0` |
| `salePrice` | number or null | If NoCo Nook later sold the item, what it sold for. Null if not sold yet. | Any number ≥ 0 or null | `65.00` |
| `saleDateStr` | string or null | Date NoCo Nook sold it. Null if not sold. | YYYY-MM-DD or null | `2025-04-01` |
| `notes` | string | Notes. | Any text | `6-month hold completed. Contributed at ETV.` |
| `createdAt` | string | When this record was created. | ISO timestamp | `2025-03-05T10:00:00.000Z` |
| `updatedAt` | string | When last updated. | ISO timestamp | `2025-04-01T15:00:00.000Z` |

---

## 15. TaxAlert {#taxalert}
**What it is:** A smart notification fired by the Tax Alert Engine when it detects something actionable — like a purchase that qualifies for a tax credit, or a deductible expense that hasn't been classified.
**Where it lives:** taxAlertEngine.ts, localStorage `rr-tax-alerts`

| Field | Type | What it means | Allowed values | Test example |
|---|---|---|---|---|
| `id` | string | Unique ID. Auto-generated. | Any string starting with `alert-` | `alert-1711234567-abc12` |
| `type` | string | What kind of alert this is. | `write_off` (deductible expense found), `credit_eligible` (tax credit opportunity), `paperwork` (action needed), `deadline` (due date coming), `info` (general) | `credit_eligible` |
| `title` | string | Short headline. | Any text | `💡 Possible Tax Credit: Heat Pump / HVAC Equipment` |
| `summary` | string | One-sentence description. | Any text | `$3,200 at Carrier HVAC may qualify for Form 5695 Part II.` |
| `detail` | string | Full explanation with action steps. | Any text | `30% credit up to $2,000 via Energy Efficient Home Improvement Credit (§25C). Keep your contractor invoice and product model number.` |
| `amount` | number | Estimated dollar benefit (credit or deduction amount). Optional. | Any number ≥ 0 | `960` |
| `form` | string | IRS form to file for this alert. Optional. | Any IRS form reference | `Form 5695 Part II` |
| `transactionId` | string | The transaction that triggered this alert. Optional. | Must match a transaction ID | `txn-034` |
| `actionLabel` | string | Button text for the call to action. Optional. | Any text | `View Credits & Deadlines` |
| `actionTab` | string | Which app tab to navigate to. Optional. | Any ERPTab value | `deadlines` |
| `sourceUrl` | string | Link to IRS or program page for verification. Optional. | Any URL | `https://www.irs.gov/credits-deductions/energy-efficient-home-improvement-credit` |
| `status` | string | Current state of this alert. | `new` (hasn't been seen), `acknowledged` (user saw it), `dismissed` (user said not relevant), `done` (user acted on it) | `new` |
| `createdAt` | string | When the alert was generated. Auto-set. | ISO timestamp | `2025-03-15T14:00:00.000Z` |
| `txnDate` | string | Date of the triggering transaction. Optional. | YYYY-MM-DD | `2025-03-10` |

---

## 16. DeadlineReminder {#deadlinereminder}
**What it is:** A reminder you set for a specific tax deadline. You can snooze it or dismiss it permanently.
**Where it lives:** deadlineReminderStore.ts, localStorage `rr-deadline-reminders`

| Field | Type | What it means | Allowed values | Test example |
|---|---|---|---|---|
| `deadlineId` | string | Which deadline this reminder is for. Matches TaxDeadline.id from TaxDeadlinesCredits. | Any deadline ID string | `q2-estimated-2025` |
| `setAt` | string | When you set this reminder. Auto-set. | ISO timestamp | `2025-03-01T10:00:00.000Z` |
| `snoozedUntil` | string or null | If snoozed, don't show before this date. Null = not snoozed. | YYYY-MM-DD or null | `2025-06-01` |
| `dismissed` | boolean | If true, never show this reminder again. | `true` or `false` | `false` |
| `note` | string | Your personal note about this reminder. | Any text | `Pay via IRS Direct Pay before June 16` |

---

## 17. AppRecord {#apprecord}
**What it is:** One app or website in the app portfolio tracker. Tracks development status, revenue, and social presence.
**Where it lives:** appPortfolioStore.ts, localStorage `rr-app-portfolio`

| Field | Type | What it means | Allowed values | Test example |
|---|---|---|---|---|
| `id` | string | Unique ID. | Any string | `app-reese-reviews` |
| `name` | string | App name. | Any text | `Reese Reviews` |
| `entity` | string | Which business entity owns this app. | Any text | `Reese Ventures LLC` |
| `status` | string | Development stage. | `idea`, `planning`, `building`, `beta`, `live`, `paused`, `sunset` | `building` |
| `description` | string | What this app does. | Any text | `Amazon Vine business management platform` |
| `techStack` | string | Technologies used. | Any text | `React, TypeScript, Supabase, Vite` |
| `liveUrl` | string | The public URL (if live). Optional. | Any URL | `https://reesereviews.com` |
| `repoUrl` | string | GitHub repository URL. Optional. | Any URL | `https://github.com/midnghtsapphire/reese-reviews` |
| `monthlyRevenue` | number | Current monthly revenue in dollars. | Any number ≥ 0 | `0` |
| `notes` | string | Notes. | Any text | `Primary revenue vehicle — deploy ASAP` |

---

## 18. Expense {#expense}
**What it is:** A business expense in the Expense Tracker (separate from the write-off tracker — this one is simpler and Keeper-style).
**Where it lives:** expenseStore.ts / businessExpenseStore.ts, localStorage `rr-expenses`

| Field | Type | What it means | Allowed values | Test example |
|---|---|---|---|---|
| `id` | string | Unique ID. | Any string | `exp-do-jan-2025` |
| `date` | string | Date of expense. | YYYY-MM-DD | `2025-01-01` |
| `merchant` | string | Who you paid. | Any text | `DigitalOcean` |
| `description` | string | What for. | Any text | `Server hosting — reesereviews.com` |
| `amount` | number | Amount paid (in dollars). | Any number > 0 | `24.00` |
| `category` | string | Write-off category. | WriteOffCategory enum | `equipment` |
| `is_write_off` | boolean | Whether this is deductible. | `true` or `false` | `true` |
| `write_off_percentage` | number | Percentage deductible. | 0–100 | `100` |
| `source` | string | Where this record came from. | `manual` (you typed it), `bank_import` (Plaid), `csv_import` | `manual` |
| `receipt_url` | string | Receipt photo URL. Optional. | Any URL | `https://…` |
| `notes` | string | Notes. | Any text | `Monthly hosting for production site` |
| `tax_year` | number | Which tax year. | 4-digit year | `2025` |

---

## ENUMERATIONS {#enumerations}

### IrsForm — Which federal forms may be required
| Value | Full name | When triggered |
|---|---|---|
| `1040` | Form 1040 | Everyone files this |
| `schedule_c` | Schedule C — Profit/Loss from Business | Any 1099-NEC, self-employment, Vine income |
| `schedule_se` | Schedule SE — Self-Employment Tax | When Schedule C net profit > $400 |
| `schedule_e` | Schedule E — Supplemental Income | Rental income, S-Corp/partnership K-1s |
| `schedule_d` | Schedule D — Capital Gains and Losses | If any investments or property sold |
| `form_8829` | Form 8829 — Home Office Deduction | When home_office_eligible = true |
| `form_8283` | Form 8283 — Noncash Charitable Contributions | If donated property worth > $500 |
| `form_4562` | Form 4562 — Depreciation and Amortization | For major equipment purchases depreciated over time |
| `form_8936` | Form 8936 — Clean Vehicle Credit | Electric vehicle purchase |
| `form_4797` | Form 4797 — Sales of Business Property | If business property sold at gain/loss |
| `form_2106` | Form 2106 — Employee Business Expenses | Disability-related work expenses |
| `form_8582` | Form 8582 — Passive Activity Loss Limitations | Rental losses limited by income |
| `form_1065` | Form 1065 — Partnership Return | Multi-member LLC, partnerships |
| `form_1120s` | Form 1120-S — S-Corporation Return | S-Corps |
| `form_5695` | Form 5695 — Residential Energy Credits | Solar installation (Part I) or heat pump (Part II) |
| `form_2441` | Form 2441 — Child and Dependent Care | Dependent care expenses |

---

*Last updated: 2026-03-27*
*See also: QA_TEST_PLAN.md for how to test these fields*

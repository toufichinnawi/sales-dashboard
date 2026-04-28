# Hinnawi Bros Bagels — Full Business Launch

## Website & Lead Capture
- [x] Upgrade project to full-stack with web-db-user
- [x] Create leads table in database (name, business, email, phone, message, status, created_at)
- [x] Create POST /api/leads endpoint to save form submissions
- [x] Create GET /api/leads endpoint to retrieve all leads
- [x] Create PATCH /api/leads/:id endpoint to update lead status
- [x] Update wholesale landing page form to POST to /api/leads via tRPC
- [x] Create Leads page in dashboard with table of submissions
- [x] Add Leads nav item to sidebar
- [x] Test form submission end-to-end (confirmed working)
- [x] Write vitest tests for leads API (9/9 passed)

## Instagram Launch
- [x] Check Instagram account connection (@hinnawibagelcafe, 5300 followers)
- [x] Post wholesale announcement to Instagram (https://www.instagram.com/p/DV8pVGjFWFk/)

## Final
- [x] Save checkpoint and deliver

## Landing Page Redesign
- [x] Update branding to match main hinnawibrosbagelandcafe.com site (warm, artistic, clean white)
- [x] Make landing page bilingual (French/English)
- [x] Match typography and color palette to main Squarespace site
- [x] Test the redesigned landing page
- [x] Save checkpoint and deliver with publishing instructions

## Rosie's Contact Info Update
- [x] Update landing page phone to 514-571-7672
- [x] Update landing page email to Rosalyn@wineandmore.com
- [x] Update landing page address to 733 Cathcart, Montreal
- [x] Update dashboard with real contact info
- [x] Save checkpoint
- [x] Add founder story section to landing page — Rosie's mission to share Montreal bagels with the world

## Orders System & Manual Lead Entry
- [x] Create customers table in database
- [x] Create orders table in database (with order items)
- [x] Push database migrations
- [x] Build tRPC routes for customers CRUD
- [x] Build tRPC routes for orders CRUD (create, list, update status, delete)
- [x] Add "Add Lead Manually" dialog to Leads page
- [x] Build Orders page with full CRUD UI
- [x] Add Orders nav item to sidebar
- [x] Add "Create Order" dialog with product selection, quantities, delivery date
- [x] Add order status tracking (Pending → Confirmed → Delivered → Paid)
- [x] Write vitest tests for orders API (23/23 passed)
- [x] Test end-to-end
- [x] Save checkpoint

## Customers Page
- [x] Build Customers page with full CRUD (add, edit, view, delete)
- [x] Add Customers nav item to sidebar
- [x] Convert lead to customer workflow
- [x] Customer detail view with order history

## Live Dashboard KPIs (Real Data)
- [x] Create tRPC dashboard.stats procedure pulling live data from orders/customers tables
- [x] Replace static demo KPIs on Overview with real totals (revenue, active accounts, avg order, etc.)
- [x] Build live revenue chart from actual order data (monthly aggregation)
- [x] Show real pipeline counts and recent activity from leads/orders

## Email Notifications
- [x] Send owner notification when new lead submits wholesale contact form
- [x] Send owner notification when order status changes to "Delivered"
- [x] Send owner notification when order status changes to "Paid"
- [x] Add notification triggers in existing tRPC mutations

## Recurring Orders
- [x] Create recurring_orders table in database schema
- [x] Push database migration for recurring orders
- [x] Build tRPC routes for recurring orders CRUD
- [x] Build "Create Standing Order" dialog (customer, products, day of week, frequency)
- [x] Build Recurring Orders management UI
- [x] Add recurring orders section to Orders page or sidebar nav

## Landing Page Promotion Readiness
- [x] Add SEO meta tags (title, description, keywords) to index.html
- [x] Add Open Graph tags for social media sharing (og:title, og:description, og:image)
- [x] Add Twitter Card meta tags
- [x] Polish landing page design for conversion (CTA clarity, trust signals, mobile)
- [x] Ensure landing page form works end-to-end with lead capture + notification
- [x] Add structured data (JSON-LD) for local business SEO

## Customer Portal & Mobile Quick Order
- [x] Add userId column to customers table (link customer to auth user account)
- [x] Add invite_tokens table for customer portal invitations (customer_invites table)
- [x] Push database migrations
- [x] Build customer invite flow (admin generates invite link → customer clicks → creates account → linked to customer record)
- [x] Build portal.myOrders tRPC route (customer sees their own order history)
- [x] Build portal.myStandingOrders tRPC route (customer sees/manages their recurring orders)
- [x] Build portal.quickOrder tRPC route (customer places new order from phone)
- [x] Build portal.profile tRPC route (customer views/updates their contact info)
- [x] Build Portal layout (mobile-first, clean, separate from admin dashboard)
- [x] Build Portal My Orders page (order history with status badges, delivery dates)
- [x] Build Portal Standing Orders page (view, pause/resume recurring orders)
- [x] Build Portal Quick Order page (mobile-friendly product picker, quantity, delivery date)
- [x] Build Portal Profile page (business info, contact details, delivery address)
- [x] Add "Invite to Portal" button on admin Customers page
- [x] Send notification to owner when customer places order via portal
- [x] Write vitest tests for portal routes (17 tests passed)
- [x] Verify mobile responsiveness on all portal pages

## English-Only Conversion
- [x] Convert WholesaleLanding.tsx from bilingual (French/English) to English-only
- [x] Update SEO meta tags in index.html to English-only (already English)
- [x] Update JSON-LD structured data to English-only (already English)
- [x] Fix WholesaleLanding.tsx JSX error (fixed via clean rewrite)

## Bug Fixes
- [x] Fix SQL alias error in getDashboardStats (oi.quantityDozens → orderItems.quantityDozens)

## QuickBooks CSV Import
- [x] Build CSV file upload endpoint (tRPC mutation accepting parsed CSV data)
- [x] Build CSV parser on frontend (parse QuickBooks Customer Contact List export)
- [x] Build "Import from QuickBooks" button and dialog on Customers page
- [x] Show preview table of mapped columns before confirming import
- [x] Handle duplicate detection (skip or update existing customers by email)
- [x] Show import results summary (imported, skipped, errors)

## QuickBooks Data Import (Actual Files)
- [x] Parse uploaded Customers.xls file
- [x] Map QuickBooks columns to dashboard customer fields
- [x] Import all customers into database (100 imported, 9 skipped)
- [x] Verify import count and data integrity

## QuickBooks Sales Import (Actual Files)
- [x] Parse uploaded SalesbyCustomerTypeDetail.xlsx file
- [x] Map QuickBooks sales columns to dashboard order fields
- [x] Match sales to existing customers in database (assigned to 'QuickBooks Import' placeholder — report lacks per-invoice customer names)
- [x] Import all orders into database (930 invoices, 2,723 line items, $206,169.29)
- [x] Verify import count and data integrity

## Wholesale Marketing Brochure
- [x] Create professional wholesale brochure/marketing material for new clients
- [x] Include product lineup, pricing, delivery info, and contact details
- [x] Design with Hinnawi Bros branding (warm, artisan style)

## Reassign Orders to Customers
- [x] Analyze QuickBooks sales data for customer name patterns (report lacks customer names — 'Sales by Customer Type Detail' only)
- [ ] Match imported orders to existing customers (needs 'Sales by Customer Detail' export from QuickBooks)
- [ ] Update order customerId for matched orders (blocked — awaiting correct export)
- [ ] Report match results (blocked — awaiting correct export)

## Brochure Pricing Update
- [x] Extract actual per-product pricing from QuickBooks sales data (66 products analyzed)
- [x] Update brochure with real wholesale prices per dozen/unit
- [x] Regenerate PDF with updated pricing

## Send Brochure to Leads
- [x] Add "Send Brochure" button on Leads page (header bulk + per-lead)
- [x] Build email/notification flow to send brochure link to leads
- [x] Include brochure content in the outreach message

## Bug Fixes
- [x] Fix SQL error in getDashboardStats monthly revenue query (orders.status → inArray with proper column reference)
- [x] Fix persistent SQL error in getDashboardStats DATE_FORMAT GROUP BY query (only_full_group_by mode - used alias in GROUP BY)

## QuickBooks Online API Integration
- [x] Research QuickBooks Online API OAuth2 flow and endpoints
- [x] Add QB_CLIENT_ID and QB_CLIENT_SECRET secrets
- [x] Create qb_connections table (store tokens, realmId, sync status)
- [x] Create qb_sync_log table (track sync history)
- [x] Build QuickBooks OAuth2 connect/disconnect flow (backend)
- [x] Build customer sync (QB → dashboard customers)
- [x] Build invoice/sales sync (QB → dashboard orders with customer matching)
- [x] Build payment sync (QB → update order status to paid)
- [x] Build QuickBooks Settings page (connect, disconnect, sync status, manual sync trigger)
- [ ] Build auto-sync schedule (every 5 min between 7AM-8PM, plus 9PM and 12AM)
- [x] Write vitest tests for QB integration (34/34 passed)
- [x] Update QB_CLIENT_ID and QB_CLIENT_SECRET to Production credentials
- [x] Ensure API_BASE uses production QuickBooks endpoint
- [x] Disconnect old connection and reconnect with production credentials
- [x] Update dashboard design to match Hinnawi Bros / Bagel Factory brand colors
- [x] Add date range filter to dashboard backend (dashboard.stats accepts startDate/endDate)
- [x] Add date range picker UI to dashboard Home page
- [x] Filter KPIs, revenue chart, recent orders, and top accounts by selected date range

## Bug Fixes
- [x] Fix date filter showing inflated revenue for "Today" — QB sync was setting createdAt to import time instead of TxnDate; fixed sync + backfilled 3,890 orders
- [x] Investigate and fix revenue discrepancy: 163 old orders had wrong createdAt; backfilled from deliveryDate. Dashboard now matches QB P&L within 0.18%
- [x] Investigate Jan/Feb revenue mismatch: QB P&L shows Jan $11,385.99, Feb $17,760.53 — fixed: invoices now use pre-tax amounts (TotalAmt - TotalTax)
- [x] Add Credit Memo sync from QuickBooks to close $93.66 revenue gap (76 credit memos synced, -$77,518.56 total)

## Revenue Discrepancy Investigation (QB P&L vs Dashboard)
- [x] Compare QB P&L "Total for Income" per month against dashboard revenue for Sep 2025 - Mar 2026
- [x] Identify missing transaction types: Sales Receipts (5 synced), Income Deposits ($500 synced), pre-tax fix for 3 invoices
- [x] Fix revenue calculation: invoices now store pre-tax amounts, income deposits synced, all transaction types covered
- [x] Verify all months match: Sep-Feb EXACT match, Mar 1-17 EXACT match ($4,752.57)

## UI Label Changes
- [x] Change "Delivery Date" to "Invoice Date" on the Orders page

## Orders Page Fixes
- [x] Fix timezone bug: Invoice dates shifted back 1 day due to UTC parsing of QB date strings (added parseQBDate helper)
- [x] Update sync to also set deliveryDate on existing order updates (all 4 update paths fixed)
- [x] Fix database dates: shifted 3,003 midnight-timestamp orders forward by 12 hours
- [x] Fix frontend date display: formatDate now uses UTC timezone to avoid browser shifts
- [x] Add date range filtering to Orders page (backend query + frontend date picker UI)

## Wholesale Brochure & Auto-Email
- [x] Create professional wholesale brochure PDF with photos for Hinnawi Bros Bagels
- [x] Wire auto-email to send brochure from rosalyn@bagelandcafe.com when new lead is added

## CRM Classification
- [x] Add suspect vs customer classification — distinguish leads/suspects from active customers
- [x] Add classification summary cards (All Accounts, Customers, Suspects, Total Revenue)
- [x] Add Type column with Customer/Suspect badges to Accounts table
- [x] Add Orders count, Revenue, and Last Order columns to Accounts table
- [x] Add clickable filter cards to filter by classification type
- [x] Rename sidebar nav from 'Customers' to 'Accounts'
- [x] Write vitest tests for customers.listWithStats (5/5 passed)

## Brochure Integration (User-Provided HTML)
- [x] Review uploaded brochure.html content
- [x] Convert brochure HTML to PDF (3-page v3 with real product images)
- [x] Upload brochure PDF to CDN (CloudFront)
- [x] Update brochure-email module to use the new v3 brochure PDF
- [x] Wire Outlook MCP for real email sending with PDF attachment
- [x] Add fallback to owner notification when MCP unavailable
- [x] Ensure auto-email sends brochure when new lead is added
- [x] Write vitest tests for brochure-email module (9/9 passed)
- [x] All 106 tests passing

## Bug Fixes
- [x] Fix brochure PDF link not opening in browser (re-uploaded with content-type application/pdf)
- [x] Fix brochure PDF link not accessible to external users (CDN cache propagation resolved)
- [x] Add professional bagel photo to brochure email template (attached as bagel-variety.jpg)
- [ ] Investigate and fix why toufic@bagelandcafe.com is receiving brochure emails

## Tasting Request Feature
- [x] Create public tasting request form page (no login required) — /tasting route
- [x] Create tasting_requests database table (12 columns, migrated)
- [x] Create backend procedures (submit, list, updateStatus)
- [x] Add "Request a Free Tasting" link to brochure email
- [x] Notify owner when new tasting request comes in
- [x] Show tasting requests in the dashboard for the team
- [x] Build Tasting Requests page with table of all requests
- [x] Add status filter cards (All, Pending, Scheduled, Completed, Cancelled)
- [x] Add status update functionality (dropdown in table + buttons in detail dialog)
- [x] Add detail dialog with contact info, tasting details, and status update
- [x] Add Tasting Requests to sidebar navigation (UtensilsCrossed icon)
- [x] Add route for /tastings in App.tsx
- [x] Write vitest tests for the tasting request flow (7/7 passed, 114 total)

## New Brochure v4 — Bagel Varieties Focus
- [x] Find/generate photos for Plain, Sesame, Multigrain, Everything bagels
- [x] Design new 3-page brochure PDF (cover, 4 variety cards with photos, pricing & contact)
- [x] Upload new brochure to CDN with correct content-type (application/pdf)
- [x] Update brochure-email.ts with new v4 brochure URL
- [x] Update email content to mention the four varieties
- [x] All 115 tests passing

## Wholesale Call Sheet Lead Import
- [x] Extract lead data from uploaded Wholesale_Bagel_Call_Sheet_Montreal.pdf (15 leads)
- [x] Parse business names, contacts, emails, phones from the call sheet
- [x] Import all 15 leads into the database (bypassed auto-email to avoid spamming)
- [x] Verify imported leads appear on the Leads page (48 total, all visible with correct statuses and notes)

## Notifications Panel
- [x] Create notifications database table (type, title, message, read status, link, timestamp)
- [x] Create backend procedures (list, markRead, markAllRead, delete, unreadCount)
- [x] Build bell icon dropdown panel in dashboard header with notification list
- [x] Show unread count badge on bell icon (amber badge with count)
- [x] Wire notification creation into new lead events
- [x] Wire notification creation into new tasting request events
- [x] Wire notification creation into new order events (create + status changes)
- [x] Add mark as read / mark all as read functionality
- [x] Add dismiss/delete individual notifications
- [x] Add type-based emoji icons (📥 leads, 🥯 tastings, 📦 orders, ⚙️ system)
- [x] Clickable notifications navigate to relevant page
- [x] Write vitest tests for notification procedures (13/13 passed, 128 total)
- [x] Remove ✅ 🚚 📦 💰 emojis from brochure email template
- [x] Fix Send Brochure button on Leads page — now calls leads.sendBrochure tRPC procedure to actually send email via Outlook
- [x] Fix Send Brochure button — replaced raw fetch with proper tRPC mutation (sendBrochureMut.mutateAsync) for correct auth and serialization
- [x] Fix: Send Brochure dialog button does nothing when clicked for individual lead — changed to mailto: approach that opens email client with pre-composed brochure email + added Copy Email button

## Direct Email Send from Dashboard
- [x] Per-row Send Brochure button sends email from Rosalyn@bagelandcafe.com via Outlook MCP (queue + scheduled task)
- [x] Implement email queue: server saves pending email to DB, scheduled task sends via Outlook MCP every 5 min
- [x] Show send status feedback to user (sending spinner + success toast)
- [x] Test end-to-end email delivery (confirmed samirkennedy1@gmail.com received brochure)
- [x] Send Brochure button queues email instantly, Outlook MCP scheduled task delivers within 5 minutes

## Lead Profile Page
- [x] Update leads schema with new fields: businessType, leadSource, potentialValue, estimatedWeeklyOrder, productsInterested, assignedTo, lastContactDate, nextFollowUpDate, notes, lostReason, address
- [x] Push database migration for new lead fields
- [x] Add getLeadById db helper
- [x] Add updateLead db helper
- [x] Add leads.getById tRPC procedure
- [x] Add leads.update tRPC procedure
- [x] Build LeadProfile.tsx page with premium UI layout
- [x] Add header with business name, status badge, potential badge
- [x] Add left/main section for lead details (editable)
- [x] Add right sidebar for contact info, assigned person, next follow-up, quick actions
- [x] Add quick actions: Mark as Contacted, Schedule Follow-up, Mark as Won, Mark as Lost
- [x] Add lost reason field (only visible when status is Lost)
- [x] Make lead rows clickable in Leads list page + add View action button
- [x] Register /leads/:id route in App.tsx
- [x] Write vitest tests for getById and update procedures (8/8 passed)
- [x] Test in browser and verify TypeScript/build passes

## Activity Timeline
- [x] Add lead_activities table to database schema (leadId, activityType, note, userId, createdAt)
- [x] Push database migration
- [x] Add db helpers: createActivity, getActivitiesByLeadId
- [x] Add tRPC procedures: leads.getActivities, leads.addActivity
- [x] Auto-create activity on status change
- [x] Auto-create activity on marked won/lost
- [x] Auto-create activity on follow-up date change
- [x] Auto-create activity on notes added
- [x] Build Activity Timeline UI in LeadProfile page (newest first, empty state)
- [x] Add "Add Activity" button with type selector and note input
- [x] Write vitest tests for activity procedures (11/11 passed, 150 total)
- [x] Test in browser and verify TypeScript/build passes

## Follow-up Control Improvements
- [x] Add follow-up fields to leads schema: followUpPriority, followUpNote, followUpStatus
- [x] Push database migration
- [x] Update db helpers for follow-up fields
- [x] Update tRPC procedures for follow-up management (markDone, reschedule, clear)
- [x] Add overdue detection logic (past date + not done = overdue)
- [x] Update Lead Profile UI: follow-up section with priority, note, status, overdue warning
- [x] Add quick buttons: Mark follow-up done, Reschedule, Clear follow-up
- [x] Add visual overdue warning on Lead Profile page
- [x] Update Leads list: show next follow-up date column
- [x] Update Leads list: show overdue badge if follow-up is overdue
- [x] Write vitest tests for follow-up procedures (6/6 passed, 156 total)
- [x] Test in browser and verify TypeScript/build passes

## Lead Import from Excel/CSV
- [x] Install xlsx library for parsing Excel/CSV files
- [x] Build server-side tRPC procedures: parseFile, checkDuplicates, confirmImport
- [x] Add "Import Leads" button on Leads page
- [x] Build multi-step import wizard: Upload → Map Columns → Preview → Confirm → Summary
- [x] File upload with .xlsx/.xls/.csv support and size validation
- [x] Column mapping step with smart auto-mapping
- [x] Validation: require business/contact + phone/email, validate email format, normalize phones
- [x] Preview step: show valid/invalid rows, duplicate warnings, allow row removal
- [x] Duplicate detection by email, phone, business+address
- [x] Duplicate handling options: skip, update existing, import anyway
- [x] Confirm import saves to database only after user approval
- [x] Import summary: imported/skipped/updated/failed/duplicate counts
- [x] Activity records for imported leads ("Lead imported from Excel/CSV")
- [x] Admin-only access (protectedProcedure with role check)
- [x] Write vitest tests for import procedures (21/21 passed, 177 total)
- [x] Test in browser and verify TypeScript/build passes

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

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

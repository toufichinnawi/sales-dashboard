import 'dotenv/config';
import mysql from 'mysql2/promise';
import fs from 'fs';

const invoices = JSON.parse(fs.readFileSync('/home/ubuntu/parsed_sales.json', 'utf-8'));
console.log(`Loaded ${invoices.length} invoices from parsed JSON`);

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  console.log('Connected to database');

  // Get or create default customer for QB imports
  const [existing] = await conn.execute(
    "SELECT id FROM customers WHERE businessName = 'QuickBooks Import' LIMIT 1"
  );
  let defaultCustomerId;
  if (existing.length > 0) {
    defaultCustomerId = existing[0].id;
  } else {
    const [result] = await conn.execute(
      "INSERT INTO customers (businessName, contactName, email, segment, customerStatus) VALUES (?, ?, ?, ?, ?)",
      ['QuickBooks Import', 'Unassigned', '', 'other', 'active']
    );
    defaultCustomerId = result.insertId;
    console.log(`Created default customer 'QuickBooks Import' with ID ${defaultCustomerId}`);
  }

  // Check existing orders to avoid duplicates
  const [existingOrders] = await conn.execute("SELECT orderNumber FROM orders");
  const existingSet = new Set(existingOrders.map(r => r.orderNumber));

  let imported = 0;
  let skipped = 0;
  let totalRevenue = 0;

  for (const inv of invoices) {
    const orderNumber = `QB-${inv.invNum}`;
    if (existingSet.has(orderNumber)) {
      skipped++;
      continue;
    }

    const status = inv.type === 'Credit Memo' ? 'cancelled' : 'paid';
    const deliveryDate = inv.date;

    // Insert order
    const [orderResult] = await conn.execute(
      `INSERT INTO orders (customerId, orderNumber, orderStatus, deliveryDate, subtotal, discount, total, notes, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        defaultCustomerId,
        orderNumber,
        status,
        deliveryDate,
        inv.subtotal.toFixed(2),
        inv.discount.toFixed(2),
        inv.total.toFixed(2),
        `Imported from QuickBooks invoice #${inv.invNum}`,
        deliveryDate,
        deliveryDate,
      ]
    );
    const orderId = orderResult.insertId;

    // Insert order items
    for (const item of inv.items) {
      const unit = guessUnit(item.product, item.unitPrice);
      await conn.execute(
        `INSERT INTO order_items (orderId, productName, quantity, unit, unitPrice, lineTotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.product,
          item.quantity.toFixed(2),
          unit,
          item.unitPrice.toFixed(2),
          item.lineTotal.toFixed(2),
        ]
      );
    }

    imported++;
    totalRevenue += inv.total;
  }

  console.log('\n=== Import Complete ===');
  console.log(`Invoices imported: ${imported}`);
  console.log(`Invoices skipped (duplicates): ${skipped}`);
  console.log(`Total revenue imported: $${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);

  // Verify
  const [orderCount] = await conn.execute("SELECT COUNT(*) as cnt FROM orders");
  console.log(`Total orders in database: ${orderCount[0].cnt}`);
  const [itemCount] = await conn.execute("SELECT COUNT(*) as cnt FROM order_items");
  console.log(`Total order items in database: ${itemCount[0].cnt}`);

  await conn.end();
}

function guessUnit(productName, price) {
  const lower = (productName || '').toLowerCase();
  if (lower.includes('dozen') || lower.includes('dz')) return 'dozen';
  if (lower.includes('combo') || lower.includes('sandwich') || lower.includes('salad')) return 'each';
  if (lower.includes('muffin') || lower.includes('cookie') || lower.includes('bread') || lower.includes('pastry')) return 'each';
  if (lower.includes('juice') || lower.includes('water') || lower.includes('drink') || lower.includes('sparkling')) return 'each';
  if (lower.includes('cream cheese') || lower.includes('chips')) return 'each';
  if (lower.includes('delivery')) return 'flat';
  if (price && price >= 6 && price <= 10) return 'dozen';
  return 'each';
}

main().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});

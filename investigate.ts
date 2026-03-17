import mysql from 'mysql2/promise';

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);

  // Jan 2026 breakdown: QB P&L says $11,385.99, we have $11,419.97 (delivered+paid)
  // Difference: $33.98
  // Check if there are cancelled/voided orders in Jan that we still count
  const [janByStatus] = await conn.execute(`
    SELECT 
      orderStatus,
      COUNT(*) as count,
      SUM(CAST(total AS DECIMAL(10,2))) as total
    FROM orders
    WHERE createdAt >= '2026-01-01' AND createdAt < '2026-02-01'
    GROUP BY orderStatus
    ORDER BY orderStatus
  `);
  console.log("Jan 2026 by status:");
  console.table(janByStatus);

  // Feb 2026 breakdown: QB P&L says $17,760.53, we have $17,788.71
  // Difference: $28.18
  const [febByStatus] = await conn.execute(`
    SELECT 
      orderStatus,
      COUNT(*) as count,
      SUM(CAST(total AS DECIMAL(10,2))) as total
    FROM orders
    WHERE createdAt >= '2026-02-01' AND createdAt < '2026-03-01'
    GROUP BY orderStatus
    ORDER BY orderStatus
  `);
  console.log("Feb 2026 by status:");
  console.table(febByStatus);

  // Oct 2025: QB P&L says $13,074.89, we have $12,574.89 (diff = -$500)
  // QB has "Sales of Product Income" = $500 — separate income account
  const [octByStatus] = await conn.execute(`
    SELECT 
      orderStatus,
      COUNT(*) as count,
      SUM(CAST(total AS DECIMAL(10,2))) as total
    FROM orders
    WHERE createdAt >= '2025-10-01' AND createdAt < '2025-11-01'
    GROUP BY orderStatus
    ORDER BY orderStatus
  `);
  console.log("Oct 2025 by status:");
  console.table(octByStatus);

  // Check Jan 2026: what's the exact sum of invoices (QB-) that are delivered or paid?
  const [janInvoices] = await conn.execute(`
    SELECT 
      SUM(CAST(total AS DECIMAL(10,2))) as invoice_total
    FROM orders
    WHERE orderNumber LIKE 'QB-%'
    AND orderStatus IN ('delivered', 'paid')
    AND createdAt >= '2026-01-01' AND createdAt < '2026-02-01'
  `);
  console.log("Jan 2026 QB invoices (delivered+paid):");
  console.table(janInvoices);

  // Check what QB says: $11,385.99 = Sales $11,533.25 + Discounts -$147.76
  // Our invoices total: $11,451.47
  // $11,533.25 - $11,451.47 = $81.78 difference in "Sales" alone
  // But our credit memos are -$31.50
  // So net = $11,451.47 - $31.50 = $11,419.97
  // QB net = $11,533.25 - $147.76 = $11,385.49 (wait, that's $11,385.49 not $11,385.99)
  // Let me recheck: QB shows Sales=$11,533.25, Discounts=-$147.76
  // $11,533.25 + (-$147.76) = $11,385.49... but P&L says $11,385.99
  // Hmm, there might be rounding. Let me check if "Discounts given" is -$147.26 instead

  await conn.end();
}
main();

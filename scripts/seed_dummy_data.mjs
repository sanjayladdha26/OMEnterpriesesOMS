import dotenv from 'dotenv';
import { Client } from 'pg';
import { faker } from '@faker-js/faker';

dotenv.config();

const confirm = process.argv.includes('--confirm');
if (!confirm) {
  console.log('WARNING: This script will DELETE all existing data in the database and insert DUMMY data.');
  console.log('To proceed, run the script with the --confirm flag:');
  console.log('node scripts/seed_dummy_data.mjs --confirm');
  process.exit(0);
}

const dbUrl = process.env.DATABASE_URL.replace('jgeBQHKx?viB4u)', encodeURIComponent('jgeBQHKx?viB4u)'));
const client = new Client({ connectionString: dbUrl });

async function seed() {
  await client.connect();
  console.log('Connected to the database. Clearing existing data...');

  // Disable triggers/constraints temporarily if possible, or delete in order
  await client.query('DELETE FROM order_items;');
  await client.query('DELETE FROM orders;');
  await client.query('DELETE FROM products;');
  await client.query('DELETE FROM categories;');
  await client.query('DELETE FROM parties;');
  await client.query('DELETE FROM agents;');
  await client.query('DELETE FROM staff;');

  console.log('Data cleared. Generating dummy data...');

  // 1. Categories
  const categoryNames = ['Sarees', 'Kurtis', 'Dress Materials', 'Lehengas', 'Suits', 'Fabrics'];
  const categories = [];
  for (const name of categoryNames) {
    const res = await client.query(
      `INSERT INTO categories (name, preferred_mtr) VALUES ($1, $2) RETURNING id`,
      [name, faker.helpers.arrayElement([5.5, 6.3, 10, null])]
    );
    categories.push({ id: res.rows[0].id, name });
  }
  console.log(`Inserted ${categories.length} categories.`);

  // 2. Products
  const products = [];
  for (let i = 0; i < 50; i++) {
    const category = faker.helpers.arrayElement(categories);
    const unit = faker.helpers.arrayElement(['piece', 'metre']);
    const res = await client.query(
      `INSERT INTO products (name, sku_name, category, price_per_unit, unit, description) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, price_per_unit`,
      [
        faker.commerce.productName(),
        faker.string.alphanumeric({ length: 6, casing: 'upper' }),
        category.name,
        faker.commerce.price({ min: 100, max: 5000, dec: 2 }),
        unit,
        faker.commerce.productDescription()
      ]
    );
    products.push(res.rows[0]);
  }
  console.log(`Inserted ${products.length} products.`);

  // 3. Agents
  const agents = [];
  for (let i = 0; i < 5; i++) {
    const res = await client.query(
      `INSERT INTO agents (name, code, phone) VALUES ($1, $2, $3) RETURNING id, name, code`,
      [
        faker.company.name() + ' Agency',
        faker.string.alpha({ length: 6, casing: 'lower' }),
        faker.phone.number({ style: 'national' })
      ]
    );
    agents.push(res.rows[0]);
  }
  console.log(`Inserted ${agents.length} agents.`);

  // 4. Parties
  const parties = [];
  for (let i = 0; i < 20; i++) {
    const agent = faker.helpers.arrayElement(agents);
    const res = await client.query(
      `INSERT INTO parties (account_name, address, city, pin_code, state, gstin, phone1, transport, agent_id, access_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, account_name, access_code`,
      [
        faker.company.name() + ' Textiles',
        faker.location.streetAddress(),
        faker.location.city(),
        faker.location.zipCode(),
        faker.location.state(),
        faker.string.alphanumeric({ length: 15, casing: 'upper' }),
        faker.phone.number({ style: 'national' }),
        faker.company.name() + ' Transport',
        agent.id,
        faker.string.numeric(6)
      ]
    );
    parties.push({ ...res.rows[0], agent_id: agent.id, agent_name: agent.name });
  }
  console.log(`Inserted ${parties.length} parties.`);

  // 5. Staff
  const staffMembers = [];
  for (let i = 0; i < 3; i++) {
    const res = await client.query(
      `INSERT INTO staff (name, code, is_admin, can_create_order, can_view_orders, can_view_inventory, can_view_agents, can_view_staff, can_accept_order, can_dispatch_order, can_complete_order, can_reject_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id, name, code`,
      [
        faker.person.fullName(),
        faker.string.alpha({ length: 6, casing: 'lower' }),
        i === 0, // make the first one admin
        true, true, true, true, true, true, true, true, true
      ]
    );
    staffMembers.push(res.rows[0]);
  }
  console.log(`Inserted ${staffMembers.length} staff.`);

  // 6. Orders and Order Items
  let orderCount = 0;
  let itemCount = 0;
  const statuses = ['pending', 'accepted', 'dispatched', 'completed', 'rejected'];
  
  for (let i = 0; i < 30; i++) {
    const party = faker.helpers.arrayElement(parties);
    const orderNumber = 'ORD-' + faker.string.numeric(6);
    const status = faker.helpers.arrayElement(statuses);
    
    // Select 1 to 5 random products for this order
    const numItems = faker.number.int({ min: 1, max: 5 });
    const orderItemsData = [];
    let subtotal = 0;
    
    for (let j = 0; j < numItems; j++) {
      const product = faker.helpers.arrayElement(products);
      const quantity = faker.number.int({ min: 10, max: 100 });
      const itemSubtotal = quantity * parseFloat(product.price_per_unit);
      subtotal += itemSubtotal;
      
      orderItemsData.push({
        product_id: product.id,
        product_name: product.name,
        quantity,
        unit_price: product.price_per_unit,
        subtotal: itemSubtotal
      });
    }
    
    const total = subtotal; // Assuming no additional taxes/discounts for simplicity here
    
    const orderRes = await client.query(
      `INSERT INTO orders (order_number, party_id, party_name, agent_id, agent_name, subtotal, total, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        orderNumber,
        party.id,
        party.account_name,
        party.agent_id,
        party.agent_name,
        subtotal,
        total,
        status
      ]
    );
    
    const orderId = orderRes.rows[0].id;
    orderCount++;
    
    for (const item of orderItemsData) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [orderId, item.product_id, item.product_name, item.quantity, 'piece', item.unit_price, item.subtotal]
      );
      itemCount++;
    }
  }
  
  console.log(`Inserted ${orderCount} orders with ${itemCount} order items.`);
  console.log('\\n--- LOGIN DETAILS ---');
  console.log(`Admin Staff Login Code: ${staffMembers[0].code} (Name: ${staffMembers[0].name})`);
  console.log(`Agent Login Code: ${agents[0].code} (Name: ${agents[0].name})`);
  console.log(`Party Access Code: ${parties[0].access_code} (Name: ${parties[0].account_name})`);
  console.log('---------------------\\n');
  console.log('Seeding completed successfully!');
  await client.end();
}

seed().catch(err => {
  console.error('Error seeding data:', err);
  client.end();
});

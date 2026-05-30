import { Client } from 'pg';
import { faker } from '@faker-js/faker';

const DB_URL = "postgresql://postgres:Sumitiscool%219@db.kwmmawjovqxajjgxsqrq.supabase.co:5432/postgres";

async function seed() {
  console.log("Connecting to the database...");
  const client = new Client({
    connectionString: DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected successfully. Seeding data...");

    // Clear existing data (optional, but good for idempotency)
    // We can skip this since it's a new db, but just in case
    await client.query(`
      TRUNCATE TABLE order_items, orders, parties, staff, products, categories, agents CASCADE;
    `);

    // 1. Seed Agents
    console.log("Seeding agents...");
    const agents = [];
    for (let i = 0; i < 5; i++) {
      const res = await client.query(`
        INSERT INTO agents (name, code, phone)
        VALUES ($1, $2, $3)
        RETURNING *;
      `, [faker.person.fullName(), faker.string.alphanumeric(5).toUpperCase(), faker.phone.number()]);
      agents.push(res.rows[0]);
    }

    // 2. Seed Categories
    console.log("Seeding categories...");
    const categoryNames = ['Cotton', 'Silk', 'Polyester', 'Wool', 'Linen'];
    const categories = [];
    for (let i = 0; i < categoryNames.length; i++) {
      const res = await client.query(`
        INSERT INTO categories (name, preferred_mtr)
        VALUES ($1, $2)
        RETURNING *;
      `, [categoryNames[i], faker.number.int({ min: 10, max: 100 })]);
      categories.push(res.rows[0]);
    }

    // 3. Seed Products
    console.log("Seeding products...");
    const products = [];
    for (let i = 0; i < 20; i++) {
      const category = faker.helpers.arrayElement(categories);
      const res = await client.query(`
        INSERT INTO products (name, sku_name, category, price_per_unit, unit, description)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `, [
        faker.commerce.productName(),
        faker.string.alphanumeric(8).toUpperCase(),
        category.name,
        faker.finance.amount(50, 500, 2),
        faker.helpers.arrayElement(['piece', 'metre']),
        faker.commerce.productDescription()
      ]);
      products.push(res.rows[0]);
    }

    // 4. Seed Staff
    console.log("Seeding staff...");
    for (let i = 0; i < 10; i++) {
      await client.query(`
        INSERT INTO staff (name, code, can_create_order, is_admin, can_view_orders, can_view_inventory, can_view_agents, can_view_staff, can_accept_order, can_dispatch_order, can_complete_order, can_reject_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);
      `, [
        faker.person.fullName(),
        faker.string.alphanumeric(6).toUpperCase(),
        faker.datatype.boolean(),
        faker.datatype.boolean(0.2), // 20% chance to be admin
        faker.datatype.boolean(),
        faker.datatype.boolean(),
        faker.datatype.boolean(),
        faker.datatype.boolean(),
        faker.datatype.boolean(),
        faker.datatype.boolean(),
        faker.datatype.boolean(),
        faker.datatype.boolean(),
      ]);
    }

    // 5. Seed Parties
    console.log("Seeding parties...");
    const parties = [];
    for (let i = 0; i < 15; i++) {
      const agent = faker.helpers.arrayElement(agents);
      const res = await client.query(`
        INSERT INTO parties (account_name, address, city, pin_code, state, gstin, phone1, phone2, transport, delivery_city, agent_id, access_code)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *;
      `, [
        faker.company.name(),
        faker.location.streetAddress(),
        faker.location.city(),
        faker.location.zipCode(),
        faker.location.state(),
        faker.string.alphanumeric(15).toUpperCase(),
        faker.phone.number(),
        faker.phone.number(),
        faker.company.name(),
        faker.location.city(),
        agent.id,
        faker.string.numeric(6)
      ]);
      parties.push(res.rows[0]);
    }

    // 6. Seed Orders & Order Items
    console.log("Seeding orders...");
    for (let i = 0; i < 20; i++) {
      const party = faker.helpers.arrayElement(parties);
      const agent = agents.find(a => a.id === party.agent_id) || faker.helpers.arrayElement(agents);
      
      const numItems = faker.number.int({ min: 1, max: 5 });
      const orderItems = [];
      let subtotal = 0;

      for (let j = 0; j < numItems; j++) {
        const product = faker.helpers.arrayElement(products);
        const quantity = faker.number.int({ min: 1, max: 50 });
        const unit_price = parseFloat(product.price_per_unit);
        const item_subtotal = quantity * unit_price;
        subtotal += item_subtotal;

        orderItems.push({
          product_id: product.id,
          product_name: product.name,
          quantity: quantity,
          unit: product.unit,
          unit_price: unit_price,
          subtotal: item_subtotal
        });
      }

      // We'll call the stored procedure to insert the order and items properly, 
      // or we can insert them manually. 
      // Manually is easier since we want to set random statuses.
      
      const orderRes = await client.query(`
        INSERT INTO orders (order_number, party_id, party_name, agent_id, agent_name, subtotal, total, status, admin_notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id;
      `, [
        `ORD-${faker.string.numeric(6)}`,
        party.id,
        party.account_name,
        agent.id,
        agent.name,
        subtotal,
        subtotal, // No tax for simplicity
        faker.helpers.arrayElement(['pending', 'accepted', 'dispatched', 'completed', 'rejected']),
        faker.lorem.sentence()
      ]);

      const orderId = orderRes.rows[0].id;

      for (const item of orderItems) {
        await client.query(`
          INSERT INTO order_items (order_id, product_id, product_name, quantity, unit, unit_price, subtotal)
          VALUES ($1, $2, $3, $4, $5, $6, $7);
        `, [
          orderId,
          item.product_id,
          item.product_name,
          item.quantity,
          item.unit,
          item.unit_price,
          item.subtotal
        ]);
      }
    }

    console.log("Seeding completed successfully!");
  } catch (err) {
    console.error("Error seeding data:", err);
  } finally {
    await client.end();
  }
}

seed();

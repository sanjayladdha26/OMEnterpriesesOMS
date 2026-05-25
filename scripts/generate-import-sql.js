const fs = require('fs');
const path = require('path');

const csvPath = 'C:\\Users\\Sumit singhvi\\Downloads\\productDataSheet.csv';
const content = fs.readFileSync(csvPath, 'utf8');

const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
// Remove header
lines.shift();

let sqlInsert = `INSERT INTO products (sku_name, name, hsn_code, price_per_unit, category) VALUES\n`;
let values = [];

for (const line of lines) {
  const parts = line.split(',');
  if (parts.length < 4) continue;
  
  let itemName = parts[0].trim();
  let skuName = parts[1].trim();
  let hsnCode = parts[2] ? parts[2].trim() : null;
  let price = parts[3] ? parseFloat(parts[3].trim()) : null;
  let category = parts[4] ? parts[4].trim() : 'fabric';
  
  if (!itemName && !skuName && !price) continue;
  if (!category) category = 'fabric';
  if (isNaN(price)) price = 0;

  let nameSql = itemName ? `'${itemName.replace(/'/g, "''")}'` : 'NULL';
  let skuNameSql = skuName ? `'${skuName.replace(/'/g, "''")}'` : 'NULL';
  let hsnSql = hsnCode ? `'${hsnCode.replace(/'/g, "''")}'` : 'NULL';
  let catSql = `'${category.replace(/'/g, "''")}'`;

  values.push(`(${skuNameSql}, ${nameSql}, ${hsnSql}, ${price}, ${catSql})`);
}

sqlInsert += values.join(',\n') + ';\n';

fs.writeFileSync(path.join(__dirname, 'import_products.sql'), sqlInsert);
console.log('Done!');

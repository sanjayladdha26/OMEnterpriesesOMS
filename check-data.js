const url = "https://asqiycozhpcligyqfpkl.supabase.co/rest/v1";
const key = "sb_publishable_AGeCj55NzSImNMvpreSruw_-DsjGhM7";

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
};

async function check() {
  const custRes = await fetch(`${url}/customers?select=*`, { headers });
  const custs = await custRes.json();
  
  console.log("Customers:", JSON.stringify(custs, null, 2));

  const billsRes = await fetch(`${url}/bills?select=*`, { headers });
  const bills = await billsRes.json();
  console.log("Bills:", JSON.stringify(bills, null, 2));

  const paymentsRes = await fetch(`${url}/payments?select=*`, { headers });
  const payments = await paymentsRes.json();
  console.log("Payments:", JSON.stringify(payments, null, 2));
}

check().catch(console.error);

const url = "https://asqiycozhpcligyqfpkl.supabase.co/rest/v1";
const key = "sb_publishable_AGeCj55NzSImNMvpreSruw_-DsjGhM7";

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
};

async function check() {
  const billsRes = await fetch(`${url}/bills?select=*`, { headers });
  const bills = await billsRes.json();
  
  console.log("Bills:", JSON.stringify(bills.map(b => ({
    bill: b.bill_number,
    total: b.total,
    paid: b.amount_paid,
    status: b.status,
    customer: b.customer_id
  })), null, 2));
}

check().catch(console.error);

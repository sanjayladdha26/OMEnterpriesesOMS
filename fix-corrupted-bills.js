const { createClient } = require("@supabase/supabase-js");

const url = "https://asqiycozhpcligyqfpkl.supabase.co";
const key = "sb_publishable_AGeCj55NzSImNMvpreSruw_-DsjGhM7";

const supabase = createClient(url, key);

async function fixBills() {
  console.log("Fetching all bills...");
  const { data: bills, error: billsError } = await supabase.from("bills").select("*");
  if (billsError) throw billsError;

  console.log("Fetching all payment allocations...");
  const { data: allocations, error: allocError } = await supabase.from("payment_allocations").select("*");
  if (allocError) throw allocError;

  console.log("Fetching all payments to check upfront payments...");
  const { data: payments, error: paymentsError } = await supabase.from("payments").select("*");
  if (paymentsError) throw paymentsError;

  for (const bill of bills) {
    let calculatedPaid = 0;

    // 1. Add allocations
    const billAllocs = allocations.filter(a => a.bill_id === bill.id);
    for (const alloc of billAllocs) {
      // make sure the payment actually exists still!
      const paymentExists = payments.some(p => p.id === alloc.payment_id);
      if (paymentExists) {
        calculatedPaid += alloc.amount;
      } else {
        console.log(`Found orphaned allocation for bill ${bill.bill_number}, ignoring.`);
      }
    }

    // 2. Add upfront payments that might not have an allocation (legacy bug)
    const upfrontPayments = payments.filter(p => p.notes === `Upfront payment for Bill ${bill.bill_number}`);
    for (const up of upfrontPayments) {
      // Check if this upfront payment is ALREADY in the allocations
      const hasAlloc = billAllocs.some(a => a.payment_id === up.id);
      if (!hasAlloc) {
        calculatedPaid += up.amount;
      }
    }

    const newStatus = calculatedPaid >= bill.total ? "completed" : "pending";

    if (bill.amount_paid !== calculatedPaid || bill.status !== newStatus) {
      console.log(`Fixing Bill ${bill.bill_number}: amount_paid ${bill.amount_paid} -> ${calculatedPaid}, status ${bill.status} -> ${newStatus}`);
      await supabase.from("bills").update({
        amount_paid: calculatedPaid,
        status: newStatus
      }).eq("id", bill.id);
    }
  }

  console.log("Done fixing bills.");
}

fixBills().catch(console.error);

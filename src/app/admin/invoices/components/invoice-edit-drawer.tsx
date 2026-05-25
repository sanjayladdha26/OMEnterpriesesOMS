"use client";

import { useEffect, useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { useBillDetails, useUpdateBill, useProducts, useCustomers } from "@/lib/hooks";
import { Loader2, Plus, Trash2, Save, User } from "lucide-react";
import { formatINR } from "@/lib/utils";
import type { BillItem, PaymentMethod, BillStatus } from "@/types/database";
import { BookOpen } from "lucide-react";
import toast from "react-hot-toast";

interface InvoiceEditDrawerProps {
  billId: string | null;
  open: boolean;
  onClose: () => void;
}

export function InvoiceEditDrawer({ billId, open, onClose }: InvoiceEditDrawerProps) {
  const { data: bill, isLoading } = useBillDetails(billId);
  const { mutateAsync: updateBill } = useUpdateBill();
  const { data: products } = useProducts();
  const { data: customers } = useCustomers();

  const [items, setItems] = useState<BillItem[]>([]);
  const [discountType, setDiscountType] = useState<"percentage" | "flat">("percentage");
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [amountReceived, setAmountReceived] = useState<number | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // For adding new items
  const [selectedProductId, setSelectedProductId] = useState("");
  const [newQuantity, setNewQuantity] = useState("1");
  const [newPieces, setNewPieces] = useState("1");

  // Initialize state when bill is loaded
  useEffect(() => {
    if (bill && open) {
      setItems(bill.items.map(item => ({ ...item })));
      setDiscountType(bill.discount_type);
      setDiscountValue(bill.discount_value);
      setPaymentMethod(bill.payment_method);
      setCustomerId(bill.customer_id);
      setCustomerName(bill.customer_name);
      
      const fetchedAmount = (bill as any).amount_received || 0;
      if (bill.status === "completed" && fetchedAmount === 0 && bill.payment_method !== "credit") {
        setAmountReceived(bill.total);
      } else {
        setAmountReceived(fetchedAmount > 0 ? fetchedAmount : null);
      }
    }
  }, [bill, open]);

  if (!open) return null;

  // Calculations
  const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
  const discountAmount = discountType === "percentage" 
    ? (subtotal * discountValue) / 100 
    : Math.min(discountValue, subtotal);
  const taxableAmount = subtotal - discountAmount;
  const gstRate = bill?.gst_rate || 5;
  const gstAmount = (taxableAmount * gstRate) / 100;
  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;
  const total = subtotal - discountAmount + gstAmount;

  // Compute Balance Due
  const effectiveAmountReceived = amountReceived ?? total;
  const balanceDue = paymentMethod === "credit" ? total : Math.max(0, total - effectiveAmountReceived);

  const handleUpdateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) return;
    const newItems = [...items];
    newItems[index].quantity = newQty;
    newItems[index].subtotal = newQty * newItems[index].unit_price;
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleAddItem = () => {
    if (!selectedProductId || !products) return;
    const qty = parseFloat(newQuantity);
    const pcs = parseInt(newPieces) || 1;
    if (isNaN(qty) || qty <= 0 || pcs <= 0) return;

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const totalQty = product.unit === "metre" ? Number((qty * pcs).toFixed(2)) : qty;

    const newItem: BillItem = {
      id: `new-${Date.now()}`,
      bill_id: bill!.id,
      product_id: product.id,
      product_name: product.name,
      quantity: totalQty,
      unit: product.unit,
      unit_price: product.price_per_unit,
      subtotal: totalQty * product.price_per_unit,
      hsn_code: product.hsn_code,
    };

    setItems([...items, newItem]);
    setSelectedProductId("");
    setNewQuantity("1");
    setNewPieces("1");
  };

  const handleSave = async () => {
    if (!bill) return;
    if (items.length === 0) {
      toast.error("Invoice must have at least one item");
      return;
    }

    if (balanceDue > 0 && !customerId) {
      toast.error("Please select a customer to put balance on khata.");
      return;
    }

    setSaving(true);
    try {
      await updateBill({
        originalBill: bill,
        updatedBill: {
          id: bill.id,
          subtotal,
          discount_type: discountType,
          discount_value: discountValue,
          discount_amount: discountAmount,
          gst_amount: gstAmount,
          cgst_amount: cgst,
          sgst_amount: sgst,
          total,
          payment_method: paymentMethod,
          customer_id: customerId,
          customer_name: customerName,
          items: items,
          amount_received: amountReceived,
        }
      });
      toast.success("Invoice updated successfully");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update invoice");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer open={open} onClose={onClose} title={`Edit Invoice ${bill?.bill_number || ""}`} width="max-w-2xl">
      {isLoading ? (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : !bill ? (
        <div className="flex h-full items-center justify-center text-text-muted">
          Failed to load invoice details.
        </div>
      ) : (
        <div className="flex flex-col h-full gap-6">
          
          {/* Payment Method & Amount Received */}
          <div className="grid grid-cols-2 gap-4 bg-surface p-3 rounded-xl border border-border">
            <div>
              <label className="text-sm font-medium text-text-primary block mb-1.5">Customer</label>
              <select 
                value={customerId || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    setCustomerId(null);
                    setCustomerName(null);
                  } else {
                    setCustomerId(val);
                    const selected = customers?.find(c => c.id === val);
                    if (selected) setCustomerName(selected.name);
                  }
                }}
                className="w-full bg-background text-text-primary border border-border rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none mb-4"
              >
                <option value="">Walk-in Customer</option>
                {customers?.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ""}
                  </option>
                ))}
              </select>

              <label className="text-sm font-medium text-text-primary block mb-1.5">Payment Method</label>
              <select 
                value={paymentMethod} 
                onChange={(e) => {
                  const val = e.target.value as PaymentMethod;
                  setPaymentMethod(val);
                  if (val === "credit") setAmountReceived(null);
                }}
                className="w-full bg-background text-text-primary border border-border rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="credit">Khata (Credit)</option>
              </select>
            </div>
            
            {(paymentMethod === "cash" || paymentMethod === "upi") && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-text-primary">Amount Received</label>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">₹</span>
                  <input
                    type="number"
                    value={amountReceived ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAmountReceived(val === "" ? null : parseFloat(val) || 0);
                    }}
                    placeholder={total.toFixed(0)}
                    className="w-full bg-background text-text-primary border border-border rounded-lg pl-7 pr-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                {balanceDue > 0 && (
                  <p className="text-[11px] text-amber font-medium mt-1 flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    Bal to Khata: {formatINR(balanceDue)}
                  </p>
                )}
              </div>
            )}
            
            {paymentMethod === "credit" && (
              <div className="flex items-center justify-end">
                <span className="text-sm font-semibold text-amber flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  Full amount on Khata
                </span>
              </div>
            )}
          </div>

          {/* Items */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">Items</h3>
            <div className="bg-surface border border-border rounded-xl overflow-hidden mb-3">
              <table className="w-full text-sm">
                <thead className="bg-surface-hover border-b border-border">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-text-muted">Product</th>
                    <th className="text-right px-3 py-2 font-medium text-text-muted w-24">Qty</th>
                    <th className="text-right px-3 py-2 font-medium text-text-muted w-24">Price</th>
                    <th className="text-right px-3 py-2 font-medium text-text-muted w-24">Subtotal</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="px-3 py-2 font-medium">{item.product_name}</td>
                      <td className="px-3 py-2">
                        <input 
                          type="number" 
                          value={item.quantity}
                          onChange={(e) => handleUpdateQuantity(idx, parseFloat(e.target.value) || 0)}
                          className="w-full bg-background text-text-primary text-right border border-border rounded p-1 text-sm focus:border-primary focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">{formatINR(item.unit_price)}</td>
                      <td className="px-3 py-2 text-right font-semibold">{formatINR(item.subtotal)}</td>
                      <td className="px-3 py-2 text-center">
                        <button onClick={() => handleRemoveItem(idx)} className="text-red hover:bg-red-light p-1.5 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add Item Form */}
            <div className="flex gap-2 items-end bg-surface-hover p-3 rounded-xl border border-border">
              <div className="flex-1">
                <label className="text-xs font-medium text-text-muted block mb-1">Add Product</label>
                <select 
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-background text-text-primary border border-border rounded-lg px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="">Select product...</option>
                  {products?.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - {formatINR(p.price_per_unit)}/{p.unit === "metre" ? "m" : "pc"}</option>
                  ))}
                </select>
              </div>
              <div className="w-20">
                <label className="text-xs font-medium text-text-muted block mb-1">
                  {products?.find(p => p.id === selectedProductId)?.unit === 'metre' ? 'M/pc' : 'Qty'}
                </label>
                <input 
                  type="number" 
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                  className="w-full bg-background text-text-primary border border-border rounded-lg px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              {products?.find(p => p.id === selectedProductId)?.unit === 'metre' && (
                <div className="w-16">
                  <label className="text-xs font-medium text-text-muted block mb-1">Pcs</label>
                  <input 
                    type="number" 
                    value={newPieces}
                    onChange={(e) => setNewPieces(e.target.value)}
                    min="1"
                    className="w-full bg-background text-text-primary border border-border rounded-lg px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              )}
              <button 
                onClick={handleAddItem}
                disabled={!selectedProductId}
                className="bg-primary text-white p-1.5 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 h-9"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Discount & Totals */}
          <div className="bg-surface p-4 rounded-xl border border-border space-y-3 mt-auto">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-muted">Subtotal</span>
              <span className="text-sm font-semibold">{formatINR(subtotal)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <select 
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as "percentage" | "flat")}
                  className="bg-background text-text-primary border border-border rounded p-1 text-xs focus:border-primary focus:outline-none"
                >
                  <option value="percentage">Discount (%)</option>
                  <option value="flat">Discount (₹)</option>
                </select>
                <input 
                  type="number" 
                  value={discountValue}
                  onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                  className="w-20 bg-background text-text-primary text-right border border-border rounded p-1 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <span className="text-sm font-semibold text-red">-{formatINR(discountAmount)}</span>
            </div>

            {gstRate > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-muted">GST ({gstRate}%)</span>
                <span className="text-sm font-semibold">{formatINR(gstAmount)}</span>
              </div>
            )}

            <div className="pt-3 border-t border-border flex items-center justify-between">
              <span className="text-base font-bold text-text-primary">Total</span>
              <span className="text-lg font-bold text-primary">{formatINR(total)}</span>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving || items.length === 0}
            className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving..." : "Save Invoice"}
          </button>
        </div>
      )}
    </Drawer>
  );
}

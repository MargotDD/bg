import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Truck, Plus, Calendar, Package, DollarSign, X, CheckCircle2 } from 'lucide-react';

export const PurchasesView: React.FC = () => {
  const { state, currentCompany, can, createPurchase, formatMoney } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [unitCost, setUnitCost] = useState(50);
  const [supplier, setSupplier] = useState('');
  const [notes, setNotes] = useState('');

  const purchases = useMemo(() => {
    return state.purchases.filter(p => p.companyId === currentCompany.id);
  }, [state.purchases, currentCompany.id]);

  const products = useMemo(() => {
    return state.products.filter(p => p.companyId === currentCompany.id);
  }, [state.products, currentCompany.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return;
    const res = createPurchase({
      productId,
      quantity,
      unitCost,
      supplier,
      notes
    });
    if (res.success) {
      setIsModalOpen(false);
      setProductId('');
      setNotes('');
    } else {
      alert(res.error);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-rose-100 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <Truck className="w-5 h-5 text-purple-600" />
            <span>Product Purchases & Stock Inflow</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Log inventory acquisitions. Automatically recalculates Weighted Average Cost and logs financial transactions.
          </p>
        </div>

        {can('create_purchases') && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Purchase</span>
          </button>
        )}
      </div>

      {/* Purchases List */}
      <div className="bg-white rounded-3xl border border-rose-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-rose-100 bg-rose-50/40 text-stone-400 uppercase text-[10px] font-bold">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-3">Product Name</th>
                <th className="py-3 px-3">Supplier</th>
                <th className="py-3 px-3 text-center">Quantity</th>
                <th className="py-3 px-3 text-right">Unit Cost</th>
                <th className="py-3 px-3 text-right">Total Cost</th>
                <th className="py-3 px-3">Purchased By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    <Truck className="w-8 h-8 mx-auto mb-2 text-rose-200" />
                    <p>No inventory purchases recorded yet.</p>
                  </td>
                </tr>
              ) : (
                purchases.map(pur => (
                  <tr key={pur.id} className="hover:bg-rose-50/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-stone-800">{pur.date}</td>
                    <td className="py-3 px-3 font-bold text-stone-900">{pur.productName}</td>
                    <td className="py-3 px-3 text-stone-600">{pur.supplier}</td>
                    <td className="py-3 px-3 text-center font-bold text-purple-800">{pur.quantity} units</td>
                    <td className="py-3 px-3 text-right text-stone-600">{formatMoney(pur.unitCost)}</td>
                    <td className="py-3 px-3 text-right font-extrabold text-stone-900">{formatMoney(pur.totalCost)}</td>
                    <td className="py-3 px-3 text-stone-500 text-[11px]">{pur.createdByName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-100">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <h3 className="font-bold text-stone-900 text-sm">Record Inventory Purchase</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Product *</label>
                <select
                  required
                  value={productId}
                  onChange={e => setProductId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-rose-200 bg-white"
                >
                  <option value="">-- Choose Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (In stock: {p.quantity}, Avg Cost: {p.purchaseCost})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Quantity Received *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl border border-rose-200"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Unit Cost ({currentCompany.currency}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={unitCost}
                    onChange={e => setUnitCost(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-rose-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Supplier *</label>
                <input
                  type="text"
                  required
                  value={supplier}
                  onChange={e => setSupplier(e.target.value)}
                  placeholder="Supplier or distributor name"
                  className="w-full px-3 py-2 rounded-xl border border-rose-200"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Batch Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Invoice or shipment reference..."
                  className="w-full px-3 py-2 rounded-xl border border-rose-200"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-rose-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-rose-200 text-stone-600 hover:bg-rose-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs"
                >
                  Confirm Purchase ({formatMoney(quantity * unitCost)})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

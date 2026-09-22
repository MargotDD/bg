import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RotateCcw, AlertTriangle, X, CheckCircle2 } from 'lucide-react';
import { Sale } from '../../types';

interface ReturnSaleModalProps {
  sale: Sale | null;
  onClose: () => void;
}

export const ReturnSaleModal: React.FC<ReturnSaleModalProps> = ({ sale, onClose }) => {
  const { returnSale, formatMoney } = useApp();
  const [reason, setReason] = useState('Customer exchange / return');
  const [returnType, setReturnType] = useState<'Full' | 'Partial'>('Full');
  const [refundAmount, setRefundAmount] = useState(sale?.finalTotal || 0);
  const [restoreStock, setRestoreStock] = useState(true);

  if (!sale) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    const itemsToReturn = sale.items.map(i => ({ productId: i.productId, quantity: i.quantity }));
    returnSale(
      sale.id,
      itemsToReturn,
      reason.trim()
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-rose-100 p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-rose-100">
          <div className="flex items-center gap-2 text-rose-700">
            <RotateCcw className="w-4 h-4" />
            <h3 className="font-bold text-stone-900 text-sm">Process Return / Refund</h3>
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 bg-rose-50/60 rounded-2xl border border-rose-100 text-xs">
          <p className="font-bold text-stone-800">Order Reference: {sale.receiptId}</p>
          <p className="text-stone-500 mt-0.5">Original Total: {formatMoney(sale.finalTotal)} • Customer: {sale.customerName}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-stone-700 font-semibold mb-1">Reason for Return / Refund *</label>
            <input
              type="text"
              required
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-rose-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Return Scope</label>
              <select
                value={returnType}
                onChange={e => {
                  const t = e.target.value as 'Full' | 'Partial';
                  setReturnType(t);
                  if (t === 'Full') setRefundAmount(sale.finalTotal);
                }}
                className="w-full px-3 py-2 rounded-xl border border-rose-200 bg-white"
              >
                <option value="Full">Full Order Return</option>
                <option value="Partial">Partial Refund</option>
              </select>
            </div>
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Refund Amount</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={sale.finalTotal}
                required
                value={refundAmount}
                onChange={e => setRefundAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-rose-200 font-bold text-rose-700"
              />
            </div>
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={restoreStock}
                onChange={e => setRestoreStock(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              <span className="font-semibold text-stone-800">
                Restock returned units back into live inventory
              </span>
            </label>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-rose-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-rose-200 text-stone-600 hover:bg-rose-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs"
            >
              Confirm Refund ({formatMoney(refundAmount)})
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

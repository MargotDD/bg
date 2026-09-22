import React from 'react';
import { useApp } from '../../context/AppContext';
import { Printer, Download, Share2, X, CheckCircle2, RotateCcw, AlertCircle } from 'lucide-react';
import { Sale } from '../../types';

interface ReceiptModalProps {
  sale: Sale | null;
  onClose: () => void;
  onOpenReturn?: (sale: Sale) => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose, onOpenReturn }) => {
  const { currentCompany, formatMoney } = useApp();

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Receipt ${sale.receiptId} — ${currentCompany.name}`,
        text: `Receipt for ${sale.customerName} - Total: ${formatMoney(sale.finalTotal)}`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`Receipt ${sale.receiptId} from ${currentCompany.name}. Total: ${formatMoney(sale.finalTotal)}`);
      alert('Receipt summary copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-rose-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Actions Top Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-rose-100 bg-rose-50/50 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-rose-900 uppercase tracking-wider">Digital Receipt</span>
            {sale.status === 'Completed' && (
              <span className="px-2 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 rounded-full font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Paid
              </span>
            )}
            {sale.status.includes('Returned') && (
              <span className="px-2 py-0.5 text-[10px] bg-amber-100 text-amber-800 rounded-full font-semibold flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {sale.status === 'Returned_Full' ? 'Returned' : 'Partial Return'}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg bg-white hover:bg-rose-100/70 border border-rose-200 text-stone-700 transition-colors"
              title="Print Receipt"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={handleShare}
              className="p-1.5 rounded-lg bg-white hover:bg-rose-100/70 border border-rose-200 text-stone-700 transition-colors"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white hover:bg-rose-100/70 border border-rose-200 text-stone-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-stone-800 font-sans print:p-0">
          {/* Header */}
          <div className="text-center space-y-2 pb-5 border-b border-dashed border-rose-200">
            <img
              src={currentCompany.logoUrl}
              alt={currentCompany.name}
              className="w-14 h-14 mx-auto rounded-2xl object-cover ring-2 ring-rose-200/80 shadow-xs"
            />
            <h2 className="text-lg font-bold text-stone-900 tracking-tight">{currentCompany.name}</h2>
            <p className="text-xs text-stone-500 max-w-xs mx-auto">{currentCompany.description}</p>
            <div className="inline-block px-3 py-1 bg-rose-50 rounded-full text-xs font-mono font-semibold text-rose-700">
              {sale.receiptId}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-rose-50/40 p-3.5 rounded-2xl border border-rose-100/70">
            <div>
              <p className="text-stone-400 text-[10px] uppercase font-bold tracking-wider">Date & Time</p>
              <p className="font-semibold text-stone-800">{sale.date} at {sale.time}</p>
            </div>
            <div>
              <p className="text-stone-400 text-[10px] uppercase font-bold tracking-wider">Customer</p>
              <p className="font-semibold text-stone-800">{sale.customerName}</p>
              {sale.customerPhone && <p className="text-[10px] text-stone-500">{sale.customerPhone}</p>}
            </div>
            <div>
              <p className="text-stone-400 text-[10px] uppercase font-bold tracking-wider">Served By</p>
              <p className="font-semibold text-stone-800">{sale.createdByName}</p>
            </div>
            <div>
              <p className="text-stone-400 text-[10px] uppercase font-bold tracking-wider">Payment Status</p>
              <p className="font-semibold text-emerald-700">Paid in Cash / Card</p>
            </div>
          </div>

          {/* Itemized Table */}
          <div>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-rose-200 text-stone-400 uppercase text-[10px] font-bold">
                  <th className="pb-2">Item</th>
                  <th className="pb-2 text-center">Qty</th>
                  <th className="pb-2 text-right">Unit Price</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-100/60">
                {sale.items.map((item, idx) => (
                  <tr key={idx} className="py-2.5">
                    <td className="py-2 pr-2">
                      <p className="font-semibold text-stone-900">{item.productName}</p>
                      <span className="text-[10px] font-mono text-stone-400">SKU: {item.sku}</span>
                      {item.discountAmount > 0 && (
                        <p className="text-[10px] text-rose-600">Item Discount: -{formatMoney(item.discountAmount)}</p>
                      )}
                    </td>
                    <td className="py-2 text-center font-semibold text-stone-700">{item.quantity}</td>
                    <td className="py-2 text-right text-stone-600">{formatMoney(item.unitPrice)}</td>
                    <td className="py-2 text-right font-bold text-stone-900">{formatMoney(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="pt-3 border-t border-dashed border-rose-200 space-y-1.5 text-xs">
            <div className="flex justify-between text-stone-500">
              <span>Subtotal</span>
              <span>{formatMoney(sale.originalSubtotal)}</span>
            </div>
            {sale.discountAmount > 0 && (
              <div className="flex justify-between text-rose-600 font-medium">
                <span>Total Discount {sale.discountType === 'percent' ? `(${sale.discountValue}%)` : ''}</span>
                <span>-{formatMoney(sale.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold text-stone-900 pt-2 border-t border-rose-200">
              <span>Grand Total</span>
              <span className="text-rose-700">{formatMoney(sale.finalTotal)}</span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-4 border-t border-rose-100 space-y-1">
            <p className="text-xs font-semibold text-rose-800">
              {currentCompany.settings.receiptFooterMessage}
            </p>
            <p className="text-[10px] text-stone-400">
              Business Girls Management Suite • Authenticated Digital Ledger
            </p>
          </div>
        </div>

        {/* Footer Actions (Return option) */}
        {onOpenReturn && sale.status !== 'Returned_Full' && (
          <div className="p-4 border-t border-rose-100 bg-rose-50/30 flex justify-end print:hidden">
            <button
              onClick={() => {
                onClose();
                onOpenReturn(sale);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-100/50 text-xs font-semibold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Process Return / Refund</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

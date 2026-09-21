import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles, Plus, Calendar, CheckCircle2, Clock, Truck,
  ArrowRight, AlertCircle, PackagePlus, DollarSign, X
} from 'lucide-react';
import { ComingSoonProduct, ComingSoonStatus } from '../../types';

export const ComingSoonView: React.FC = () => {
  const { 
    state, currentCompany, currentUser, can, createComingSoonOrder, 
    addComingSoonToStock, updateComingSoonStatus, formatMoney 
  } = useApp();

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [productTypeChoice, setProductTypeChoice] = useState<'existing' | 'new'>('existing');
  
  // Order form state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [quantity, setQuantity] = useState(20);
  const [purchasePrice, setPurchasePrice] = useState(50);
  const [supplier, setSupplier] = useState('');
  const [expectedArrival, setExpectedArrival] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [destinationChoice, setDestinationChoice] = useState<'coming_soon' | 'direct_stock'>('coming_soon');
  const [statusFilter, setStatusFilter] = useState<string>('active');

  const comingSoonList = useMemo(() => {
    return state.comingSoon.filter(c => c.companyId === currentCompany.id);
  }, [state.comingSoon, currentCompany.id]);

  const filteredOrders = useMemo(() => {
    return comingSoonList.filter(item => {
      if (statusFilter === 'active') {
        return item.status !== 'Added to Stock' && item.status !== 'Cancelled';
      }
      if (statusFilter === 'all') return true;
      return item.status === statusFilter;
    });
  }, [comingSoonList, statusFilter]);

  const existingProducts = useMemo(() => {
    return state.products.filter(p => p.companyId === currentCompany.id);
  }, [state.products, currentCompany.id]);

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();

    let pName = newProductName;
    let pId: string | undefined = undefined;

    if (productTypeChoice === 'existing') {
      const prod = existingProducts.find(p => p.id === selectedProductId);
      if (!prod) return;
      pName = prod.name;
      pId = prod.id;
    }

    createComingSoonOrder({
      productId: pId,
      productName: pName,
      quantity,
      purchasePrice,
      supplier,
      expectedArrival: expectedArrival || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      notes,
      imageUrl: imageUrl || undefined,
      addImmediatelyToStock: destinationChoice === 'direct_stock'
    });

    setIsOrderModalOpen(false);
    setSelectedProductId('');
    setNewProductName('');
    setNotes('');
  };

  const getStatusBadge = (status: ComingSoonStatus) => {
    switch (status) {
      case 'Ordered': return 'bg-blue-100 text-blue-800';
      case 'On the Way': return 'bg-purple-100 text-purple-800';
      case 'Coming Soon': return 'bg-pink-100 text-pink-800';
      case 'Arrived': return 'bg-amber-100 text-amber-800';
      case 'Added to Stock': return 'bg-emerald-100 text-emerald-800';
      case 'Cancelled': return 'bg-stone-200 text-stone-700';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-rose-100 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-rose-500" />
            <span>Coming Soon & Product Pre-Orders</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Incoming inventory orders that remain unsellable until physically verified and added to live stock.
          </p>
        </div>

        {can('create_purchases') && (
          <button
            onClick={() => setIsOrderModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm shadow-rose-200 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Order Incoming Stock</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-white p-2.5 rounded-2xl border border-rose-100/80 shadow-xs overflow-x-auto">
        {[
          { id: 'active', label: 'Active Pipeline' },
          { id: 'all', label: 'All Orders' },
          { id: 'Coming Soon', label: 'Coming Soon' },
          { id: 'On the Way', label: 'On the Way' },
          { id: 'Arrived', label: 'Arrived (Pending Intake)' },
          { id: 'Added to Stock', label: 'Added to Stock' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === tab.id
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-stone-500 hover:text-stone-800 hover:bg-rose-50/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid of Coming Soon Orders */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full py-16 text-center text-stone-400 bg-white rounded-3xl border border-rose-100 p-8">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-rose-200" />
            <p className="text-xs font-semibold">No Coming Soon orders in this view.</p>
            <p className="text-[11px] text-stone-400 mt-1">Tap "+ Order Incoming Stock" to schedule incoming product batches.</p>
          </div>
        ) : (
          filteredOrders.map(item => {
            const isAdded = item.status === 'Added to Stock';

            return (
              <div
                key={item.id}
                className="bg-white p-4 rounded-3xl border border-rose-100 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(item.status)}`}>
                      {item.status}
                    </span>
                    <span className="text-[10px] text-stone-400">Ordered: {item.orderDate}</span>
                  </div>

                  <div className="flex gap-3">
                    <img
                      src={item.imageUrl || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=100&auto=format&fit=crop&q=80'}
                      alt=""
                      className="w-14 h-14 rounded-2xl object-cover ring-1 ring-rose-100 shrink-0"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 leading-snug">{item.productName}</h4>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Supplier: <span className="font-semibold text-stone-700">{item.supplier}</span>
                      </p>
                      <p className="text-[11px] text-stone-500">
                        Batch: <span className="font-bold text-rose-700">{item.quantity} units</span> @ {formatMoney(item.purchasePrice)}
                      </p>
                    </div>
                  </div>

                  {item.notes && (
                    <p className="text-[11px] text-stone-600 bg-rose-50/40 p-2 rounded-xl mt-2 italic">
                      "{item.notes}"
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-rose-50 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-stone-400">
                    <span>Expected Arrival:</span>
                    <span className="font-semibold text-stone-700">{item.expectedArrival}</span>
                  </div>

                  {/* Actions */}
                  {!isAdded && can('create_purchases') && (
                    <div className="flex items-center gap-2 pt-1">
                      <select
                        value={item.status}
                        onChange={e => updateComingSoonStatus(item.id, e.target.value as ComingSoonStatus)}
                        className="px-2 py-1.5 text-[11px] rounded-xl border border-rose-200 bg-white text-stone-700"
                      >
                        <option value="Ordered">Ordered</option>
                        <option value="On the Way">On the Way</option>
                        <option value="Coming Soon">Coming Soon</option>
                        <option value="Arrived">Arrived</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>

                      <button
                        onClick={() => {
                          const res = addComingSoonToStock(item.id);
                          if (!res.success) alert(res.error);
                        }}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <PackagePlus className="w-3.5 h-3.5" />
                        <span>Add to Stock</span>
                      </button>
                    </div>
                  )}

                  {isAdded && (
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 text-[11px] font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Transferred into live stock inventory</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Order Incoming Stock Modal */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-rose-100 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <div>
                <h3 className="font-bold text-stone-900 text-sm">Order Stock / Coming Soon</h3>
                <p className="text-[11px] text-stone-400">Add to Coming Soon or directly intake into live stock</p>
              </div>
              <button onClick={() => setIsOrderModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="mt-4 space-y-3.5 text-xs">
              {/* Product Choice: Existing vs New */}
              <div className="flex gap-2 p-1 bg-rose-50 rounded-xl border border-rose-100">
                <button
                  type="button"
                  onClick={() => setProductTypeChoice('existing')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${productTypeChoice === 'existing' ? 'bg-white text-rose-800 shadow-xs' : 'text-stone-500'}`}
                >
                  Existing Product
                </button>
                <button
                  type="button"
                  onClick={() => setProductTypeChoice('new')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${productTypeChoice === 'new' ? 'bg-white text-rose-800 shadow-xs' : 'text-stone-500'}`}
                >
                  New Product Line
                </button>
              </div>

              {productTypeChoice === 'existing' ? (
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Select Existing Product *</label>
                  <select
                    required
                    value={selectedProductId}
                    onChange={e => setSelectedProductId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-rose-200 bg-white"
                  >
                    <option value="">-- Choose Product --</option>
                    {existingProducts.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Current Stock: {p.quantity}, Avg Cost: {p.purchaseCost} {currentCompany.currency})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">New Product Title *</label>
                  <input
                    type="text"
                    required
                    value={newProductName}
                    onChange={e => setNewProductName(e.target.value)}
                    placeholder="e.g. Mulberry Silk Pillowcase (Blush)"
                    className="w-full px-3 py-2 rounded-xl border border-rose-200"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Quantity *</label>
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
                  <label className="block text-stone-700 font-semibold mb-1">Purchase Unit Cost ({currentCompany.currency}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={purchasePrice}
                    onChange={e => setPurchasePrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-rose-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Supplier *</label>
                  <input
                    type="text"
                    required
                    value={supplier}
                    onChange={e => setSupplier(e.target.value)}
                    placeholder="Supplier name"
                    className="w-full px-3 py-2 rounded-xl border border-rose-200"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Expected Arrival Date</label>
                  <input
                    type="date"
                    value={expectedArrival}
                    onChange={e => setExpectedArrival(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-rose-200"
                  />
                </div>
              </div>

              {/* Destination Choice: Add to Stock vs Coming Soon */}
              <div className="p-3 bg-rose-50/70 rounded-2xl border border-rose-100 space-y-2">
                <label className="block text-stone-800 font-bold">Intake Destination:</label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="destination"
                      value="coming_soon"
                      checked={destinationChoice === 'coming_soon'}
                      onChange={() => setDestinationChoice('coming_soon')}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span className="font-semibold text-stone-800">
                      Put in Coming Soon (Non-sellable pre-order pipeline)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="destination"
                      value="direct_stock"
                      checked={destinationChoice === 'direct_stock'}
                      onChange={() => setDestinationChoice('direct_stock')}
                      disabled={productTypeChoice === 'new'}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span className={`font-semibold ${productTypeChoice === 'new' ? 'text-stone-400' : 'text-stone-800'}`}>
                      Add Directly to Stock (Immediately sellable)
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Notes / Tracking</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Carrier shipment tracking or batch notes..."
                  className="w-full px-3 py-2 rounded-xl border border-rose-200"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-rose-100">
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-rose-200 text-stone-600 hover:bg-rose-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs"
                >
                  Confirm Order ({formatMoney(quantity * purchasePrice)})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

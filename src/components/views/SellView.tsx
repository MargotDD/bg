import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShoppingBag, Search, Plus, Minus, Trash2, UserCheck,
  Percent, DollarSign, AlertCircle, CheckCircle2, ShieldAlert,
  ArrowRight, Sparkles, Receipt, Filter
} from 'lucide-react';
import { Product, Customer } from '../../types';

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
}

export const SellView: React.FC = () => {
  const { 
    state, currentCompany, currentUser, createSale, formatMoney, 
    setSelectedReceipt, can 
  } = useApp();

  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [manualCustomerName, setManualCustomerName] = useState('Walk-in Guest');
  const [manualCustomerPhone, setManualCustomerPhone] = useState('');
  
  // Whole sale discount
  const [saleDiscountType, setSaleDiscountType] = useState<'none' | 'percent' | 'fixed'>('none');
  const [saleDiscountValue, setSaleDiscountValue] = useState<number>(0);
  const [saleNotes, setSaleNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [overrideBlockedCustomer, setOverrideBlockedCustomer] = useState(false);

  // Products belonging to this company
  const availableProducts = useMemo(() => {
    return state.products.filter(p => p.companyId === currentCompany.id);
  }, [state.products, currentCompany.id]);

  const categories = useMemo(() => {
    const cats = new Set(availableProducts.map(p => p.category).filter(Boolean));
    return ['All', ...Array.from(cats)];
  }, [availableProducts]);

  const filteredProducts = useMemo(() => {
    return availableProducts.filter(p => {
      const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchFilter.toLowerCase()) || 
                            p.sku.toLowerCase().includes(searchFilter.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [availableProducts, selectedCategory, searchFilter]);

  const currentCustomer: Customer | undefined = useMemo(() => {
    return state.customers.find(c => c.id === selectedCustomerId && c.companyId === currentCompany.id);
  }, [state.customers, selectedCustomerId, currentCompany.id]);

  const isCustomerBlocked = currentCustomer?.status === 'Blocked';

  // Add to cart
  const addToCart = (product: Product) => {
    setErrorMessage('');
    if (product.quantity <= 0 && !currentCompany.settings.allowNegativeStockSales) {
      setErrorMessage(`Product "${product.name}" is currently Out of Stock.`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity && !currentCompany.settings.allowNegativeStockSales) {
          setErrorMessage(`Cannot exceed available stock of ${product.quantity} for "${product.name}".`);
          return prev;
        }
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          unitPrice: product.sellingPrice,
          discountAmount: 0
        }
      ];
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setErrorMessage('');
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id !== productId) return item;
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        if (newQty > item.product.quantity && !currentCompany.settings.allowNegativeStockSales) {
          setErrorMessage(`Only ${item.product.quantity} available in stock for "${item.product.name}".`);
          return item;
        }
        return { ...item, quantity: newQty };
      }).filter(Boolean) as CartItem[];
    });
  };

  const updateItemDiscount = (productId: string, discount: number) => {
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, discountAmount: Math.max(0, discount) } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // Calculations
  const originalSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
  }, [cart]);

  const itemsCost = useMemo(() => {
    return cart.reduce((acc, item) => acc + ((item.product.purchaseCost || 0) * item.quantity), 0);
  }, [cart]);

  const itemsDiscounts = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.discountAmount, 0);
  }, [cart]);

  const saleDiscountAmount = useMemo(() => {
    if (saleDiscountType === 'percent' && saleDiscountValue > 0) {
      return (originalSubtotal * saleDiscountValue) / 100;
    }
    if (saleDiscountType === 'fixed' && saleDiscountValue > 0) {
      return saleDiscountValue;
    }
    return 0;
  }, [originalSubtotal, saleDiscountType, saleDiscountValue]);

  const totalDiscount = itemsDiscounts + saleDiscountAmount;
  const finalTotal = Math.max(0, originalSubtotal - totalDiscount);
  const estimatedProfit = finalTotal - itemsCost;

  // Checkout handler
  const handleCheckout = () => {
    setErrorMessage('');

    if (cart.length === 0) {
      setErrorMessage('Please add at least one product to the checkout cart.');
      return;
    }

    if (isCustomerBlocked && !overrideBlockedCustomer) {
      setErrorMessage(`Cannot complete sale: Customer ${currentCustomer?.name} is BLOCKED. An admin must override to continue.`);
      return;
    }

    const salePayload = {
      customerId: selectedCustomerId || undefined,
      customerName: currentCustomer ? currentCustomer.name : manualCustomerName,
      customerPhone: currentCustomer ? currentCustomer.phone : manualCustomerPhone,
      items: cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount: item.discountAmount
      })),
      discountType: saleDiscountType,
      discountValue: saleDiscountValue,
      notes: saleNotes.trim() || undefined
    };

    const result = createSale(salePayload);
    if (!result.success) {
      setErrorMessage(result.error || 'Failed to complete sale.');
      return;
    }

    // Reset POS cart
    setCart([]);
    setSelectedCustomerId('');
    setManualCustomerName('Walk-in Guest');
    setManualCustomerPhone('');
    setSaleDiscountType('none');
    setSaleDiscountValue(0);
    setSaleNotes('');
    setOverrideBlockedCustomer(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-16">
      
      {/* LEFT: Product Catalog & Fast Select (7 cols) */}
      <div className="lg:col-span-7 space-y-4">
        {/* Search & Category Filter Bar */}
        <div className="bg-white p-4 rounded-3xl border border-rose-100/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                placeholder="Search products by title or SKU..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-rose-50/50 border border-rose-100/80 text-xs focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 text-stone-800"
              />
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-rose-600 text-white shadow-xs shadow-rose-200'
                    : 'bg-rose-50/70 text-stone-600 hover:bg-rose-100/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredProducts.map(product => {
            const isOutOfStock = product.quantity <= 0;
            const inCart = cart.find(i => i.product.id === product.id);

            return (
              <div
                key={product.id}
                onClick={() => addToCart(product)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer select-none relative group flex flex-col justify-between ${
                  isOutOfStock
                    ? 'bg-stone-50/70 border-stone-200 opacity-60'
                    : inCart
                    ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-300/40 shadow-xs'
                    : 'bg-white border-rose-100 hover:border-rose-300 hover:shadow-xs'
                }`}
              >
                <div>
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-rose-50 mb-2">
                    <img
                      src={product.imageUrl || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&auto=format&fit=crop&q=80'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 text-[9px] font-bold rounded-md ${
                      product.quantity <= 0
                        ? 'bg-stone-800 text-white'
                        : product.quantity <= product.minimumStock
                        ? 'bg-amber-500 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}>
                      {product.quantity} left
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-stone-900 line-clamp-1 leading-snug">{product.name}</h4>
                  <p className="text-[10px] text-stone-400 font-mono mt-0.5">{product.sku}</p>
                </div>

                <div className="mt-2 pt-2 border-t border-rose-50 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-rose-700">
                    {formatMoney(product.sellingPrice)}
                  </span>
                  {inCart && (
                    <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {inCart.quantity}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: POS Cart & Checkout Terminal (5 cols) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white p-5 rounded-3xl border border-rose-100 shadow-xs space-y-4 sticky top-20">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-rose-100">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-rose-600" />
              <h3 className="font-bold text-sm text-stone-900">Current Order</h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
              {cart.reduce((a, c) => a + c.quantity, 0)} items
            </span>
          </div>

          {/* Customer Selection */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">Customer</label>
            <div className="flex gap-2">
              <select
                value={selectedCustomerId}
                onChange={e => {
                  setSelectedCustomerId(e.target.value);
                  setOverrideBlockedCustomer(false);
                }}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-rose-200 focus:ring-2 focus:ring-rose-400/20 text-stone-800 bg-white"
              >
                <option value="">Walk-in Guest / Quick Sale</option>
                {state.customers.filter(c => c.companyId === currentCompany.id).map(cust => (
                  <option key={cust.id} value={cust.id}>
                    {cust.name} {cust.isVip ? '★ VIP' : ''} {cust.status === 'Blocked' ? '⚠️ BLOCKED' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Blocked Warning */}
            {isCustomerBlocked && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-2">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Customer is Blocked!</span>
                    <p className="text-[11px] mt-0.5 text-red-700">
                      Reason: {currentCustomer?.currentRestrictionReason || 'Restriction on file.'}
                    </p>
                  </div>
                </div>
                {can('create_admin_spending') && (
                  <label className="flex items-center gap-2 text-[11px] font-semibold text-red-900 cursor-pointer pt-1 border-t border-red-100">
                    <input
                      type="checkbox"
                      checked={overrideBlockedCustomer}
                      onChange={e => setOverrideBlockedCustomer(e.target.checked)}
                      className="rounded text-red-600 focus:ring-red-500"
                    />
                    <span>Authorized Admin Override (Proceed with Caution)</span>
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-rose-50 pr-1 space-y-1">
            {cart.length === 0 ? (
              <div className="py-8 text-center text-stone-400 space-y-1">
                <ShoppingBag className="w-8 h-8 mx-auto text-rose-200" />
                <p className="text-xs">Cart is empty. Tap products to add.</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.product.id} className="py-2.5 flex items-center justify-between text-xs gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-900 truncate">{item.product.name}</p>
                    <p className="text-[10px] text-stone-400">{formatMoney(item.unitPrice)} each</p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-1.5 bg-rose-50/70 p-1 rounded-xl border border-rose-100">
                    <button
                      onClick={() => updateCartQty(item.product.id, -1)}
                      className="w-5 h-5 rounded-lg bg-white text-stone-600 flex items-center justify-center hover:bg-rose-100"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-bold text-stone-800 text-xs">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQty(item.product.id, 1)}
                      className="w-5 h-5 rounded-lg bg-white text-stone-600 flex items-center justify-center hover:bg-rose-100"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Subtotal & Delete */}
                  <div className="text-right flex items-center gap-2">
                    <span className="font-bold text-stone-900">
                      {formatMoney((item.unitPrice * item.quantity) - item.discountAmount)}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-stone-300 hover:text-red-500 p-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Discount Controls */}
          <div className="pt-2 border-t border-rose-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-stone-600">Sale Discount</span>
              <div className="flex items-center gap-1 bg-rose-50 p-0.5 rounded-lg border border-rose-100">
                <button
                  onClick={() => { setSaleDiscountType('none'); setSaleDiscountValue(0); }}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold ${saleDiscountType === 'none' ? 'bg-white shadow-xs text-rose-700' : 'text-stone-500'}`}
                >
                  None
                </button>
                <button
                  onClick={() => setSaleDiscountType('percent')}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold ${saleDiscountType === 'percent' ? 'bg-white shadow-xs text-rose-700' : 'text-stone-500'}`}
                >
                  % Off
                </button>
                <button
                  onClick={() => setSaleDiscountType('fixed')}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold ${saleDiscountType === 'fixed' ? 'bg-white shadow-xs text-rose-700' : 'text-stone-500'}`}
                >
                  Amount
                </button>
              </div>
            </div>

            {saleDiscountType !== 'none' && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max={saleDiscountType === 'percent' ? 100 : originalSubtotal}
                  value={saleDiscountValue || ''}
                  onChange={e => setSaleDiscountValue(parseFloat(e.target.value) || 0)}
                  placeholder={saleDiscountType === 'percent' ? 'Enter percentage (e.g. 10%)' : 'Enter amount in MAD'}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-rose-200 focus:outline-hidden text-stone-800"
                />
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <input
              type="text"
              value={saleNotes}
              onChange={e => setSaleNotes(e.target.value)}
              placeholder="Sale notes (optional: gift wrapping, rush dispatch...)"
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-rose-100 focus:ring-1 focus:ring-rose-300 text-stone-700 placeholder:text-stone-400"
            />
          </div>

          {/* Pre-Confirmation Breakdown */}
          <div className="bg-rose-50/50 p-3.5 rounded-2xl border border-rose-100 text-xs space-y-1.5">
            <div className="flex justify-between text-stone-500">
              <span>Original Subtotal</span>
              <span>{formatMoney(originalSubtotal)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-rose-600 font-semibold">
                <span>Discount Applied</span>
                <span>-{formatMoney(totalDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-stone-500 text-[11px]">
              <span>Estimated Cost of Goods</span>
              <span>{formatMoney(itemsCost)}</span>
            </div>
            <div className="flex justify-between text-emerald-700 text-[11px] font-semibold">
              <span>Estimated Profit</span>
              <span>+{formatMoney(estimatedProfit)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-stone-900 pt-2 border-t border-rose-200">
              <span>Final Total</span>
              <span className="text-rose-700">{formatMoney(finalTotal)}</span>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Confirm & Checkout Button */}
          <button
            id="pos-confirm-sale-btn"
            onClick={handleCheckout}
            disabled={cart.length === 0 || (isCustomerBlocked && !overrideBlockedCustomer)}
            className={`w-full py-3 rounded-2xl text-xs font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 ${
              cart.length === 0 || (isCustomerBlocked && !overrideBlockedCustomer)
                ? 'bg-stone-300 cursor-not-allowed'
                : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200 active:scale-98'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm & Generate Digital Receipt ({formatMoney(finalTotal)})</span>
          </button>
        </div>
      </div>
    </div>
  );
};

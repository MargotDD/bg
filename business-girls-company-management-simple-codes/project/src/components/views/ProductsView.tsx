import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Package, Plus, Search, Star, Edit3, Trash2, AlertTriangle, 
  History, DollarSign, X, Check, Filter, ArrowUpDown
} from 'lucide-react';
import { Product, StockStatus } from '../../types';

export const ProductsView: React.FC = () => {
  const { 
    state, currentCompany, can, createProduct, updateProduct, 
    deleteProduct, toggleProductFavorite, formatMoney 
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewHistoryProduct, setViewHistoryProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Skincare',
    sku: '',
    purchaseCost: 0,
    sellingPrice: 0,
    quantity: 0,
    minimumStock: 5,
    supplier: '',
    imageUrl: '',
    notes: '',
    isFavorite: false
  });

  const products = useMemo(() => {
    return state.products.filter(p => p.companyId === currentCompany.id);
  }, [state.products, currentCompany.id]);

  const categories = useMemo(() => {
    const set = new Set(products.map(p => p.category).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
      const matchStatus = selectedStatus === 'All' || p.stockStatus === selectedStatus;
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      return matchSearch && matchStatus && matchCat;
    });
  }, [products, search, selectedStatus, selectedCategory]);

  const openNewProductModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      category: 'Skincare',
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      purchaseCost: 0,
      sellingPrice: 0,
      quantity: 0,
      minimumStock: 5,
      supplier: '',
      imageUrl: '',
      notes: '',
      isFavorite: false
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      description: p.description,
      category: p.category,
      sku: p.sku,
      purchaseCost: p.purchaseCost,
      sellingPrice: p.sellingPrice,
      quantity: p.quantity,
      minimumStock: p.minimumStock,
      supplier: p.supplier,
      imageUrl: p.imageUrl || '',
      notes: p.notes || '',
      isFavorite: p.isFavorite
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        sku: formData.sku,
        sellingPrice: formData.sellingPrice,
        quantity: formData.quantity,
        minimumStock: formData.minimumStock,
        supplier: formData.supplier,
        imageUrl: formData.imageUrl || undefined,
        notes: formData.notes
      });
    } else {
      createProduct({
        name: formData.name,
        description: formData.description,
        category: formData.category,
        sku: formData.sku,
        purchaseCost: formData.purchaseCost,
        sellingPrice: formData.sellingPrice,
        quantity: formData.quantity,
        minimumStock: formData.minimumStock,
        supplier: formData.supplier,
        imageUrl: formData.imageUrl || undefined,
        notes: formData.notes,
        isFavorite: formData.isFavorite,
        initialUnitCost: formData.purchaseCost
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-rose-100 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">Products & Stock Inventory</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Weighted Average Cost accounting & automated stock status tracking.
          </p>
        </div>

        {can('create_edit_delete_products') && (
          <button
            id="add-product-btn"
            onClick={openNewProductModal}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm shadow-rose-200 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-3xl border border-rose-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name or SKU..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-rose-100 bg-rose-50/40 text-xs text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-rose-400/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-rose-100 text-xs font-medium text-stone-700 bg-rose-50/40"
          >
            <option value="All">All Statuses</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-rose-100 text-xs font-medium text-stone-700 bg-rose-50/40"
          >
            {categories.map(c => (
              <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table (Desktop) / Cards (Mobile) */}
      <div className="bg-white rounded-3xl border border-rose-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-rose-100 bg-rose-50/40 text-stone-400 uppercase text-[10px] font-bold">
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Stock Level</th>
                <th className="py-3 px-3 text-right">Avg Cost</th>
                <th className="py-3 px-3 text-right">Selling Price</th>
                <th className="py-3 px-3 text-right">Margin</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50">
              {filteredProducts.map(prod => {
                const margin = prod.sellingPrice > 0 
                  ? Math.round(((prod.sellingPrice - prod.purchaseCost) / prod.sellingPrice) * 100) 
                  : 0;

                return (
                  <tr key={prod.id} className="hover:bg-rose-50/30 transition-colors">
                    <td className="py-3 px-4 flex items-center gap-3">
                      <button
                        onClick={() => toggleProductFavorite(prod.id)}
                        className={`p-1 rounded-md ${prod.isFavorite ? 'text-amber-500' : 'text-stone-300 hover:text-amber-400'}`}
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                      </button>
                      <img
                        src={prod.imageUrl || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=100&auto=format&fit=crop&q=80'}
                        alt=""
                        className="w-10 h-10 rounded-xl object-cover ring-1 ring-rose-100"
                      />
                      <div>
                        <p className="font-bold text-stone-900">{prod.name}</p>
                        <p className="text-[10px] text-stone-400">{prod.supplier || 'No supplier listed'}</p>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono text-stone-500">{prod.sku}</td>
                    
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold text-[10px]">
                        {prod.category}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          prod.stockStatus === 'Out of Stock'
                            ? 'bg-stone-800 text-white'
                            : prod.stockStatus === 'Low Stock'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {prod.quantity} in stock
                        </span>
                        {prod.quantity <= prod.minimumStock && (
                          <span className="text-[10px] text-stone-400">(Min: {prod.minimumStock})</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-medium text-stone-600">
                      {formatMoney(prod.purchaseCost)}
                    </td>

                    <td className="py-3 px-3 text-right font-bold text-stone-900">
                      {formatMoney(prod.sellingPrice)}
                    </td>

                    <td className="py-3 px-3 text-right font-semibold text-emerald-600">
                      {margin}%
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setViewHistoryProduct(prod)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="View Weighted Cost Purchase History"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                        {can('create_edit_delete_products') && (
                          <>
                            <button
                              onClick={() => openEditModal(prod)}
                              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Edit Product"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete product "${prod.name}"?`)) {
                                  deleteProduct(prod.id);
                                }
                              }}
                              className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Purchases & Weighted Average Modal */}
      {viewHistoryProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-rose-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <div>
                <h3 className="font-bold text-stone-900 text-sm">{viewHistoryProduct.name}</h3>
                <p className="text-xs text-stone-400">Historical Purchases & Weighted Average Cost Ledger</p>
              </div>
              <button onClick={() => setViewHistoryProduct(null)} className="p-1 text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-rose-50/50 p-3.5 rounded-2xl border border-rose-100 text-xs flex justify-between items-center">
              <div>
                <span className="text-stone-500">Current Calculated WAC:</span>
                <p className="text-base font-extrabold text-rose-700">{formatMoney(viewHistoryProduct.purchaseCost)}</p>
              </div>
              <div className="text-right">
                <span className="text-stone-500">Total Batches:</span>
                <p className="font-bold text-stone-800">{viewHistoryProduct.purchaseHistory.length}</p>
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {viewHistoryProduct.purchaseHistory.length === 0 ? (
                <p className="text-xs text-stone-400 text-center py-6">No historical purchase batches logged yet.</p>
              ) : (
                viewHistoryProduct.purchaseHistory.map(ph => (
                  <div key={ph.id} className="p-3 rounded-xl border border-rose-100 bg-white flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-stone-800">{ph.quantity} units @ {formatMoney(ph.unitCost)}</span>
                      <p className="text-[10px] text-stone-400">{ph.date} • {ph.supplier}</p>
                      {ph.notes && <p className="text-[10px] text-stone-500 italic mt-0.5">{ph.notes}</p>}
                    </div>
                    <span className="font-mono font-semibold text-stone-700">
                      {formatMoney(ph.quantity * ph.unitCost)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-rose-100 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <h3 className="font-bold text-stone-900 text-sm">
                {editingProduct ? 'Edit Product Details' : 'Add New Product to Catalog'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-rose-200 focus:ring-2 focus:ring-rose-400/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">SKU / Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-rose-200"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Category *</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Skincare, Makeup, Hair"
                    className="w-full px-3 py-2 rounded-xl border border-rose-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Selling Price ({currentCompany.currency}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.sellingPrice || ''}
                    onChange={e => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-rose-200 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Initial Unit Purchase Cost *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.purchaseCost || ''}
                    onChange={e => setFormData({ ...formData, purchaseCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-rose-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Quantity in Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-rose-200"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Minimum Stock Threshold</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minimumStock}
                    onChange={e => setFormData({ ...formData, minimumStock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-rose-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Supplier</label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="e.g. Atlas Botanics Ltd"
                  className="w-full px-3 py-2 rounded-xl border border-rose-200"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Image URL</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
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
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

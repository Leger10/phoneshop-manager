import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { formatCurrency } from '../utils';

interface Product { id: number; name: string; brand: string; model: string; price: number; stock: number; }
interface CartItem { product: Product; quantity: number; }

export default function NewSale() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [clientId, setClientId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await api.get(`/products?search=${search}&per_page=50`);
      setProducts(res.data.data || []);
    } catch {} finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    const existing = cart.find(i => i.product.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) return;
      setCart(cart.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateQty = (id: number, delta: number) => {
    setCart(cart.map(i => {
      if (i.product.id === id) {
        const q = i.quantity + delta;
        if (q <= 0) return null;
        if (q > i.product.stock) return i;
        return { ...i, quantity: q };
      }
      return i;
    }).filter(Boolean) as CartItem[]);
  };

  const removeItem = (id: number) => setCart(cart.filter(i => i.product.id !== id));
  const total = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);

  const handleSale = async () => {
    if (!cart.length) return;
    setSubmitting(true);
    try {
      await api.post('/sales', {
        client_id: clientId || null,
        payment_method: paymentMethod,
        items: cart.map(i => ({ product_id: i.product.id, quantity: i.quantity })),
      });
      navigate('/sales');
    } catch {} finally { setSubmitting(false); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Nouvelle Vente</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
            <input
              type="text" placeholder="Rechercher un produit..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={4} className="text-center py-8 text-gray-500">Chargement...</td></tr>
                ) : products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3"><div className="font-medium">{p.name}</div><div className="text-sm text-gray-500">{p.brand} {p.model}</div></td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(p.price)}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${p.stock <= 5 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{p.stock}</span></td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => addToCart(p)} className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700" disabled={p.stock <= 0}>Ajouter</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-fit sticky top-24">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Panier</h2>
          {cart.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Panier vide</p>
          ) : (
            <>
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.product.name}</p>
                      <p className="text-xs text-gray-500">{formatCurrency(item.product.price)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(item.product.id, -1)} className="w-7 h-7 rounded bg-gray-200 text-sm font-bold">-</button>
                      <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQty(item.product.id, 1)} className="w-7 h-7 rounded bg-gray-200 text-sm font-bold">+</button>
                      <button onClick={() => removeItem(item.product.id)} className="text-red-500 text-sm ml-1">✕</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 mb-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-green-600">{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Paiement</label>
                <div className="grid grid-cols-4 gap-2">
                  {['cash', 'card', 'mobile', 'transfer'].map((m) => (
                    <button key={m} onClick={() => setPaymentMethod(m)}
                      className={`py-2 rounded-lg text-xs font-semibold border ${paymentMethod === m ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                      {m === 'cash' ? 'Cash' : m === 'card' ? 'Carte' : m === 'mobile' ? 'Mobile' : 'Virement'}
                    </button>
                  ))}
                </div>
              </div>

              <input type="text" placeholder="ID Client (optionnel)" value={clientId} onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:ring-2 focus:ring-blue-500 outline-none" />

              <button onClick={handleSale} disabled={submitting || cart.length === 0}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50">
                {submitting ? 'Enregistrement...' : 'Enregistrer la vente'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

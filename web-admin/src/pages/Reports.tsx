import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { formatCurrency } from '../utils';

interface SalesReport { sales_by_date: { date: string; total: number; count: number }[]; sales_by_payment: { payment_method: string; total: number; count: number }[]; }
interface ProductsReport { top_products: { id: number; name: string; brand: string; total_sold: number }[]; low_stock_products: { id: number; name: string; stock: number; category: { name: string } }[]; }

const paymentLabels: Record<string, string> = { cash: 'Cash', card: 'Carte', mobile: 'Mobile', transfer: 'Virement' };

export default function Reports() {
  const [tab, setTab] = useState<'sales' | 'products'>('sales');
  const [period, setPeriod] = useState('month');
  const [salesData, setSalesData] = useState<SalesReport | null>(null);
  const [productsData, setProductsData] = useState<ProductsReport | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, p] = await Promise.all([
        api.get(`/reports/sales?period=${period}`),
        api.get('/reports/products'),
      ]);
      setSalesData(s.data);
      setProductsData(p.data);
    } catch {} finally { setLoading(false); }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Rapports</h1>

      <div className="flex gap-2 mb-6">
        {(['sales', 'products'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg font-medium text-sm ${tab === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}>
            {t === 'sales' ? 'Ventes' : 'Produits'}
          </button>
        ))}
      </div>

      {loading && <p className="text-gray-500 text-center py-8">Chargement...</p>}

      {!loading && tab === 'sales' && (
        <div className="space-y-6">
          <div className="flex gap-2 mb-4">
            {(['week', 'month', 'year'] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${period === p ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                {p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : 'Année'}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Ventes par jour</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-medium text-gray-500">Date</th>
                    <th className="text-right py-2 font-medium text-gray-500">Total</th>
                    <th className="text-right py-2 font-medium text-gray-500">Transactions</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData?.sales_by_date?.map((d, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-2 text-gray-800">{d.date}</td>
                      <td className="py-2 text-right font-semibold text-green-600">{formatCurrency(d.total)}</td>
                      <td className="py-2 text-right text-gray-600">{d.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Par mode de paiement</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {salesData?.sales_by_payment?.map((p) => (
                <div key={p.payment_method} className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">{paymentLabels[p.payment_method] || p.payment_method}</p>
                  <p className="text-xl font-bold text-gray-800 mt-1">{formatCurrency(p.total)}</p>
                  <p className="text-xs text-gray-400">{p.count} vente(s)</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!loading && tab === 'products' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Top 10 Produits vendus</h2>
            <div className="space-y-3">
              {productsData?.top_products?.map((p, i) => (
                <div key={p.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <span className="text-lg font-bold text-blue-600 w-8">#{i + 1}</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{p.name}</p>
                    <p className="text-sm text-gray-500">{p.brand}</p>
                  </div>
                  <span className="font-bold text-gray-800">{p.total_sold} vendu(s)</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Stock bas</h2>
            <div className="space-y-3">
              {productsData?.low_stock_products?.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{p.name}</p>
                    <p className="text-sm text-gray-500">{p.category?.name}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${p.stock === 0 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {p.stock}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

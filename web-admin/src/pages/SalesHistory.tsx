import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils';

interface Sale {
  id: number; total: number; payment_method: string; status: string; created_at: string;
  client: { name: string } | null; user: { name: string };
  items: { product: { name: string }; quantity: number; subtotal: number }[];
}

const paymentLabels: Record<string, string> = { cash: 'Cash', card: 'Carte', mobile: 'Mobile', transfer: 'Virement' };

export default function SalesHistory() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try { const res = await api.get('/sales'); setSales(res.data.data || []); }
    catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Historique des Ventes</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Articles</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paiement</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">Chargement...</td></tr>
            ) : sales.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">Aucune vente</td></tr>
            ) : sales.map((sale) => (
              <tr key={sale.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-800">#{sale.id}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{sale.client?.name || 'Anonyme'}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {sale.items?.map((i, idx) => (
                    <span key={idx}>{i.quantity}x {i.product?.name}{idx < sale.items.length - 1 ? ', ' : ''}</span>
                  ))}
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                    {paymentLabels[sale.payment_method] || sale.payment_method}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{formatDate(sale.created_at)}</td>
                <td className="px-6 py-4 text-right font-bold text-green-600">{formatCurrency(sale.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

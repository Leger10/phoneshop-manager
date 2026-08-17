import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formatCurrency } from '../utils';

interface DashboardData {
  today_sales: number;
  month_sales: number;
  total_products: number;
  low_stock_products: number;
  total_clients: number;
  total_employees: number;
  today_transactions: number;
  recent_sales: any[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/reports/dashboard');
      setData(res.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div className="flex justify-center items-center h-64"><div className="text-gray-500">Chargement...</div></div>;

  const stats = [
    { label: "Ventes aujourd'hui", value: formatCurrency(data?.today_sales || 0), color: 'bg-blue-500', icon: '💰' },
    { label: 'Ce mois', value: formatCurrency(data?.month_sales || 0), color: 'bg-green-500', icon: '📈' },
    { label: 'Produits', value: String(data?.total_products || 0), color: 'bg-orange-500', icon: '📦' },
    { label: 'Stock bas', value: String(data?.low_stock_products || 0), color: 'bg-red-500', icon: '⚠️' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tableau de bord</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{stat.icon}</span>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <p className="text-sm text-gray-500">Transactions</p>
          <p className="text-3xl font-bold text-blue-600">{data?.today_transactions || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <p className="text-sm text-gray-500">Clients</p>
          <p className="text-3xl font-bold text-green-600">{data?.total_clients || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <p className="text-sm text-gray-500">Employés actifs</p>
          <p className="text-3xl font-bold text-purple-600">{data?.total_employees || 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Ventes récentes</h2>
          <Link to="/sales" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            Voir tout →
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {data?.recent_sales?.length ? (
            data.recent_sales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="font-medium text-gray-800">{sale.client?.name || 'Client anonyme'}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(sale.created_at).toLocaleDateString('fr-FR')} · {sale.user?.name}
                  </p>
                </div>
                <span className="font-bold text-green-600">{formatCurrency(sale.total)}</span>
              </div>
            ))
          ) : (
            <p className="p-6 text-center text-gray-500">Aucune vente récente</p>
          )}
        </div>
      </div>
    </div>
  );
}

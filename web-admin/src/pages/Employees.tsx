import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { formatDate } from '../utils';

interface Employee {
  id: number; boutique_name: string; phone: string; salary: number;
  hire_date: string; status: string;
  user: { id: number; name: string; email: string };
}

const emptyForm = { name: '', email: '', password: '', boutique_name: '', phone: '', salary: '', hire_date: '' };

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try { const res = await api.get(`/employees?search=${search}`); setEmployees(res.data.data || []); }
    catch {} finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/employees', { ...form, salary: form.salary ? parseFloat(form.salary) : null });
      setShowModal(false); setForm(emptyForm); fetchData();
    } catch {} finally { setSaving(false); }
  };

  const handleDeactivate = async (id: number) => {
    if (!confirm('Désactiver cet employé ?')) return;
    try { await api.delete(`/employees/${id}`); fetchData(); } catch {}
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Employés</h1>
        <button onClick={() => { setForm(emptyForm); setShowModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">
          + Nouvel employé
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 p-4">
        <input type="text" placeholder="Rechercher un employé..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="text-center text-gray-500 col-span-full py-8">Chargement...</p>
        ) : employees.length === 0 ? (
          <p className="text-center text-gray-500 col-span-full py-8">Aucun employé trouvé</p>
        ) : employees.map((e) => (
          <div key={e.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-gray-800">{e.user.name}</h3>
                <p className="text-sm text-gray-500">{e.user.email}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${e.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {e.status === 'active' ? 'Actif' : 'Inactif'}
              </span>
            </div>
            <div className="space-y-1 text-sm text-gray-600 mb-4">
              <p>Boutique: <span className="font-medium">{e.boutique_name}</span></p>
              {e.phone && <p>Tel: {e.phone}</p>}
              <p>Embauché: {formatDate(e.hire_date)}</p>
            </div>
            {e.status === 'active' && (
              <button onClick={() => handleDeactivate(e.id)} className="w-full py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50">
                Désactiver
              </button>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">Nouvel employé</h2>
            </div>
            <div className="p-6 space-y-4">
              {[
                { key: 'name', label: 'Nom complet' },
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'password', label: 'Mot de passe', type: 'password' },
                { key: 'boutique_name', label: 'Nom de la boutique' },
                { key: 'phone', label: 'Téléphone' },
                { key: 'salary', label: 'Salaire', type: 'number' },
                { key: 'hire_date', label: 'Date d\'embauche (YYYY-MM-DD)' },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                  <input
                    type={(field as any).type || 'text'}
                    value={(form as any)[field.key]}
                    onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Annuler</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

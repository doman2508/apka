import { useEffect, useMemo, useState } from 'react';

function formatQuantity(value) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

export default function App() {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch('/api/materials-summary');
        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }
        const data = await response.json();
        setRows(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredRows = useMemo(() => {
    const normalizedFilter = filter.trim().toLowerCase();
    if (!normalizedFilter) {
      return rows;
    }
    return rows.filter((row) => row.Name.toLowerCase().includes(normalizedFilter));
  }, [rows, filter]);

  return (
    <main className="min-h-screen bg-slate-100 py-10 px-4">
      <div className="mx-auto max-w-5xl rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
        <header className="border-b border-slate-200 p-6">
          <h1 className="text-2xl font-semibold text-slate-900">Materials Stock Overview</h1>
          <p className="mt-1 text-sm text-slate-600">Data source: dbo_Materials + dbo_LogisticUnits (wms3)</p>
          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Filter by material name</span>
            <input
              type="text"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Type a name..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-blue-200 transition focus:border-blue-500 focus:ring"
            />
          </label>
        </header>

        <section className="p-6">
          {loading && <p className="text-sm text-slate-600">Loading data...</p>}
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          {!loading && !error && (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Reference</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Name</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">Total Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                        No matching materials found.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row) => (
                      <tr key={row.Id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-700">{row.Reference}</td>
                        <td className="px-4 py-3 text-slate-900">{row.Name}</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">{formatQuantity(row.TotalQuantity)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

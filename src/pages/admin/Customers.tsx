import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { maskMobile } from '../../utils/api';

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('kartal_token');

  useEffect(() => {
    fetch('/api/customers', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(d => setCustomers(Array.isArray(d) ? d : [])).catch(() => setCustomers([])).finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.mobile?.includes(search) || c.address?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header"><h1>Customers</h1><p>All customers who have participated in lucky draws.</p></div>
      <input className="input" placeholder="Search by name, mobile or address..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: '20px' }} />
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Mobile</th><th>Address</th><th>Tickets</th><th></th></tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/customers/${c.id}`)}>
                  <td style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{c.name}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{c.mobile}</td>
                  <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.address || '—'}</td>
                  <td><span style={{ color: 'var(--accent)', fontWeight: '700' }}>{c.ticket_count || 0}</span></td>
                  <td><button className="btn btn-ghost btn-sm">View →</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

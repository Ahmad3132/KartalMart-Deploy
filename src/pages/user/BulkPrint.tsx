import React, { useState, useEffect } from 'react';
import { maskMobile } from '../../utils/api';
import { QRCodeSVG } from 'qrcode.react';

export default function BulkPrint() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const token = localStorage.getItem('kartal_token');

  useEffect(() => {
    fetch('/api/tickets?limit=200', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(d => setTickets(Array.isArray(d.tickets) ? d.tickets : [])).catch(() => setTickets([])).finally(() => setLoading(false));
  }, []);

  const filtered = tickets.filter(t => !search || t.ticket_id?.toLowerCase().includes(search.toLowerCase()) || t.name?.toLowerCase().includes(search.toLowerCase()));

  const toggleSelect = (id: number) => {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };

  const selectAll = () => setSelected(new Set(filtered.map(t => t.id)));
  const clearAll = () => setSelected(new Set());

  const printSelected = () => {
    const toPrint = tickets.filter(t => selected.has(t.id));
    if (toPrint.length === 0) return alert('Select at least one ticket.');
    const w = window.open('', '_blank');
    if (!w) return;
    const ticketHTML = toPrint.map(t => `
      <div style="display:inline-block;border:2px solid #333;padding:16px;margin:8px;text-align:center;width:180px;font-family:monospace;">
        <div style="font-size:10px;font-weight:bold">KARTAL LUCKY DRAW</div>
        <div style="font-size:18px;font-weight:bold;margin:8px 0">${t.ticket_id}</div>
        <div style="font-size:11px">${t.name}</div>
        <div style="font-size:10px;color:#666">${t.mobile}</div>
      </div>
    `).join('');
    w.document.write(`<html><body>${ticketHTML}<script>window.print();window.close();</script></body></html>`);
    w.document.close();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div><h1 style={{ fontFamily: 'Syne', fontSize: '26px', fontWeight: '800' }}>Bulk Print</h1><p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '3px' }}>Select tickets and print them all at once.</p></div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost btn-sm" onClick={selectAll}>Select All</button>
          <button className="btn btn-ghost btn-sm" onClick={clearAll}>Clear</button>
          <button className="btn btn-primary" onClick={printSelected} disabled={selected.size === 0}>
            🖨 Print {selected.size > 0 ? `(${selected.size})` : ''}
          </button>
        </div>
      </div>

      <input className="input" placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: '20px' }} />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
          {filtered.map(t => (
            <div key={t.id}
              onClick={() => toggleSelect(t.id)}
              style={{
                background: selected.has(t.id) ? 'var(--accent-soft)' : 'var(--bg-card)',
                border: `2px solid ${selected.has(t.id) ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: '12px', padding: '16px', textAlign: 'center', cursor: 'pointer',
                transition: 'all 0.15s'
              }}>
              <QRCodeSVG value={t.ticket_id} size={70} style={{ marginBottom: '8px' }} />
              <div style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: '700', color: 'var(--accent)' }}>{t.ticket_id}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{t.name}</div>
              {selected.has(t.id) && <div style={{ marginTop: '6px', color: 'var(--accent)', fontSize: '16px' }}>✓</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

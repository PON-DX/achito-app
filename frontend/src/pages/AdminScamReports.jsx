import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ScamReportCard, StatusBadge } from '../components/ScamReport';

const TABS = [
  { key: 'pending', label: 'รอตรวจสอบ' },
  { key: 'approved', label: 'อนุมัติแล้ว' },
  { key: 'rejected', label: 'ไม่อนุมัติ' },
];

function ReviewActions({ report, onDone }) {
  const [note, setNote] = useState(report.admin_note || '');
  const [busy, setBusy] = useState(false);

  const run = async (fn) => {
    setBusy(true);
    try { await fn(); onDone(); }
    catch (err) { alert(err.response?.data?.error || 'ดำเนินการไม่สำเร็จ'); }
    finally { setBusy(false); }
  };

  const setStatus = (status) => run(() => axios.patch(`/api/scam-reports/${report.id}/status`, { status, admin_note: note }));
  const remove = () => {
    if (!window.confirm('ลบรายงานนี้และรูปทั้งหมดถาวร?')) return;
    run(() => axios.delete(`/api/scam-reports/${report.id}`));
  };

  return (
    <div className="mt-4 pt-4 border-t border-gold/10 space-y-3">
      <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} maxLength={1000}
        placeholder="หมายเหตุถึงผู้รายงาน (เช่น เหตุผลที่ไม่อนุมัติ)" className="input-field resize-none text-sm" />
      <div className="flex flex-wrap gap-2">
        {report.status !== 'approved' && (
          <button disabled={busy} onClick={() => setStatus('approved')}
            className="px-4 py-2 rounded text-sm font-semibold bg-emerald-700 hover:bg-emerald-600 text-white disabled:opacity-40">✓ อนุมัติ</button>
        )}
        {report.status !== 'rejected' && (
          <button disabled={busy} onClick={() => setStatus('rejected')}
            className="px-4 py-2 rounded text-sm font-semibold bg-yellow-800 hover:bg-yellow-700 text-white disabled:opacity-40">✕ ไม่อนุมัติ</button>
        )}
        {report.status !== 'pending' && (
          <button disabled={busy} onClick={() => setStatus(report.status)} className="btn-outline-gold text-sm py-2 px-4 disabled:opacity-40">บันทึกหมายเหตุ</button>
        )}
        <button disabled={busy} onClick={remove} className="btn-danger text-sm ml-auto disabled:opacity-40">ลบ</button>
      </div>
    </div>
  );
}

export default function AdminScamReports() {
  const [tab, setTab] = useState('pending');
  const [data, setData] = useState({ reports: [], counts: {} });
  const [loading, setLoading] = useState(true);

  const fetchReports = () => {
    setLoading(true);
    return axios.get('/api/scam-reports/admin', { params: { status: tab } })
      .then(res => setData(res.data))
      .catch(() => setData({ reports: [], counts: {} }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReports(); }, [tab]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="section-title">ตรวจรายงานมิจฉาชีพ</h1>
      <p className="text-cream-muted text-sm mb-6">รายงานที่อนุมัติแล้วจะแสดงในหน้า "เช็กบัญชีก่อนโอน" ให้ทุกคนค้นหาได้</p>

      <div className="flex gap-2 mb-6 border-b border-gold/15">
        {TABS.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            className={`px-4 py-2.5 text-sm -mb-px border-b-2 transition-colors ${tab === tb.key ? 'border-gold text-gold font-semibold' : 'border-transparent text-cream-muted hover:text-cream'}`}>
            {tb.label} <span className="text-xs opacity-70">({data.counts[tb.key] ?? 0})</span>
          </button>
        ))}
      </div>

      {loading && <p className="text-gold font-serif animate-pulse">กำลังโหลด...</p>}
      {!loading && data.reports.length === 0 && (
        <div className="glass-card rounded-2xl p-10 text-center border border-gold/15 text-cream-muted">ไม่มีรายงานในหมวดนี้</div>
      )}

      <div className="space-y-4">
        {!loading && data.reports.map(r => (
          <ScamReportCard
            key={r.id}
            report={r}
            header={
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-gold/10 text-xs text-cream-muted">
                <span className="flex items-center gap-2"><StatusBadge status={r.status} /> #{r.id} โดย <span className="text-cream">{r.reporter_username || '-'}</span></span>
                <span>ส่งเมื่อ {new Date(r.created_at).toLocaleString('th-TH')}</span>
              </div>
            }
            footer={<ReviewActions report={r} onDone={fetchReports} />}
          />
        ))}
      </div>
    </div>
  );
}

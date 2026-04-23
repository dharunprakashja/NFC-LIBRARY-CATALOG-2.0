import React, { useEffect, useMemo, useState } from 'react';
import { 
    Search, RefreshCw, Send, Phone, MessageCircle, Bot, 
    CreditCard, Ban, Trash2, X, AlertCircle, CheckCircle2, 
    BookOpen, User, ToggleLeft, ToggleRight, Loader2
} from 'lucide-react';
import { api } from '../api';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  
  .fn-wrapper {
    font-family: 'Inter', sans-serif;
    display: flex;
    flex-direction: column;
    gap: 20px;
    color: #0f172a;
    width: 100%;
    box-sizing: border-box;
  }

  .fn-wrapper * {
    box-sizing: border-box;
  }

  /* --- Hero & Stats --- */
  .fn-hero {
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    padding: 24px;
    background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
    box-shadow: 0 4px 20px rgba(15, 23, 42, 0.03);
  }

  .fn-kicker {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-weight: 700;
    color: #64748b;
    margin-bottom: 8px;
  }

  .fn-title {
    margin: 0;
    font-size: 30px;
    font-weight: 700;
    line-height: 1.2;
    color: #0f172a;
  }

  .fn-sub {
    margin-top: 8px;
    color: #475569;
    font-size: 14px;
    max-width: 600px;
    line-height: 1.5;
  }

  .fn-summary {
    margin-top: 20px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }

  .fn-stat {
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    background: #fff;
    padding: 16px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .fn-stat:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(15, 23, 42, 0.05);
  }

  .fn-stat-k {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
    color: #64748b;
  }

  .fn-stat-v {
    margin-top: 8px;
    font-size: 28px;
    font-weight: 700;
    color: #0f172a;
    display: flex;
    align-items: baseline;
    gap: 4px;
  }
  
  .fn-stat-v span {
    font-size: 14px;
    color: #94a3b8;
    font-weight: 500;
  }

  /* --- Toolbar --- */
  .fn-toolbar {
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    background: #fff;
    padding: 16px;
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
  }

  .fn-toolbar-group {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }

  .fn-search-wrap {
    position: relative;
    flex: 1;
    min-width: 250px;
  }

  .fn-search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    width: 18px;
    height: 18px;
  }

  .fn-input {
    width: 100%;
    height: 42px;
    border-radius: 10px;
    border: 1px solid #cbd5e1;
    background: #f8fafc;
    color: #0f172a;
    font-size: 14px;
    padding: 0 16px 0 38px;
    transition: all 0.2s ease;
  }
  
  .fn-input:focus {
    outline: none;
    border-color: #3b82f6;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .fn-select {
    height: 42px;
    border-radius: 10px;
    border: 1px solid #cbd5e1;
    background: #fff;
    color: #0f172a;
    font-size: 14px;
    padding: 0 36px 0 16px;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
    background-repeat: no-repeat;
    background-position: right 12px top 50%;
    background-size: 10px auto;
  }

  .fn-btn {
    height: 42px;
    border-radius: 10px;
    border: 1px solid #cbd5e1;
    background: #fff;
    color: #0f172a;
    font-size: 14px;
    font-weight: 600;
    padding: 0 16px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s ease;
  }

  .fn-btn:hover:not(:disabled) {
    background: #f1f5f9;
    border-color: #94a3b8;
  }

  .fn-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .fn-btn.primary {
    background: #0f172a;
    border-color: #0f172a;
    color: #fff;
  }
  
  .fn-btn.primary:hover:not(:disabled) {
    background: #1e293b;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2);
  }

  /* --- List & Cards --- */
  .fn-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .fn-card {
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    background: #fff;
    overflow: hidden;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }
  
  .fn-card:hover {
    border-color: #cbd5e1;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
  }

  .fn-card.selected {
    border-color: #3b82f6;
    box-shadow: 0 0 0 1px #3b82f6, 0 10px 30px rgba(59, 130, 246, 0.08);
  }

  .fn-card-head {
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 1px solid #f1f5f9;
    background: #f8fafc;
  }
  
  .fn-card-head-left {
    display: flex;
    gap: 14px;
    align-items: flex-start;
  }
  
  .fn-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #e2e8f0;
    color: #475569;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 16px;
    flex-shrink: 0;
  }

  .fn-check {
    width: 18px;
    height: 18px;
    margin-top: 13px;
    cursor: pointer;
    accent-color: #3b82f6;
  }

  .fn-user-info {
    display: flex;
    flex-direction: column;
    margin-top: 2px;
  }

  .fn-name {
    font-size: 16px;
    font-weight: 700;
    color: #0f172a;
  }

  .fn-meta {
    font-size: 13px;
    color: #64748b;
    margin-top: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .fn-card-head-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 12px;
  }

  .fn-fine-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    padding: 6px 12px;
    border-radius: 12px;
    font-size: 18px;
    font-weight: 700;
  }

  .fn-pref {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .fn-pref .fn-select {
    height: 32px;
    padding: 0 28px 0 10px;
    font-size: 12px;
    background-size: 8px auto;
  }

  .fn-chip-btn {
    height: 32px;
    border-radius: 8px;
    border: 1px solid #cbd5e1;
    background: #fff;
    color: #475569;
    font-size: 12px;
    font-weight: 600;
    padding: 0 10px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s ease;
  }
  
  .fn-chip-btn.active {
    background: #ecfdf5;
    border-color: #a7f3d0;
    color: #059669;
  }

  .fn-body {
    padding: 0;
  }

  .fn-books {
    display: flex;
    flex-direction: column;
  }

  .fn-book-row {
    display: grid;
    grid-template-columns: auto 1fr auto auto auto auto;
    gap: 16px;
    padding: 12px 20px;
    align-items: center;
    font-size: 13px;
    border-bottom: 1px solid #f1f5f9;
  }
  
  .fn-book-row:last-child {
    border-bottom: none;
  }
  
  .fn-book-icon {
    color: #94a3b8;
  }

  .fn-book-title {
    font-weight: 600;
    color: #1e293b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .fn-tag {
    border-radius: 999px;
    padding: 4px 10px;
    border: 1px solid;
    font-size: 11px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
  }

  .fn-tag.over {
    color: #b45309;
    background: #fffbeb;
    border-color: #fde68a;
  }

  .fn-tag.fine {
    color: #dc2626;
    background: #fef2f2;
    border-color: #fecaca;
  }

  .fn-card-actions {
    padding: 16px 20px;
    background: #f8fafc;
    border-top: 1px solid #f1f5f9;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .fn-action-group {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .fn-icon-btn {
    height: 38px;
    padding: 0 12px;
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    background: #fff;
    color: #475569;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .fn-icon-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
    color: #0f172a;
    border-color: #94a3b8;
  }

  .fn-icon-btn svg {
    width: 16px;
    height: 16px;
  }

  /* Specific Button Colors */
  .fn-icon-btn.whatsapp { color: #16a34a; border-color: #bbf7d0; background: #f0fdf4; }
  .fn-icon-btn.whatsapp:hover { background: #dcfce7; border-color: #86efac; }
  
  .fn-icon-btn.voice { color: #0284c7; border-color: #bae6fd; background: #f0f9ff; }
  .fn-icon-btn.voice:hover { background: #e0f2fe; border-color: #7dd3fc; }
  
  .fn-icon-btn.ai { color: #7c3aed; border-color: #ddd6fe; background: #f5f3ff; }
  .fn-icon-btn.ai:hover { background: #ede9fe; border-color: #c4b5fd; }
  
  .fn-icon-btn.pay { background: #0f172a; border-color: #0f172a; color: #fff; }
  .fn-icon-btn.pay:hover { background: #1e293b; }
  
  .fn-icon-btn.waive { color: #dc2626; border-color: #fecaca; background: #fef2f2; }
  .fn-icon-btn.waive:hover { background: #fee2e2; border-color: #fca5a5; }

  .fn-pay-mode {
    font-size: 12px;
    color: #64748b;
    font-weight: 500;
  }

  /* --- Feedback & Modals --- */
  .fn-message-banner {
    padding: 12px 16px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    color: #0f172a;
  }
  
  .fn-message-banner.success {
    background: #f0fdf4;
    border-color: #bbf7d0;
    color: #166534;
  }

  .fn-empty {
    border: 2px dashed #e2e8f0;
    border-radius: 16px;
    padding: 40px 20px;
    text-align: center;
    color: #64748b;
    background: #f8fafc;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    font-size: 15px;
  }

  .fn-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    z-index: 1400;
  }

  .fn-modal {
    width: min(600px, 100%);
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    border-radius: 20px;
    background: #fff;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    overflow: hidden;
  }

  .fn-modal-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid #f1f5f9;
    background: #f8fafc;
  }

  .fn-modal-title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .fn-close {
    border: 1px solid #cbd5e1;
    background: #fff;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #64748b;
    transition: all 0.2s ease;
  }
  
  .fn-close:hover {
    background: #f1f5f9;
    color: #0f172a;
  }

  .fn-modal-body {
    padding: 24px;
    overflow-y: auto;
  }

  .fn-modal-message {
    white-space: pre-wrap;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px;
    background: #f8fafc;
    color: #334155;
    font-size: 15px;
    line-height: 1.6;
    font-family: monospace;
  }

  /* --- Responsive --- */
  @media (max-width: 1024px) {
    .fn-summary { grid-template-columns: repeat(2, 1fr); }
  }

  @media (max-width: 768px) {
    .fn-toolbar { flex-direction: column; align-items: stretch; }
    .fn-toolbar-group { justify-content: space-between; }
    .fn-search-wrap { min-width: 100%; }
    
    .fn-card-head { flex-direction: column; gap: 16px; }
    .fn-card-head-right { width: 100%; align-items: flex-start; flex-direction: row; justify-content: space-between; }
    
    .fn-book-row {
      grid-template-columns: auto 1fr;
      grid-template-rows: auto auto auto;
      gap: 8px;
    }
    
    .fn-book-icon { display: none; }
    .fn-book-title { grid-column: 1 / -1; white-space: normal; }
    
    .fn-card-actions { flex-direction: column; align-items: flex-start; }
    .fn-action-group { width: 100%; }
    .fn-icon-btn { flex: 1; justify-content: center; }
    .fn-icon-btn span { display: none; } /* Hide text on small screens for action buttons */
  }

  @media (max-width: 480px) {
    .fn-summary { grid-template-columns: 1fr; }
    .fn-pref { width: 100%; justify-content: space-between; }
    .fn-fine-badge { width: 100%; justify-content: center; }
  }
`;

const channelOptions = [
    { value: 'preferred', label: 'Use Preferred Channel' },
    { value: 'whatsapp', label: 'Force WhatsApp' },
    { value: 'voice', label: 'Force Voice' },
];

export default function Fines() {
    const [accounts, setAccounts] = useState([]);
    const [selected, setSelected] = useState({});
    const [channel, setChannel] = useState('preferred');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info'); // 'info' | 'success' | 'error'
    const [aiDialog, setAiDialog] = useState({
        open: false,
        loading: false,
        accountName: '',
        channel: 'whatsapp',
        text: '',
    });

    const loadAccounts = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/fines/accounts');
            setAccounts(data?.accounts || []);
        } catch (error) {
            showMessage(error?.response?.data?.message || 'Failed to load fines.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAccounts();
    }, []);

    const showMessage = (msg, type = 'info') => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => setMessage(''), 5000);
    };

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return accounts;

        return accounts.filter((a) => {
            return (
                String(a.name || '').toLowerCase().includes(q) ||
                String(a.roll_no || '').toLowerCase().includes(q) ||
                String(a.department || '').toLowerCase().includes(q)
            );
        });
    }, [accounts, search]);

    const selectedRollNos = useMemo(() => {
        return Object.keys(selected).filter((rollNo) => selected[rollNo]);
    }, [selected]);

    const totalFine = useMemo(() => {
        return filtered.reduce((sum, a) => sum + (a.total_fine || 0), 0);
    }, [filtered]);

    const totalBooksInFine = useMemo(() => {
        return filtered.reduce((sum, a) => sum + (a.borrowed_books || []).filter((b) => (b.fine || 0) > 0).length, 0);
    }, [filtered]);

    const allSelected = filtered.length > 0 && filtered.every((a) => selected[a.roll_no]);

    const toggleSelectAll = () => {
        if (allSelected) {
            const next = { ...selected };
            filtered.forEach((a) => delete next[a.roll_no]);
            setSelected(next);
            return;
        }

        const next = { ...selected };
        filtered.forEach((a) => { next[a.roll_no] = true; });
        setSelected(next);
    };

    const sendNotify = async ({ rollNos = [], selectAll = false, forceChannel = channel }) => {
        setSending(true);
        setMessage('');

        try {
            const { data } = await api.post('/fines/notify', {
                roll_nos: rollNos,
                select_all: selectAll,
                channel: forceChannel,
            });
            showMessage(`Success: ${data?.sent || 0} sent, ${data?.failed || 0} failed.`, 'success');
        } catch (error) {
            showMessage(error?.response?.data?.message || 'Failed to send alerts.', 'error');
        } finally {
            setSending(false);
        }
    };

    const updatePreference = async (rollNo, patch) => {
        try {
            await api.put(`/fines/preferences/${rollNo}`, patch);
            setAccounts((prev) => prev.map((a) => (a.roll_no === rollNo ? { ...a, ...patch } : a)));
        } catch (error) {
            showMessage(error?.response?.data?.message || 'Failed to save preferences.', 'error');
        }
    };

    const previewAi = async (rollNo, preferred) => {
        const accountName = accounts.find((a) => a.roll_no === rollNo)?.name || rollNo;
        const channelType = preferred || 'whatsapp';
        setAiDialog({ open: true, loading: true, accountName, channel: channelType, text: '' });
        try {
            const { data } = await api.post('/fines/preview', { roll_no: rollNo, channel: channelType });
            setAiDialog({ open: true, loading: false, accountName, channel: channelType, text: data?.message || 'No response from AI.' });
        } catch (error) {
            setAiDialog({ open: true, loading: false, accountName, channel: channelType, text: error?.response?.data?.message || 'Failed to preview AI message.' });
        }
    };

    const generatePaymentLink = async (rollNo) => {
        try {
            const { data } = await api.post('/fines/payment-link', { roll_no: rollNo });
            if (data?.payment_link) {
                window.open(data.payment_link, '_blank', 'noopener,noreferrer');
            } else {
                showMessage('Payment link not returned by server.', 'info');
            }
        } catch (error) {
            showMessage(error?.response?.data?.message || 'Failed to generate payment link.', 'error');
        }
    };

    const recalculate = async () => {
        try {
            await api.post('/fines/recalculate');
            await loadAccounts();
            showMessage('Fine values updated successfully.', 'success');
        } catch (error) {
            showMessage(error?.response?.data?.message || 'Failed to recalculate fines.', 'error');
        }
    };

    const waiveFine = async ({ rollNo, bookId }) => {
        try {
            let amount;
            if (!bookId) {
                const val = window.prompt('Optional: enter amount to waive (leave blank to waive all).');
                if (val !== null && String(val).trim() !== '') {
                    const parsed = Number(val);
                    if (!Number.isFinite(parsed) || parsed <= 0) {
                        showMessage('Invalid amount. Please enter a positive number.', 'error');
                        return;
                    }
                    amount = parsed;
                } else if (val === null) {
                    return; // user cancelled
                }
            }

            await api.post('/fines/waive', {
                roll_no: rollNo,
                book_id: bookId || undefined,
                amount,
            });
            await loadAccounts();
            showMessage('Fine waived successfully.', 'success');
        } catch (error) {
            showMessage(error?.response?.data?.message || 'Failed to waive fine.', 'error');
        }
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    return (
        <>
            <style>{styles}</style>
            <div className="fn-wrapper">
                {/* Hero Section */}
                <section className="fn-hero">
                    <div className="fn-kicker">
                        <AlertCircle size={14} /> Library Administration
                    </div>
                    <h1 className="fn-title">Fine Control Center</h1>
                    <div className="fn-sub">
                        Manage outstanding fines, review per-book breakdowns, configure channel preferences, generate AI reminders, and process payments or waivers.
                    </div>

                    <div className="fn-summary">
                        <div className="fn-stat">
                            <div className="fn-stat-k">Members with Fines</div>
                            <div className="fn-stat-v">{filtered.length}</div>
                        </div>
                        <div className="fn-stat">
                            <div className="fn-stat-k">Total Outstanding</div>
                            <div className="fn-stat-v"><span>Rs.</span>{totalFine.toLocaleString()}</div>
                        </div>
                        <div className="fn-stat">
                            <div className="fn-stat-k">Books Overdue</div>
                            <div className="fn-stat-v">{totalBooksInFine}</div>
                        </div>
                        <div className="fn-stat">
                            <div className="fn-stat-k">Selected for Action</div>
                            <div className="fn-stat-v">{selectedRollNos.length}</div>
                        </div>
                    </div>
                </section>

                {/* Toolbar */}
                <section className="fn-toolbar">
                    <div className="fn-search-wrap">
                        <Search className="fn-search-icon" />
                        <input
                            className="fn-input"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name, roll no, or department..."
                        />
                    </div>

                    <div className="fn-toolbar-group">
                        <select className="fn-select" value={channel} onChange={(e) => setChannel(e.target.value)}>
                            {channelOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>

                        <button className="fn-btn" onClick={toggleSelectAll}>
                            {allSelected ? <CheckCircle2 size={16}/> : <CheckCircle2 size={16} color="#94a3b8"/>}
                            {allSelected ? 'Unselect All' : 'Select All'}
                        </button>

                        <button
                            className="fn-btn primary"
                            disabled={sending || selectedRollNos.length === 0}
                            onClick={() => sendNotify({ rollNos: selectedRollNos, selectAll: false })}
                        >
                            {sending ? <Loader2 size={16} className="lucide-spin"/> : <Send size={16}/>}
                            Notify Selected
                        </button>
                        
                        <button className="fn-btn" onClick={recalculate} title="Recalculate all fines">
                            <RefreshCw size={16} />
                        </button>
                    </div>
                </section>

                {/* Status Message */}
                {message && (
                    <div className={`fn-message-banner ${messageType === 'success' ? 'success' : ''}`}>
                        {messageType === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                        {message}
                    </div>
                )}

                {/* Main Content */}
                {loading ? (
                    <div className="fn-empty">
                        <Loader2 size={32} className="lucide-spin" color="#3b82f6" />
                        Loading fine records...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="fn-empty">
                        <CheckCircle2 size={40} color="#10b981" />
                        <div>No members with outstanding fines matching your criteria.</div>
                    </div>
                ) : (
                    <section className="fn-list">
                        {filtered.map((account) => {
                            const isSelected = Boolean(selected[account.roll_no]);
                            return (
                                <article className={`fn-card ${isSelected ? 'selected' : ''}`} key={account.roll_no}>
                                    
                                    {/* Card Header (User Info & Total) */}
                                    <div className="fn-card-head">
                                        <div className="fn-card-head-left">
                                            <input
                                                className="fn-check"
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={(e) => {
                                                    const next = { ...selected };
                                                    if (e.target.checked) next[account.roll_no] = true;
                                                    else delete next[account.roll_no];
                                                    setSelected(next);
                                                }}
                                            />
                                            <div className="fn-avatar">
                                                {getInitials(account.name)}
                                            </div>
                                            <div className="fn-user-info">
                                                <div className="fn-name">{account.name}</div>
                                                <div className="fn-meta">
                                                    <User size={14} /> {account.roll_no} • {account.department}
                                                    {account.mobile && ` • ${account.mobile}`}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="fn-card-head-right">
                                            <div className="fn-fine-badge">
                                                Rs. {account.total_fine || 0}
                                            </div>
                                            <div className="fn-pref">
                                                <select
                                                    className="fn-select"
                                                    value={account.preferred_channel || 'whatsapp'}
                                                    onChange={(e) => updatePreference(account.roll_no, { preferred_channel: e.target.value })}
                                                >
                                                    <option value="whatsapp">WhatsApp</option>
                                                    <option value="voice">Voice Call</option>
                                                </select>

                                                <button
                                                    className={`fn-chip-btn ${account.automated_enabled ? 'active' : ''}`}
                                                    onClick={() => updatePreference(account.roll_no, { automated_enabled: !account.automated_enabled })}
                                                >
                                                    {account.automated_enabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                                                    Auto Reminders
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Books Breakdown */}
                                    <div className="fn-body">
                                        <div className="fn-books">
                                            {(account.borrowed_books || []).filter((b) => (b.fine || 0) > 0).map((book) => (
                                                <div className="fn-book-row" key={`${account.roll_no}-${book.book_id}-${book.due_date || ''}`}>
                                                    <BookOpen size={16} className="fn-book-icon" />
                                                    <div className="fn-book-title" title={book.title || book.book_id}>
                                                        {book.title || book.book_id}
                                                    </div>
                                                    <span className="fn-tag over">{book.overdue_days || 0}d Overdue</span>
                                                    <span className="fn-tag fine">Rs. {book.fine || 0}</span>
                                                    <div className="fn-meta" style={{marginTop: 0}}>
                                                        Due: {book.due_date ? new Date(book.due_date).toLocaleDateString() : 'N/A'}
                                                    </div>
                                                    <button 
                                                        className="fn-icon-btn waive" 
                                                        title="Waive fine for this specific book" 
                                                        onClick={() => waiveFine({ rollNo: account.roll_no, bookId: book.book_id })}
                                                    >
                                                        <Ban /> <span>Waive</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action Bar */}
                                    <div className="fn-card-actions">
                                        <div className="fn-pay-mode">
                                            Gateway: {(account.payment_mode || 'Standard UPI').toUpperCase()}
                                        </div>
                                        
                                        <div className="fn-action-group">
                                            <button className="fn-icon-btn whatsapp" title="Send WhatsApp Reminder" onClick={() => sendNotify({ rollNos: [account.roll_no], forceChannel: 'whatsapp' })}>
                                                <MessageCircle /> <span>WhatsApp</span>
                                            </button>
                                            <button className="fn-icon-btn voice" title="Queue Voice Call" onClick={() => sendNotify({ rollNos: [account.roll_no], forceChannel: 'voice' })}>
                                                <Phone /> <span>Voice</span>
                                            </button>
                                            <button className="fn-icon-btn ai" title="Preview AI Generated Message" onClick={() => previewAi(account.roll_no, account.preferred_channel)}>
                                                <Bot /> <span>AI Preview</span>
                                            </button>
                                            <button className="fn-icon-btn pay" title="Generate Payment Link" onClick={() => generatePaymentLink(account.roll_no)}>
                                                <CreditCard /> <span>Pay Link</span>
                                            </button>
                                            <button className="fn-icon-btn waive" title="Waive total fine for member" onClick={() => waiveFine({ rollNo: account.roll_no })}>
                                                <Trash2 /> <span>Waive All</span>
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </section>
                )}

                {/* AI Preview Modal */}
                {aiDialog.open && (
                    <div className="fn-modal-backdrop" onClick={() => setAiDialog((prev) => ({ ...prev, open: false }))}>
                        <div className="fn-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="fn-modal-head">
                                <h3 className="fn-modal-title">
                                    <Bot color="#7c3aed" /> AI Message Preview
                                </h3>
                                <button className="fn-close" onClick={() => setAiDialog((prev) => ({ ...prev, open: false }))} title="Close dialog">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="fn-modal-body">
                                <div className="fn-meta" style={{marginBottom: '16px'}}>
                                    Generating for <strong>{aiDialog.accountName}</strong> via <strong>{aiDialog.channel.toUpperCase()}</strong> format.
                                </div>
                                <div className="fn-modal-message">
                                    {aiDialog.loading ? (
                                        <span style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b'}}>
                                            <Loader2 size={16} className="lucide-spin" /> Generating response...
                                        </span>
                                    ) : aiDialog.text}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
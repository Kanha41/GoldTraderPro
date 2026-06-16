import React, { useState } from 'react';
import { useAppContext } from '../context/useAppContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, RefreshCw } from 'lucide-react';

const AdminPanel = () => {
  const { adminRecords, setAdminRecords, updateUserRole, processTransactionRequest, user: currentUser, feedbacks, setFeedbacks, supportChats, replySupportMessage, refreshAdminData } = useAppContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('trades');
  const [replyInputs, setReplyInputs] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshAdminData();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleSupportReply = (chatId) => {
    const text = replyInputs[chatId];
    if (!text || !text.trim()) return;
    replySupportMessage(chatId, text);
    setReplyInputs(prev => ({ ...prev, [chatId]: '' }));
  };

  const handleRoleChange = (userId, newRole) => {
    const record = adminRecords.find(r => r.id === userId);
    if (!record) return;

    if (['kanhaiya15', 'smrutika26'].includes(record.username.toLowerCase()) && newRole !== 'admin') {
      alert("Master admins cannot be demoted from the dashboard to avoid lockouts.");
      return;
    }
    
    const res = updateUserRole(userId, newRole);
    if (!res.success) {
      alert(res.message);
    }
  };

  const toggleTradeReview = (userId, tradeId) => {
    setAdminRecords(prev => prev.map(record => {
      if (record.id !== userId) return record;
      
      const updatedTrades = (record.trades || []).map(trade => {
        if (trade.id !== tradeId) return trade;
        return { ...trade, adminReviewed: !trade.adminReviewed };
      });
      
      return { ...record, trades: updatedTrades };
    }));
  };

  const handleTransactionRequest = (userId, transactionId, action) => {
    // Process the request through the backend
    processTransactionRequest(userId, transactionId, action);
    // The context will call loadUserData() internally to seamlessly update the frontend state
  };

  const renderRequests = () => {
    let requests = [];
    adminRecords.forEach(record => {
      if (record.transactions) {
        record.transactions.forEach((tx, idx) => {
          if (tx.type === 'WITHDRAWAL' || tx.type === 'DEPOSIT' || tx.type === 'CHALLENGE_REWARD') {
            // For withdrawal requests, attach user's verification/bank details
            let verificationData = record.verification || null;
            if (!verificationData && tx.type === 'WITHDRAWAL') {
              try {
                const saved = localStorage.getItem(`verification_${record.id}`);
                if (saved) verificationData = JSON.parse(saved);
              } catch(e) { /* ignore */ }
            }
            requests.push({ userId: record.id, username: record.username, tx, txId: tx.id, verification: verificationData });
          }
        });
      }
    });

    // sort by date descending
    requests.sort((a, b) => new Date(b.tx.date) - new Date(a.tx.date));

    if (requests.length === 0) return <p style={{ color: 'var(--text-secondary)' }}>No requests found.</p>;

    return (
      <table className="admin-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Username</th>
            <th>Amount (Rs)</th>
            <th>UTR / Txn ID</th>
            <th>Bank/UPI Details</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req, i) => (
            <tr key={i}>
              <td>{new Date(req.tx.date).toLocaleString()}</td>
              <td>
                <span style={{
                  fontWeight: '500',
                  color: req.tx.type === 'DEPOSIT'
                    ? 'var(--buy-color)'
                    : req.tx.type === 'CHALLENGE_REWARD'
                      ? 'var(--accent)'
                      : 'var(--sell-color)'
                }}>
                  {req.tx.type === 'CHALLENGE_REWARD' ? (req.tx.label || 'Challenge Prize') : req.tx.type}
                </span>
              </td>
              <td>{req.username}</td>
              <td>{Number(req.tx.amount || 0).toFixed(2)}</td>
              <td>
                {req.tx.label ? (
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#a5f3fc', background: 'rgba(165,243,252,0.08)', padding: '3px 8px', borderRadius: '6px', wordBreak: 'break-all' }}>
                    {req.tx.label}
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontStyle: 'italic' }}>—</span>
                )}
              </td>
              <td>
                {req.tx.type === 'WITHDRAWAL' && req.verification ? (
                  <div style={{ fontSize: '12px', lineHeight: '1.6', color: '#a5f3fc' }}>
                    {req.verification.mode === 'BANK' ? (
                      <>
                        <div><strong style={{ color: 'var(--text-secondary)' }}>A/C:</strong> {req.verification.bankAccount}</div>
                        <div><strong style={{ color: 'var(--text-secondary)' }}>IFSC:</strong> {req.verification.ifscCode}</div>
                      </>
                    ) : (
                      <div><strong style={{ color: 'var(--text-secondary)' }}>UPI:</strong> {req.verification.upiNumber}</div>
                    )}
                  </div>
                ) : req.tx.type === 'WITHDRAWAL' ? (
                  <span style={{ color: 'var(--sell-color)', fontSize: '11px', fontStyle: 'italic' }}>Not verified</span>
                ) : (
                  <span style={{ color: 'var(--text-secondary)' }}>—</span>
                )}
              </td>
              <td>
                <span className={`status-badge status-${req.tx.status.toLowerCase()}`}>
                  {req.tx.status}
                </span>
              </td>
              <td>
                {req.tx.status === 'PENDING' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleTransactionRequest(req.userId, req.txId, 'APPROVE')} className="btn" style={{ padding: '5px 10px', background: 'var(--buy-color)', color: '#fff' }}><Check size={14}/></button>
                    <button onClick={() => handleTransactionRequest(req.userId, req.txId, 'REJECT')} className="btn" style={{ padding: '5px 10px', background: 'var(--sell-color)', color: '#fff' }}><X size={14}/></button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderUsers = () => {
    if (adminRecords.length === 0) return <p style={{ color: 'var(--text-secondary)' }}>No users found.</p>;

    return (
      <div style={{ overflowX: 'auto' }}>
        <table className="admin-table" style={{ minWidth: '900px' }}>
          <thead>
            <tr>
              <th>Username</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Mobile</th>
              <th>Password</th>
              <th>Role</th>
              <th>Balance (Rs)</th>
              <th>Total Trades</th>
              <th>Total Deposits</th>
            </tr>
          </thead>
          <tbody>
            {adminRecords.map((u, i) => {
              const totalDeposits = (u.transactions || [])
                .filter(t => t.type === 'DEPOSIT')
                .reduce((sum, t) => sum + t.amount, 0);

              return (
                <tr key={u.id || i}>
                  <td style={{ fontWeight: '600' }}>{u.username}</td>
                  <td>{u.fullName || '-'}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{u.email || '-'}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{u.mobileNumber || '-'}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '13px', fontFamily: 'monospace' }}>{u.password || '-'}</td>
                  <td>
                    <select
                      value={u.role || 'user'}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="custom-input"
                      style={{ 
                        padding: '6px 12px', 
                        fontSize: '13px', 
                        background: 'rgba(0,0,0,0.4)', 
                        border: '1px solid var(--panel-border)', 
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="user" style={{ background: '#111827' }}>User</option>
                      <option value="admin" style={{ background: '#111827' }}>Admin</option>
                    </select>
                  </td>
                  <td>{Number(u.balance || 0).toFixed(2)}</td>
                  <td>{u.trades ? u.trades.length : 0}</td>
                  <td>{Number(totalDeposits || 0).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTrades = () => {
    let allTrades = [];
    adminRecords.forEach(record => {
      if (record.trades) {
        record.trades.forEach(trade => {
          allTrades.push({ userId: record.id, username: record.username, trade });
        });
      }
    });

    allTrades.sort((a, b) => new Date(b.trade.date) - new Date(a.trade.date));

    if (allTrades.length === 0) return <p style={{ color: 'var(--text-secondary)' }}>No trades found.</p>;

    return (
      <table className="admin-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Username</th>
            <th>Type</th>
            <th>Entry Price</th>
            <th>Status</th>
            <th>Profit</th>
            <th style={{ textAlign: 'center', width: '90px' }}>Checked</th>
          </tr>
        </thead>
        <tbody>
          {allTrades.map((t, i) => (
            <tr key={i}>
              <td>{new Date(t.trade.date).toLocaleString()}</td>
              <td>{t.username}</td>
              <td style={{ color: t.trade.type === 'BUY' ? 'var(--buy-color)' : 'var(--sell-color)', fontWeight: 'bold' }}>{t.trade.type}</td>
              <td>{Number(t.trade.price || 0).toFixed(2)}</td>
              <td>{t.trade.status}</td>
              <td style={{ color: t.trade.profit > 0 ? 'var(--buy-color)' : 'inherit' }}>
                {t.trade.profit !== undefined ? `+${t.trade.profit} Rs` : '-'}
              </td>
              <td style={{ textAlign: 'center' }}>
                <button
                  onClick={() => toggleTradeReview(t.userId, t.trade.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '6px',
                    borderRadius: '50%',
                    transition: 'background 0.2s',
                    width: '32px',
                    height: '32px'
                  }}
                  className="review-toggle-btn"
                  title={t.trade.adminReviewed ? "Reviewed (Done)" : "Pending Review (Click to Tick)"}
                >
                  {t.trade.adminReviewed ? (
                    <Check size={18} color="var(--buy-color)" style={{ filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.4))' }} />
                  ) : (
                    <X size={18} color="var(--sell-color)" style={{ filter: 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.4))' }} />
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const handleClearFeedback = (id) => {
    const updated = feedbacks.filter(f => f.id !== id);
    setFeedbacks(updated);
    localStorage.setItem('feedbacks', JSON.stringify(updated));
  };

  const handleClearAllFeedbacks = () => {
    if (window.confirm("Are you sure you want to clear all feedback logs?")) {
      setFeedbacks([]);
      localStorage.removeItem('feedbacks');
    }
  };

  const renderFeedbacks = () => {
    if (!feedbacks || feedbacks.length === 0) return <p style={{ color: 'var(--text-secondary)' }}>No feedbacks submitted yet.</p>;

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
          <button onClick={handleClearAllFeedbacks} className="btn" style={{ padding: '8px 16px', background: 'var(--sell-color)', color: '#fff', fontSize: '13px' }}>
            Clear All Logs
          </button>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: '180px' }}>Date</th>
              <th style={{ width: '120px' }}>Username</th>
              <th style={{ width: '180px' }}>Full Name</th>
              <th>Message</th>
              <th style={{ width: '80px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {feedbacks.map((f, i) => (
              <tr key={i}>
                <td>{new Date(f.date).toLocaleString()}</td>
                <td style={{ fontWeight: '600' }}>{f.username}</td>
                <td>{f.fullName}</td>
                <td style={{ color: '#ccc', lineHeight: '1.4', wordBreak: 'break-word' }}>{f.text}</td>
                <td style={{ textAlign: 'center' }}>
                  <button onClick={() => handleClearFeedback(f.id)} className="btn" style={{ padding: '4px 8px', background: 'rgba(239,68,68,0.15)', color: 'var(--sell-color)', border: '1px solid rgba(239,68,68,0.2)', display: 'inline-flex', justifyContent: 'center' }} title="Delete log">
                    <X size={12}/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSupportTickets = () => {
    if (!supportChats || supportChats.length === 0) return <p style={{ color: 'var(--text-secondary)' }}>No support tickets found.</p>;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {supportChats.map(chat => (
          <div key={chat.id} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '15px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <strong style={{ fontSize: '15px' }}>Ticket from: {chat.username}</strong>
              <span className={`status-badge status-${chat.status.toLowerCase()}`}>{chat.status}</span>
            </div>
            <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
              {chat.messages.map((m, idx) => (
                <div key={idx} style={{ marginBottom: '8px', textAlign: m.sender === 'admin' ? 'right' : 'left' }}>
                  <span style={{ 
                    display: 'inline-block', 
                    background: m.sender === 'admin' ? '#38bdf8' : 'rgba(255,255,255,0.1)', 
                    color: m.sender === 'admin' ? '#000' : '#fff',
                    padding: '6px 10px', 
                    borderRadius: '8px',
                    fontSize: '13px'
                  }}>
                    {m.text}
                  </span>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>{m.time}</div>
                </div>
              ))}
            </div>
            {chat.status === 'OPEN' && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  className="custom-input" 
                  style={{ flex: 1, padding: '8px 12px' }} 
                  placeholder="Type a reply..." 
                  value={replyInputs[chat.id] || ''} 
                  onChange={(e) => setReplyInputs(prev => ({ ...prev, [chat.id]: e.target.value }))}
                />
                <button onClick={() => handleSupportReply(chat.id)} className="btn btn-primary" style={{ padding: '8px 16px' }}>Reply</button>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const usersWithBuy = adminRecords.filter(user => user.trades && user.trades.some(t => t.type === 'BUY')).length;
  const usersWithSell = adminRecords.filter(user => user.trades && user.trades.some(t => t.type === 'SELL')).length;

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo">
          <span>&#x2B22;</span> Admin Dashboard
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            className="btn btn-outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: isRefreshing ? 0.7 : 1 }}
          >
            <RefreshCw size={15} style={{ animation: isRefreshing ? 'spin 0.6s linear infinite' : 'none' }} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button className="btn btn-outline" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Back
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div className="glass-panel" style={{ flex: 1, padding: '20px', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-secondary)' }}>Users with BUY Orders</h3>
          <h2 style={{ color: 'var(--buy-color)', fontSize: '2em', marginTop: '10px' }}>{usersWithBuy}</h2>
        </div>
        <div className="glass-panel" style={{ flex: 1, padding: '20px', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-secondary)' }}>Users with SELL Orders</h3>
          <h2 style={{ color: 'var(--sell-color)', fontSize: '2em', marginTop: '10px' }}>{usersWithSell}</h2>
        </div>
      </div>

      <div className="glass-panel" style={{ minHeight: '600px' }}>
        <div className="tabs">
          <button className={`tab ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>
            Transaction Requests
            {(() => {
              const pendingCount = adminRecords.reduce((acc, r) => {
                return acc + (r.transactions || []).filter(t => t.status === 'PENDING' && (t.type === 'DEPOSIT' || t.type === 'WITHDRAWAL')).length;
              }, 0);
              return pendingCount > 0 ? (
                <span style={{ marginLeft: '8px', background: 'var(--sell-color)', color: '#fff', borderRadius: '10px', padding: '1px 7px', fontSize: '11px', fontWeight: '700' }}>
                  {pendingCount}
                </span>
              ) : null;
            })()
            }
          </button>
          <button className={`tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            All Users
          </button>
          <button className={`tab ${activeTab === 'trades' ? 'active' : ''}`} onClick={() => setActiveTab('trades')}>
            All Trades
          </button>
          <button className={`tab ${activeTab === 'feedback' ? 'active' : ''}`} onClick={() => setActiveTab('feedback')}>
            User Feedback
          </button>
          <button className={`tab ${activeTab === 'support' ? 'active' : ''}`} onClick={() => setActiveTab('support')}>
            Support Tickets
          </button>
        </div>

        <div style={{ marginTop: '20px' }}>
          {activeTab === 'requests' && renderRequests()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'trades' && renderTrades()}
          {activeTab === 'feedback' && renderFeedbacks()}
          {activeTab === 'support' && renderSupportTickets()}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;

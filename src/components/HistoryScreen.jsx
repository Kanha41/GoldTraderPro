import React, { useState } from 'react';
import { useAppContext } from '../context/useAppContext';
import MobileNavBar from './MobileNavBar';
import { Clock, TrendingUp, ArrowUpRight, ArrowDownRight, CheckCircle } from 'lucide-react';

// Safe number parser — handles DB strings, nulls, undefined
const n = (val, fallback = 0) => {
  if (val === null || val === undefined) return fallback;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? fallback : parsed;
};

// Safe date formatter — prevents crash on invalid dates
const formatDate = (dateVal, options) => {
  if (!dateVal) return '';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString([], options || { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

// Safe single-trade card to prevent one bad trade from crashing entire list
const ActiveTradeCard = ({ trade }) => {
  try {
    return (
      <div
        className="glass-panel"
        style={{
          padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px',
          borderLeft: trade.type === 'BUY' ? '4px solid var(--buy-color)' : '4px solid var(--sell-color)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              background: trade.type === 'BUY' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: trade.type === 'BUY' ? 'var(--buy-color)' : 'var(--sell-color)',
              padding: '4px 10px', borderRadius: '6px', fontWeight: '700', fontSize: '12px'
            }}>
              {trade.type || 'N/A'}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Qty: {n(trade.amount, 1)} Lots</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Entry: ${n(trade.price).toFixed(2)}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', opacity: 0.7 }}>
              {formatDate(trade.date)}
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex', justifyContent: 'space-between', fontSize: '12px',
          color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.2)',
          padding: '8px 12px', borderRadius: '6px'
        }}>
          <span style={{ color: 'rgba(16,185,129,0.8)' }}>
            TP: ${n(trade.takeProfit).toFixed(2)}
          </span>
          <span style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>|</span>
          <span style={{ color: 'rgba(239,68,68,0.8)' }}>
            SL: ${n(trade.stopLoss).toFixed(2)}
          </span>
        </div>
      </div>
    );
  } catch (err) {
    console.error('Error rendering active trade card:', err, trade);
    return null;
  }
};

const SettledTradeCard = ({ trade }) => {
  try {
    const profitAmount = n(trade.profit);
    const isWin = profitAmount > 0;
    return (
      <div
        className="glass-panel"
        style={{
          padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderLeft: isWin ? '4px solid var(--buy-color)' : '4px solid var(--sell-color)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <strong style={{ color: trade.type === 'BUY' ? 'var(--buy-color)' : 'var(--sell-color)', fontSize: '14px' }}>{trade.type || 'N/A'}</strong>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Qty: {n(trade.amount, 1)}</span>
            <span style={{
              fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
              background: isWin ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              color: isWin ? 'var(--buy-color)' : 'var(--sell-color)'
            }}>
              {isWin ? 'TP HIT' : 'SL HIT'}
            </span>
          </div>
          <small style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Entry: ${n(trade.price).toFixed(2)} &nbsp;|&nbsp; TP: ${n(trade.takeProfit).toFixed(2)} &nbsp;|&nbsp; SL: ${n(trade.stopLoss).toFixed(2)}
          </small>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ color: isWin ? 'var(--buy-color)' : 'var(--sell-color)', fontWeight: '700', fontSize: '15px', display: 'block' }}>
            {isWin ? `+₹${profitAmount}` : '₹0.00'}
          </span>
          <small style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
            {formatDate(trade.date || Date.now())}
          </small>
        </div>
      </div>
    );
  } catch (err) {
    console.error('Error rendering settled trade card:', err, trade);
    return null;
  }
};

const HistoryScreen = () => {
  const { trades = [], livePrice, priceChange } = useAppContext();
  const [activeSubTab, setActiveSubTab] = useState('active'); // 'active' or 'settled'

  // Safely filter trades — guard against non-array or items without status
  const safeTrades = Array.isArray(trades) ? trades : [];
  const openTrades   = safeTrades.filter(t => t && t.status === 'OPEN');
  const settledTrades = safeTrades.filter(t => t && t.status === 'CLOSED');

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0b0e14',
      backgroundImage: 'radial-gradient(circle at top, rgba(18, 30, 54, 0.8), #0b0e14)',
      color: 'var(--text-primary)',
      padding: '30px 15px 95px 15px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{ maxWidth: '480px', width: '100%' }}>

        {/* --- Header Section --- */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px', textAlign: 'center' }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #a78bfa, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(167, 139, 250, 0.25)', marginBottom: '15px'
          }}>
            <Clock size={32} color="#000" />
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '700', letterSpacing: '-0.02em', margin: '0 0 5px 0' }}>Trade Station</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>Review active positions and complete historical contracts</p>
        </div>

        {/* --- Live Price Banner --- */}
        <div className="glass-panel" style={{ padding: '12px 18px', borderRadius: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PAXG/USDT Proxy</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: '700', fontSize: '15px', color: priceChange === 'up' ? 'var(--buy-color)' : 'var(--sell-color)' }}>
              ${livePrice ? n(livePrice).toFixed(2) : 'Loading...'}
            </span>
            {priceChange === 'up'
              ? <ArrowUpRight size={16} color="var(--buy-color)" />
              : <ArrowDownRight size={16} color="var(--sell-color)" />}
          </div>
        </div>

        {/* --- Sub-Tab Switcher --- */}
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--panel-border)', padding: '4px', borderRadius: '10px', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveSubTab('active')}
            style={{
              flex: 1, padding: '10px', borderRadius: '8px',
              background: activeSubTab === 'active' ? 'var(--panel-bg)' : 'transparent',
              border: activeSubTab === 'active' ? '1px solid var(--panel-border)' : 'none',
              color: activeSubTab === 'active' ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}
          >
            Active Trades ({openTrades.length})
          </button>
          <button
            onClick={() => setActiveSubTab('settled')}
            style={{
              flex: 1, padding: '10px', borderRadius: '8px',
              background: activeSubTab === 'settled' ? 'var(--panel-bg)' : 'transparent',
              border: activeSubTab === 'settled' ? '1px solid var(--panel-border)' : 'none',
              color: activeSubTab === 'settled' ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}
          >
            Settle History ({settledTrades.length})
          </button>
        </div>

        {/* --- Lists Display --- */}
        {activeSubTab === 'active' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {openTrades.length === 0 ? (
              <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <TrendingUp size={36} color="var(--text-secondary)" style={{ opacity: 0.4 }} />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' }}>No active trade positions</span>
                <small style={{ fontSize: '11px', color: 'var(--text-secondary)', opacity: 0.7 }}>Navigate to the main tab to open gold contracts.</small>
              </div>
            ) : (
              openTrades.map(trade => (
                <ActiveTradeCard key={trade.id || Math.random()} trade={trade} />
              ))
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {settledTrades.length === 0 ? (
              <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={36} color="var(--text-secondary)" style={{ opacity: 0.4 }} />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' }}>No settled trades yet</span>
                <small style={{ fontSize: '11px', color: 'var(--text-secondary)', opacity: 0.7 }}>Your completed options settlements will be logged here.</small>
              </div>
            ) : (
              settledTrades.map(trade => (
                <SettledTradeCard key={trade.id || Math.random()} trade={trade} />
              ))
            )}
          </div>
        )}

      </div>
      <MobileNavBar activeTab="history" />
    </div>
  );
};

export default HistoryScreen;

import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/useAppContext';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, Wallet, ArrowUpRight, ArrowDownRight, Info, AlertTriangle, X } from 'lucide-react';
import TradingViewChart from './TradingViewChart';
import MobileNavBar from './MobileNavBar';
import DepositModal from './DepositModal';

const RulesModal = ({ onClose }) => (
  <div className="modal-overlay">
    <div className="glass-panel modal-content">
      <div className="modal-header">
        <h2>Platform Rules</h2>
        <button onClick={onClose} className="modal-close"><X size={24} /></button>
      </div>
      <div style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
        <ul className="rules-list">
          <li><strong>30-Day Challenge:</strong> Complete 30 qualifying days with at least 2 successful trades (TP hit) per day. Days do not need to be consecutive.</li>
        </ul>
      </div>
    </div>
  </div>
);


const TradingPlatform = () => {
  const { user, logout, balance, trades, addTrade, completeTrade, accountType, setAccountType, livePrice, priceChange } = useAppContext();
  const navigate = useNavigate();
  
  const [showRules, setShowRules] = useState(false);
  const [toast, setToast] = useState(null);
  
  const [quantity, setQuantity] = useState(1);
  const [showDeposit, setShowDeposit] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const isWeekend = [0,6].includes(new Date().getDay());

  // Scroll to top on mount to ensure the top part of the screen is always displayed
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Global WebSocket and Trade Monitoring moved to AppContext

  const handleOrder = async (type) => {
    if (isProcessingOrder) return;
    
    if (isWeekend) {
      alert("Market is closed on weekends. Trades cannot be placed.");
      return;
    }

    if (quantity <= 0) return;

    if (balance < (80 * quantity)) {
      alert(`Insufficient balance. You need at least ${80 * quantity} Rs to place an order of ${quantity} lots.`);
      return;
    }

    if (livePrice <= 0) {
      alert("Live price not available. Cannot place trade.");
      return;
    }

    setIsProcessingOrder(true);

    const pipValue = 1.0; 
    const tpDistance = 5 * pipValue;
    const slDistance = 1 * pipValue;

    await addTrade({
      pair: 'PAXG/USDT',
      type,
      amount: quantity,
      price: livePrice,
      takeProfit: type === 'BUY' ? livePrice + tpDistance : livePrice - tpDistance,
      stopLoss: type === 'BUY' ? livePrice - slDistance : livePrice + slDistance,
      status: 'OPEN'
    });
    
    setToast({ message: `Order of ${quantity} placed at ${livePrice.toFixed(2)}`, type: 'success' });
    setTimeout(() => setToast(null), 4000);
    setIsProcessingOrder(false);
  };


  return (
    <div className="app-container" style={{ paddingBottom: '90px' }}>
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: toast.type === 'success' ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          fontWeight: '500',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          zIndex: 9999,
          animation: 'slideUp 0.3s ease'
        }}>
          {toast.message}
        </div>
      )}
      <header className="header" style={{ gap: '15px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div className="logo">
          <span>&#x2B22;</span> GoldTrader Pro
        </div>
        {isWeekend && (
          <div className="notice" style={{ background: 'rgba(255,165,0,0.2)', color: 'var(--text-primary)', padding: '8px', borderRadius: '6px', textAlign: 'center', marginBottom: '12px' }}>
            Market is closed on weekends. Trading is off track.
          </div>
        )}

        {/* Synced Premium Real/Demo Switcher */}
        <div style={{
          display: 'flex',
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid var(--panel-border)',
          borderRadius: '30px',
          padding: '2px',
          position: 'relative',
          width: '200px',
          height: '36px',
          userSelect: 'none'
        }}>
          {/* Animated Background Selector */}
          <div style={{
            position: 'absolute',
            top: '2px',
            bottom: '2px',
            left: accountType === 'REAL' ? '2px' : '100px',
            width: '96px',
            background: accountType === 'REAL' 
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(16, 185, 129, 0.1))'
              : 'linear-gradient(135deg, rgba(234, 179, 8, 0.25), rgba(217, 119, 6, 0.15))',
            border: accountType === 'REAL' 
              ? '1px solid rgba(16, 185, 129, 0.4)' 
              : '1px solid rgba(234, 179, 8, 0.4)',
            borderRadius: '28px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: accountType === 'REAL' 
              ? '0 0 10px rgba(16, 185, 129, 0.2)' 
              : '0 0 10px rgba(234, 179, 8, 0.2)',
            zIndex: 1
          }} />
          
          <button 
            onClick={() => setAccountType('REAL')}
            style={{
              flex: 1,
              background: 'none',
              color: accountType === 'REAL' ? 'var(--buy-color)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: '700',
              zIndex: 2,
              borderRadius: '28px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              textShadow: accountType === 'REAL' ? '0 0 8px rgba(16, 185, 129, 0.3)' : 'none'
            }}
          >
            Real
          </button>
          
          <button 
            onClick={() => setAccountType('DEMO')}
            title="Demo money cannot be withdrawn"
            style={{
              flex: 1,
              background: 'none',
              color: accountType === 'DEMO' ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: '700',
              zIndex: 2,
              borderRadius: '28px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              textShadow: accountType === 'DEMO' ? '0 0 8px rgba(234, 179, 8, 0.3)' : 'none'
            }}
          >
            Demo
          </button>
        </div>

        <div className="header-actions">
          <button className="btn btn-outline" onClick={() => setShowDeposit(true)}>
            <Wallet size={16} /> Deposit
          </button>
          {user?.role === 'admin' && (
            <button className="btn btn-outline" onClick={() => navigate('/admin')}>
              <Settings size={16} /> Admin
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--panel-border)', padding: '6px 16px', borderRadius: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: '1.2' }}>
              <span style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: '600' }}>{user?.fullName || user?.username}</span>
              <span style={{ color: 'var(--accent)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold' }}>{user?.role}</span>
            </div>
            <button onClick={logout} className="btn" style={{ padding: '4px', background: 'none' }} title="Log Out">
              <LogOut size={15} color="var(--sell-color)" />
            </button>
          </div>
        </div>
      </header>
      <div className="main-grid">
        {/* Left Side: Chart/Data */}
        <div className="chart-area" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ color: 'var(--text-secondary)', marginBottom: '10px', fontSize: '14px', textTransform: 'uppercase' }}>Live Gold Price (PAXG/USDT)</h3>
            <div className="price-display" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div className={`current-price ${priceChange === 'up' ? 'price-up' : 'price-down'}`}>
                  {livePrice ? livePrice.toFixed(2) : 'Loading...'}
                </div>
                {priceChange === 'up' ? <ArrowUpRight size={32} color="var(--buy-color)" /> : <ArrowDownRight size={32} color="var(--sell-color)" />}
              </div>
            </div>
            
            <TradingViewChart />
          </div>
        </div>

        {/* Right Side: Order Panel */}
        <div className="order-panel">
          <div className="wallet-stats">
            <div className="stat-box">
              <div className="stat-label">Wallet Balance</div>
              <div className="stat-value">{balance.toFixed(2)} <span style={{fontSize:'14px', color:'var(--text-secondary)'}}>Rs</span></div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Total Trades</div>
              <div className="stat-value">{trades.length}</div>
            </div>
          </div>
          <div className="glass-panel" style={{ flex: 1 }}>
            <h3 style={{ marginBottom: '20px' }}>Place Order</h3>
            <div className="input-group">
              <label>Quantity (Lots)</label>
              <input 
                type="number" 
                className="custom-input" 
                value={quantity} 
                onChange={(e) => setQuantity(Number(e.target.value))}
                min="1"
              />
            </div>
            <div style={{ marginTop: '15px', marginBottom: '25px', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Auto TP: 5 Pips<br/>
              Auto SL: 1 Pip<br/>
              Profit on TP: 140 Rs
            </div>
            <div className="trade-buttons">
              <button 
                className="btn btn-buy" 
                onClick={() => handleOrder('BUY')}
                disabled={isProcessingOrder}
                style={{ opacity: isProcessingOrder ? 0.5 : 1 }}
              >
                {isProcessingOrder ? 'PROCESSING...' : 'BUY'}
              </button>
              <button 
                className="btn btn-sell" 
                onClick={() => handleOrder('SELL')}
                disabled={isProcessingOrder}
                style={{ opacity: isProcessingOrder ? 0.5 : 1 }}
              >
                {isProcessingOrder ? 'PROCESSING...' : 'SELL'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      {showDeposit && <DepositModal onClose={() => setShowDeposit(false)} />}
      <MobileNavBar activeTab="trade" />
    </div>
  );
};

export default TradingPlatform;

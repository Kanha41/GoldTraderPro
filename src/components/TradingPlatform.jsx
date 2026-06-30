import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/useAppContext';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, Wallet, ArrowUpRight, ArrowDownRight, Info, AlertTriangle, X, Trophy, Lock, Star } from 'lucide-react';
import TradingViewChart from './TradingViewChart';
import MobileNavBar from './MobileNavBar';
import DepositModal from './DepositModal';

const RRR_OPTIONS = [
  {
    ratio: '1:10',
    label: '1 : 10',
    slPips: 5,
    tpPips: 50,
    prize: 10000,
    color: '#a855f7',
    glow: 'rgba(168,85,247,0.3)',
    desc: 'High reward, hardest to maintain mentally',
    recommended: false
  },
  {
    ratio: '1:5',
    label: '1 : 5',
    slPips: 5,
    tpPips: 25,
    prize: 6000,
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.3)',
    desc: 'Great reward for confident traders',
    recommended: false
  },
  {
    ratio: '1:4',
    label: '1 : 4',
    slPips: 5,
    tpPips: 20,
    prize: 5000,
    color: '#10b981',
    glow: 'rgba(16,185,129,0.3)',
    desc: 'Best for beginners — forgiving and achievable',
    recommended: true
  },
  {
    ratio: '1:2.5',
    label: '1 : 2.5',
    slPips: 5,
    tpPips: 12.5,
    prize: 2500,
    color: '#38bdf8',
    glow: 'rgba(56,189,248,0.3)',
    desc: 'Quick wins, great for consistency',
    recommended: false
  }
];

const TradingPlatform = () => {
  const { 
    user, 
    logout, 
    balance, 
    trades, 
    addTrade, 
    completeTrade, 
    accountType, 
    setAccountType, 
    livePrice, 
    priceChange,
    activeChallengeAccount,
    enrollChallengeAccount,
    selectChallengeTarget,
    addChallengeTrade
  } = useAppContext();
  const navigate = useNavigate();
  
  const [toast, setToast] = useState(null);
  const [showRrrModal, setShowRrrModal] = useState(false);
  const [selectedRrr, setSelectedRrr] = useState('1:4');
  const [enrollingRrr, setEnrollingRrr] = useState(false);
  
  const [quantity, setQuantity] = useState(1);
  const [realTpPips, setRealTpPips] = useState(7);
  const [realSlPips, setRealSlPips] = useState(4);
  const [showDeposit, setShowDeposit] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const isWeekend = [0,6].includes(new Date().getDay());

  // Derive locked SL/TP from active challenge account's ratio
  const lockedRrr = activeChallengeAccount?.riskRewardRatio || '1:4';
  const lockedRrrCfg = RRR_OPTIONS.find(r => r.ratio === lockedRrr) || RRR_OPTIONS[2];
  const computedSl = livePrice > 0 ? (livePrice - lockedRrrCfg.slPips).toFixed(2) : '—';
  const computedTp = livePrice > 0 ? (livePrice + lockedRrrCfg.tpPips).toFixed(2) : '—';
  const computedSlSell = livePrice > 0 ? (livePrice + lockedRrrCfg.slPips).toFixed(2) : '—';
  const computedTpSell = livePrice > 0 ? (livePrice - lockedRrrCfg.tpPips).toFixed(2) : '—';

  // Scroll to top on mount to ensure the top part of the screen is always displayed
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Sync default lot size / quantity when switching account types
  useEffect(() => {
    if (accountType === 'CHALLENGE') {
      setQuantity(0.01);
    } else {
      setQuantity(1);
    }
  }, [accountType]);

  const handleOrder = async (type) => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (isProcessingOrder) return;
    
    if (isWeekend) {
      alert("Market is closed on weekends. Trades cannot be placed.");
      return;
    }

    if (quantity <= 0) return;

    if (livePrice <= 0) {
      alert("Live price not available. Cannot place trade.");
      return;
    }

    setIsProcessingOrder(true);

    if (accountType === 'CHALLENGE') {
      if (!activeChallengeAccount) {
        alert("Please enroll in the 3-Stage Challenge first.");
        setIsProcessingOrder(false);
        return;
      }

      const res = await addChallengeTrade({
        side: type,
        lotSize: quantity,
        currentPrice: livePrice,
        tpPips: lockedRrrCfg.tpPips,
        slPips: lockedRrrCfg.slPips
      });

      if (res && res.success) {
        setToast({ message: `Challenge ${type} Order placed at ${livePrice.toFixed(2)}`, type: 'success' });
        setTimeout(() => setToast(null), 4000);
      }
    } else {
      if (realTpPips < 7) {
        alert("Take Profit must be at least 7 pips.");
        setIsProcessingOrder(false);
        return;
      }
      if (realSlPips > 4) {
        alert("Stop Loss must be at most 4 pips.");
        setIsProcessingOrder(false);
        return;
      }

      if (balance < (80 * quantity)) {
        alert(`Insufficient balance. You need at least ${80 * quantity} Rs to place an order of ${quantity} lots.`);
        setIsProcessingOrder(false);
        return;
      }

      // Entry at exact current price
      const entryPrice = livePrice;

      await addTrade({
        pair: 'XAUUSD',
        type,
        amount: quantity,
        price: entryPrice,
        takeProfit: type === 'BUY' ? entryPrice + realTpPips : entryPrice - realTpPips,
        stopLoss:   type === 'BUY' ? entryPrice - realSlPips : entryPrice + realSlPips,
        tpPips: realTpPips,
        slPips: realSlPips,
        status: 'OPEN'
      });
      
      setToast({ message: `Order of ${quantity} lots placed at ${entryPrice.toFixed(2)}`, type: 'success' });
      setTimeout(() => setToast(null), 4000);
    }
    
    setIsProcessingOrder(false);
  };

  // RRR Enrollment Modal
  const RrrModal = () => (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(160deg, #0f172a 0%, #0b0e1a 100%)',
        border: '1px solid rgba(56,189,248,0.3)',
        borderRadius: '24px',
        padding: '30px 24px',
        maxWidth: '420px',
        width: '100%',
        boxShadow: '0 25px 60px rgba(0,0,0,0.7)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px auto',
            boxShadow: '0 0 24px rgba(56,189,248,0.4)'
          }}>
            <Trophy size={28} color="#000" />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', marginBottom: '6px' }}>Choose Your Risk-Reward Ratio</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            This sets your <strong style={{ color: '#f59e0b' }}>locked SL &amp; TP</strong> for every challenge trade.<br/>
            <span style={{ color: '#ef4444', fontWeight: '600' }}>Cannot be changed until your real account is won.</span>
          </p>
        </div>

        {/* Rule Banner */}
        <div style={{
          background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)',
          borderRadius: '10px', padding: '10px 14px', marginBottom: '20px',
          fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.6'
        }}>
          📏 <strong style={{ color: '#38bdf8' }}>Risk is always 1 (= 5 pips SL)</strong><br/>
          E.g. at entry <strong>4344</strong> with <strong>1:4</strong>: SL = 4339 | TP = 4364
        </div>

        {/* RRR Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '22px' }}>
          {RRR_OPTIONS.map(opt => (
            <div
              key={opt.ratio}
              onClick={() => setSelectedRrr(opt.ratio)}
              style={{
                position: 'relative',
                background: selectedRrr === opt.ratio
                  ? `linear-gradient(135deg, rgba(${opt.ratio==='1:10'?'168,85,247':opt.ratio==='1:5'?'245,158,11':'16,185,129'},0.18), rgba(${opt.ratio==='1:10'?'168,85,247':opt.ratio==='1:5'?'245,158,11':'16,185,129'},0.06))`
                  : 'rgba(255,255,255,0.02)',
                border: `1.5px solid ${selectedRrr === opt.ratio ? opt.color : 'rgba(255,255,255,0.07)'}`,
                borderRadius: '14px',
                padding: '14px 16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: selectedRrr === opt.ratio ? `0 0 16px ${opt.glow}` : 'none'
              }}
            >
              {opt.recommended && (
                <div style={{
                  position: 'absolute', top: '-10px', right: '14px',
                  background: 'linear-gradient(90deg, #10b981, #059669)',
                  color: '#000', fontSize: '9px', fontWeight: '800',
                  padding: '2px 10px', borderRadius: '20px',
                  letterSpacing: '0.05em', textTransform: 'uppercase',
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                  <Star size={8} fill="#000" /> Recommended
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '20px', fontWeight: '900', color: opt.color, letterSpacing: '0.02em' }}>{opt.label}</span>
                <span style={{
                  fontSize: '11px', fontWeight: '700',
                  background: 'rgba(255,255,255,0.06)', borderRadius: '8px',
                  padding: '3px 10px', color: '#fff'
                }}>🏆 ₹{opt.prize.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: '#ef4444' }}>SL: <strong>5 pips</strong></span>
                <span style={{ color: '#10b981' }}>TP: <strong>{opt.tpPips} pips</strong></span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{opt.desc}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <button
          disabled={enrollingRrr}
          onClick={async () => {
            setEnrollingRrr(true);
            const res = await enrollChallengeAccount(selectedRrr);
            setEnrollingRrr(false);
            if (res && res.success) {
              setShowRrrModal(false);
              setToast({ message: `Enrolled with ${selectedRrr} ratio! Good luck! 🏆`, type: 'success' });
              setTimeout(() => setToast(null), 5000);
            } else {
              setToast({ message: res?.message || 'Enrollment failed.', type: 'error' });
              setTimeout(() => setToast(null), 4000);
            }
          }}
          style={{
            width: '100%', padding: '14px',
            background: enrollingRrr ? 'rgba(56,189,248,0.3)' : 'linear-gradient(90deg, #38bdf8, #0ea5e9)',
            color: '#000', border: 'none', borderRadius: '12px',
            fontWeight: '800', fontSize: '14px', cursor: enrollingRrr ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 15px rgba(56,189,248,0.3)',
            transition: 'opacity 0.2s'
          }}
        >
          {enrollingRrr ? 'Enrolling...' : `Enroll with ${selectedRrr} Ratio`}
        </button>
        <button
          onClick={() => setShowRrrModal(false)}
          style={{
            width: '100%', marginTop: '10px', padding: '10px',
            background: 'transparent', color: 'var(--text-secondary)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
            fontSize: '13px', cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );

  // Render Enrollment Screen for unenrolled Challenge account
  if (accountType === 'CHALLENGE' && !activeChallengeAccount) {
    return (
      <div className="app-container" style={{ paddingBottom: '90px' }}>
        {showRrrModal && <RrrModal />}
        <header className="header" style={{ gap: '15px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div className="logo">
            <span>&#x2B22;</span> GoldTrader Pro
          </div>
          <div className="account-switcher">
            <div style={{
              position: 'absolute',
              top: '2px',
              bottom: '2px',
              left: '2px',
              width: 'calc(100% - 4px)',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(14, 165, 233, 0.15))',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '28px',
              boxShadow: '0 0 10px rgba(56, 189, 248, 0.2)',
              zIndex: 1
            }} />
            {/* <button className="account-switcher-btn" onClick={() => setAccountType('REAL')} style={{ color: 'var(--text-secondary)', textShadow: 'none' }}>Real</button> */}
            <button className="account-switcher-btn" onClick={() => setAccountType('CHALLENGE')} style={{ color: '#38bdf8', textShadow: '0 0 8px rgba(56, 189, 248, 0.3)', width: '100%' }}>Free Fund</button>
            {/* <button className="account-switcher-btn" onClick={() => setAccountType('DEMO')} style={{ color: 'var(--text-secondary)', textShadow: 'none' }}>Demo</button> */}
          </div>
        </header>

        <div style={{ maxWidth: '600px', margin: '40px auto 0 auto', padding: '0 15px' }}>
          <div className="glass-panel" style={{
            borderRadius: '24px',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(12px)',
            padding: '40px 30px',
            textAlign: 'center',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px auto',
              boxShadow: '0 0 30px rgba(56, 189, 248, 0.4)'
            }}>
              <Trophy size={42} color="#000" />
            </div>

            <h2 style={{ fontSize: '30px', fontWeight: '800', color: '#fff', marginBottom: '10px', letterSpacing: '-0.03em' }}>
              Free Fund
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '30px', lineHeight: '1.6' }}>
              Prove your trading skill! Pass the Profit Target then win a Triplet Trade to earn Cash Prize + Funded Status.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '35px', textAlign: 'left' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--panel-border)', borderRadius: '16px', padding: '14px' }}>
                <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 'bold', display: 'block', textTransform: 'uppercase', marginBottom: '6px' }}>Stage 1 — Demo Triplet Trade</span>
                <strong style={{ fontSize: '14px', color: '#fff', display: 'block', marginBottom: '4px' }}>Win 3 Consecutive Trades (Practice)</strong>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4', display: 'block' }}>Get 3 consecutive wins in demo mode. 2 attempts per try. Auto-restarts on failure.</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--panel-border)', borderRadius: '16px', padding: '14px' }}>
                <span style={{ fontSize: '10px', color: '#a855f7', fontWeight: 'bold', display: 'block', textTransform: 'uppercase', marginBottom: '6px' }}>Stage 2 — Demo Twice Trade</span>
                <strong style={{ fontSize: '14px', color: '#fff', display: 'block', marginBottom: '4px' }}>Win 2 Consecutive Trades (Practice)</strong>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4', display: 'block' }}>Get 2 consecutive wins in demo mode. 2 attempts. Failure resets to Stage 1.</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--panel-border)', borderRadius: '16px', padding: '14px' }}>
                <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 'bold', display: 'block', textTransform: 'uppercase', marginBottom: '6px' }}>Stage 3 — Real Choice Trade</span>
                <strong style={{ fontSize: '14px', color: '#fff', display: 'block', marginBottom: '4px' }}>Choose your target for real</strong>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4', display: 'block' }}>Choose between Triplet or Twice trade. Pass to earn Cash Prize + Funded Status. Failure resets to Stage 1.</span>
              </div>
            </div>

            <button
              onClick={() => {
                if (!user) { navigate('/login'); return; }
                setSelectedRrr('1:4');
                setShowRrrModal(true);
              }}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(90deg, #38bdf8, #0ea5e9)',
                color: '#000',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '800',
                fontSize: '15px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(56, 189, 248, 0.3)',
                transition: 'transform 0.1s'
              }}
            >
              Enroll &amp; Choose Ratio
            </button>
          </div>
        </div>

        <MobileNavBar activeTab="trade" />
      </div>
    );
  }


  return (
    <div className="app-container" style={{ paddingBottom: '90px' }}>
      {showRrrModal && <RrrModal />}
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
        <div className="account-switcher">
          {/* Animated Background Selector */}
          <div style={{
            position: 'absolute',
            top: '2px',
            bottom: '2px',
            left: '2px',
            width: 'calc(100% - 4px)',
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(14, 165, 233, 0.15))',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '28px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 0 10px rgba(56, 189, 248, 0.2)',
            zIndex: 1
          }} />
          
          {/* <button 
            className="account-switcher-btn"
            onClick={() => setAccountType('REAL')}
            style={{
              color: accountType === 'REAL' ? 'var(--buy-color)' : 'var(--text-secondary)',
              textShadow: accountType === 'REAL' ? '0 0 8px rgba(16, 185, 129, 0.3)' : 'none'
            }}
          >
            Real
          </button> */}

          <button 
            className="account-switcher-btn"
            onClick={() => setAccountType('CHALLENGE')}
            style={{
              color: '#38bdf8',
              textShadow: '0 0 8px rgba(56, 189, 248, 0.3)',
              width: '100%'
            }}
          >
            Free Fund
          </button>
          
          {/* <button 
            className="account-switcher-btn"
            onClick={() => setAccountType('DEMO')}
            title="Demo money cannot be withdrawn"
            style={{
              color: accountType === 'DEMO' ? 'var(--accent)' : 'var(--text-secondary)',
              textShadow: accountType === 'DEMO' ? '0 0 8px rgba(234, 179, 8, 0.3)' : 'none'
            }}
          >
            Demo
          </button> */}
        </div>

        <div className="header-actions">
          {!user ? (
            <button 
              className="btn" 
              onClick={() => navigate('/login')}
              style={{ background: 'var(--buy-color)', color: '#000', fontWeight: 'bold' }}
            >
              Login / Register
            </button>
          ) : (
            <>
              <button className="btn btn-outline" onClick={() => setShowDeposit(true)}>
                <Wallet size={16} /> Deposit
              </button>
              {user?.role === 'admin' && (
                <button className="btn btn-outline" onClick={() => navigate('/admin')}>
                  <Settings size={16} /> Admin
                </button>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--panel-border)', padding: '6px 16px', borderRadius: '24px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: '1.2' }}>
                  <span style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: '600' }}>{user?.fullName || user?.username}</span>
                  <span style={{ color: 'var(--accent)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold' }}>{user?.role}</span>
                </div>
                <button onClick={logout} className="btn" style={{ padding: '4px', background: 'none' }} title="Log Out">
                  <LogOut size={15} color="var(--sell-color)" />
                </button>
              </div>
            </>
          )}
        </div>
      </header>
      <div className="main-grid">
        {/* Left Side: Chart/Data */}
        <div className="chart-area" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '18px', fontWeight: '800', color: priceChange === 'up' ? 'var(--buy-color)' : 'var(--sell-color)' }}>
                {livePrice ? livePrice.toFixed(2) : 'Loading...'}
              </span>
              <h3 style={{ color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase', margin: 0, fontWeight: '600' }}>
                {accountType === 'CHALLENGE' ? 'Live XAU/USD Gold Price' : 'Live Gold Price'}
              </h3>
              {priceChange === 'up' ? <ArrowUpRight size={18} color="var(--buy-color)" /> : <ArrowDownRight size={18} color="var(--sell-color)" />}
            </div>
            
            <TradingViewChart />
          </div>
        </div>

        {/* Right Side: Order Panel */}
        <div className="order-panel">
          {accountType === 'CHALLENGE' && activeChallengeAccount ? (
            <div className="wallet-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
              <div className="stat-box">
                <div className="stat-label">Challenge Stage</div>
                <div className="stat-value" style={{ color: '#38bdf8', fontSize: '18px' }}>
                  Stage {activeChallengeAccount.currentStage}
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Account Balance</div>
                <div className="stat-value" style={{ fontSize: '18px' }}>
                  ${balance.toFixed(2)} <span style={{fontSize:'11px', color:'var(--text-secondary)'}}>USD</span>
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Trades Count</div>
                <div className="stat-value" style={{ fontSize: '18px' }}>{trades.length}</div>
              </div>
            </div>
          ) : (
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
          )}

          {/* Challenge Progress Dashboard */}
          {accountType === 'CHALLENGE' && activeChallengeAccount && (
            <div className="glass-panel" style={{ borderRadius: '16px', border: '1px solid rgba(56, 189, 248, 0.25)', background: 'rgba(56, 189, 248, 0.03)', padding: '16px', marginBottom: '20px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Trophy size={16} color="#38bdf8" />
                <strong style={{ fontSize: '13px', color: '#fff' }}>
                  {activeChallengeAccount.currentStage === 1 ? 'Stage 1 — Demo Triplet Trade' : 
                   activeChallengeAccount.currentStage === 2 ? 'Stage 2 — Demo Twice Trade' : 
                   'Stage 3 — Real Choice Trade'}
                </strong>
                <span style={{
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  background: activeChallengeAccount.currentStage < 3 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: activeChallengeAccount.currentStage < 3 ? '#38bdf8' : 'var(--buy-color)',
                  marginLeft: 'auto'
                }}>
                  {activeChallengeAccount.currentStage < 3 ? 'DEMO' : 'REAL'}
                </span>
              </div>
              
              {activeChallengeAccount.currentStage < 3 && activeChallengeAccount.progress && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Target: {activeChallengeAccount.currentStage === 1 ? 3 : 2} Consecutive Wins</span>
                    <span style={{ color: '#ef4444', fontSize: '10px', fontWeight: '600' }}>⚠ A loss resets the streak</span>
                    <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>Streak: {activeChallengeAccount.progress.currentStreak} / {activeChallengeAccount.currentStage === 1 ? 3 : 2}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', margin: '8px 0' }}>
                    {Array.from({ length: activeChallengeAccount.currentStage === 1 ? 3 : 2 }).map((_, idx) => {
                      const active = idx < activeChallengeAccount.progress.currentStreak;
                      return (
                        <div key={idx} style={{
                          flex: 1,
                          height: '12px',
                          background: active ? 'linear-gradient(90deg, #38bdf8, #0ea5e9)' : 'rgba(255,255,255,0.05)',
                          border: active ? '1px solid #38bdf8' : '1px solid var(--panel-border)',
                          borderRadius: '6px',
                          boxShadow: active ? '0 0 8px rgba(56, 189, 248, 0.3)' : 'none'
                        }} />
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    <span>Attempt {(activeChallengeAccount.progress.tripletAttempts || 0) + 1} of 2</span>
                    <span>{activeChallengeAccount.currentStage === 1 ? 'Fail resets attempt.' : 'Fail resets to Stage 1.'}</span>
                  </div>
                </div>
              )}

              {activeChallengeAccount.currentStage === 3 && activeChallengeAccount.progress && (
                <div>
                  {/* Removed manual target selection since it is fixed to 3 */}
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Target: {activeChallengeAccount.progress.targetWins} Consecutive Wins</span>
                        <span style={{ color: '#ef4444', fontSize: '10px', fontWeight: '600' }}>⚠ A loss resets the streak</span>
                        <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>Streak: {activeChallengeAccount.progress.currentStreak} / {activeChallengeAccount.progress.targetWins}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', margin: '8px 0' }}>
                        {Array.from({ length: activeChallengeAccount.progress.targetWins }).map((_, idx) => {
                          const active = idx < activeChallengeAccount.progress.currentStreak;
                          return (
                            <div key={idx} style={{
                              flex: 1,
                              height: '12px',
                              background: active ? 'linear-gradient(90deg, #f59e0b, #d97706)' : 'rgba(255,255,255,0.05)',
                              border: active ? '1px solid #f59e0b' : '1px solid var(--panel-border)',
                              borderRadius: '6px',
                              boxShadow: active ? '0 0 8px rgba(245, 158, 11, 0.3)' : 'none'
                            }} />
                          );
                        })}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        <span>Attempt {(activeChallengeAccount.progress.tripletAttempts || 0) + 1} of 2</span>
                        <span>A loss resets streak. 2 failed attempts = restart Stage 1.</span>
                      </div>
                    </>
                </div>
              )}
            </div>
          )}

          <div className="glass-panel" style={{ flex: 1 }}>
            <h3>Place Order</h3>
            <div className="input-group" style={{ marginTop: '15px' }}>
              <label>{accountType === 'CHALLENGE' ? 'Lot Size (0.01 min)' : 'Quantity (Lots)'}</label>
              <input 
                type="number" 
                className="custom-input" 
                value={quantity} 
                onChange={(e) => setQuantity(Number(e.target.value))}
                min={accountType === 'CHALLENGE' ? "0.01" : "1"}
                step={accountType === 'CHALLENGE' ? "0.01" : "1"}
              />
            </div>
            
            {accountType === 'CHALLENGE' ? (
              <>
                {/* Locked RRR badge */}
                <div style={{
                  marginTop: '15px',
                  padding: '10px 14px',
                  background: `linear-gradient(135deg, rgba(${lockedRrrCfg.ratio==='1:10'?'168,85,247':lockedRrrCfg.ratio==='1:5'?'245,158,11':'16,185,129'},0.12), transparent)`,
                  border: `1px solid ${lockedRrrCfg.color}40`,
                  borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Lock size={13} color={lockedRrrCfg.color} />
                    <span style={{ fontSize: '12px', color: lockedRrrCfg.color, fontWeight: '700' }}>Locked Ratio: {lockedRrr}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Prize: ₹{lockedRrrCfg.prize.toLocaleString('en-IN')}</span>
                </div>

                {/* Auto-computed SL/TP display (read-only) */}
                <div style={{ marginTop: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '10px', color: '#ef4444', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Lock size={9}/> SL · {lockedRrrCfg.slPips} pips
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#ef4444' }}>BUY: {computedSl}</div>
                    <div style={{ fontSize: '11px', color: '#ef4444', opacity: 0.7 }}>SELL: {computedSlSell}</div>
                  </div>
                  <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '10px', color: '#10b981', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Lock size={9}/> TP · {lockedRrrCfg.tpPips} pips
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#10b981' }}>BUY: {computedTp}</div>
                    <div style={{ fontSize: '11px', color: '#10b981', opacity: 0.7 }}>SELL: {computedTpSell}</div>
                  </div>
                </div>
                <div style={{ marginTop: '10px', marginBottom: '20px', padding: '9px 12px', background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.1)', borderRadius: '8px', fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Instrument: <strong>XAUUSD only</strong><br/>
                  1 Pip = <strong>$1 USD</strong> · SL/TP auto-set from your locked ratio
                </div>
              </>
            ) : (
              <>
                <div className="input-group" style={{ marginTop: '15px' }}>
                  <label>Take Profit (Pips) - Min 7</label>
                  <input
                    type="number"
                    className="custom-input"
                    value={realTpPips}
                    onChange={(e) => setRealTpPips(Number(e.target.value))}
                    min="7"
                  />
                </div>
                <div className="input-group" style={{ marginTop: '15px' }}>
                  <label>Stop Loss (Pips) - Max 4</label>
                  <input
                    type="number"
                    className="custom-input"
                    value={realSlPips}
                    onChange={(e) => setRealSlPips(Number(e.target.value))}
                    max="4"
                  />
                </div>
                <div style={{ marginTop: '15px', marginBottom: '25px', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'left', lineHeight: '1.6' }}>
                  Instrument: <strong>XAUUSD</strong><br/>
                  Order Amount: <strong>{80 * quantity} Rs</strong><br/>
                  1 Pip = <strong>$1 USD (per 1 lot)</strong><br/>
                  Potential Profit (TP): <strong style={{ color: 'var(--buy-color)' }}>+${(realTpPips * quantity).toFixed(2)} USD</strong><br/>
                  Potential Loss (SL): <strong style={{ color: 'var(--sell-color)' }}>-${(realSlPips * quantity).toFixed(2)} USD</strong>
                </div>
              </>
            )}

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


      {showDeposit && <DepositModal onClose={() => setShowDeposit(false)} />}
      <MobileNavBar activeTab="trade" />
    </div>
  );
};

export default TradingPlatform;

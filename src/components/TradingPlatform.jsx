import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/useAppContext';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, Wallet, ArrowUpRight, ArrowDownRight, Info, AlertTriangle, X, Trophy } from 'lucide-react';
import TradingViewChart from './TradingViewChart';
import MobileNavBar from './MobileNavBar';
import DepositModal from './DepositModal';


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
    addChallengeTrade
  } = useAppContext();
  const navigate = useNavigate();
  
  const [toast, setToast] = useState(null);
  
  const [quantity, setQuantity] = useState(1);
  const [tpPips, setTpPips] = useState(8);
  const [slPips, setSlPips] = useState(3);
  const [realTpPips, setRealTpPips] = useState(7);
  const [realSlPips, setRealSlPips] = useState(4);
  const [showDeposit, setShowDeposit] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const isWeekend = [0,6].includes(new Date().getDay());

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

      if (tpPips < 8) {
        alert("Take Profit must be at least 8 pips.");
        setIsProcessingOrder(false);
        return;
      }
      if (slPips > 3) {
        alert("Stop Loss must be at most 3 pips.");
        setIsProcessingOrder(false);
        return;
      }

      const res = await addChallengeTrade({
        side: type,
        lotSize: quantity,
        currentPrice: livePrice,
        tpPips: tpPips,
        slPips: slPips
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

  // Render Enrollment Screen for unenrolled Challenge account
  if (accountType === 'CHALLENGE' && !activeChallengeAccount) {
    return (
      <div className="app-container" style={{ paddingBottom: '90px' }}>
        <header className="header" style={{ gap: '15px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div className="logo">
            <span>&#x2B22;</span> GoldTrader Pro
          </div>
          <div className="account-switcher">
            <div style={{
              position: 'absolute',
              top: '2px',
              bottom: '2px',
              left: 'calc((100% - 4px) / 3 + 2px)',
              width: 'calc((100% - 4px) / 3)',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(14, 165, 233, 0.15))',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '28px',
              boxShadow: '0 0 10px rgba(56, 189, 248, 0.2)',
              zIndex: 1
            }} />
            <button className="account-switcher-btn" onClick={() => setAccountType('REAL')} style={{ color: 'var(--text-secondary)', textShadow: 'none' }}>Real</button>
            <button className="account-switcher-btn" onClick={() => setAccountType('CHALLENGE')} style={{ color: '#38bdf8', textShadow: '0 0 8px rgba(56, 189, 248, 0.3)' }}>Challenge</button>
            <button className="account-switcher-btn" onClick={() => setAccountType('DEMO')} style={{ color: 'var(--text-secondary)', textShadow: 'none' }}>Demo</button>
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
              Funded Challenge
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '30px', lineHeight: '1.6' }}>
              Prove your trading skill! Pass the Profit Target then win a Triplet Trade to earn ₹800 Cash Prize + Funded Status.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '35px', textAlign: 'left' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--panel-border)', borderRadius: '16px', padding: '14px' }}>
                <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 'bold', display: 'block', textTransform: 'uppercase', marginBottom: '6px' }}>Stage 1 — Profit Target</span>
                <strong style={{ fontSize: '14px', color: '#fff', display: 'block', marginBottom: '4px' }}>Grow to $1,300</strong>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4', display: 'block' }}>Start with $1,000 and grow your balance to $1,300 (+30% profit). TP min 8 pips, SL max 3 pips.</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--panel-border)', borderRadius: '16px', padding: '14px' }}>
                <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 'bold', display: 'block', textTransform: 'uppercase', marginBottom: '6px' }}>Stage 2 — Triplet Trade</span>
                <strong style={{ fontSize: '14px', color: '#fff', display: 'block', marginBottom: '4px' }}>Win 3 Consecutive Trades</strong>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4', display: 'block' }}>Trade a triplet (3 trades). All 3 must be consecutive wins. You get 2 attempts. If both fail, you restart from Stage 1.</span>
              </div>
            </div>



            <button
              onClick={async () => {
                if (!user) {
                  navigate('/login');
                  return;
                }
                if (window.confirm("Enroll in the 3-Stage Funded Challenge? This will start a new evaluation account starting at $1,000. Proceed?")) {
                  const res = await enrollChallengeAccount();
                  if (res && res.success) {
                    alert("Enrolled successfully! Good luck trading XAUUSD!");
                  } else {
                    alert(res?.message || "Enrollment failed.");
                  }
                }
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
              Enroll Challenge Account
            </button>
          </div>
        </div>

        <MobileNavBar activeTab="trade" />
      </div>
    );
  }


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
        <div className="account-switcher">
          {/* Animated Background Selector */}
          <div style={{
            position: 'absolute',
            top: '2px',
            bottom: '2px',
            left: accountType === 'REAL' 
              ? '2px' 
              : accountType === 'CHALLENGE' 
                ? 'calc((100% - 4px) / 3 + 2px)' 
                : 'calc((100% - 4px) * 2 / 3 + 2px)',
            width: 'calc((100% - 4px) / 3)',
            background: accountType === 'REAL' 
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(16, 185, 129, 0.1))'
              : accountType === 'CHALLENGE'
                ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(14, 165, 233, 0.15))'
                : 'linear-gradient(135deg, rgba(234, 179, 8, 0.25), rgba(217, 119, 6, 0.15))',
            border: accountType === 'REAL' 
              ? '1px solid rgba(16, 185, 129, 0.4)' 
              : accountType === 'CHALLENGE'
                ? '1px solid rgba(56, 189, 248, 0.4)'
                : '1px solid rgba(234, 179, 8, 0.4)',
            borderRadius: '28px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: accountType === 'REAL' 
              ? '0 0 10px rgba(16, 185, 129, 0.2)' 
              : accountType === 'CHALLENGE'
                ? '0 0 10px rgba(56, 189, 248, 0.2)'
                : '0 0 10px rgba(234, 179, 8, 0.2)',
            zIndex: 1
          }} />
          
          <button 
            className="account-switcher-btn"
            onClick={() => setAccountType('REAL')}
            style={{
              color: accountType === 'REAL' ? 'var(--buy-color)' : 'var(--text-secondary)',
              textShadow: accountType === 'REAL' ? '0 0 8px rgba(16, 185, 129, 0.3)' : 'none'
            }}
          >
            Real
          </button>

          <button 
            className="account-switcher-btn"
            onClick={() => setAccountType('CHALLENGE')}
            style={{
              color: accountType === 'CHALLENGE' ? '#38bdf8' : 'var(--text-secondary)',
              textShadow: accountType === 'CHALLENGE' ? '0 0 8px rgba(56, 189, 248, 0.3)' : 'none'
            }}
          >
            Challenge
          </button>
          
          <button 
            className="account-switcher-btn"
            onClick={() => setAccountType('DEMO')}
            title="Demo money cannot be withdrawn"
            style={{
              color: accountType === 'DEMO' ? 'var(--accent)' : 'var(--text-secondary)',
              textShadow: accountType === 'DEMO' ? '0 0 8px rgba(234, 179, 8, 0.3)' : 'none'
            }}
          >
            Demo
          </button>
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
                  {activeChallengeAccount.currentStage === 1 ? 'Stage 1 — Profit Target' : 'Stage 2 — Triplet Trade'}
                </strong>
              </div>
              
              {activeChallengeAccount.currentStage === 1 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Target: $1,300</span>
                    <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>${balance.toFixed(2)} / $1,300</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(0,0,0,0.4)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.max(0, Math.min(100, ((balance - 1000) / 300) * 100))}%`,
                      height: '100%',
                      background: '#38bdf8',
                      borderRadius: '3px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '6px' }}>
                    Grow balance from $1,000 to $1,300.
                  </span>
                </div>
              )}

              {activeChallengeAccount.currentStage === 3 && activeChallengeAccount.progress && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Target: 3 Consecutive Wins</span>
                    <span style={{ color: '#ef4444', fontSize: '10px', fontWeight: '600' }}>⚠ A loss resets the streak</span>
                    <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>Streak: {activeChallengeAccount.progress.currentStreak} / 3</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', margin: '8px 0' }}>
                    {Array.from({ length: 3 }).map((_, idx) => {
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
                <div className="input-group" style={{ marginTop: '15px' }}>
                  <label>Take Profit (Pips) - Min 8</label>
                  <input 
                    type="number" 
                    className="custom-input" 
                    value={tpPips} 
                    onChange={(e) => setTpPips(Number(e.target.value))}
                    min="8"
                  />
                </div>
                <div className="input-group" style={{ marginTop: '15px' }}>
                  <label>Stop Loss (Pips) - Max 3</label>
                  <input 
                    type="number" 
                    className="custom-input" 
                    value={slPips} 
                    onChange={(e) => setSlPips(Number(e.target.value))}
                    max="3"
                  />
                </div>
                <div style={{ marginTop: '15px', marginBottom: '25px', padding: '12px', background: 'rgba(56, 189, 248, 0.04)', border: '1px solid rgba(56, 189, 248, 0.1)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'left', lineHeight: '1.5' }}>
                  Instrument: <strong>XAUUSD only</strong><br/>
                  1 Pip = <strong>$1 USD</strong><br/>
                  Potential Profit (TP): <strong style={{ color: 'var(--buy-color)' }}>+${(tpPips).toFixed(2)} USD</strong><br/>
                  Potential Loss (SL): <strong style={{ color: 'var(--sell-color)' }}>-${(slPips).toFixed(2)} USD</strong>
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

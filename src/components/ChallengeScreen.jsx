import React, { useState } from 'react';
import { useAppContext } from '../context/useAppContext';
import { useNavigate } from 'react-router-dom';
import MobileNavBar from './MobileNavBar';
import { Trophy, Award, Star, Target, Lock } from 'lucide-react';
import {
  normalizeChallengeData,
  normalizeTradeChallengeData,
  getChallengeTotalDays,
  getRequiredTrades,
  getChallengePrize,
  isChallengeFullyComplete,
  isTradeChallengeComplete,
  getChallengeRewardTransaction,
  TRADE_CHALLENGE_TYPE,
  TRADE_CHALLENGE_TARGET,
  CHALLENGE_PRIZES
} from '../utils/challenge';

const RRR_OPTIONS = [
  { ratio: '1:10', label: '1 : 10', slPips: 5, tpPips: 50, prize: 10000, color: '#a855f7', glow: 'rgba(168,85,247,0.3)', desc: 'High reward, hardest to maintain mentally', recommended: false },
  { ratio: '1:5',  label: '1 : 5',  slPips: 5, tpPips: 25, prize: 60000, color: '#f59e0b', glow: 'rgba(245,158,11,0.3)', desc: 'Great reward for confident traders', recommended: false },
  { ratio: '1:4',  label: '1 : 4',  slPips: 5, tpPips: 20, prize: 5000,  color: '#10b981', glow: 'rgba(16,185,129,0.3)', desc: 'Best for beginners — forgiving and achievable', recommended: true }
];

const ChallengeScreen = () => {
  const { 
    user, 
    adminRecords, 
    switchChallenge, 
    enrollSixtyTradeChallenge, 
    activeChallengeAccount, 
    enrollChallengeAccount, 
    setAccountType 
  } = useAppContext();
  const navigate = useNavigate();
  const [dayHover, setDayHover] = useState(false);
  const [showRrrModal, setShowRrrModal] = useState(false);
  const [selectedRrr, setSelectedRrr] = useState('1:4');
  const [enrollingRrr, setEnrollingRrr] = useState(false);

  const currentUserRecord = adminRecords.find((r) => r.username === user?.username);
  const challengeData = normalizeChallengeData(currentUserRecord);
  const tradeChallengeData = normalizeTradeChallengeData(currentUserRecord);

  const activeType = challengeData.type || '30_DAY';
  const totalDays = getChallengeTotalDays(activeType);
  const requiredTrades = getRequiredTrades(activeType);
  const prizeAmount = getChallengePrize(activeType);
  const isDayComplete = isChallengeFullyComplete(challengeData);
  const dayRewardTx = getChallengeRewardTransaction(currentUserRecord?.transactions, activeType);

  const tradePrize = CHALLENGE_PRIZES[TRADE_CHALLENGE_TYPE];
  const isTradeComplete = isTradeChallengeComplete(tradeChallengeData);
  const tradeRewardTx = getChallengeRewardTransaction(
    currentUserRecord?.transactions,
    TRADE_CHALLENGE_TYPE
  );
  const daysRemaining = Math.max(0, totalDays - challengeData.completedDays);
  const tradesRemaining = Math.max(
    0,
    tradeChallengeData.targetTrades - tradeChallengeData.successfulTrades
  );

  // Locked RRR for active challenge account
  const lockedRrr = activeChallengeAccount?.riskRewardRatio || '1:4';
  const lockedRrrCfg = RRR_OPTIONS.find(r => r.ratio === lockedRrr) || RRR_OPTIONS[2];

  // RRR Selection Modal
  const RrrModal = () => (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(160deg, #0f172a 0%, #0b0e1a 100%)',
        border: '1px solid rgba(56,189,248,0.3)', borderRadius: '24px',
        padding: '30px 24px', maxWidth: '420px', width: '100%',
        boxShadow: '0 25px 60px rgba(0,0,0,0.7)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px auto', boxShadow: '0 0 24px rgba(56,189,248,0.4)'
          }}>
            <Trophy size={28} color="#000" />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', marginBottom: '6px' }}>Choose Your Risk-Reward Ratio</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            This sets your <strong style={{ color: '#f59e0b' }}>locked SL &amp; TP</strong> for every challenge trade.<br/>
            <span style={{ color: '#ef4444', fontWeight: '600' }}>Cannot be changed until your real account is won.</span>
          </p>
        </div>
        <div style={{
          background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)',
          borderRadius: '10px', padding: '10px 14px', marginBottom: '20px',
          fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.6'
        }}>
          📏 <strong style={{ color: '#38bdf8' }}>Risk is always 1 (= 5 pips SL)</strong><br/>
          E.g. at entry <strong>4344</strong> with <strong>1:4</strong>: SL = 4339 | TP = 4364
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '22px' }}>
          {RRR_OPTIONS.map(opt => (
            <div key={opt.ratio} onClick={() => setSelectedRrr(opt.ratio)} style={{
              position: 'relative',
              background: selectedRrr === opt.ratio
                ? `linear-gradient(135deg, rgba(${opt.ratio==='1:10'?'168,85,247':opt.ratio==='1:5'?'245,158,11':'16,185,129'},0.18), rgba(${opt.ratio==='1:10'?'168,85,247':opt.ratio==='1:5'?'245,158,11':'16,185,129'},0.06))`
                : 'rgba(255,255,255,0.02)',
              border: `1.5px solid ${selectedRrr === opt.ratio ? opt.color : 'rgba(255,255,255,0.07)'}`,
              borderRadius: '14px', padding: '14px 16px', cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: selectedRrr === opt.ratio ? `0 0 16px ${opt.glow}` : 'none'
            }}>
              {opt.recommended && (
                <div style={{
                  position: 'absolute', top: '-10px', right: '14px',
                  background: 'linear-gradient(90deg, #10b981, #059669)',
                  color: '#000', fontSize: '9px', fontWeight: '800',
                  padding: '2px 10px', borderRadius: '20px',
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                  <Star size={8} fill="#000" /> Recommended
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '20px', fontWeight: '900', color: opt.color }}>{opt.label}</span>
                <span style={{ fontSize: '11px', fontWeight: '700', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '3px 10px', color: '#fff' }}>🏆 ₹{opt.prize.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: '#ef4444' }}>SL: <strong>5 pips</strong></span>
                <span style={{ color: '#10b981' }}>TP: <strong>{opt.tpPips} pips</strong></span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{opt.desc}</div>
            </div>
          ))}
        </div>
        <button
          disabled={enrollingRrr}
          onClick={async () => {
            setEnrollingRrr(true);
            const res = await enrollChallengeAccount(selectedRrr);
            setEnrollingRrr(false);
            if (res && res.success) {
              setShowRrrModal(false);
              alert(`Enrolled with ${selectedRrr} ratio! Go to the Home tab → Challenge to start trading!`);
            } else {
              alert(res?.message || 'Enrollment failed.');
            }
          }}
          style={{
            width: '100%', padding: '14px',
            background: enrollingRrr ? 'rgba(56,189,248,0.3)' : 'linear-gradient(90deg, #38bdf8, #0ea5e9)',
            color: '#000', border: 'none', borderRadius: '12px',
            fontWeight: '800', fontSize: '14px', cursor: enrollingRrr ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 15px rgba(56,189,248,0.3)'
          }}
        >
          {enrollingRrr ? 'Enrolling...' : `Enroll with ${selectedRrr} Ratio`}
        </button>
        <button onClick={() => setShowRrrModal(false)} style={{
          width: '100%', marginTop: '10px', padding: '10px',
          background: 'transparent', color: 'var(--text-secondary)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
          fontSize: '13px', cursor: 'pointer'
        }}>Cancel</button>
      </div>
    </div>
  );

  const handleEnroll60Trade = () => {
    const res = enrollSixtyTradeChallenge();
    if (res.success) {
      alert('You are enrolled in the 60 Trade Challenge. Only successful trades (TP hit) count toward 60.');
    } else {
      alert(res.message);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0b0e14',
        backgroundImage: 'radial-gradient(circle at top, rgba(18, 30, 54, 0.8), #0b0e14)',
        color: 'var(--text-primary)',
        padding: '30px 15px 95px 15px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      {showRrrModal && <RrrModal />}
      <div style={{ maxWidth: '600px', width: '100%' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '24px',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              width: '70px',
              height: '70px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, var(--accent), #b45309)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 25px var(--accent-glow)',
              marginBottom: '15px',
              animation: 'pulse 3s infinite'
            }}
          >
            <Trophy size={36} color="#000" />
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '700', letterSpacing: '-0.02em', margin: '0 0 5px 0' }}>
            Trading Challenges
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
            Enroll in our 3-Stage Funded Challenge to win cash prizes and funded status.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 3-Stage Funded Challenge Card */}
          <div
            className="glass-panel"
            style={{
              borderRadius: '16px',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              background: 'rgba(16, 185, 129, 0.04)',
              textAlign: 'left',
              padding: '24px',
              position: 'relative'
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: activeChallengeAccount
                  ? activeChallengeAccount.challengeStatus === 'PASSED'
                    ? 'var(--buy-color)'
                    : 'var(--accent)'
                  : 'var(--text-secondary)',
                color: '#000',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 'bold',
                letterSpacing: '0.05em'
              }}
            >
              {activeChallengeAccount
                ? activeChallengeAccount.challengeStatus === 'PASSED'
                  ? 'PASSED'
                  : `STAGE ${activeChallengeAccount.currentStage} ${activeChallengeAccount.currentStage < 3 ? 'DEMO' : 'REAL'}`
                : 'NOT ENROLLED'}
            </div>

            <h3
              style={{
                fontSize: '18px',
                color: 'var(--buy-color)',
                fontWeight: '700',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Trophy size={20} style={{ color: 'var(--buy-color)' }} />
              3-Stage Funded Challenge
            </h3>
            <span
              style={{
                fontSize: '12px',
                color: 'var(--accent)',
                fontWeight: '600',
                display: 'block',
                marginBottom: '8px'
              }}
            >
              {activeChallengeAccount
                ? `Locked Ratio: ${lockedRrr} · Prize: ₹${lockedRrrCfg.prize.toLocaleString('en-IN')}`
                : 'Choose ratio on enroll · Prize: ₹5,000 – ₹60,000'}
            </span>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.45' }}>
              Complete 3 stages (Demo Triplet → Demo Twice Trade → Real Choice) to win a cash prize and funded status.
            </p>

            {activeChallengeAccount ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Account Balance:</span>
                    <strong style={{ color: '#fff' }}>${parseFloat(activeChallengeAccount.balance).toFixed(2)} USD</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Current Stage:</span>
                    <strong style={{ color: 'var(--buy-color)' }}>Stage {activeChallengeAccount.currentStage}</strong>
                  </div>

                  {activeChallengeAccount.currentStage < 3 && activeChallengeAccount.progress && (
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>
                      <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '3px' }}>⚠ A loss resets the streak</span>
                      <span style={{ color: 'var(--text-secondary)' }}>Target:</span> <strong style={{ color: '#38bdf8' }}>{activeChallengeAccount.progress.currentStreak} of {activeChallengeAccount.currentStage === 1 ? 3 : 2} wins</strong> in a row<br/>
                      <span style={{ color: 'var(--text-secondary)' }}>Attempt:</span> <strong>{(activeChallengeAccount.progress.tripletAttempts || 0) + 1} / 2</strong>
                    </div>
                  )}
                  {activeChallengeAccount.currentStage === 3 && activeChallengeAccount.progress && (
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>
                      {!activeChallengeAccount.progress.targetWins ? (
                        <strong style={{ color: '#f59e0b', fontSize: '11px' }}>Action Required: Select Target in Trade View</strong>
                      ) : (
                        <>
                          <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '3px' }}>⚠ A loss resets the streak</span>
                          <span style={{ color: 'var(--text-secondary)' }}>Target:</span> <strong style={{ color: '#f59e0b' }}>{activeChallengeAccount.progress.currentStreak} of {activeChallengeAccount.progress.targetWins} wins</strong> in a row<br/>
                          <span style={{ color: 'var(--text-secondary)' }}>Attempt:</span> <strong>{(activeChallengeAccount.progress.tripletAttempts || 0) + 1} / 2</strong>
                        </>
                      )}
                    </div>
                  )}
                </div>
                {activeChallengeAccount.challengeStatus === 'PASSED' && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', fontSize: '12px', color: 'var(--buy-color)', fontWeight: 'bold' }}>
                    Congratulations! You completed the challenge. A reward of ₹{lockedRrrCfg.prize.toLocaleString('en-IN')} was added and is pending admin approval!
                  </div>
                )}
                {/* Locked Ratio Badge */}
                {activeChallengeAccount.challengeStatus !== 'PASSED' && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 12px', marginBottom: '10px',
                    background: `${lockedRrrCfg.color}15`,
                    border: `1px solid ${lockedRrrCfg.color}40`,
                    borderRadius: '8px'
                  }}>
                    <Lock size={12} color={lockedRrrCfg.color} />
                    <span style={{ fontSize: '11px', color: lockedRrrCfg.color, fontWeight: '700' }}>Locked Ratio: {lockedRrr} · SL 5 pips · TP {lockedRrrCfg.tpPips} pips</span>
                  </div>
                )}
              </>
            ) : (
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
                Enroll to get a challenge evaluation account starting at $1,000. Switch to the Challenge tab on the Home screen to trade.
              </p>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '15px',
                borderTop: '1px solid var(--panel-border)',
                gap: '10px'
              }}
            >
              {!activeChallengeAccount && (
                <button
                  onClick={() => {
                    if (!user) { navigate('/login'); return; }
                    setSelectedRrr('1:4');
                    setShowRrrModal(true);
                  }}
                  className="btn"
                  style={{ padding: '8px 14px', fontSize: '12px', flex: 1, background: 'linear-gradient(90deg, var(--buy-color), #059669)', color: '#000', fontWeight: 'bold' }}
                >
                  Enroll &amp; Choose Ratio
                </button>
              )}
              {activeChallengeAccount && activeChallengeAccount.challengeStatus !== 'PASSED' && (
                <button
                  onClick={() => {
                    setAccountType('CHALLENGE');
                    navigate('/');
                  }}
                  className="btn"
                  style={{ padding: '8px 14px', fontSize: '12px', flex: 1 }}
                >
                  Trade Challenge Account
                </button>
              )}

            </div>
          </div>

          {false && (
            <>
              {/* 60 Trade Challenge — independent */}
          <div
            className="glass-panel"
            style={{
              borderRadius: '16px',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              background: 'rgba(56, 189, 248, 0.04)',
              textAlign: 'left',
              padding: '24px',
              position: 'relative'
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: tradeRewardTx?.status === 'APPROVED'
                  ? 'var(--buy-color)'
                  : tradeChallengeData.enrolled
                    ? isTradeComplete
                      ? 'var(--buy-color)'
                      : '#38bdf8'
                    : 'var(--text-secondary)',
                color: '#000',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 'bold',
                letterSpacing: '0.05em'
              }}
            >
              {tradeRewardTx?.status === 'APPROVED'
                ? 'PRIZE PAID'
                : !tradeChallengeData.enrolled
                  ? 'NOT ENROLLED'
                  : isTradeComplete
                    ? 'COMPLETED'
                    : 'ACTIVE'}
            </div>

            <h3
              style={{
                fontSize: '18px',
                color: '#38bdf8',
                fontWeight: '700',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Target size={20} />
              60-Trade Challenge
            </h3>
            <span
              style={{
                fontSize: '12px',
                color: 'var(--buy-color)',
                fontWeight: '600',
                display: 'block',
                marginBottom: '8px'
              }}
            >
              Target Reward: ₹{tradePrize.toLocaleString('en-IN')} Cash Prize
            </span>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.45' }}>
              Trade-based only — not tied to days. Mutually exclusive with day challenges.
            </p>

            {tradeChallengeData.enrolled ? (
              <>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  <span>
                    {tradeChallengeData.successfulTrades} of {tradeChallengeData.targetTrades} successful trades
                  </span>
                </div>
                <div
                  style={{
                    background: 'rgba(0,0,0,0.5)',
                    height: '10px',
                    borderRadius: '5px',
                    overflow: 'hidden',
                    marginBottom: '12px',
                    border: '1px solid var(--panel-border)'
                  }}
                >
                  <div
                    style={{
                      width: `${(tradeChallengeData.successfulTrades / tradeChallengeData.targetTrades) * 100}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #38bdf8, #0ea5e9)',
                      borderRadius: '5px',
                      transition: 'width 0.5s ease'
                    }}
                  />
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    marginBottom: '18px',
                    fontSize: '12px'
                  }}
                >
                  <span style={{ color: 'var(--buy-color)', fontWeight: '600' }}>
                    Wins: {tradeChallengeData.successfulTrades}
                  </span>
                  <span style={{ color: 'var(--sell-color)', fontWeight: '600' }}>
                    Losses: {tradeChallengeData.losingTrades}
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Total closed: {tradeChallengeData.successfulTrades + tradeChallengeData.losingTrades}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: '1.5' }}>
                  {isTradeComplete
                    ? 'Congratulations! You have completed 60 successful trades.'
                    : `${tradesRemaining} more successful trade${tradesRemaining === 1 ? '' : 's'} (TP hit) to finish — take as many days as you need. Losses do not count toward 60.`}
                </p>
                {isTradeComplete && (
                  <div
                    style={{
                      background: 'rgba(56, 189, 248, 0.08)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      marginBottom: '18px',
                      fontSize: '12px',
                      lineHeight: '1.5'
                    }}
                  >
                    <strong style={{ color: '#38bdf8', display: 'block', marginBottom: '4px' }}>
                      Prize: ₹{tradePrize.toLocaleString('en-IN')}
                    </strong>
                    {tradeRewardTx?.status === 'PENDING' && (
                      <span style={{ color: '#f59e0b' }}>
                        Reward submitted — waiting for admin approval. Check Profile → Transactions.
                      </span>
                    )}
                    {tradeRewardTx?.status === 'APPROVED' && (
                      <span style={{ color: 'var(--buy-color)' }}>
                        Reward approved! ₹{tradePrize.toLocaleString('en-IN')} credited to your balance.
                      </span>
                    )}
                    {tradeRewardTx?.status === 'REJECTED' && (
                      <span style={{ color: 'var(--sell-color)' }}>
                        Reward request was rejected. Contact support for assistance.
                      </span>
                    )}
                    {!tradeRewardTx && (
                      <span style={{ color: 'var(--text-secondary)' }}>
                        Reward will be submitted for admin approval automatically.
                      </span>
                    )}
                  </div>
                )}
              </>
            ) : (
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
                Enroll to track wins and losses. Only successful trades (TP hit) count toward ₹
                {tradePrize.toLocaleString('en-IN')}. Enrolling terminates day-based challenges.
              </p>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '15px',
                borderTop: '1px solid var(--panel-border)',
                gap: '10px'
              }}
            >
              {!tradeChallengeData.enrolled && !tradeRewardTx && (
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        `Enroll in the 60 Trade Challenge? Complete ${TRADE_CHALLENGE_TARGET} successful trades (TP hit) in any number of days to win ₹${tradePrize.toLocaleString('en-IN')}. Losses are tracked but do not count. Enrolling will TERMINATE any active day-based challenge. Proceed?`
                      )
                    ) {
                      handleEnroll60Trade();
                    }
                  }}
                  className="btn"
                  style={{ padding: '8px 14px', fontSize: '12px', flex: 1 }}
                >
                  Enroll in 60-Trade Challenge
                </button>
              )}

            </div>
          </div>

          {/* Day-based challenge */}
          <div
            className="glass-panel"
            style={{
              borderRadius: '16px',
              border: '1px solid var(--accent)',
              background: 'rgba(234,179,8,0.03)',
              textAlign: 'left',
              padding: '24px',
              position: 'relative'
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background:
                  dayRewardTx?.status === 'APPROVED'
                    ? 'var(--buy-color)'
                    : !challengeData.enrolled
                      ? 'var(--text-secondary)'
                      : isDayComplete
                        ? 'var(--buy-color)'
                        : 'var(--accent)',
                color: '#000',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 'bold',
                letterSpacing: '0.05em'
              }}
            >
              {dayRewardTx?.status === 'APPROVED' ? 'PRIZE PAID' : !challengeData.enrolled ? 'NOT ENROLLED' : isDayComplete ? 'COMPLETED' : 'ACTIVE'}
            </div>

            <span
              style={{
                fontSize: '10px',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                display: 'block',
                marginBottom: '6px'
              }}
            >
              Day-based challenge (30-Day or 7-Day — one at a time)
            </span>
            <h3
              style={{
                fontSize: '18px',
                color: 'var(--accent)',
                fontWeight: '700',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Award size={20} />
              {activeType === '30_DAY' ? '30-Day Challenge' : '7-Day Fast Challenge'}
            </h3>
            <span
              style={{
                fontSize: '12px',
                color: 'var(--buy-color)',
                fontWeight: '600',
                display: 'block',
                marginBottom: '20px'
              }}
            >
              Target Reward: {activeType === '30_DAY' ? '₹10,000' : '₹3,100'} Cash Prize
            </span>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              <span>
                {challengeData.completedDays} of {totalDays} qualifying days completed
              </span>
            </div>

            <div
              style={{
                background: 'rgba(0,0,0,0.5)',
                height: '10px',
                borderRadius: '5px',
                overflow: 'hidden',
                marginBottom: '18px',
                border: '1px solid var(--panel-border)'
              }}
            >
              <div
                style={{
                  width: `${(challengeData.completedDays / totalDays) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--accent), #eab308)',
                  boxShadow: '0 0 10px var(--accent-glow)',
                  borderRadius: '5px',
                  transition: 'width 0.5s ease'
                }}
              />
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: '1.5' }}>
              {isDayComplete
                ? 'Congratulations! You have completed this day-based challenge.'
                : daysRemaining === 0
                  ? `Final day: win ${requiredTrades} trades today to finish and claim your ₹${prizeAmount.toLocaleString('en-IN')} prize.`
                  : 'Missed days do not reset your progress. Each day you meet the win target counts toward completion.'}
            </p>

            {isDayComplete && (
              <div
                style={{
                  background: 'rgba(234, 179, 8, 0.08)',
                  border: '1px solid rgba(234, 179, 8, 0.25)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  marginBottom: '18px',
                  fontSize: '12px',
                  lineHeight: '1.5'
                }}
              >
                <strong style={{ color: 'var(--accent)', display: 'block', marginBottom: '4px' }}>
                  Prize: ₹{prizeAmount.toLocaleString('en-IN')}
                </strong>
                {!dayRewardTx && (
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Finish today&apos;s win target to submit your reward for admin approval.
                  </span>
                )}
                {dayRewardTx?.status === 'PENDING' && (
                  <span style={{ color: '#f59e0b' }}>
                    Reward submitted — waiting for admin approval. Check Profile → Transactions.
                  </span>
                )}
                {dayRewardTx?.status === 'APPROVED' && (
                  <span style={{ color: 'var(--buy-color)' }}>
                    Reward approved! ₹{prizeAmount.toLocaleString('en-IN')} credited to your balance.
                  </span>
                )}
                {dayRewardTx?.status === 'REJECTED' && (
                  <span style={{ color: 'var(--sell-color)' }}>
                    Reward request was rejected. Contact support for assistance.
                  </span>
                )}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '15px',
                borderTop: '1px solid var(--panel-border)'
              }}
            >
              <div style={{ textAlign: 'left' }}>
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    display: 'block',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  Today&apos;s winning target
                </span>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>
                  {challengeData.tradesToday} of {requiredTrades} trades won today
                </span>
              </div>

            </div>
          </div>

          {/* Switch 30 / 7 day challenge only */}
          <div className="glass-panel" style={{ borderRadius: '16px', textAlign: 'left', padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '10px' }}>
              Switch day-based challenge
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '15px' }}>
              Choose a challenge to enroll. Enrolling in one terminates your progress in the others (including 60-Trade).
            </p>

            {activeType === '30_DAY' ? (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(255,255,255,0.02)',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--panel-border)'
                }}
              >
                <div>
                  <strong style={{ fontSize: '14px', display: 'block', color: 'var(--accent)' }}>
                    7-Day Fast Challenge
                  </strong>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    7 qualifying days • Win ₹3,100
                  </span>
                </div>
                <div style={{ position: 'relative' }}>
                  {dayHover && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '100%',
                        right: '0',
                        marginBottom: '10px',
                        width: '230px',
                        background: 'rgba(15, 23, 42, 0.95)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        fontSize: '11px',
                        color: '#f8fafc',
                        zIndex: 100,
                        pointerEvents: 'none'
                      }}
                    >
                      Terminates any active 30-Day or 60-Trade challenge.
                    </div>
                  )}
                  <button
                    onMouseEnter={() => setDayHover(true)}
                    onMouseLeave={() => setDayHover(false)}
                    onClick={() => {
                      if (
                        window.confirm(
                          'Enroll in the 7-Day Challenge? This will TERMINATE any active 30-Day or 60-Trade challenge. Proceed?'
                        )
                      ) {
                        switchChallenge('7_DAY');
                      }
                    }}
                    className="btn btn-outline"
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      borderColor: 'var(--sell-color)',
                      color: 'var(--sell-color)',
                      background: 'rgba(239, 68, 68, 0.05)'
                    }}
                  >
                    Enroll in 7-Day
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(255,255,255,0.02)',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--panel-border)'
                }}
              >
                <div>
                  <strong style={{ fontSize: '14px', display: 'block', color: 'var(--accent)' }}>
                    30-Day Challenge
                  </strong>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    30 qualifying days • Win ₹10,000
                  </span>
                </div>
                <div style={{ position: 'relative' }}>
                  {dayHover && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '100%',
                        right: '0',
                        marginBottom: '10px',
                        width: '230px',
                        background: 'rgba(15, 23, 42, 0.95)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        fontSize: '11px',
                        color: '#f8fafc',
                        zIndex: 100,
                        pointerEvents: 'none'
                      }}
                    >
                      Terminates any active 7-Day or 60-Trade challenge.
                    </div>
                  )}
                  <button
                    onMouseEnter={() => setDayHover(true)}
                    onMouseLeave={() => setDayHover(false)}
                    onClick={() => {
                      if (
                        window.confirm(
                          'Enroll in the 30-Day Challenge? This will TERMINATE any active 7-Day or 60-Trade challenge. Proceed?'
                        )
                      ) {
                        switchChallenge('30_DAY');
                      }
                    }}
                    className="btn btn-outline"
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      borderColor: 'var(--sell-color)',
                      color: 'var(--sell-color)',
                      background: 'rgba(239, 68, 68, 0.05)'
                    }}
                  >
                    Enroll in 30-Day
                  </button>
                </div>
              </div>
            )}
          </div>

          <div
            className="glass-panel"
            style={{
              borderRadius: '16px',
              textAlign: 'left',
              padding: '18px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              background: 'rgba(56,189,248,0.02)',
              border: '1px solid rgba(56,189,248,0.08)'
            }}
          >
            <Star size={16} color="#38bdf8" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              <strong style={{ color: '#38bdf8', display: 'block', marginBottom: '2px' }}>Challenge tip:</strong>
              60-Trade counts only successful (TP) trades toward 60. Day challenges count winning trades per calendar day. You can only be enrolled in one challenge at a time.
            </div>
          </div>
          </>)}
        </div>
      </div>


      <MobileNavBar activeTab="challenge" />
    </div>
  );
};

export default ChallengeScreen;

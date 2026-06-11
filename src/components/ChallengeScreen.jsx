import React, { useState } from 'react';
import { useAppContext } from '../context/useAppContext';
import MobileNavBar from './MobileNavBar';
import { Trophy, Award, Star, X, Info, Target } from 'lucide-react';
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

const ChallengeRulesModal = ({ type, onClose }) => (
  <div className="modal-overlay">
    <div className="glass-panel modal-content" style={{ maxWidth: '420px', textAlign: 'left' }}>
      <div className="modal-header">
        <h2>
          {type === '60_TRADE'
            ? '60-Trade Challenge Rules'
            : type === '7_DAY'
              ? '7-Day Challenge Rules'
              : '30-Day Challenge Rules'}
        </h2>
        <button onClick={onClose} className="modal-close"><X size={22} /></button>
      </div>
      <div style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '14px' }}>
        <ul className="rules-list" style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {type === '60_TRADE' ? (
            <>
              <li>
                <strong>Based on trades, not days:</strong> This challenge counts{' '}
                <strong style={{ color: 'var(--accent)' }}>completed trades</strong>, not calendar days.
                Finish in 1 day or 60 days — your pace does not matter.
              </li>
              <li>
                <strong>The objective:</strong> Complete{' '}
                <strong style={{ color: 'var(--accent)' }}>{TRADE_CHALLENGE_TARGET} successful trades</strong>{' '}
                (Take Profit hit) after enrollment to win{' '}
                <strong style={{ color: 'var(--accent)' }}>₹{CHALLENGE_PRIZES['60_TRADE'].toLocaleString('en-IN')}</strong>.
              </li>
              <li>
                <strong>What counts toward 60:</strong> Only{' '}
                <strong style={{ color: 'var(--buy-color)' }}>successful trades</strong> (TP hit) increase your
                progress. Losing trades (SL hit) are tracked separately and do not count toward the 60.
              </li>
              <li>
                <strong>Tracking:</strong> Your dashboard shows successful vs losing trade counts so you always
                know both numbers.
              </li>
              <li>
                <strong>Mutually Exclusive:</strong> You can only be enrolled in one challenge at a time. Enrolling in the 60-Trade Challenge will terminate any active 30-Day or 7-Day challenge.
              </li>
              <li>
                <strong>Payout:</strong> When you reach {TRADE_CHALLENGE_TARGET} trades, a ₹
                {CHALLENGE_PRIZES['60_TRADE'].toLocaleString('en-IN')} reward is sent to admin for approval —
                same process as withdrawals. Track status under Profile → Transactions.
              </li>
            </>
          ) : type === '7_DAY' ? (
            <>
              <li><strong>The Objective:</strong> Complete <strong style={{ color: 'var(--accent)' }}>7 qualifying days</strong> to win a cash prize of <strong style={{ color: 'var(--accent)' }}>3,100 Rs</strong>.</li>
              <li><strong>Daily Requirement:</strong> On each day you trade, execute and win at least <strong style={{ color: 'var(--buy-color)' }}>3 successful trades</strong> (hitting Take Profit).</li>
              <li><strong>Time Limit:</strong> All daily trades must be successfully closed before 11:59 PM on that day.</li>
              <li><strong>Flexible Pace:</strong> Days do not need to be consecutive. Miss a day and your progress stays — you simply do not earn credit for that day.</li>
              <li><strong>Mutually Exclusive:</strong> You can only be enrolled in one challenge at a time. Enrolling here terminates any active 30-Day or 60-Trade challenge.</li>
              <li><strong>Completion &amp; Payout:</strong> After 7 qualifying days and meeting the final day&apos;s win target, a <strong style={{ color: 'var(--accent)' }}>₹3,100</strong> reward is sent to admin for approval. Track status under Profile → Transactions.</li>
            </>
          ) : (
            <>
              <li><strong>The Objective:</strong> Complete <strong style={{ color: 'var(--accent)' }}>30 qualifying days</strong> to win a grand prize of <strong style={{ color: 'var(--accent)' }}>10,000 Rs</strong>.</li>
              <li><strong>Daily Requirement:</strong> On each day you trade, execute and win at least <strong style={{ color: 'var(--buy-color)' }}>2 successful trades</strong> (hitting Take Profit).</li>
              <li><strong>Time Limit:</strong> Both daily trades must be successfully closed before 11:59 PM on that day.</li>
              <li><strong>Flexible Pace:</strong> Days do not need to be consecutive. Miss a day and your progress stays — you simply do not earn credit for that day.</li>
              <li><strong>Mutually Exclusive:</strong> You can only be enrolled in one challenge at a time. Enrolling here terminates any active 7-Day or 60-Trade challenge.</li>
              <li><strong>Completion &amp; Payout:</strong> After 30 qualifying days and meeting the final day&apos;s win target, a <strong style={{ color: 'var(--accent)' }}>₹10,000</strong> reward is sent to admin for approval. Track status under Profile → Transactions.</li>
            </>
          )}
        </ul>
      </div>
    </div>
  </div>
);

const ChallengeScreen = () => {
  const { user, adminRecords, switchChallenge, enrollSixtyTradeChallenge } = useAppContext();
  const [showRules, setShowRules] = useState(null);
  const [dayHover, setDayHover] = useState(false);

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
      <div style={{ maxWidth: '480px', width: '100%' }}>
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
            Day-based goals and trade-count milestones — win rewards on your schedule.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
              <button
                onClick={() => setShowRules('60_TRADE')}
                className="btn btn-outline"
                style={{ padding: '6px 12px', fontSize: '12px', gap: '4px', marginLeft: 'auto' }}
              >
                <Info size={13} /> Rules
              </button>
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
              <button
                onClick={() => setShowRules(activeType)}
                className="btn btn-outline"
                style={{ padding: '6px 12px', fontSize: '12px', gap: '4px' }}
              >
                <Info size={13} /> Rules
              </button>
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
        </div>
      </div>

      {showRules && <ChallengeRulesModal type={showRules} onClose={() => setShowRules(null)} />}
      <MobileNavBar activeTab="challenge" />
    </div>
  );
};

export default ChallengeScreen;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/useAppContext';
import VerificationModal from './VerificationModal';
import { 
  User, Wallet, CreditCard, Info, MessageSquare, 
  BookOpen, Settings, ChevronRight, LogOut, X,
  Send, HelpCircle, Clock, ArrowDownLeft, CheckCircle, Trophy
} from 'lucide-react';
import HelpCenter from './HelpCenter';
import MobileNavBar from './MobileNavBar';
import DepositModal from './DepositModal';
import { getTransactionDisplay } from '../utils/transactions';

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
);

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style={{ display: 'block' }}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style={{ display: 'block' }}><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
);

const YoutubeIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style={{ display: 'block' }}><path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
);


const ProfileDashboard = () => {
  const { 
    user, 
    balance, 
    logout, 
    deposit, 
    withdraw, 
    adminRecords, 
    submitFeedback, 
    accountType, 
    setAccountType, 
    updateProfileDetails, 
    verification, 
    supportChats,
    activeChallengeAccount,
    passedChallengeAccounts,
    failedChallengeAccounts,
    enrollChallengeAccount
  } = useAppContext();
  const navigate = useNavigate();

  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [isSettingsUpdating, setIsSettingsUpdating] = useState(false);

  const currentUserRecord = adminRecords.find(r => r.id === user?.id);

  const handleDepositSubmit = (e) => {
    // Handled by DepositModal now
  };

  const handleWithdrawSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (amount && amount >= 100) {
      if (amount <= balance) {
        const success = withdraw(amount);
        if (success) {
          if (accountType === 'DEMO') {
            alert(`Demo withdrawal of ₹${amount.toFixed(2)} succeeded instantly!`);
          } else {
            alert(`Withdrawal request of ₹${amount.toFixed(2)} submitted to admin for review.`);
          }
          setWithdrawAmount('');
          setShowWithdrawModal(false);
        } else {
          alert('Withdrawal failed. Please check your parameters.');
        }
      } else {
        alert('Insufficient balance for this withdrawal amount.');
      }
    } else {
      alert('Minimum withdrawal amount is ₹100.');
    }
  };

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    if (feedbackText.trim()) {
      submitFeedback(feedbackText);
      alert("Thank you for your valuable feedback! We appreciate your support.");
      setFeedbackText('');
      setShowFeedbackModal(false);
    }
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setSettingsError('');
    setSettingsSuccess('');
    setIsSettingsUpdating(true);

    try {
      if (!editUsername.trim()) {
        setSettingsError('Username cannot be empty.');
        return;
      }
      if (!editEmail.trim()) {
        setSettingsError('Email address cannot be empty.');
        return;
      }

      if (editPassword) {
        if (editPassword.length < 6) {
          setSettingsError('Password must be at least 6 characters long.');
          return;
        }
        if (editPassword !== editConfirmPassword) {
          setSettingsError('Passwords do not match.');
          return;
        }
      }

      const res = await updateProfileDetails({
        username: editUsername,
        email: editEmail,
        password: editPassword || undefined
      });

      if (res.success) {
        if (editPassword) {
          setSettingsSuccess('Password changed successfully!');
        } else {
          setSettingsSuccess('Profile updated successfully!');
        }
        setTimeout(() => {
          setShowSettingsModal(false);
        }, 1200);
      } else {
        setSettingsError(res.message || 'Failed to update profile.');
      }
    } finally {
      setIsSettingsUpdating(false);
    }
  };

  const handleRowClick = (item) => {
    if (!user && item !== 'about' && item !== 'tutorials') {
      navigate('/login');
      return;
    }
    if (accountType === 'CHALLENGE' && (item === 'deposit' || item === 'withdraw')) {
      alert("Deposits and withdrawals are disabled for Challenge accounts. Use Real Account for deposits/withdrawals.");
      return;
    }
    if (item === 'deposit') {
      setShowDepositModal(true);
    } else if (item === 'withdraw') {
        if (!verification) {
          // Prompt user to complete verification first
          setShowVerificationModal(true);
          return;
        }
        setShowWithdrawModal(true);
    } else if (item === 'feedback') {
      setShowFeedbackModal(true);
    } else if (item === 'settings') {
      setEditUsername(user?.username || '');
      setEditEmail(user?.email || '');
      setEditPassword('');
      setEditConfirmPassword('');
      setSettingsError('');
      setSettingsSuccess('');
      setShowSettingsModal(true);
    } else if (item === 'about') {
      setShowAboutModal(true);
    } else if (item === 'transactions') {
      setShowTransactionsModal(true);
    } else if (item === 'tutorials') {
      setShowHelpCenter(true);
    }
  };

  if (showHelpCenter) {
    return <HelpCenter isSubView={true} onBack={() => setShowHelpCenter(false)} />;
  }

  return (
    <>
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0b0e14',
        backgroundImage: 'radial-gradient(circle at top, rgba(18, 30, 54, 0.8), #0b0e14)',
        color: 'var(--text-primary)',
        padding: '20px 15px 90px 15px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{ maxWidth: '600px', width: '100%' }}>
          
          {/* --- Header Section --- */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px',
            padding: '10px 0'
          }}>
            {/* Avatar Placeholder */}
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), #d97706)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(234, 179, 8, 0.2)'
            }}>
              <User size={30} color="#000" />
            </div>
            
            {/* User Profile Identifiers */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
              <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {user?.fullName || user?.username}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {user?.email || 'user@goldtrader.pro'}
              </span>
            </div>

            {/* Action Sign Out */}
            <button 
              onClick={logout} 
              style={{
                padding: '10px 14px',
                borderRadius: '20px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: 'var(--sell-color)',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <LogOut size={13} /> Logout
            </button>
          </div>

          {/* Synced Premium Real/Demo Switcher */}
          <div className="account-switcher" style={{
            width: '100%',
            height: '42px',
            marginBottom: '24px'
          }}>
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
              onClick={() => setAccountType('REAL')}
              className="account-switcher-btn"
              style={{
                color: accountType === 'REAL' ? 'var(--buy-color)' : 'var(--text-secondary)',
                fontSize: '13px',
                textShadow: accountType === 'REAL' ? '0 0 8px rgba(16, 185, 129, 0.3)' : 'none'
              }}
            >
              Real
            </button>

            <button 
              onClick={() => setAccountType('CHALLENGE')}
              className="account-switcher-btn"
              style={{
                color: accountType === 'CHALLENGE' ? '#38bdf8' : 'var(--text-secondary)',
                fontSize: '13px',
                textShadow: accountType === 'CHALLENGE' ? '0 0 8px rgba(56, 189, 248, 0.3)' : 'none'
              }}
            >
              Challenge
            </button>
            
            <button 
              onClick={() => setAccountType('DEMO')}
              className="account-switcher-btn"
              style={{
                color: accountType === 'DEMO' ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: '13px',
                textShadow: accountType === 'DEMO' ? '0 0 8px rgba(234, 179, 8, 0.3)' : 'none'
              }}
            >
              Demo
            </button>
          </div>

          {/* Challenge progress metrics card on Profile tab */}
          {accountType === 'CHALLENGE' && activeChallengeAccount && (
            <div className="glass-panel" style={{
              borderRadius: '16px',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              background: 'rgba(15, 23, 42, 0.6)',
              padding: '20px',
              marginBottom: '20px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Trophy size={18} color="#38bdf8" />
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#fff', margin: 0 }}>Active Evaluation Progress</h3>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Current Stage</span>
                <strong style={{ color: '#38bdf8' }}>Stage {activeChallengeAccount.currentStage}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Account Balance</span>
                <strong style={{ color: '#fff' }}>${parseFloat(activeChallengeAccount.balance).toFixed(2)} USD</strong>
              </div>

              
              {activeChallengeAccount.currentStage === 1 && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Stage 1 Target ($1,300) Progress</span>
                    <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>
                      {Math.max(0, Math.min(100, (((parseFloat(activeChallengeAccount.balance) - 1000) / 300) * 100))).toFixed(0)}%
                    </span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(0,0,0,0.4)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.max(0, Math.min(100, (((parseFloat(activeChallengeAccount.balance) - 1000) / 300) * 100)))}%`,
                      height: '100%',
                      background: '#38bdf8',
                      borderRadius: '3px'
                    }} />
                  </div>
                </div>
              )}
              {activeChallengeAccount.currentStage === 2 && activeChallengeAccount.progress && (
                <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Stage 2 Consistency Test</span>
                  <strong style={{ fontSize: '13px', color: '#fff' }}>
                    {activeChallengeAccount.progress.wins} Wins / {activeChallengeAccount.progress.losses} Losses ({activeChallengeAccount.progress.tradeCount} of 8 trades)
                  </strong>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>Need at least 5 wins to pass.</span>
                </div>
              )}
              {activeChallengeAccount.currentStage === 3 && activeChallengeAccount.progress && (
                <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Stage 3 Streak</span>
                  <strong style={{ fontSize: '13px', color: '#f59e0b' }}>
                    {activeChallengeAccount.progress.currentStreak} of 3 Consecutive Wins
                  </strong>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>A loss demotes you back to Stage 2.</span>
                </div>
              )}
            </div>
          )}

          {/* --- Navigation Cards Stack --- */}
          {/* Row 0: Verification Status */}
          <div 
            onClick={() => setShowVerificationModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid var(--panel-border)',
              cursor: 'pointer',
              background: verification ? 'rgba(0,64,0,0.2)' : 'rgba(64,0,0,0.2)',
              transition: 'background 0.2s'
            }}
            className="menu-row"
          >
            <Info size={20} color={verification ? 'var(--buy-color)' : 'var(--sell-color)'} style={{ marginRight: '16px' }} />
            <span style={{ fontWeight: '600', fontSize: '15px', flex: 1, textAlign: 'left' }}>Verification</span>
            <span style={{ fontWeight: '700', fontSize: '14px', color: verification ? 'Completed' : 'Pending', marginRight: '10px' }}>
              {verification ? 'Completed' : 'Pending'}
            </span>
            <ChevronRight size={18} color="var(--text-secondary)" />
          </div>
          {/* Row 1: Balance */}
          <div 
            onClick={() => handleRowClick('deposit')}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid var(--panel-border)',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            className="menu-row"
          >
            <Wallet size={20} color="var(--accent)" style={{ marginRight: '16px' }} />
            <span style={{ fontWeight: '600', fontSize: '15px', flex: 1, textAlign: 'left' }}>Balance</span>
            <span style={{ fontWeight: '700', fontSize: '16px', color: 'var(--accent)', marginRight: '10px' }}>
              {accountType === 'CHALLENGE' ? `$${balance.toFixed(2)} USD` : `₹${balance.toFixed(2)}`}
            </span>
            <ChevronRight size={18} color="var(--text-secondary)" />
          </div>

          {/* Row 2: Deposit */}
          <div 
            onClick={() => handleRowClick('deposit')}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid var(--panel-border)',
              cursor: 'pointer'
            }}
            className="menu-row"
          >
            <CreditCard size={20} color="#38bdf8" style={{ marginRight: '16px' }} />
            <span style={{ fontWeight: '600', fontSize: '15px', flex: 1, textAlign: 'left' }}>Deposit</span>
            <ChevronRight size={18} color="var(--text-secondary)" />
          </div>

          {/* Row 3: Withdrawal */}
          <div 
            onClick={() => handleRowClick('withdraw')}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid var(--panel-border)',
              cursor: 'pointer'
            }}
            className="menu-row"
          >
            <ArrowDownLeft size={20} color="#fb7185" style={{ marginRight: '16px' }} />
            <span style={{ fontWeight: '600', fontSize: '15px', flex: 1, textAlign: 'left' }}>Withdrawal</span>
            <ChevronRight size={18} color="var(--text-secondary)" />
          </div>

          {/* Row 3: Transactions */}
          <div 
            onClick={() => handleRowClick('transactions')}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid var(--panel-border)',
              cursor: 'pointer'
            }}
            className="menu-row"
          >
            <Clock size={20} color="#a78bfa" style={{ marginRight: '16px' }} />
            <span style={{ fontWeight: '600', fontSize: '15px', flex: 1, textAlign: 'left' }}>Transactions</span>
            <ChevronRight size={18} color="var(--text-secondary)" />
          </div>

          {/* Row 4: About */}
          <div 
            onClick={() => handleRowClick('about')}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid var(--panel-border)',
              cursor: 'pointer'
            }}
            className="menu-row"
          >
            <Info size={20} color="#fb7185" style={{ marginRight: '16px' }} />
            <span style={{ fontWeight: '600', fontSize: '15px', flex: 1, textAlign: 'left' }}>About</span>
            <ChevronRight size={18} color="var(--text-secondary)" />
          </div>

          {/* Row 5: Feedback */}
          <div 
            onClick={() => handleRowClick('feedback')}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid var(--panel-border)',
              cursor: 'pointer'
            }}
            className="menu-row"
          >
            <MessageSquare size={20} color="#34d399" style={{ marginRight: '16px' }} />
            <span style={{ fontWeight: '600', fontSize: '15px', flex: 1, textAlign: 'left' }}>Feedback</span>
            <ChevronRight size={18} color="var(--text-secondary)" />
          </div>

          {/* Row 6: Tutorials */}
          <div 
            onClick={() => handleRowClick('tutorials')}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid var(--panel-border)',
              cursor: 'pointer'
            }}
            className="menu-row"
          >
            <HelpCircle size={20} color="#f472b6" style={{ marginRight: '16px' }} />
            <span style={{ fontWeight: '600', fontSize: '15px', flex: 1, textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Help Center
              {supportChats?.some(c => c.userId === user?.id && c.unreadByUser) && (
                <span style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  display: 'inline-block',
                  boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)',
                  animation: 'pulse 1.5s infinite'
                }} />
              )}
            </span>
            <ChevronRight size={18} color="var(--text-secondary)" />
          </div>

          {/* Row 7: Settings */}
          <div 
            onClick={() => handleRowClick('settings')}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px 20px',
              cursor: 'pointer'
            }}
            className="menu-row"
          >
            <Settings size={20} color="#94a3b8" style={{ marginRight: '16px' }} />
            <span style={{ fontWeight: '600', fontSize: '15px', flex: 1, textAlign: 'left' }}>Settings</span>
            <ChevronRight size={18} color="var(--text-secondary)" />
          </div>
        </div>

        {/* --- Community Section --- */}
        <div style={{ margin: '20px 0 30px 0', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--panel-border)' }} />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Connect with our trading community
            </span>
            <div style={{ flex: 1, height: '1px', background: 'var(--panel-border)' }} />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="social-button" style={{ background: '#e1306c', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%' }}><InstagramIcon /></a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="social-button" style={{ background: '#1d9bf0', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%' }}><TwitterIcon /></a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="social-button" style={{ background: '#1877f2', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%' }}><FacebookIcon /></a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" className="social-button" style={{ background: '#ff0000', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%' }}><YoutubeIcon /></a>
            <a href="https://telegram.org" target="_blank" rel="noreferrer" className="social-button" style={{ background: '#0088cc', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%' }}><Send size={18} color="#fff" /></a>
          </div>
        </div>

      </div>

      
      {showVerificationModal && (
        <VerificationModal isOpen={showVerificationModal} onClose={() => setShowVerificationModal(false)} />
      )}
      {/* Transactions List Popup */}
      {showTransactionsModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '640px', width: '90%' }}>
            <div className="modal-header">
              <h2>Transaction Logs</h2>
              <button onClick={() => setShowTransactionsModal(false)} className="modal-close"><X size={22} /></button>
            </div>
            
            {(!(accountType === 'DEMO' ? currentUserRecord?.demoTransactions : currentUserRecord?.transactions) || (accountType === 'DEMO' ? (currentUserRecord?.demoTransactions || []).length : (currentUserRecord?.transactions || []).length) === 0) ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-secondary)' }}>
                  No transactions recorded yet.<br />Use Deposit to fund your account.
                </p>
              </div>
            ) : (() => {
              const allTxs = accountType === 'DEMO' ? (currentUserRecord?.demoTransactions || []) : (currentUserRecord?.transactions || []);
              const pendingTxs = [...allTxs]
                .filter(tx => tx.status === 'PENDING')
                .sort((a, b) => new Date(b.date) - new Date(a.date));
              const approvedTxs = [...allTxs]
                .filter(tx => tx.status === 'APPROVED' || tx.status === 'REJECTED')
                .sort((a, b) => new Date(b.date) - new Date(a.date));

              return (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '20px',
                  maxHeight: '60vh',
                  overflowY: 'auto',
                  paddingRight: '4px'
                }} className="custom-scrollbar">
                  {/* Column 1: Waiting Approval */}
                  <div style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <h3 style={{
                      fontSize: '14px',
                      fontWeight: '700',
                      color: '#f59e0b',
                      borderBottom: '1px solid rgba(245, 158, 11, 0.2)',
                      paddingBottom: '8px',
                      margin: '0 0 4px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      textAlign: 'left'
                    }}>
                      <Clock size={16} /> Waiting Approval ({pendingTxs.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {pendingTxs.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'left', padding: '15px 0', fontSize: '13px', fontStyle: 'italic' }}>
                          No transactions waiting approval.
                        </p>
                      ) : (
                        pendingTxs.map((tx, idx) => {
                          const display = getTransactionDisplay(tx);
                          return (
                          <div key={idx} style={{ 
                            background: 'rgba(245, 158, 11, 0.03)', 
                            border: '1px solid rgba(245, 158, 11, 0.15)', 
                            borderRadius: '10px', 
                            padding: '12px 14px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                              <span style={{ 
                                fontWeight: '600', 
                                fontSize: '13px', 
                                color: display.color
                              }}>
                                {display.label}
                              </span>
                              <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                                {new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                              <span style={{ fontWeight: '700', fontSize: '14px', color: '#fff' }}>
                                {display.sign} ₹{Number(tx.amount || 0).toFixed(2)}
                              </span>
                              <span className="status-badge status-pending" style={{ fontSize: '9px', padding: '1px 6px' }}>
                                Waiting Approval
                              </span>
                            </div>
                          </div>
                        );
                        })
                      )}
                    </div>
                  </div>

                  {/* Column 2: Approved Transactions */}
                  <div style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <h3 style={{
                      fontSize: '14px',
                      fontWeight: '700',
                      color: '#10b981',
                      borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
                      paddingBottom: '8px',
                      margin: '0 0 4px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      textAlign: 'left'
                    }}>
                      <CheckCircle size={16} /> Approved Transactions ({approvedTxs.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {approvedTxs.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'left', padding: '15px 0', fontSize: '13px', fontStyle: 'italic' }}>
                          No approved/settled transactions yet.
                        </p>
                      ) : (
                        approvedTxs.map((tx, idx) => {
                          const display = getTransactionDisplay(tx);
                          return (
                          <div key={idx} style={{ 
                            background: tx.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.03)' : 'rgba(239, 68, 68, 0.03)', 
                            border: tx.status === 'APPROVED' ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid rgba(239, 68, 68, 0.15)', 
                            borderRadius: '10px', 
                            padding: '12px 14px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                              <span style={{ 
                                fontWeight: '600', 
                                fontSize: '13px', 
                                color: display.color
                              }}>
                                {display.label}
                              </span>
                              <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                                {new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                              <span style={{ fontWeight: '700', fontSize: '14px', color: '#fff' }}>
                                {display.sign} ₹{Number(tx.amount || 0).toFixed(2)}
                              </span>
                              <span className={`status-badge status-${tx.status.toLowerCase()}`} style={{ fontSize: '9px', padding: '1px 6px' }}>
                                {tx.status}
                              </span>
                            </div>
                          </div>
                        );
                        })
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Deposit Popup */}
      {showDepositModal && (
        <DepositModal onClose={() => setShowDepositModal(false)} />
      )}

      {/* Withdrawal Popup */}
      {showWithdrawModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Withdraw Funds</h2>
              <button onClick={() => setShowWithdrawModal(false)} className="modal-close"><X size={22} /></button>
            </div>
            <form onSubmit={handleWithdrawSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ textAlign: 'left', fontSize: '14px', color: 'var(--text-secondary)' }}>
                Available Balance: <strong style={{ color: 'var(--accent)' }}>₹{balance.toFixed(2)}</strong>
              </div>
              <div className="input-group" style={{ textAlign: 'left' }}>
                <label>Amount (Rs)</label>
                <input 
                  type="number" 
                  className="custom-input" 
                  value={withdrawAmount} 
                  onChange={(e) => setWithdrawAmount(e.target.value)} 
                  min="100" 
                  max={balance}
                  placeholder="Enter amount (min ₹100)"
                  required 
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center', padding: '12px', background: 'var(--sell-color)' }}>
                Submit Withdrawal Request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Feedback Popup */}
      {showFeedbackModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Send Feedback</h2>
              <button onClick={() => setShowFeedbackModal(false)} className="modal-close"><X size={22} /></button>
            </div>
            <form onSubmit={handleFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group" style={{ textAlign: 'left' }}>
                <label>Your Feedback</label>
                <textarea 
                  className="custom-input" 
                  value={feedbackText} 
                  onChange={(e) => setFeedbackText(e.target.value)} 
                  placeholder="Tell us what you think about GoldTrader Pro..."
                  rows={4}
                  required 
                  style={{ resize: 'none', background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid var(--panel-border)', borderRadius: '8px', padding: '12px' }}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center', padding: '12px' }}>
                Submit Feedback
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Settings Popup */}
      {showSettingsModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '400px', textAlign: 'left' }}>
            <div className="modal-header">
              <h2>Edit Profile Settings</h2>
              <button onClick={() => setShowSettingsModal(false)} className="modal-close"><X size={22} /></button>
            </div>
            
            <form onSubmit={handleSettingsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <span><strong>Role:</strong> <span style={{ color: 'var(--accent)', textTransform: 'uppercase', fontWeight: 'bold' }}>{user?.role}</span></span>
                <span><strong>Status:</strong> <span style={{ color: 'var(--buy-color)', fontWeight: 'bold' }}>VERIFIED ✔</span></span>
              </div>
              
              <hr style={{ border: 'none', borderTop: '1px solid var(--panel-border)', margin: '0' }} />

              <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Username</label>
                <input 
                  type="text" 
                  className="custom-input" 
                  value={editUsername} 
                  onChange={(e) => setEditUsername(e.target.value)} 
                  placeholder="Enter new username"
                  required 
                  style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid var(--panel-border)', borderRadius: '8px', padding: '10px 12px' }}
                />
              </div>

              <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Email Address</label>
                <input 
                  type="email" 
                  className="custom-input" 
                  value={editEmail} 
                  onChange={(e) => setEditEmail(e.target.value)} 
                  placeholder="Enter new email"
                  required 
                  style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid var(--panel-border)', borderRadius: '8px', padding: '10px 12px' }}
                />
              </div>

              <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>New Password <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>(leave blank to keep current)</span></label>
                <input 
                  type="password" 
                  className="custom-input" 
                  value={editPassword} 
                  onChange={(e) => setEditPassword(e.target.value)} 
                  placeholder="Enter new password (min 6 chars)"
                  style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid var(--panel-border)', borderRadius: '8px', padding: '10px 12px' }}
                />
              </div>

              {editPassword && (
                <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Confirm Password</label>
                  <input 
                    type="password" 
                    className="custom-input" 
                    value={editConfirmPassword} 
                    onChange={(e) => setEditConfirmPassword(e.target.value)} 
                    placeholder="Confirm new password"
                    required
                    style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid var(--panel-border)', borderRadius: '8px', padding: '10px 12px' }}
                  />
                </div>
              )}

              {settingsError && (
                <div style={{ color: 'var(--sell-color)', fontSize: '13px', fontWeight: '500', padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px' }}>
                  {settingsError}
                </div>
              )}

              {settingsSuccess && (
                <div style={{ color: 'var(--buy-color)', fontSize: '13px', fontWeight: '500', padding: '8px 12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '6px' }}>
                  {settingsSuccess}
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center', padding: '12px', marginTop: '8px', cursor: isSettingsUpdating ? 'not-allowed' : 'pointer', opacity: isSettingsUpdating ? 0.7 : 1, transition: 'opacity 0.2s ease', display: 'flex', alignItems: 'center', gap: '8px' }} disabled={isSettingsUpdating}>
                {isSettingsUpdating && (
                  <span style={{
                    display: 'inline-block',
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite'
                  }} />
                )}
                {isSettingsUpdating ? 'Updating...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* About Popup */}
      {showAboutModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '420px', textAlign: 'left' }}>
            <div className="modal-header">
              <h2>About Platform</h2>
              <button onClick={() => setShowAboutModal(false)} className="modal-close"><X size={22} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              <p><strong>GoldTrader Pro v1.2.0</strong></p>
              <p>GoldTrader Pro is a high-fidelity binary options and forex-inspired demo trading application powered by real-time Pax Gold (PAXG/USDT) prices via Binance WebSocket integrations.</p>
              <p>© 2026 GoldTrader Pro Inc. Developed with dynamic Challenge Tracking and Role-Based Access Controls for premium financial simulations.</p>
            </div>
          </div>
        </div>
      )}

      <MobileNavBar activeTab="me" />
    </>
  );
};

export default ProfileDashboard;

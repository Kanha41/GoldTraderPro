import React, { useState } from 'react';
import { X, Copy, CheckCircle, ArrowRight } from 'lucide-react';
import { useAppContext } from '../context/useAppContext';

const UPI_ID = 'kanhaiyyayadav645@okaxis';
const API_URL = import.meta.env.VITE_API_URL || 'https://goldtraderpro-production.up.railway.app';

const DepositModal = ({ onClose }) => {
  const { accountType, deposit } = useAppContext();
  const [step, setStep] = useState(1); // 1 = enter amount, 2 = enter txn ID
  const [amount, setAmount] = useState('');
  const [txnId, setTxnId] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNextStep = () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (num < 100) {
      setError('Minimum deposit amount is ₹100.');
      return;
    }
    setError('');

    // Demo mode: credit instantly
    if (accountType === 'DEMO') {
      deposit(num);
      setSuccess(true);
      return;
    }

    setStep(2);
  };

  const handleSubmit = async () => {
    if (!txnId.trim()) {
      setError('Please enter your UPI Transaction ID.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/funds/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ amount: parseFloat(amount), accountType, utr: txnId.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.message || 'Submission failed. Please try again.');
      }
    } catch (e) {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Success Screen ───────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="modal-overlay">
        <div className="glass-panel modal-content" style={{ textAlign: 'center', padding: '40px 30px' }}>
          <CheckCircle size={56} color="var(--buy-color)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ marginBottom: '10px' }}>
            {accountType === 'DEMO' ? 'Demo Funds Credited!' : 'Request Submitted!'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
            {accountType === 'DEMO'
              ? `₹${parseFloat(amount).toFixed(2)} has been added to your demo balance instantly.`
              : `Your deposit request of ₹${parseFloat(amount).toFixed(2)} with UTR ${txnId} has been sent to the admin for approval. Your balance will be credited once approved.`}
          </p>
          <button className="btn btn-primary" onClick={onClose} style={{ marginTop: '24px', width: '100%' }}>
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content" style={{ maxWidth: '420px', width: '95%' }}>

        {/* Header */}
        <div className="modal-header">
          <h2>Deposit Funds {accountType === 'DEMO' ? '(Demo)' : '(Real)'}</h2>
          <button onClick={onClose} className="modal-close"><X size={24} /></button>
        </div>

        <div style={{ padding: '24px' }}>

          {/* Step indicator */}
          {accountType === 'REAL' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              {[1, 2].map(s => (
                <React.Fragment key={s}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: step >= s ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                    color: step >= s ? '#000' : 'var(--text-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: '700', fontSize: '13px',
                    transition: 'all 0.3s'
                  }}>{s}</div>
                  {s < 2 && <div style={{ flex: 1, height: '2px', background: step > s ? 'var(--accent)' : 'rgba(255,255,255,0.1)', borderRadius: '2px', transition: 'all 0.3s' }} />}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* ─── STEP 1: Amount + UPI ID ─── */}
          {step === 1 && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  Amount (₹)
                </label>
                <input
                  type="number"
                  className="custom-input"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="Enter amount (min ₹100)"
                  min="100"
                  style={{ width: '100%' }}
                />
              </div>

              {accountType === 'REAL' && (
                <div style={{
                  background: 'rgba(234, 179, 8, 0.08)',
                  border: '1px solid rgba(234, 179, 8, 0.3)',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '20px'
                }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '10px' }}>
                    Send payment to this UPI ID:
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--accent)', fontWeight: '700', fontSize: '15px', wordBreak: 'break-all' }}>
                      {UPI_ID}
                    </span>
                    <button
                      onClick={handleCopy}
                      className="btn btn-outline"
                      style={{ padding: '6px 12px', fontSize: '12px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Copy size={14} />
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '12px', lineHeight: '1.6' }}>
                    ✅ Pay via GPay, PhonePe, Paytm, or any UPI app.<br/>
                    ✅ After payment, click <strong style={{ color: 'var(--text-primary)' }}>Next</strong> to submit your Transaction ID.
                  </p>
                </div>
              )}
            </>
          )}

          {/* ─── STEP 2: Transaction ID ─── */}
          {step === 2 && (
            <>
              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '10px',
                padding: '14px',
                marginBottom: '20px',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                lineHeight: '1.6'
              }}>
                <strong style={{ color: 'var(--buy-color)' }}>Payment sent?</strong><br/>
                Enter the <strong>UPI Transaction ID</strong> (also called UTR/Ref No.) from your payment app. Admin will verify and credit your ₹{parseFloat(amount || 0).toFixed(2)}.
              </div>

              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                UPI Transaction ID / UTR
              </label>
              <input
                type="text"
                className="custom-input"
                value={txnId}
                onChange={e => setTxnId(e.target.value)}
                placeholder="e.g. 427839201038"
                style={{ width: '100%' }}
                autoFocus
              />
            </>
          )}

          {/* Error */}
          {error && (
            <div style={{ color: 'var(--sell-color)', fontSize: '13px', marginTop: '10px' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Footer Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
            <button
              className="btn btn-outline"
              onClick={step === 1 ? onClose : () => { setStep(1); setError(''); }}
              style={{ flex: 1 }}
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </button>

            {step === 1 && (
              <button
                className="btn btn-primary"
                onClick={handleNextStep}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                {accountType === 'DEMO' ? 'Credit Now' : <>Next <ArrowRight size={16} /></>}
              </button>
            )}

            {step === 2 && (
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={loading}
                style={{ flex: 1, opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepositModal;

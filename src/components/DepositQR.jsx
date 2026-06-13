import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG as QRCode } from 'qrcode.react';

// Razorpay payment handle URL (static link)
const RAZORPAY_LINK = 'https://razorpay.me/@kanhaiyamanmathyadav';

const DepositQR = () => {
  const [amount, setAmount] = useState('');
  const [txId, setTxId] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Environment variables for UPI details
  const BANK_ACCOUNT = import.meta.env.VITE_BANK_ACCOUNT || 'admin@upi';
  const BANK_NAME = import.meta.env.VITE_BANK_NAME || 'GoldTrader';

  const handleGenerate = () => {
    const numeric = Number(amount);
    if (!numeric || numeric <= 0) {
      setError('Enter a valid amount');
      return;
    }
    setError('');
    setShowQR(true);
  };

  const handleVerify = async () => {
    if (!txId) {
      setError('Enter UPI Transaction ID (UTR)');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const accountType = localStorage.getItem('accountType') || 'REAL';
      const API_URL = import.meta.env.VITE_API_URL || 'https://goldtraderpro-production.up.railway.app';
      
      const res = await fetch(`${API_URL}/api/funds/deposit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ amount: Number(amount), accountType, utr: txId })
      });
      const data = await res.json();
      if (data.success) {
        alert('Deposit request submitted! It is pending admin approval.');
        navigate('/history');
      } else {
        setError(data.message || 'Deposit submission failed');
      }
    } catch (e) {
      console.error(e);
      setError('Server error');
    }
  };

  // Build UPI Intent URI
  const params = new URLSearchParams({
    pa: BANK_ACCOUNT,
    pn: BANK_NAME,
    tr: `DEP${Date.now()}`,
    tn: `Deposit ${amount} Rs`,
    am: amount,
    cu: 'INR'
  });
  const qrValue = `upi://pay?${params.toString()}`;

  return (
    <div className="glass-panel" style={{ maxWidth: '480px', margin: 'auto', padding: '20px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '16px' }}>Deposit via UPI QR</h2>
      <label>Amount (Rs)</label>
      <input
        type="number"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        className="custom-input"
        placeholder="Enter amount"
        style={{ width: '100%', marginBottom: '12px' }}
      />
      <button className="btn btn-primary" onClick={handleGenerate} style={{ width: '100%', marginBottom: '12px' }}>
        Generate QR Code
      </button>

      {showQR && (
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <QRCode value={qrValue} size={200} />
          <p style={{ marginTop: '8px' }}>Scan with GPay, PhonePe, or Paytm.</p>
        </div>
      )}

      <label>UPI Transaction ID / UTR (after payment)</label>
      <input
        type="text"
        value={txId}
        onChange={e => setTxId(e.target.value)}
        className="custom-input"
        placeholder="e.g., 31920394..."
        style={{ width: '100%', marginBottom: '12px' }}
      />
      <button className="btn btn-success" onClick={handleVerify} style={{ width: '100%' }}>
        Submit for Verification
      </button>

      {error && <div style={{ color: 'var(--error)', marginTop: '8px' }}>{error}</div>}
    </div>
  );
};

export default DepositQR;

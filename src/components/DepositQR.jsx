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
      setError('Enter Razorpay transaction ID');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await fetch(`${API_URL}/api/verify-qr-payment`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ razorpay_payment_id: txId, amount: Number(amount) })
      });
      const data = await res.json();
      if (data.success) {
        navigate('/deposit-success');
      } else {
        setError(data.message || 'Verification failed');
      }
    } catch (e) {
      console.error(e);
      setError('Server error');
    }
  };

  // Build QR data: the payment link with amount (Razorpay supports amount query param in paise)
  const qrValue = `${RAZORPAY_LINK}?amount=${Number(amount) * 100}`;

  return (
    <div className="glass-panel" style={{ maxWidth: '480px', margin: 'auto', padding: '20px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '16px' }}>Deposit via Razorpay QR</h2>
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
          <p style={{ marginTop: '8px' }}>Scan with Razorpay app to pay.</p>
        </div>
      )}

      <label>Razorpay Payment ID (after payment)</label>
      <input
        type="text"
        value={txId}
        onChange={e => setTxId(e.target.value)}
        className="custom-input"
        placeholder="e.g., pay_29QQoUBi66M1…"
        style={{ width: '100%', marginBottom: '12px' }}
      />
      <button className="btn btn-success" onClick={handleVerify} style={{ width: '100%' }}>
        Verify & Finish
      </button>

      {error && <div style={{ color: 'var(--error)', marginTop: '8px' }}>{error}</div>}
    </div>
  );
};

export default DepositQR;

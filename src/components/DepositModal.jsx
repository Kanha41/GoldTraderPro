import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAppContext } from '../context/useAppContext';

// Environment variables for bank details (hidden from UI)
const BANK_ACCOUNT = import.meta.env.VITE_BANK_ACCOUNT;
const BANK_IFSC = import.meta.env.VITE_BANK_IFSC;
const BANK_NAME = import.meta.env.VITE_BANK_NAME;
const RAZORPAY_KEY = 'rzp_test_SvSlpnoRnLnCAO';

/**
 * DepositModal handles real‑account fund deposits.
 * Users can choose between UPI app redirection and Razorpay checkout.
 * Admin details are never displayed in the UI.
 */
const DepositModal = ({ onClose }) => {
  const navigate = useNavigate();
  const { accountType, deposit } = useAppContext();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('razorpay'); // 'upi' | 'razorpay'

  const buildUpiUrl = () => {
    const params = new URLSearchParams({
      pa: BANK_ACCOUNT,
      pn: BANK_NAME,
      tr: `DEP${Date.now()}`,
      tn: `Deposit ${amount} Rs`,
      am: amount,
      cu: 'INR',
      url: window.location.origin,
    });
    return `upi://pay?${params.toString()}`;
  };

  const loadRazorpay = () => {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Razorpay SDK failed to load'));
      document.body.appendChild(script);
    });
  };

  const handleProceed = async () => {
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (accountType === 'DEMO') {
      deposit(numericAmount);
      alert(`Demo funds of ₹${numericAmount.toFixed(2)} have been successfully credited instantly!`);
      onClose();
      return;
    }

    if (paymentMethod === 'upi') {
      const upiUrl = buildUpiUrl();
      window.location.href = upiUrl;
    } else {
      try {
        await loadRazorpay();
        const options = {
          key: RAZORPAY_KEY,
          amount: numericAmount * 100, // paise
          currency: 'INR',
          name: 'GoldTrader Pro Deposit',
          description: `Deposit ${numericAmount} Rs`,
          handler: async function (response) {
            try {
              const token = localStorage.getItem('token');
              const API_URL = import.meta.env.VITE_API_URL || 'https://goldtraderpro-production.up.railway.app';
              const verifyRes = await fetch(`${API_URL}/api/verify-payment`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  amount: numericAmount,
                }),
              });
              const data = await verifyRes.json();
              if (data.success) {
                alert('Deposit successful and verified!');
                navigate('/deposit-success');
                onClose();
              } else {
                alert('Verification failed: ' + data.message);
              }
            } catch (e) {
              console.error('Verification error', e);
              alert('Could not verify the payment.');
            }
          },
          prefill: {},
          theme: { color: '#eab308' },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (e) {
        setError('Failed to load payment gateway');
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content">
        <div className="modal-header">
          <h2>Deposit Funds ({accountType === 'DEMO' ? 'Demo' : 'Real'})</h2>
          <button onClick={onClose} className="modal-close">
            <X size={24} />
          </button>
        </div>
        <div className="modal-body" style={{ padding: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>Amount (Rs)</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="custom-input"
            placeholder={accountType === 'DEMO' ? "Enter amount (min ₹100)" : "Enter amount"}
            min={accountType === 'DEMO' ? "100" : "1"}
            style={{ width: '100%', padding: '8px', borderRadius: '4px' }}
          />
          {accountType === 'REAL' && (
            <div className="payment-method" style={{ marginTop: '12px' }}>
              <label style={{ marginLeft: '20px' }}>
                <input
                  type="radio"
                  name="payment"
                  value="razorpay"
                  checked={paymentMethod === 'razorpay'}
                  onChange={() => setPaymentMethod('razorpay')}
                />
                &nbsp;Razorpay
              </label>
            </div>
          )}
          {error && (
            <div style={{ color: 'var(--error)', marginTop: '8px' }}>{error}</div>
          )}
        </div>
        <div className="modal-footer" style={{ padding: '10px', textAlign: 'right' }}>
          <button className="btn btn-outline" onClick={onClose} style={{ marginRight: '8px' }}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleProceed}>
            {accountType === 'DEMO' ? 'Submit Deposit Request' : 'Proceed'}
          </button>
          {accountType === 'REAL' && (
            <a href="https://razorpay.me/@kanhaiyamanmathyadav" target="_blank" rel="noopener noreferrer" style={{ marginLeft: '12px', color: 'var(--accent)', textDecoration: 'underline' }}>
              Deposit via Razorpay link
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default DepositModal;

import React, { useState } from 'react';
import { useAppContext } from '../context/useAppContext';
import { X } from 'lucide-react';

const VerificationModal = ({ isOpen, onClose }) => {
  const { user, setAccountType, accountType, updateVerification } = useAppContext();
  const [mode, setMode] = useState('BANK'); // BANK or UPI
  const [bankAccount, setBankAccount] = useState('');
  const [confirmBankAccount, setConfirmBankAccount] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiNumber, setUpiNumber] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'BANK') {
      if (!bankAccount || bankAccount !== confirmBankAccount || !ifscCode) {
        alert('Please provide matching bank account numbers and IFSC code.');
        return;
      }
      updateVerification({
        mode: 'BANK',
        bankAccount,
        ifscCode,
      });
    } else {
      if (!upiNumber) {
        alert('Please provide your UPI number.');
        return;
      }
      updateVerification({
        mode: 'UPI',
        upiNumber,
        accountName: 'Kartik Vilas Patil', // pre‑written blurred name
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h2>Verification Setup</h2>
          <button onClick={onClose} className="modal-close"><X size={22} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label><input type="radio" name="mode" value="BANK" checked={mode === 'BANK'} onChange={() => setMode('BANK')} /> Bank Withdraw</label>
            <label style={{ marginLeft: '12px' }}><input type="radio" name="mode" value="UPI" checked={mode === 'UPI'} onChange={() => setMode('UPI')} /> UPI Withdraw</label>
          </div>
          {mode === 'BANK' && (
            <>
              <div className="input-group" style={{ textAlign: 'left' }}>
                <label>Bank Account Number</label>
                <input type="text" className="custom-input" value={bankAccount} onChange={e => setBankAccount(e.target.value)} required />
              </div>
              <div className="input-group" style={{ textAlign: 'left' }}>
                <label>Confirm Account Number</label>
                <input type="text" className="custom-input" value={confirmBankAccount} onChange={e => setConfirmBankAccount(e.target.value)} required />
              </div>
              <div className="input-group" style={{ textAlign: 'left' }}>
                <label>IFSC Code</label>
                <input type="text" className="custom-input" value={ifscCode} onChange={e => setIfscCode(e.target.value)} required />
              </div>
            </>
          )}
          {mode === 'UPI' && (
            <div className="input-group" style={{ textAlign: 'left' }}>
              <label>UPI Number</label>
              <input type="text" className="custom-input" value={upiNumber} onChange={e => setUpiNumber(e.target.value)} required />
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Account Name: <span style={{ opacity: 0.4, filter: 'blur(2px)' }}>Kartik Vilas Patil</span>
              </div>
            </div>
          )}
          <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center', padding: '12px' }}>
            Save Verification
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerificationModal;

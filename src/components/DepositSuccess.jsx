import React from 'react';
import { useNavigate } from 'react-router-dom';

const DepositSuccess = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="glass-panel" style={{ maxWidth: '500px', margin: 'auto', padding: '30px', textAlign: 'center' }}>
      <h2>Deposit Successful 🎉</h2>
      <p>Your deposit has been verified and credited to your account.</p>
      <button className="btn btn-primary" onClick={handleGoHome} style={{ marginTop: '20px' }}>
        Go to Dashboard
      </button>
    </div>
  );
};

export default DepositSuccess;

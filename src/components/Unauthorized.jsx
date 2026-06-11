import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="auth-container">
      <div className="glass-panel auth-box" style={{ maxWidth: '500px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <ShieldAlert size={64} color="var(--sell-color)" style={{ filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.4))' }} />
        </div>
        <h2 style={{ marginBottom: '15px', fontSize: '28px', color: 'var(--sell-color)' }}>Access Denied</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', lineHeight: '1.6' }}>
          You do not have the required administrative permissions to access the Admin Dashboard. If you believe this is an error, please contact a platform administrator.
        </p>
        <button 
          onClick={() => navigate('/')} 
          className="btn btn-primary" 
          style={{ width: '100%', padding: '14px', justifyContent: 'center', fontSize: '16px' }}
        >
          <ArrowLeft size={18} /> Return to Trading Platform
        </button>
      </div>
    </div>
  );
};

export default Unauthorized;

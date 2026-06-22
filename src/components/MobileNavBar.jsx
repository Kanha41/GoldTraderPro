import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, TrendingUp, Clock, User, Home } from 'lucide-react';

const MobileNavBar = ({ activeTab }) => {
  const navigate = useNavigate();

  const tabs = [
    { id: 'trade', label: 'Home', icon: Home, path: '/' },
    { id: 'challenge', label: 'Challenge', icon: Trophy, path: '/challenge' },
    { id: 'history', label: 'History', icon: Clock, path: '/history' },
    { id: 'me', label: 'Me', icon: User, path: '/profile' }
  ];

  const handleTabClick = (tab) => {
    navigate(tab.path);
  };

  return (
    <div className="mobile-nav-bar" style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '65px',
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderTop: '1px solid var(--panel-border)',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      zIndex: 1000,
      boxShadow: '0 -4px 20px rgba(0,0,0,0.4)'
    }}>
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab)}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer',
              flex: 1,
              transition: 'color 0.2s',
              padding: '8px 0'
            }}
          >
            <IconComponent size={20} />
            <span style={{ fontSize: '11px', fontWeight: isActive ? '600' : '400' }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default MobileNavBar;

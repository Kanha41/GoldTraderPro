import React, { useState, useEffect } from 'react';
import { AppContext } from './appContextStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [balance, setBalance] = useState(0);
  const [trades, setTrades] = useState([]);
  const [accountType, setAccountType] = useState(() => {
    const saved = localStorage.getItem('accountType');
    return saved ? saved : 'REAL';
  });
  const [verification, setVerification] = useState(null);

  // Admin Records synced from DB for administrators
  const [adminRecords, setAdminRecords] = useState([]);

  // Feedbacks state stored in localStorage (can be migrated to DB as well)
  const [feedbacks, setFeedbacks] = useState(() => {
    const saved = localStorage.getItem('feedbacks');
    return saved ? JSON.parse(saved) : [];
  });

  // Support Chats state stored in localStorage
  const [supportChats, setSupportChats] = useState(() => {
    const saved = localStorage.getItem('supportChats');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('accountType', accountType);
  }, [accountType]);

  useEffect(() => {
    localStorage.setItem('supportChats', JSON.stringify(supportChats));
  }, [supportChats]);

  useEffect(() => {
    if (user) {
      sessionStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('currentUser');
    }
  }, [user]);

  // Helper to fetch authorization header
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  };

  // Fetch current user details & admin lists on startup/change
  const loadUserData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        const u = data.user;
        setUser({
          id: u._id,
          username: u.username,
          fullName: u.fullName,
          email: u.email,
          role: u.role
        });
        setVerification(u.verification || null);
        setBalance(accountType === 'DEMO' ? u.demoBalance : u.balance);
        setTrades(accountType === 'DEMO' ? u.demoTrades : u.trades);
        
        // If admin, load all users
        if (u.role === 'admin') {
          const adminRes = await fetch(`${API_URL}/api/admin/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const adminData = await adminRes.json();
          if (adminData.success) {
            setAdminRecords(adminData.users);
          }
        }
      } else {
        // Token expired or invalid
        logout();
      }
    } catch (e) {
      console.error('Failed to sync session with database:', e);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [accountType]);

  // Handle Sign In API
  const login = async (usernameOrEmail, password) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        await loadUserData();
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (err) {
      return { success: false, message: 'Server connection failed.' };
    }
  };

  // Handle Sign Up API
  const signUp = async ({ username, fullName, email, mobileNumber, password, securityQuestion, securityAnswer }) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, fullName, email, mobileNumber, password, securityQuestion, securityAnswer })
      });
      const data = await res.json();
      if (data.success) {
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (err) {
      return { success: false, message: 'Server connection failed.' };
    }
  };

  // Handle Reset Password API (Forgot Password verification & change)
  const resetPassword = async (username, newPassword, optionalPayload = {}) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, newPassword, ...optionalPayload })
      });
      const data = await res.json();
      if (data.success) {
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (err) {
      return { success: false, message: 'Failed to communicate with recovery server.' };
    }
  };

  // Sign out user locally
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setBalance(0);
    setTrades([]);
    setVerification(null);
    setAdminRecords([]);
  };

  // Admin Action: Update specific user role
  const updateUserRole = async (userId, newRole) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/user-role`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId, role: newRole })
      });
      const data = await res.json();
      if (data.success) {
        await loadUserData(); // Refresh admin record state
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (err) {
      return { success: false, message: 'Server connection failed.' };
    }
  };

  // Submit User Feedbacks
  const submitFeedback = (text) => {
    if (!text.trim()) return;
    const newFeedback = {
      id: Date.now(),
      userId: user?.id,
      username: user?.username || 'Anonymous',
      fullName: user?.fullName || 'Anonymous',
      text: text.trim(),
      date: new Date().toISOString()
    };
    setFeedbacks(prev => {
      const updated = [newFeedback, ...prev];
      localStorage.setItem('feedbacks', JSON.stringify(updated));
      return updated;
    });
  };

  // Submit Support Chats
  const sendSupportMessage = (text) => {
    if (!user) return;
    setSupportChats(prev => {
      const existingChatIndex = prev.findIndex(c => c.userId === user.id && c.status === 'OPEN');
      const newMessage = {
        id: Date.now(),
        sender: 'user',
        text: text.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      if (existingChatIndex >= 0) {
        const updated = [...prev];
        updated[existingChatIndex] = {
          ...updated[existingChatIndex],
          messages: [...updated[existingChatIndex].messages, newMessage],
          lastUpdated: new Date().toISOString()
        };
        return updated;
      } else {
        return [{
          id: Date.now(),
          userId: user.id,
          username: user.username,
          status: 'OPEN',
          lastUpdated: new Date().toISOString(),
          messages: [newMessage]
        }, ...prev];
      }
    });
  };

  // Reply to Chats
  const replySupportMessage = (chatId, text) => {
    setSupportChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages: [...chat.messages, {
            id: Date.now(),
            sender: 'admin',
            text: text.trim(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }],
          lastUpdated: new Date().toISOString(),
          unreadByUser: true
        };
      }
      return chat;
    }));
  };

  const markSupportChatRead = () => {
    if (!user) return;
    setSupportChats(prev => prev.map(chat => {
      if (chat.userId === user.id && chat.unreadByUser) {
        return { ...chat, unreadByUser: false };
      }
      return chat;
    }));
  };

  // Request Fund Deposit
  const deposit = async (amount) => {
    try {
      const res = await fetch(`${API_URL}/api/funds/deposit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ amount, accountType })
      });
      const data = await res.json();
      if (data.success) {
        await loadUserData();
      }
    } catch (err) {
      console.error('Failed to register deposit:', err);
    }
  };

  // Request Fund Withdrawal
  const withdraw = async (amount) => {
    try {
      const res = await fetch(`${API_URL}/api/funds/withdraw`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ amount, accountType })
      });
      const data = await res.json();
      if (data.success) {
        await loadUserData();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to submit withdrawal:', err);
      return false;
    }
  };

  // Admin Action: Approve user withdrawal request
  const approveWithdrawal = async (userId, transactionId) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/approve-transaction`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId, transactionId })
      });
      const data = await res.json();
      if (data.success) {
        await loadUserData();
      }
    } catch (err) {
      console.error('Failed to approve transaction:', err);
    }
  };

  // Save Identity verification setup
  const updateVerification = async (data) => {
    try {
      const res = await fetch(`${API_URL}/api/funds/verification`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      const resData = await res.json();
      if (resData.success) {
        await loadUserData();
      }
    } catch (err) {
      console.error('Failed to update verification details:', err);
    }
  };

  // Add Opened Trade to database
  const addTrade = async (tradeDetails) => {
    try {
      const res = await fetch(`${API_URL}/api/trades/add`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ tradeDetails, accountType })
      });
      const data = await res.json();
      if (data.success) {
        await loadUserData();
      }
    } catch (err) {
      console.error('Failed to register trade creation:', err);
    }
  };

  // Complete Opened Trade
  const completeTrade = async (tradeId, profit) => {
    try {
      const res = await fetch(`${API_URL}/api/trades/complete`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ tradeId, profit, accountType })
      });
      const data = await res.json();
      if (data.success) {
        await loadUserData();
      }
    } catch (err) {
      console.error('Failed to close trade:', err);
    }
  };

  // Switch/Enroll in challenges
  const switchChallenge = async (newType) => {
    try {
      const res = await fetch(`${API_URL}/api/funds/enroll-challenge`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ challengeType: newType })
      });
      const data = await res.json();
      if (data.success) {
        await loadUserData();
      }
    } catch (err) {
      console.error('Failed to switch challenge:', err);
    }
  };

  const enrollSixtyTradeChallenge = async () => {
    try {
      const res = await fetch(`${API_URL}/api/funds/enroll-challenge`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ challengeType: '60_TRADE' })
      });
      const data = await res.json();
      if (data.success) {
        await loadUserData();
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (err) {
      console.error('Failed to enroll in 60-trade challenge:', err);
      return { success: false, message: 'Server connection failed.' };
    }
  };

  // Update Profile details from Dashboard settings
  const updateProfileDetails = async ({ username, email, password }) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/update-profile`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ username, email, password })
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        await loadUserData();
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (err) {
      return { success: false, message: 'Server connection failed.' };
    }
  };

  const value = {
    user,
    balance,
    trades,
    accountType,
    setAccountType,
    adminRecords,
    login,
    signUp,
    resetPassword,
    updateUserRole,
    logout,
    submitFeedback,
    deposit,
    withdraw,
    addTrade,
    completeTrade,
    switchChallenge,
    enrollSixtyTradeChallenge,
    feedbacks,
    setFeedbacks,
    supportChats,
    sendSupportMessage,
    replySupportMessage,
    markSupportChatRead,
    updateProfileDetails,
    verification,
    updateVerification,
    approveWithdrawal
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

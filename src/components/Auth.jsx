import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/useAppContext';
import { LogIn, UserPlus, ShieldCheck, Mail, User, Lock, ArrowLeft, KeyRound } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const Auth = () => {
  // Modes: 'signin', 'signup', 'forgot'
  const [mode, setMode] = useState('signin');
  
  // AppContext functions
  const { login, signUp, resetPassword, adminRecords } = useAppContext();
  const navigate = useNavigate();

  // General Status Messages
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [toast, setToast] = useState(null);

  // --- Sign In Fields ---
  const [signInInput, setSignInInput] = useState(''); // Username or Email
  const [signInPassword, setSignInPassword] = useState('');

  // --- Sign Up Fields ---
  const [signUpFullName, setSignUpFullName] = useState('');
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpQuestion, setSignUpQuestion] = useState("What was your first pet's name?");
  const [signUpMobileNumber, setSignUpMobileNumber] = useState('');
  const [signUpOtpId, setSignUpOtpId] = useState('');
  const [forgotOtpId, setForgotOtpId] = useState('');
  const [signUpInputOtp, setSignUpInputOtp] = useState('');
  const [signUpStep, setSignUpStep] = useState(1);
  const [signUpAnswer, setSignUpAnswer] = useState('');

  // --- Forgot Password Fields ---
  const [forgotInput, setForgotInput] = useState(''); // Username or Email
  const [recoveryMethod, setRecoveryMethod] = useState('otp'); // 'otp' or 'question'
  const [forgotStep, setForgotStep] = useState(1); // 1: username check, 2: reset password verification
  const [matchedUser, setMatchedUser] = useState(null);
  
  // Security Question Mode
  const [securityAnswer, setSecurityAnswer] = useState('');
  
  // OTP Mode
  const [inputOtp, setInputOtp] = useState('');
  
  // Reset Password Inputs
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Security Questions list
  const securityQuestionsList = [
    "What was your first pet's name?",
    "What is your mother's maiden name?",
    "What city were you born in?",
    "What is your favorite school subject?",
    "What was the model of your first car?"
  ];

  const triggerToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 10000);
  };

  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!signInInput.trim() || !signInPassword) {
      setError('Please fill in all fields.');
      return;
    }

    const res = await login(signInInput.trim(), signInPassword);
    if (res.success) {
      setSuccess('Logged in successfully! Redirecting...');
      setTimeout(() => navigate('/'), 1200);
    } else {
      setError(res.message);
    }
  };

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Basic validation
    if (!signUpFullName.trim() || !signUpUsername.trim() || !signUpEmail.trim() || !signUpMobileNumber.trim() || !signUpPassword || !signUpAnswer.trim()) {
      setError('All fields are required.');
      return;
    }
    if (signUpPassword !== signUpConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (signUpPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    // Directly register the user
    const res = await signUp({
      username: signUpUsername,
      fullName: signUpFullName,
      email: signUpEmail,
      mobileNumber: signUpMobileNumber,
      password: signUpPassword,
      securityQuestion: signUpQuestion,
      securityAnswer: signUpAnswer
    });

    if (res.success) {
      setSuccess('✅ Account created successfully! You can now sign in.');
      setSignInInput(signUpUsername);
      setTimeout(() => {
        setMode('signin');
        setSuccess('');
        setSignUpFullName('');
        setSignUpUsername('');
        setSignUpEmail('');
        setSignUpPassword('');
        setSignUpConfirmPassword('');
        setSignUpAnswer('');
        setSignUpMobileNumber('');
        setSignUpOtpId('');
        setSignUpInputOtp('');
        setSignUpStep(1);
      }, 1500);
    } else {
      setError(res.message || 'Signup failed. Please try again.');
    }
  };


  // Forgot Password Steps
  const handleForgotStep1Submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const checkRes = await fetch(`${API_URL}/api/auth/forgot-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail: forgotInput })
      });
      const checkData = await checkRes.json();
      if (!checkData.success) {
        setError(checkData.message || 'No registered user was found with that username or email.');
        return;
      }

      setMatchedUser({
        username: checkData.username,
        email: checkData.email,
        securityQuestion: checkData.securityQuestion
      });

      if (recoveryMethod === 'otp') {
        const otpRes = await fetch(`${API_URL}/api/otp/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ purpose: 'forgot', email: checkData.email })
        });
        const otpData = await otpRes.json();
        if (otpData.success) {
          setForgotOtpId(otpData.otpId);
          triggerToast(
            `📧 Password Reset OTP\n\nA 6-digit verification code has been dispatched to:\n  ${checkData.email}\n\nEnter this code in the next step to reset your password. (Code: ${otpData.code})`,
            'info'
          );
          setForgotStep(2);
        } else {
          setError(otpData.message || 'Failed to send OTP.');
        }
      } else {
        if (!checkData.securityQuestion) {
          setError('This user does not have a security question configured. Please recover using email OTP instead.');
          return;
        }
        setForgotStep(2);
      }
    } catch (err) {
      setError('Connection to authentication server failed.');
    }
  };

  const handleForgotStep2Submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    const payload = {
      username: matchedUser.username,
      newPassword,
      recoveryMethod
    };

    if (recoveryMethod === 'otp') {
      payload.otpId = forgotOtpId;
      payload.code = inputOtp.trim();
    } else {
      payload.securityAnswer = securityAnswer.trim().toLowerCase();
    }

    const res = await resetPassword(matchedUser.username, newPassword, payload);
    if (res.success) {
      setSuccess('✅ Your password has been reset successfully! Redirecting to login...');
      setTimeout(() => {
        setMode('signin');
        setForgotStep(1);
        setMatchedUser(null);
        setForgotInput('');
        setSecurityAnswer('');
        setNewPassword('');
        setConfirmNewPassword('');
        setInputOtp('');
        setForgotOtpId('');
        setSuccess('');
      }, 2000);
    } else {
      setError(res.message || 'Failed to reset password. Please try again.');
    }
  };


  const toggleMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
  };

  return (
    <div className="auth-container" style={{ position: 'relative' }}>
      {/* Premium simulated email / OTP toast notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          width: '380px',
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          borderLeft: '4px solid var(--accent)',
          borderTop: '1px solid var(--panel-border)',
          borderRight: '1px solid var(--panel-border)',
          borderBottom: '1px solid var(--panel-border)',
          color: 'var(--text-primary)',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
          zIndex: 9999,
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={14} /> Simulated System Notification
            </span>
            <button 
              onClick={() => setToast(null)} 
              style={{ background: 'none', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer' }}
            >
              Dismiss
            </button>
          </div>
          <div style={{ 
            fontSize: '13px', 
            color: 'var(--text-secondary)', 
            lineHeight: '1.6', 
            backgroundColor: 'rgba(0,0,0,0.3)',
            padding: '12px',
            borderRadius: '6px',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            {toast.message}
          </div>
        </div>
      )}

      <div className="glass-panel auth-box" style={{ maxWidth: '450px', width: '100%', transition: 'all 0.3s' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
          <KeyRound size={48} color="var(--accent)" style={{ filter: 'drop-shadow(0 0 10px var(--accent-glow))' }} />
        </div>
        
        <h2 style={{ marginBottom: '8px', fontSize: '28px', fontWeight: '700' }}>
          GoldTrader Pro
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
          {mode === 'signin' && "Access your premium trading dashboard"}
          {mode === 'signup' && "Register a new secure account"}
          {mode === 'forgot' && "Recover your account credentials"}
        </p>

        {/* Global Error/Success Messages */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--sell-color)',
            color: '#f87171',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '14px',
            textAlign: 'left',
            marginBottom: '20px',
            animation: 'fadeIn 0.3s'
          }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid var(--buy-color)',
            color: '#34d399',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '14px',
            textAlign: 'left',
            marginBottom: '20px',
            animation: 'fadeIn 0.3s'
          }}>
            {success}
          </div>
        )}

        {/* ==============================================
            SIGN IN FORM
            ============================================== */}
        {mode === 'signin' && (
          <form onSubmit={handleSignInSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
            <div className="input-group">
              <label htmlFor="signin-input" style={{ fontSize: '13px', fontWeight: '500' }}>Username or Email Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="signin-input"
                  type="text"
                  className="custom-input"
                  placeholder="Enter username or email"
                  value={signInInput}
                  onChange={(e) => setSignInInput(e.target.value)}
                  required
                  style={{ width: '100%', paddingLeft: '40px' }}
                />
                <User size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '14px', top: '15px' }} />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="signin-password" style={{ fontSize: '13px', fontWeight: '500' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="signin-password"
                  type="password"
                  className="custom-input"
                  placeholder="••••••••"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  required
                  style={{ width: '100%', paddingLeft: '40px' }}
                />
                <Lock size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '14px', top: '15px' }} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '14px', fontSize: '16px', justifyContent: 'center', marginTop: '10px' }}>
              <LogIn size={18} /> Sign In
            </button>

            {/* Bottom Links */}
            <div style={{ 
              marginTop: '16px', 
              display: 'flex', 
              flexDirection: 'column',
              gap: '12px', 
              alignItems: 'center', 
              fontSize: '13px',
              borderTop: '1px solid var(--panel-border)',
              paddingTop: '16px'
            }}>
              <button 
                type="button" 
                onClick={() => toggleMode('forgot')}
                style={{ background: 'none', color: 'var(--accent)', fontWeight: '500', cursor: 'pointer', border: 'none' }}
              >
                Forgot Password?
              </button>

              <div style={{ color: 'var(--text-secondary)' }}>
                Don't have an account?{' '}
                <button 
                  type="button" 
                  onClick={() => toggleMode('signup')}
                  style={{ background: 'none', color: '#fff', fontWeight: '600', cursor: 'pointer', border: 'none' }}
                >
                  Create Account
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ==============================================
            SIGN UP FORM
            ============================================== */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
            <div className="input-group">
              <label htmlFor="signup-fullname" style={{ fontSize: '13px', fontWeight: '500' }}>Full Name</label>
              <input
                id="signup-fullname"
                type="text"
                className="custom-input"
                placeholder="John Doe"
                value={signUpFullName}
                onChange={(e) => setSignUpFullName(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="signup-username" style={{ fontSize: '13px', fontWeight: '500' }}>Username</label>
              <input
                id="signup-username"
                type="text"
                className="custom-input"
                placeholder="johndoe12"
                value={signUpUsername}
                onChange={(e) => setSignUpUsername(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="signup-email" style={{ fontSize: '13px', fontWeight: '500' }}>Email Address</label>
              <input
                id="signup-email"
                type="email"
                className="custom-input"
                placeholder="john@example.com"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                required
              />
<div className="input-group">
  <label htmlFor="signup-mobile" style={{ fontSize: '13px', fontWeight: '500' }}>Mobile Number</label>
  <input
    id="signup-mobile"
    type="text"
    className="custom-input"
    placeholder="+1 555-1234"
    value={signUpMobileNumber}
    onChange={(e) => setSignUpMobileNumber(e.target.value)}
    required
  />
</div>
            </div>

            <div className="input-group">
              <label htmlFor="signup-password" style={{ fontSize: '13px', fontWeight: '500' }}>Password (min 6 characters)</label>
              <input
                id="signup-password"
                type="password"
                className="custom-input"
                placeholder="••••••••"
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="signup-confirm" style={{ fontSize: '13px', fontWeight: '500' }}>Confirm Password</label>
              <input
                id="signup-confirm"
                type="password"
                className="custom-input"
                placeholder="••••••••"
                value={signUpConfirmPassword}
                onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="signup-question" style={{ fontSize: '13px', fontWeight: '500' }}>Security Recovery Question</label>
              <select
                id="signup-question"
                className="custom-input"
                value={signUpQuestion}
                onChange={(e) => setSignUpQuestion(e.target.value)}
                style={{ background: 'rgba(0,0,0,0.4)', color: 'var(--text-primary)' }}
              >
                {securityQuestionsList.map((q, idx) => (
                  <option key={idx} value={q} style={{ background: '#111827', color: '#fff' }}>{q}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="signup-answer" style={{ fontSize: '13px', fontWeight: '500' }}>Recovery Answer</label>
              <input
                id="signup-answer"
                type="text"
                className="custom-input"
                placeholder="Enter answer (case-insensitive)"
                value={signUpAnswer}
                onChange={(e) => setSignUpAnswer(e.target.value)}
                required
              />
            </div>


<button type="submit" className="btn btn-primary" style={{ padding: '14px', fontSize: '16px', justifyContent: 'center', marginTop: '10px' }}>
  <UserPlus size={18} /> Register Account
</button>

            <div style={{ 
              marginTop: '10px', 
              textAlign: 'center', 
              fontSize: '13px',
              borderTop: '1px solid var(--panel-border)',
              paddingTop: '14px',
              color: 'var(--text-secondary)'
            }}>
              Already have an account?{' '}
              <button 
                type="button" 
                onClick={() => toggleMode('signin')}
                style={{ background: 'none', color: 'var(--accent)', fontWeight: '600', cursor: 'pointer', border: 'none' }}
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* ==============================================
            FORGOT PASSWORD FORM
            ============================================== */}
        {mode === 'forgot' && (
          <div style={{ textAlign: 'left' }}>
            {/* Step 1: Identify Account and Select Recovery Method */}
            {forgotStep === 1 ? (
              <form onSubmit={handleForgotStep1Submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="input-group">
                  <label htmlFor="forgot-input" style={{ fontSize: '13px', fontWeight: '500' }}>Enter Username or Email</label>
                  <input
                    id="forgot-input"
                    type="text"
                    className="custom-input"
                    placeholder="Enter your username or registered email"
                    value={forgotInput}
                    onChange={(e) => setForgotInput(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label style={{ fontSize: '13px', fontWeight: '500', marginBottom: '4px' }}>Choose Recovery Option</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px', 
                      background: 'rgba(255,255,255,0.03)', 
                      padding: '12px 16px', 
                      borderRadius: '8px', 
                      border: recoveryMethod === 'otp' ? '1px solid var(--accent)' : '1px solid var(--panel-border)',
                      cursor: 'pointer',
                      transition: '0.3s'
                    }}>
                      <input 
                        type="radio" 
                        name="recovery" 
                        value="otp"
                        checked={recoveryMethod === 'otp'}
                        onChange={() => setRecoveryMethod('otp')}
                        style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
                      />
                      <div>
                        <span style={{ fontSize: '14px', fontWeight: '600', display: 'block' }}>Email OTP Verification</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Send a 6-digit simulation code to email</span>
                      </div>
                    </label>

                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px', 
                      background: 'rgba(255,255,255,0.03)', 
                      padding: '12px 16px', 
                      borderRadius: '8px', 
                      border: recoveryMethod === 'question' ? '1px solid var(--accent)' : '1px solid var(--panel-border)',
                      cursor: 'pointer',
                      transition: '0.3s'
                    }}>
                      <input 
                        type="radio" 
                        name="recovery" 
                        value="question"
                        checked={recoveryMethod === 'question'}
                        onChange={() => setRecoveryMethod('question')}
                        style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
                      />
                      <div>
                        <span style={{ fontSize: '14px', fontWeight: '600', display: 'block' }}>Security Question Recovery</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Answer your pre-configured security question</span>
                      </div>
                    </label>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ padding: '14px', fontSize: '16px', justifyContent: 'center', marginTop: '10px' }}>
                  Next Step <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
                </button>
              </form>
            ) : (
              /* Step 2: Answer Verification details and Change Password */
              <form onSubmit={handleForgotStep2Submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid var(--panel-border)',
                  padding: '12px', 
                  borderRadius: '8px', 
                  fontSize: '13px', 
                  color: 'var(--text-secondary)',
                  marginBottom: '10px'
                }}>
                  Recovering account for: <strong style={{ color: 'var(--text-primary)' }}>{matchedUser.username}</strong>
                </div>

                {recoveryMethod === 'otp' ? (
                  <div className="input-group">
                    <label htmlFor="otp-input" style={{ fontSize: '13px', fontWeight: '500' }}>Enter Verification OTP</label>
                    <input
                      id="otp-input"
                      type="text"
                      maxLength={6}
                      className="custom-input"
                      placeholder="Enter 6-digit code"
                      value={inputOtp}
                      onChange={(e) => setInputOtp(e.target.value)}
                      required
                    />
                    <small style={{ color: 'var(--accent)', fontSize: '12px', marginTop: '4px' }}>
                      Check the floating system notification on your top right for the code!
                    </small>
                  </div>
                ) : (
                  <div className="input-group">
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Security Question</label>
                    <div style={{ fontSize: '15px', fontWeight: '600', margin: '4px 0 10px 0', color: 'var(--accent)' }}>
                      {matchedUser.securityQuestion}
                    </div>
                    <label htmlFor="security-answer" style={{ fontSize: '13px', fontWeight: '500' }}>Your Answer</label>
                    <input
                      id="security-answer"
                      type="text"
                      className="custom-input"
                      placeholder="Answer"
                      value={securityAnswer}
                      onChange={(e) => setSecurityAnswer(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="input-group">
                  <label htmlFor="new-password" style={{ fontSize: '13px', fontWeight: '500' }}>New Password</label>
                  <input
                    id="new-password"
                    type="password"
                    className="custom-input"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="confirm-new-password" style={{ fontSize: '13px', fontWeight: '500' }}>Confirm New Password</label>
                  <input
                    id="confirm-new-password"
                    type="password"
                    className="custom-input"
                    placeholder="••••••••"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ padding: '14px', fontSize: '16px', justifyContent: 'center', marginTop: '10px' }}>
                  <ShieldCheck size={18} /> Reset Password & Sign In
                </button>
              </form>
            )}

            <div style={{ 
              marginTop: '16px', 
              textAlign: 'center', 
              fontSize: '13px',
              borderTop: '1px solid var(--panel-border)',
              paddingTop: '14px',
              color: 'var(--text-secondary)'
            }}>
              <button 
                type="button" 
                onClick={() => {
                  setForgotStep(1);
                  toggleMode('signin');
                }}
                style={{ background: 'none', color: '#fff', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 auto', cursor: 'pointer', border: 'none' }}
              >
                <ArrowLeft size={14} /> Back to Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;

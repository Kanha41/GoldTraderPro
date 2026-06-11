import React, { useState } from 'react';
import MobileNavBar from './MobileNavBar';
import { useAppContext } from '../context/useAppContext';
import { 
  Mail, Copy, Check, Headset, MessageSquare, Play, 
  HelpCircle, ChevronRight, X, ChevronDown, Send
} from 'lucide-react';

const HelpCenter = ({ isSubView = false, onBack }) => {
  const [copied, setCopied] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const { user, supportChats, sendSupportMessage, markSupportChatRead } = useAppContext();
  
  const activeChat = supportChats?.find(c => c.userId === user?.id && c.status === 'OPEN');
  const chatMessages = activeChat && activeChat.messages.length > 0 ? activeChat.messages : [
    { sender: 'bot', text: 'Hello! I am your GoldTrader Pro support assistant. How can I help you today?', time: '09:00' }
  ];
  const [newMessage, setNewMessage] = useState('');
  
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [faqOpenIndex, setFaqOpenIndex] = useState(null);
  
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState(null);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('kanhaiyyayadav645@gmail.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    sendSupportMessage(newMessage);
    setNewMessage('');
  };

  const faqs = [
    { q: "How does the trading challenge work?", a: "GoldTrader Pro offers 7-Day (₹3,100), 30-Day (₹10,000), and 60-Trade (₹6,000) challenges. Day challenges count qualifying calendar days with daily win targets. The 60-Trade challenge counts only successful (TP) trades toward 60 and tracks losses separately — runs alongside day challenges. Prizes go to admin for approval under Profile → Transactions." },
    { q: "What is PAXG/USDT and Pax Gold?", a: "Pax Gold (PAXG) is a digital token backed by physical gold deposits. Since gold is not directly traded on all futures brokers, GoldTrader Pro links with PAXG/USDT live WebSocket feeds via Binance to represent gold price movements accurately." },
    { q: "What is the Take Profit (TP) and Stop Loss (SL)?", a: "Every placed order has locked, unalterable risk management parameters. The Take Profit is fixed at a 0.5 pip move (resulting in ₹140 reward), and the Stop Loss is fixed at a 1.0 pip move (which closes the trade resulting in loss of the ₹80 entry bid)." },
    { q: "How are Deposits and Withdrawals approved?", a: "Since GoldTrader Pro operates in demo mode, your deposits and withdrawals are logged as pending transactions in your profile database. Go to the Admin dashboard panel to instantly approve or reject these pending transactions to change your balance!" }
  ];

  const videos = [
    { title: "Introduction to GoldTrader Pro Dashboards", duration: "1:45" },
    { title: "Entering BUY and SELL market orders", duration: "2:20" },
    { title: "Understanding Trading Challenges", duration: "3:05" },
    { title: "Managing User Transactions as Admin", duration: "1:30" }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0b0e14',
      backgroundImage: 'radial-gradient(circle at top, rgba(18, 30, 54, 0.8), #0b0e14)',
      color: 'var(--text-primary)',
      padding: '30px 15px 90px 15px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{ maxWidth: '480px', width: '100%' }}>
        
        {/* --- Header Title --- */}
        {isSubView ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '24px', width: '100%' }}>
            <button onClick={onBack} className="btn btn-outline" style={{ padding: '8px 14px', fontSize: '13px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', borderColor: 'var(--panel-border)' }}>
              ← Back to Profile
            </button>
            <h2 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.02em', margin: 0, flex: 1, textAlign: 'right' }}>
              Help Center
            </h2>
          </div>
        ) : (
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            textAlign: 'center',
            marginBottom: '24px',
            letterSpacing: '-0.02em'
          }}>
            Help
          </h2>
        )}

        {/* --- Support Cards Stack --- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Card 1: E-mail Support Card */}
          <div className="glass-panel" style={{
            borderRadius: '16px',
            padding: '24px',
            textAlign: 'left',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(234, 179, 8, 0.1)', display: 'flex', alignItems: 'center', justifycontent: 'center', justifyContent: 'center' }}>
                <Mail size={20} color="var(--accent)" />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: '700' }}>E-mail Support</h4>
            </div>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--panel-border)',
              padding: '14px 16px',
              borderRadius: '10px',
              marginBottom: '10px'
            }}>
              <span style={{ fontSize: '15px', fontWeight: '700', letterSpacing: '0.02em', color: '#fff' }}>
                kanhaiyyayadav645@gmail.com
              </span>
              <button 
                onClick={handleCopyEmail}
                style={{
                  background: 'none',
                  color: copied ? 'var(--buy-color)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Copy email to clipboard"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
            
            <small style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>
              You will get a response within 1 business day.
            </small>
          </div>

          {/* Card 2: Online Support Card */}
          <div className="glass-panel" style={{
            borderRadius: '16px',
            padding: '24px',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Headset size={20} color="#38bdf8" />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Online Support
                {supportChats?.some(c => c.userId === user?.id && c.unreadByUser) && (
                  <span style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    display: 'inline-block',
                    boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)',
                    animation: 'pulse 1.5s infinite'
                  }} />
                )}
              </h4>
            </div>

            <button 
              onClick={() => { setShowChatModal(true); markSupportChatRead(); }}
              className="btn btn-outline"
              style={{
                width: '100%',
                padding: '14px',
                justifyContent: 'center',
                borderColor: '#38bdf8',
                color: '#38bdf8',
                fontSize: '15px',
                fontWeight: '600',
                background: 'rgba(56, 189, 248, 0.05)',
                boxShadow: '0 0 15px rgba(56, 189, 248, 0.1)',
                marginBottom: '10px'
              }}
            >
              Ask a question online
            </button>
            
            <small style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>
              Available from 9:00 to 17:00
            </small>
          </div>

          {/* Card 3: FAQ Card */}
          <div 
            onClick={() => setShowFaqModal(true)}
            className="glass-panel menu-row" 
            style={{
              borderRadius: '16px',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(52, 211, 153, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' }}>
              <HelpCircle size={20} color="#34d399" />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '15px', fontWeight: '700', margin: 0 }}>FAQ</h4>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Open knowledge base</span>
            </div>
            <ChevronRight size={20} color="var(--text-secondary)" />
          </div>

          {/* Card 4: Video Lessons Card */}
          <div 
            onClick={() => setShowVideoModal(true)}
            className="glass-panel menu-row" 
            style={{
              borderRadius: '16px',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(244, 114, 182, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' }}>
              <Play size={20} color="#f472b6" />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '15px', fontWeight: '700', margin: 0 }}>Video Lessons</h4>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Let’s discover the platform</span>
            </div>
            <ChevronRight size={20} color="var(--text-secondary)" />
          </div>

          {/* Bottom Back Button */}
          {isSubView && (
            <button 
              onClick={onBack}
              className="btn btn-outline"
              style={{
                width: '100%',
                padding: '14px',
                justifyContent: 'center',
                borderColor: 'var(--panel-border)',
                color: 'var(--text-primary)',
                fontSize: '15px',
                fontWeight: '600',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '16px',
                marginTop: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              ← Back to Profile
            </button>
          )}

        </div>

      </div>

      {/* --- MODALS & INTERACTIVE OVERLAYS --- */}
      
      {/* Live Online Assistant chat Modal */}
      {showChatModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ 
            maxWidth: '420px', 
            height: '80vh', 
            maxHeight: '600px', 
            display: 'flex', 
            flexDirection: 'column', 
            padding: 0, 
            borderRadius: '20px',
            overflow: 'hidden'
          }}>
            {/* Chat Header */}
            <div style={{ 
              padding: '16px 20px', 
              background: 'rgba(15, 23, 42, 0.9)', 
              borderBottom: '1px solid var(--panel-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
                <Headset size={20} color="#38bdf8" />
                <div>
                  <h4 style={{ fontSize: '14px', margin: 0, fontWeight: '700' }}>Live Operator</h4>
                  <small style={{ color: 'var(--buy-color)', fontSize: '11px' }}>Online Support Agent</small>
                </div>
              </div>
              <button onClick={() => setShowChatModal(false)} style={{ background: 'none', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            
            {/* Message Area */}
            <div style={{ 
              flex: 1, 
              padding: '20px', 
              overflowY: 'auto', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px' 
            }}>
              {chatMessages.map((msg, idx) => {
                const isBot = msg.sender === 'bot';
                return (
                  <div key={idx} style={{
                    alignSelf: isBot ? 'flex-start' : 'flex-end',
                    maxWidth: '80%',
                    textAlign: 'left'
                  }}>
                    <div style={{
                      background: isBot ? 'rgba(255,255,255,0.05)' : '#38bdf8',
                      color: isBot ? 'var(--text-primary)' : '#000',
                      padding: '10px 14px',
                      borderRadius: isBot ? '14px 14px 14px 4px' : '14px 14px 4px 14px',
                      fontSize: '13px',
                      lineHeight: '1.4',
                      border: isBot ? '1px solid var(--panel-border)' : 'none'
                    }}>
                      {msg.text}
                    </div>
                    <small style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginTop: '4px', textAlign: isBot ? 'left' : 'right' }}>
                      {msg.time}
                    </small>
                  </div>
                );
              })}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} style={{ 
              padding: '14px 20px', 
              background: 'rgba(15, 23, 42, 0.9)', 
              borderTop: '1px solid var(--panel-border)',
              display: 'flex',
              gap: '10px'
            }}>
              <input 
                type="text" 
                className="custom-input" 
                placeholder="Ask support assistant..." 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                style={{ flex: 1, padding: '10px 14px', fontSize: '13px' }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 14px' }}>
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FAQ Accordion Modal */}
      {showFaqModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '450px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2>FAQ Knowledge Base</h2>
              <button onClick={() => { setShowFaqModal(false); setFaqOpenIndex(null); }} className="modal-close"><X size={22} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', marginTop: '10px' }}>
              {faqs.map((faq, idx) => {
                const isOpen = faqOpenIndex === idx;
                return (
                  <div key={idx} style={{ 
                    border: '1px solid var(--panel-border)', 
                    borderRadius: '10px', 
                    overflow: 'hidden', 
                    background: 'rgba(255,255,255,0.01)'
                  }}>
                    <button 
                      onClick={() => setFaqOpenIndex(isOpen ? null : idx)}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        background: 'rgba(255,255,255,0.02)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        color: isOpen ? 'var(--accent)' : 'var(--text-primary)',
                        fontWeight: '600',
                        fontSize: '14px',
                        textAlign: 'left'
                      }}
                    >
                      {faq.q}
                      <ChevronDown size={16} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                    </button>
                    {isOpen && (
                      <div style={{ 
                        padding: '14px 16px', 
                        fontSize: '13px', 
                        lineHeight: '1.6', 
                        color: 'var(--text-secondary)',
                        borderTop: '1px solid var(--panel-border)',
                        background: 'rgba(0,0,0,0.1)'
                      }}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Video lessons list Modal */}
      {showVideoModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h2>Video Tutorials</h2>
              <button onClick={() => { setShowVideoModal(false); setActiveVideoUrl(null); }} className="modal-close"><X size={22} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left', marginTop: '10px' }}>
              {activeVideoUrl ? (
                /* Simulated video player frame */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{
                    width: '100%',
                    aspectRatio: '16/9',
                    background: '#000',
                    borderRadius: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--accent-glow)',
                    boxShadow: '0 0 20px var(--accent-glow)'
                  }}>
                    <Play size={44} color="var(--accent)" style={{ animation: 'pulse 2s infinite' }} />
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                      Streaming tutorial track...
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Playing: <strong style={{ color: '#fff' }}>{activeVideoUrl}</strong>
                  </div>
                  <button onClick={() => setActiveVideoUrl(null)} className="btn btn-outline" style={{ padding: '6px', fontSize: '12px', justifyContent: 'center' }}>
                    Back to Lesson List
                  </button>
                </div>
              ) : (
                /* Videos List */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {videos.map((vid, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setActiveVideoUrl(vid.title)}
                      style={{
                        padding: '12px 16px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--panel-border)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                      }}
                      className="menu-row"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Play size={15} color="var(--accent)" />
                        <div>
                          <h4 style={{ fontSize: '13px', margin: 0, fontWeight: '600' }}>{vid.title}</h4>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Duration: {vid.duration}</span>
                        </div>
                      </div>
                      <ChevronRight size={16} color="var(--text-secondary)" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!isSubView && <MobileNavBar activeTab="help" />}
    </div>
  );
};

export default HelpCenter;

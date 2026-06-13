require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const Razorpay = require('razorpay');

const { 
  sequelize, 
  User, 
  Trade, 
  Transaction, 
  Verification, 
  ChallengeData, 
  TradeChallengeData 
} = require('./sequelize');

const app = express();

// Allow requests from localhost in dev and the live frontend URL in production
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.FRONTEND_URL  // e.g. https://goldtraderpro.vercel.app
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    // Allow any Vercel preview/production deployment
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    // Allow any Railway deployment
    if (origin.endsWith('.railway.app')) return callback(null, true);
    // Allow explicitly listed origins
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS policy blocked request from origin: ${origin}`));
  },
  credentials: true
}));

app.use(express.json());

// In-memory OTP store (could be shifted to Redis/DB in the future)
const otpStore = {};

// JWT Secret Key
const JWT_SECRET = process.env.JWT_SECRET || 'goldtrader_jwt_super_secret_key';

// Initialize Razorpay SDK
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else {
  console.warn('⚠️ Razorpay credentials missing from env. Payments will run in simulation fallback.');
}

// Connect and sync PostgreSQL
sequelize.sync({ alter: true })
  .then(() => {
    console.log('✅ Connected to PostgreSQL and synced tables successfully.');
    seedDefaultAdmins();
  })
  .catch(err => console.error('❌ PostgreSQL connection error:', err));

// Format User for frontend compatibility (mimics Mongoose structure)
function formatUserResponse(user) {
  if (!user) return null;
  const raw = user.toJSON ? user.toJSON() : user;
  
  const sortedTrades = raw.tradesList ? [...raw.tradesList].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)) : [];
  const trades = sortedTrades.filter(t => !t.isDemo);
  const demoTrades = sortedTrades.filter(t => t.isDemo);
  
  const sortedTransactions = raw.transactionsList ? [...raw.transactionsList].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)) : [];
  const transactions = sortedTransactions.filter(t => !t.isDemo);
  const demoTransactions = sortedTransactions.filter(t => t.isDemo);

  return {
    _id: raw.id,
    id: raw.id,
    username: raw.username,
    fullName: raw.fullName,
    email: raw.email,
    mobileNumber: raw.mobileNumber,
    role: raw.role,
    balance: parseFloat(raw.balance || 0),
    demoBalance: parseFloat(raw.demoBalance || 0),
    trades,
    demoTrades,
    transactions,
    demoTransactions,
    verification: raw.verification || null,
    challengeData: raw.challengeData || { type: '30_DAY', enrolled: false, tradesToday: 0, qualifyingDays: 0, rewardSubmitted: false },
    tradeChallengeData: raw.tradeChallengeData || { enrolled: false, tradesCount: 0, winningTrades: 0, rewardSubmitted: false },
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt
  };
}

// Helper to query user with all nested relationships
async function getUserWithAssociations(userId) {
  return await User.findByPk(userId, {
    include: [
      { model: Trade, as: 'tradesList' },
      { model: Transaction, as: 'transactionsList' },
      { model: Verification, as: 'verification' },
      { model: ChallengeData, as: 'challengeData' },
      { model: TradeChallengeData, as: 'tradeChallengeData' }
    ]
  });
}

// Seed Default Administrators if they do not exist
async function seedDefaultAdmins() {
  try {
    const defaultAdmins = [
      {
        username: 'kanhaiya15',
        fullName: 'Kanhaiya Admin',
        email: 'kanhaiya@goldtrader.pro',
        mobileNumber: '9876543210',
        password: 'Admin@123',
        role: 'admin',
        securityQuestion: 'What is your favorite color?',
        securityAnswer: 'gold',
        balance: 1000.00,
        demoBalance: 10000.00
      },
      {
        username: 'smrutika26',
        fullName: 'Smrutika Admin',
        email: 'smrutika@goldtrader.pro',
        mobileNumber: '9876543211',
        password: 'Admin@123',
        role: 'admin',
        securityQuestion: 'What is your favorite color?',
        securityAnswer: 'gold',
        balance: 1000.00,
        demoBalance: 10000.00
      }
    ];

    for (const adminData of defaultAdmins) {
      const exists = await User.findOne({ where: { username: adminData.username } });
      if (!exists) {
        // Hash the admin password before saving
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminData.password, salt);
        
        const newAdmin = await User.create({
          ...adminData,
          password: hashedPassword,
        });

        // Seed challenge records
        await ChallengeData.create({
          userId: newAdmin.id,
          type: '30_DAY',
          enrolled: false,
          tradesToday: 0,
          qualifyingDays: 0,
          rewardSubmitted: false
        });

        await TradeChallengeData.create({
          userId: newAdmin.id,
          enrolled: false,
          tradesCount: 0,
          winningTrades: 0,
          rewardSubmitted: false
        });
        
        console.log(`👤 Seeded default admin account: ${adminData.username}`);
      }
    }
  } catch (err) {
    console.error('❌ Error seeding default admin accounts:', err);
  }
}

// Middleware: Authenticate JWT Token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ success: false, message: 'Access Token required' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    req.user = decoded;
    next();
  });
}

// Helper to generate 6-digit OTP code
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

// User Sign Up
app.post('/api/auth/signup', async (req, res) => {
  const { username, fullName, email, mobileNumber, password, securityQuestion, securityAnswer } = req.body;
  
  if (!username || !fullName || !email || !mobileNumber || !password || !securityQuestion || !securityAnswer) {
    return res.status(400).json({ success: false, message: 'All registration fields are required.' });
  }

  const t = await sequelize.transaction();
  try {
    // Check if user exists
    const existsUser = await User.findOne({ where: { username: username.toLowerCase().trim() } }, { transaction: t });
    if (existsUser) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Username is already taken.' });
    }

    const existsEmail = await User.findOne({ where: { email: email.toLowerCase().trim() } }, { transaction: t });
    if (existsEmail) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Email address is already registered.' });
    }

    const existsMobile = await User.findOne({ where: { mobileNumber: mobileNumber.trim() } }, { transaction: t });
    if (existsMobile) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Mobile number is already registered.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await User.create({
      username: username.trim(),
      fullName: fullName.trim(),
      email: email.trim(),
      mobileNumber: mobileNumber.trim(),
      password: hashedPassword,
      securityQuestion,
      securityAnswer: securityAnswer.trim().toLowerCase(),
      balance: 0.00,
      demoBalance: 10000.00
    }, { transaction: t });

    // Initialize challenge records for newly registered user
    await ChallengeData.create({
      userId: newUser.id,
      type: '30_DAY',
      enrolled: false,
      tradesToday: 0,
      qualifyingDays: 0,
      rewardSubmitted: false
    }, { transaction: t });

    await TradeChallengeData.create({
      userId: newUser.id,
      enrolled: false,
      tradesCount: 0,
      winningTrades: 0,
      rewardSubmitted: false
    }, { transaction: t });

    await t.commit();
    res.status(201).json({ success: true, message: 'Account registered successfully!' });
  } catch (err) {
    await t.rollback();
    console.error('Signup error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

// User Sign In
app.post('/api/auth/login', async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  if (!usernameOrEmail || !password) {
    return res.status(400).json({ success: false, message: 'Username/Email and Password are required.' });
  }

  try {
    const { Op } = require('sequelize');
    const userObj = await User.findOne({
      where: {
        [Op.or]: [
          { username: usernameOrEmail.toLowerCase().trim() },
          { email: usernameOrEmail.toLowerCase().trim() }
        ]
      }
    });

    if (!userObj) return res.status(400).json({ success: false, message: 'Invalid username or email.' });

    const isMatch = await bcrypt.compare(password, userObj.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Incorrect password.' });

    // Create and assign JWT token
    const token = jwt.sign({ id: userObj.id, username: userObj.username, role: userObj.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: {
        id: userObj.id,
        username: userObj.username,
        fullName: userObj.fullName,
        email: userObj.email,
        mobileNumber: userObj.mobileNumber,
        role: userObj.role,
        balance: parseFloat(userObj.balance || 0),
        demoBalance: parseFloat(userObj.demoBalance || 0)
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during sign in.' });
  }
});

// Get Current User Profile (Auto login session)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const userObj = await getUserWithAssociations(req.user.id);
    if (!userObj) return res.status(404).json({ success: false, message: 'User not found.' });

    res.json({ success: true, user: formatUserResponse(userObj) });
  } catch (err) {
    console.error('Auth check error:', err);
    res.status(500).json({ success: false, message: 'Server verification failed.' });
  }
});

// Update Profile Details
app.post('/api/auth/update-profile', authenticateToken, async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const userObj = await getUserWithAssociations(req.user.id);
    if (!userObj) return res.status(404).json({ success: false, message: 'User not found.' });

    if (username && username.trim().toLowerCase() !== userObj.username) {
      const exists = await User.findOne({ where: { username: username.trim().toLowerCase() } });
      if (exists) return res.status(400).json({ success: false, message: 'Username is already taken.' });
      userObj.username = username.trim();
    }

    if (email && email.trim().toLowerCase() !== userObj.email) {
      const exists = await User.findOne({ where: { email: email.trim().toLowerCase() } });
      if (exists) return res.status(400).json({ success: false, message: 'Email address is already in use.' });
      userObj.email = email.trim();
    }

    if (password) {
      if (password.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
      const salt = await bcrypt.genSalt(10);
      userObj.password = await bcrypt.hash(password, salt);
    }

    await userObj.save();
    res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: formatUserResponse(userObj)
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ success: false, message: 'Server error updating profile details.' });
  }
});

// Check if User exists & Fetch Security Question (Forgot Password step 1)
app.post('/api/auth/forgot-check', async (req, res) => {
  const { usernameOrEmail } = req.body;

  try {
    const { Op } = require('sequelize');
    const userObj = await User.findOne({
      where: {
        [Op.or]: [
          { username: usernameOrEmail.toLowerCase().trim() },
          { email: usernameOrEmail.toLowerCase().trim() }
        ]
      }
    });

    if (!userObj) {
      return res.status(404).json({ success: false, message: 'No registered user was found.' });
    }

    res.json({
      success: true,
      username: userObj.username,
      email: userObj.email,
      securityQuestion: userObj.securityQuestion
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server verification failed.' });
  }
});

// Reset Password (Forgot Password step 2)
app.post('/api/auth/reset-password', async (req, res) => {
  const { username, newPassword, recoveryMethod, securityAnswer, otpId, code } = req.body;

  try {
    const userObj = await User.findOne({ where: { username: username.toLowerCase().trim() } });
    if (!userObj) return res.status(404).json({ success: false, message: 'User not found.' });

    // Validate security criteria
    if (recoveryMethod === 'otp') {
      const entry = otpStore[otpId];
      if (!entry || entry.target !== userObj.email) {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP session.' });
      }
      if (entry.code !== code) {
        return res.status(400).json({ success: false, message: 'Incorrect OTP code.' });
      }
      delete otpStore[otpId];
    } else {
      if (securityAnswer.trim().toLowerCase() !== userObj.securityAnswer.toLowerCase()) {
        return res.status(400).json({ success: false, message: 'Incorrect answer to the security question.' });
      }
    }

    // Set new password
    if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    const salt = await bcrypt.genSalt(10);
    userObj.password = await bcrypt.hash(newPassword, salt);
    await userObj.save();

    res.json({ success: true, message: 'Password reset successfully!' });
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
});

// ==========================================
// OTP INTEGRATION ROUTES (EMAIL / SMS)
// ==========================================

// Send OTP
app.post('/api/otp/send', async (req, res) => {
  const { purpose, phone, email } = req.body;

  if (!purpose) {
    return res.status(400).json({ success: false, message: 'Purpose is required' });
  }

  const code = generateOtp();
  const id = uuidv4();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins

  const target = email || phone;
  otpStore[id] = { code, expiresAt, purpose, target };

  console.log(`[DEV Simulation OTP] Generated Code: ${code} (ID: ${id}) for ${target}`);

  try {
    if (purpose === 'signup' && phone && process.env.TWILIO_ACCOUNT_SID) {
      // Send Real Twilio SMS
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await client.messages.create({
        body: `Your GoldTrader OTP code is: ${code}`,
        from: process.env.TWILIO_FROM_NUMBER,
        to: phone,
      });
      console.log(`📲 Real Twilio SMS sent to ${phone}`);
    } else if (purpose === 'forgot' && email && process.env.EMAIL_USER) {
      // Send Real Nodemailer Email
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your GoldTrader OTP Code',
        text: `Your OTP verification code is: ${code}`,
      });
      console.log(`📧 Real Nodemailer Email sent to ${email}`);
    }
  } catch (err) {
    console.error('⚠️ Real OTP sending failed. Mock code remains active in dev console.', err);
  }

  // Return the code to the frontend as well for simulation if envs are missing
  res.json({ success: true, otpId: id, code });
});

// Verify OTP
app.post('/api/otp/verify', (req, res) => {
  const { otpId, code } = req.body;

  const entry = otpStore[otpId];
  if (!entry) return res.status(400).json({ success: false, message: 'Invalid OTP session ID.' });

  if (Date.now() > entry.expiresAt) {
    delete otpStore[otpId];
    return res.status(400).json({ success: false, message: 'OTP has expired.' });
  }

  if (entry.code !== code) {
    return res.status(400).json({ success: false, message: 'Incorrect OTP.' });
  }

  delete otpStore[otpId];
  res.json({ success: true, message: 'OTP successfully verified.' });
});

// ==========================================
// TRADES MANAGEMENT ROUTES
// ==========================================

// ==========================================
// TRADES MANAGEMENT ROUTES
// ==========================================

// Add a new Trade
app.post('/api/trades/add', authenticateToken, async (req, res) => {
  const { tradeDetails, accountType } = req.body;
  const t = await sequelize.transaction();

  try {
    const userObj = await getUserWithAssociations(req.user.id);
    if (!userObj) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isDemo = accountType === 'DEMO';
    const activeBalance = isDemo ? parseFloat(userObj.demoBalance) : parseFloat(userObj.balance);

    if (activeBalance < 80) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Insufficient balance to open trade.' });
    }

    // Deduct cost of trade
    const updatedBalance = activeBalance - 80;
    if (isDemo) {
      userObj.demoBalance = updatedBalance;
    } else {
      userObj.balance = updatedBalance;
    }
    await userObj.save({ transaction: t });

    await Trade.create({
      userId: userObj.id,
      isDemo,
      pair: tradeDetails.pair || 'PAXG/USDT',
      type: tradeDetails.type,
      amount: tradeDetails.amount,
      price: tradeDetails.price,
      takeProfit: tradeDetails.takeProfit,
      stopLoss: tradeDetails.stopLoss,
      status: 'OPEN',
      date: new Date()
    }, { transaction: t });

    // Record trade entry transaction for accurate ledger
    await Transaction.create({
      userId: userObj.id,
      isDemo: isDemo,
      type: 'TRADE_ENTRY',
      amount: cost,
      status: 'APPROVED',
      date: new Date()
    }, { transaction: t });

    await userObj.save({ transaction: t });
    await t.commit();
    const updatedUser = await getUserWithAssociations(userObj.id);
    res.json({ success: true, user: formatUserResponse(updatedUser) });
  } catch (err) {
    await t.rollback();
    console.error('Add trade error:', err);
    res.status(500).json({ success: false, message: 'Server failed to add trade.' });
  }
});

// Complete a Trade
app.post('/api/trades/complete', authenticateToken, async (req, res) => {
  const { tradeId, profit, accountType } = req.body;
  const t = await sequelize.transaction();

  try {
    const userObj = await getUserWithAssociations(req.user.id);
    if (!userObj) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isDemo = accountType === 'DEMO';
    const trade = await Trade.findOne({ where: { id: tradeId, userId: userObj.id } }, { transaction: t });
    if (!trade) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Trade not found.' });
    }

    const reward = profit > 0 ? 140.00 : 0.00;
    
    // Update Trade
    trade.status = 'CLOSED';
    trade.profit = reward;
    await trade.save({ transaction: t });

    // Credit Balance
    if (isDemo) {
      userObj.demoBalance = parseFloat(userObj.demoBalance) + reward;
    } else {
      userObj.balance = parseFloat(userObj.balance) + reward;
    }
      
    // Update Challenge Data
    let challengeData = userObj.challengeData;
    let tradeChallengeData = userObj.tradeChallengeData;

    if (!challengeData) {
      challengeData = await ChallengeData.create({ userId: userObj.id }, { transaction: t });
    }
    if (!tradeChallengeData) {
      tradeChallengeData = await TradeChallengeData.create({ userId: userObj.id }, { transaction: t });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    
    // Reset tradesToday if it's a new day
    if (challengeData.lastActiveDate !== todayStr) {
      challengeData.tradesToday = 0;
      challengeData.lastActiveDate = todayStr;
    }

    if (profit > 0) {
      challengeData.tradesToday += 1;
      
      const requiredTrades = challengeData.type === '7_DAY' ? 3 : 2;
      const requiredDays = challengeData.type === '7_DAY' ? 7 : 30;
      
      // If daily requirement is met, increment day and reset trade count
      if (challengeData.tradesToday >= requiredTrades) {
        challengeData.qualifyingDays += 1;
        challengeData.tradesToday = 0; // Reset for the next 'day' of progress
        challengeData.lastCountedDate = todayStr;
        
        // Check if challenge is fully completed now
        if (challengeData.qualifyingDays >= requiredDays && !challengeData.rewardSubmitted) {
          challengeData.rewardSubmitted = true;
          
          const rewardAmount = challengeData.type === '7_DAY' ? 3100 : 10000;
          const rewardLabel = challengeData.type === '7_DAY' ? '7-Day Challenge Prize' : '30-Day Challenge Prize';
          
          // Auto submit withdrawal request
          await Transaction.create({
            userId: userObj.id,
            isDemo: false,
            type: 'CHALLENGE_REWARD',
            amount: rewardAmount,
            status: 'PENDING',
            date: new Date(),
            label: `${rewardLabel} for ${userObj.username}`,
            challengeType: challengeData.type
          }, { transaction: t });
        }
      }
    }

    if (tradeChallengeData.enrolled) {
      tradeChallengeData.tradesCount += 1;
      if (profit > 0) {
        tradeChallengeData.winningTrades += 1;
      }
    }

    await challengeData.save({ transaction: t });
    await tradeChallengeData.save({ transaction: t });

    await userObj.save({ transaction: t });

    // Record trade profit transaction if won
    if (profit > 0) {
      await Transaction.create({
        userId: userObj.id,
        isDemo: isDemo,
        type: 'TRADE_PROFIT',
        amount: reward,
        status: 'APPROVED',
        date: new Date()
      }, { transaction: t });
    }

    await t.commit();

    const updatedUser = await getUserWithAssociations(userObj.id);
    res.json({ success: true, user: formatUserResponse(updatedUser) });
  } catch (err) {
    await t.rollback();
    console.error('Complete trade error:', err);
    res.status(500).json({ success: false, message: 'Failed to complete trade.' });
  }
});

// ==========================================
// TRANSACTIONS & VERIFICATIONS ROUTES
// ==========================================

// Deposit Request / Instant Demo Deposit
app.post('/api/funds/deposit', authenticateToken, async (req, res) => {
  const { amount, accountType, utr } = req.body;
  const numAmount = parseFloat(amount);

  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Enter a valid amount.' });
  }

  const t = await sequelize.transaction();
  try {
    const userObj = await getUserWithAssociations(req.user.id);
    if (!userObj) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (accountType === 'DEMO') {
      userObj.demoBalance = parseFloat(userObj.demoBalance) + numAmount;
      await userObj.save({ transaction: t });

      await Transaction.create({
        userId: userObj.id,
        isDemo: true,
        type: 'DEPOSIT',
        amount: numAmount,
        status: 'APPROVED',
        date: new Date()
      }, { transaction: t });

      await t.commit();
      const updatedUser = await getUserWithAssociations(userObj.id);
      return res.json({ success: true, message: `Demo funds of ₹${numAmount} credited.`, user: formatUserResponse(updatedUser) });
    } else {
      // Real Accounts: Pending manual transaction submission
      await Transaction.create({
        userId: userObj.id,
        isDemo: false,
        type: 'DEPOSIT',
        amount: numAmount,
        status: 'PENDING',
        label: utr ? `UTR: ${utr}` : null,
        date: new Date()
      }, { transaction: t });

      await t.commit();
      const updatedUser = await getUserWithAssociations(userObj.id);
      return res.json({ success: true, message: 'Real deposit request submitted for verification.', user: formatUserResponse(updatedUser) });
    }
  } catch (err) {
    await t.rollback();
    console.error('Deposit error:', err);
    res.status(500).json({ success: false, message: 'Server failed deposit request.' });
  }
});

// Withdrawal Request
app.post('/api/funds/withdraw', authenticateToken, async (req, res) => {
  const { amount, accountType } = req.body;
  const numAmount = parseFloat(amount);

  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Enter a valid amount.' });
  }

  const t = await sequelize.transaction();
  try {
    const userObj = await getUserWithAssociations(req.user.id);
    if (!userObj) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const activeBalance = accountType === 'DEMO' ? parseFloat(userObj.demoBalance) : parseFloat(userObj.balance);
    if (activeBalance < numAmount) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Insufficient balance to request withdrawal.' });
    }

    // Deduct active balance
    if (accountType === 'DEMO') {
      userObj.demoBalance = activeBalance - numAmount;
      await Transaction.create({
        userId: userObj.id,
        isDemo: true,
        type: 'WITHDRAWAL',
        amount: numAmount,
        status: 'APPROVED',
        date: new Date()
      }, { transaction: t });
    } else {
      userObj.balance = activeBalance - numAmount;
      await Transaction.create({
        userId: userObj.id,
        isDemo: false,
        type: 'WITHDRAWAL',
        amount: numAmount,
        status: 'PENDING',
        date: new Date()
      }, { transaction: t });
    }

    await userObj.save({ transaction: t });
    await t.commit();
    const updatedUser = await getUserWithAssociations(userObj.id);
    res.json({ success: true, message: 'Withdrawal request successfully registered.', user: formatUserResponse(updatedUser) });
  } catch (err) {
    await t.rollback();
    console.error('Withdrawal error:', err);
    res.status(500).json({ success: false, message: 'Server failed withdrawal request.' });
  }
});

// Update Bank / UPI Verification Details
app.post('/api/funds/verification', authenticateToken, async (req, res) => {
  const verificationData = req.body;

  try {
    const userObj = await getUserWithAssociations(req.user.id);
    if (!userObj) return res.status(404).json({ success: false, message: 'User not found.' });

    let verification = userObj.verification;
    if (!verification) {
      await Verification.create({
        userId: userObj.id,
        mode: verificationData.mode,
        bankAccount: verificationData.bankAccount,
        ifscCode: verificationData.ifscCode,
        upiNumber: verificationData.upiNumber,
        accountName: verificationData.accountName
      });
    } else {
      await verification.update(verificationData);
    }

    const updatedUser = await getUserWithAssociations(userObj.id);
    res.json({ success: true, message: 'Verification details saved successfully.', user: formatUserResponse(updatedUser) });
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ success: false, message: 'Server failed to update verification details.' });
  }
});

// Enroll / Switch Trading Challenges
app.post('/api/funds/enroll-challenge', authenticateToken, async (req, res) => {
  const { challengeType } = req.body;
  const t = await sequelize.transaction();

  try {
    const userObj = await getUserWithAssociations(req.user.id);
    if (!userObj) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let challengeData = userObj.challengeData;
    let tradeChallengeData = userObj.tradeChallengeData;

    if (!challengeData) {
      challengeData = await ChallengeData.create({ userId: userObj.id }, { transaction: t });
    }
    if (!tradeChallengeData) {
      tradeChallengeData = await TradeChallengeData.create({ userId: userObj.id }, { transaction: t });
    }

    if (challengeType === '60_TRADE') {
      tradeChallengeData.enrolled = true;
      tradeChallengeData.enrolledAt = new Date();
      tradeChallengeData.tradesCount = 0;
      tradeChallengeData.winningTrades = 0;
      tradeChallengeData.rewardSubmitted = false;

      challengeData.enrolled = false;
    } else {
      challengeData.type = challengeType;
      challengeData.enrolled = true;
      challengeData.enrolledAt = new Date();
      challengeData.tradesToday = 0;
      challengeData.qualifyingDays = 0;
      challengeData.lastActiveDate = '';
      challengeData.rewardSubmitted = false;

      tradeChallengeData.enrolled = false;
    }

    await challengeData.save({ transaction: t });
    await tradeChallengeData.save({ transaction: t });
    await t.commit();

    const updatedUser = await getUserWithAssociations(userObj.id);
    res.json({ success: true, message: 'Successfully enrolled in challenge.', user: formatUserResponse(updatedUser) });
  } catch (err) {
    await t.rollback();
    console.error('Challenge enrollment error:', err);
    res.status(500).json({ success: false, message: 'Challenge enrollment failed.' });
  }
});

// ==========================================
// RAZORPAY GATEWAY PAYMENT VERIFICATION
// ==========================================

// Verify Standard Razorpay Checkout Payment
app.post('/api/verify-payment', authenticateToken, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;
  const t = await sequelize.transaction();

  try {
    const userObj = await getUserWithAssociations(req.user.id);
    if (!userObj) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (razorpay) {
      const generatedSignature = razorpay.utils.sha256_hmac(
        `${razorpay_order_id}|${razorpay_payment_id}`,
        process.env.RAZORPAY_KEY_SECRET
      );

      if (generatedSignature !== razorpay_signature) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'Invalid payment signature.' });
      }

      // Verify transaction details via Razorpay API
      const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
      if (paymentDetails.amount !== amount * 100) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'Payment amount mismatch.' });
      }
    } else {
      await t.rollback();
      return res.status(500).json({ success: false, message: 'Payment gateway configuration is missing on server.' });
    }

    // Credit real balance in database
    userObj.balance = parseFloat(userObj.balance) + Number(amount);
    await userObj.save({ transaction: t });

    await Transaction.create({
      userId: userObj.id,
      isDemo: false,
      type: 'DEPOSIT',
      amount: Number(amount),
      status: 'APPROVED',
      date: new Date()
    }, { transaction: t });

    await t.commit();
    const updatedUser = await getUserWithAssociations(userObj.id);
    res.json({ success: true, message: 'Payment successfully verified and balance credited!', user: formatUserResponse(updatedUser) });
  } catch (err) {
    await t.rollback();
    console.error('Razorpay verification error:', err);
    res.status(500).json({ success: false, message: 'Server failed to verify payment transaction.' });
  }
});

// Verify Static QR Razorpay Payment
app.post('/api/verify-qr-payment', authenticateToken, async (req, res) => {
  const { razorpay_payment_id, amount } = req.body;
  const t = await sequelize.transaction();

  try {
    const userObj = await getUserWithAssociations(req.user.id);
    if (!userObj) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (razorpay) {
      const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
      if (paymentDetails.amount !== amount * 100) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'Payment amount mismatch.' });
      }
    } else {
      await t.rollback();
      return res.status(500).json({ success: false, message: 'Payment gateway configuration is missing on server.' });
    }

    // Credit real balance
    userObj.balance = parseFloat(userObj.balance) + Number(amount);
    await userObj.save({ transaction: t });

    await Transaction.create({
      userId: userObj.id,
      isDemo: false,
      type: 'DEPOSIT',
      amount: Number(amount),
      status: 'APPROVED',
      date: new Date()
    }, { transaction: t });

    await t.commit();
    const updatedUser = await getUserWithAssociations(userObj.id);
    res.json({ success: true, message: 'Payment successfully verified!', user: formatUserResponse(updatedUser) });
  } catch (err) {
    await t.rollback();
    console.error('QR verification error:', err);
    res.status(500).json({ success: false, message: 'Server failed to verify QR payment.' });
  }
});

// ==========================================
// ADMIN CONTROL MANAGEMENT ROUTES
// ==========================================

// Verify user is administrator
async function checkAdmin(req, res, next) {
  try {
    const userObj = await User.findByPk(req.user.id);
    if (userObj && userObj.role === 'admin') {
      next();
    } else {
      res.status(403).json({ success: false, message: 'Access denied: Admin role required.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server validation error.' });
  }
}

// Fetch all registered users (for admin panel sync)
app.get('/api/admin/users', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      include: [
        { model: Trade, as: 'tradesList' },
        { model: Transaction, as: 'transactionsList' },
        { model: Verification, as: 'verification' },
        { model: ChallengeData, as: 'challengeData' },
        { model: TradeChallengeData, as: 'tradeChallengeData' }
      ]
    });
    
    const formatted = users.map(u => formatUserResponse(u));
    res.json({ success: true, users: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch admin users.' });
  }
});

// Update specific user role
app.post('/api/admin/user-role', authenticateToken, checkAdmin, async (req, res) => {
  const { userId, role } = req.body;

  try {
    const record = await User.findByPk(userId);
    if (!record) return res.status(404).json({ success: false, message: 'User not found.' });

    // Prevent demoting master admins
    if (['kanhaiya15', 'smrutika26'].includes(record.username) && role !== 'admin') {
      return res.status(400).json({ success: false, message: 'Master administrators cannot be demoted.' });
    }

    record.role = role;
    await record.save();
    res.json({ success: true, message: `Successfully updated user role to ${role}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update user role.' });
  }
});

// Approve/Reject Pending Withdrawal / Deposit Transaction
app.post('/api/admin/approve-transaction', authenticateToken, checkAdmin, async (req, res) => {
  const { userId, transactionId, action } = req.body;
  const t = await sequelize.transaction();

  try {
    const targetUser = await User.findByPk(userId, { transaction: t });
    if (!targetUser) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const transaction = await Transaction.findOne({ where: { id: transactionId, userId: targetUser.id } }, { transaction: t });
    if (!transaction) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    if (action === 'REJECT') {
      transaction.status = 'REJECTED';
      await transaction.save({ transaction: t });
      
      // If it is a withdrawal, refund the deducted amount back to the user's active balance
      if (transaction.type === 'WITHDRAWAL') {
        if (transaction.isDemo) {
          targetUser.demoBalance = parseFloat(targetUser.demoBalance) + parseFloat(transaction.amount);
        } else {
          targetUser.balance = parseFloat(targetUser.balance) + parseFloat(transaction.amount);
        }
        await targetUser.save({ transaction: t });
      }
    } else {
      // Default to APPROVE
      transaction.status = 'APPROVED';
      await transaction.save({ transaction: t });

      // If it is a real deposit or challenge reward, credit target user balance
      if ((transaction.type === 'DEPOSIT' || transaction.type === 'CHALLENGE_REWARD') && !transaction.isDemo) {
        targetUser.balance = parseFloat(targetUser.balance) + parseFloat(transaction.amount);
        await targetUser.save({ transaction: t });
      }
    }

    await t.commit();
    res.json({ success: true, message: `Transaction successfully ${action === 'REJECT' ? 'rejected' : 'approved'}!` });
  } catch (err) {
    await t.rollback();
    console.error('Approve transaction error:', err);
    res.status(500).json({ success: false, message: 'Failed to approve transaction.' });
  }
});

// Startup the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Unified production server running on http://localhost:${PORT}`);
});

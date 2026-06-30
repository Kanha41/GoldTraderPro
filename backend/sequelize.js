const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Load environment variables
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/goldtrader';

mongoose.connect(DATABASE_URL)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully.');
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
  });

const sequelize = {
  sync: async () => {
    if (mongoose.connection.readyState === 1) return sequelize;
    return new Promise((resolve, reject) => {
      mongoose.connection.once('open', () => resolve(sequelize));
      mongoose.connection.once('error', (err) => reject(err));
    });
  },
  authenticate: async () => {
    if (mongoose.connection.readyState === 1) return;
    return new Promise((resolve, reject) => {
      mongoose.connection.once('open', () => resolve());
      mongoose.connection.once('error', (err) => reject(err));
    });
  },
  transaction: async () => {
    return {
      commit: async () => {},
      rollback: async () => {}
    };
  }
};

// --- MONGODB/MONGOOSE SCHEMAS ---

const UserSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  mobileNumber: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  rawPassword: { type: String, default: null },
  role: { type: String, default: 'user' },
  balance: { type: Number, default: 0.00 },
  demoBalance: { type: Number, default: 10000.00 },
  securityQuestion: { type: String, required: true },
  securityAnswer: { type: String, required: true, lowercase: true, trim: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const TradeSchema = new mongoose.Schema({
  userId: { type: String, required: true, ref: 'User' },
  isDemo: { type: Boolean, default: false },
  pair: { type: String, required: true },
  type: { type: String, required: true, enum: ['BUY', 'SELL'] },
  amount: { type: Number, required: true },
  price: { type: Number, required: true },
  takeProfit: { type: Number, default: null },
  stopLoss: { type: Number, default: null },
  profit: { type: Number, default: 0.00 },
  status: { type: String, default: 'OPEN', enum: ['OPEN', 'CLOSED'] },
  date: { type: Date, default: Date.now }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const TransactionSchema = new mongoose.Schema({
  userId: { type: String, required: true, ref: 'User' },
  isDemo: { type: Boolean, default: false },
  type: { type: String, required: true, enum: ['DEPOSIT', 'WITHDRAWAL', 'CHALLENGE_REWARD', 'TRADE_ENTRY'] },
  amount: { type: Number, required: true },
  status: { type: String, default: 'PENDING', enum: ['PENDING', 'APPROVED', 'REJECTED'] },
  date: { type: Date, default: Date.now },
  label: { type: String, default: null },
  challengeType: { type: String, default: null }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const VerificationSchema = new mongoose.Schema({
  userId: { type: String, required: true, ref: 'User', primaryKey: true },
  mode: { type: String, enum: ['BANK', 'UPI'] },
  bankAccount: { type: String, default: null },
  ifscCode: { type: String, default: null },
  upiNumber: { type: String, default: null },
  accountName: { type: String, default: null }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const ChallengeDataSchema = new mongoose.Schema({
  userId: { type: String, required: true, ref: 'User', primaryKey: true },
  type: { type: String, default: '30_DAY' },
  enrolled: { type: Boolean, default: false },
  enrolledAt: { type: Date, default: null },
  tradesToday: { type: Number, default: 0 },
  qualifyingDays: { type: Number, default: 0 },
  lastActiveDate: { type: String, default: null },
  lastCountedDate: { type: String, default: null },
  rewardSubmitted: { type: Boolean, default: false }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const TradeChallengeDataSchema = new mongoose.Schema({
  userId: { type: String, required: true, ref: 'User', primaryKey: true },
  enrolled: { type: Boolean, default: false },
  enrolledAt: { type: Date, default: null },
  tradesCount: { type: Number, default: 0 },
  winningTrades: { type: Number, default: 0 },
  rewardSubmitted: { type: Boolean, default: false }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const ChallengeAccountSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  userId: { type: String, required: true, ref: 'User' },
  balance: { type: Number, default: 1000.00 },
  equity: { type: Number, default: 1000.00 },
  challengeStatus: { type: String, default: 'ACTIVE' },
  currentStage: { type: Number, default: 1 },
  highestBalance: { type: Number, default: 1000.00 }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const ChallengeProgressSchema = new mongoose.Schema({
  accountId: { type: String, required: true, ref: 'ChallengeAccount' },
  stage: { type: Number, default: 1 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  tradeCount: { type: Number, default: 0 },
  currentStreak: { type: Number, default: 0 },
  tripletAttempts: { type: Number, default: 0 },
  targetReached: { type: Boolean, default: false },
  targetWins: { type: Number, default: null }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const ChallengeTradeSchema = new mongoose.Schema({
  accountId: { type: String, required: true, ref: 'ChallengeAccount' },
  symbol: { type: String, default: 'XAUUSD' },
  side: { type: String, required: true, enum: ['BUY', 'SELL'] },
  lotSize: { type: Number, default: 0.01 },
  entryPrice: { type: Number, required: true },
  tpPrice: { type: Number, required: true },
  slPrice: { type: Number, required: true },
  profitLoss: { type: Number, default: 0.00 },
  result: { type: String, default: 'PENDING' },
  openedAt: { type: Date, default: Date.now },
  closedAt: { type: Date, default: null }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
const ChallengeAttemptHistorySchema = new mongoose.Schema({
  accountId: { type: String, required: true, ref: 'ChallengeAccount' },
  userId: { type: String, required: true, ref: 'User' },
  stage: { type: Number, required: true },
  status: { type: String, required: true, enum: ['PASSED', 'FAILED'] },
  tradesTaken: { type: Number, default: 0 },
  streakReached: { type: Number, default: 0 },
  attemptNumber: { type: Number, default: 1 },
  details: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// --- VIRTUAL RELATIONSHIPS (for population) ---

UserSchema.virtual('tradesList', {
  ref: 'Trade',
  localField: '_id',
  foreignField: 'userId'
});

UserSchema.virtual('transactionsList', {
  ref: 'Transaction',
  localField: '_id',
  foreignField: 'userId'
});

UserSchema.virtual('verification', {
  ref: 'Verification',
  localField: '_id',
  foreignField: 'userId',
  justOne: true
});

UserSchema.virtual('challengeData', {
  ref: 'ChallengeData',
  localField: '_id',
  foreignField: 'userId',
  justOne: true
});

UserSchema.virtual('tradeChallengeData', {
  ref: 'TradeChallengeData',
  localField: '_id',
  foreignField: 'userId',
  justOne: true
});

UserSchema.virtual('challengeAccounts', {
  ref: 'ChallengeAccount',
  localField: '_id',
  foreignField: 'userId'
});

ChallengeAccountSchema.virtual('progress', {
  ref: 'ChallengeProgress',
  localField: '_id',
  foreignField: 'accountId',
  justOne: true
});

ChallengeAccountSchema.virtual('trades', {
  ref: 'ChallengeTrade',
  localField: '_id',
  foreignField: 'accountId'
});

// --- MONGOOSE MODELS ---

ChallengeAccountSchema.virtual('history', {
  ref: 'ChallengeAttemptHistory',
  localField: '_id',
  foreignField: 'accountId'
});

const RawUser = mongoose.model('User', UserSchema);
const RawTrade = mongoose.model('Trade', TradeSchema);
const RawTransaction = mongoose.model('Transaction', TransactionSchema);
const RawVerification = mongoose.model('Verification', VerificationSchema);
const RawChallengeData = mongoose.model('ChallengeData', ChallengeDataSchema);
const RawTradeChallengeData = mongoose.model('TradeChallengeData', TradeChallengeDataSchema);
const RawChallengeAccount = mongoose.model('ChallengeAccount', ChallengeAccountSchema);
const RawChallengeProgress = mongoose.model('ChallengeProgress', ChallengeProgressSchema);
const RawChallengeTrade = mongoose.model('ChallengeTrade', ChallengeTradeSchema);
const RawChallengeAttemptHistory = mongoose.model('ChallengeAttemptHistory', ChallengeAttemptHistorySchema);

// --- SEQUELIZE COMPATIBILITY LAYER ---

function convertWhere(where) {
  if (!where) return {};
  const query = {};

  const symbols = Object.getOwnPropertySymbols(where);
  for (const sym of symbols) {
    if (sym.toString().includes('or')) {
      return { $or: where[sym].map(convertWhere) };
    }
  }

  for (const key of Object.keys(where)) {
    let val = where[key];
    if (key === '$or' || key === 'or') {
      query['$or'] = val.map(convertWhere);
      continue;
    }

    if (key === 'id') {
      query['_id'] = val;
      continue;
    }

    if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      const innerSymbols = Object.getOwnPropertySymbols(val);
      const innerQuery = {};
      let hasSymbol = false;
      for (const sym of innerSymbols) {
        if (sym.toString().includes('in')) {
          innerQuery['$in'] = val[sym];
          hasSymbol = true;
        }
      }
      if (hasSymbol) {
        query[key] = innerQuery;
      } else {
        query[key] = val;
      }
    } else {
      query[key] = val;
    }
  }
  return query;
}

function applyIncludes(query, include) {
  if (!include) return query;
  
  const processInclude = (inc) => {
    if (typeof inc === 'string') {
      return inc;
    }
    
    const popObj = { path: inc.as || inc.association };
    if (inc.include) {
      popObj.populate = inc.include.map(processInclude);
    }
    return popObj;
  };

  const populateArgs = include.map(processInclude);
  return query.populate(populateArgs);
}

function patchDoc(doc) {
  if (!doc) return null;

  if (Array.isArray(doc)) {
    return doc.map(patchDoc);
  }

  // Ensure `id` is present on the plain object/instance
  if (doc._id && !doc.id) {
    Object.defineProperty(doc, 'id', {
      get() { return this._id; },
      set(v) { this._id = v; }
    });
  }

  // Sequelize reload method
  doc.reload = async function() {
    const refetched = await doc.constructor.findById(this._id);
    if (refetched) {
      this._doc = refetched._doc;
    }
    return this;
  };

  // Sequelize update method
  doc.update = async function(updateData) {
    this.set(updateData);
    return await this.save();
  };

  return doc;
}

function wrapModel(Model) {
  const wrapped = {
    prototype: Model.prototype,
    
    findOne: async (options = {}) => {
      const q = convertWhere(options.where);
      let query = Model.findOne(q);
      if (options.include) {
        query = applyIncludes(query, options.include);
      }
      const doc = await query.exec();
      return patchDoc(doc);
    },

    findByPk: async (id, options = {}) => {
      if (!id) return null;
      let query = Model.findById(id);
      if (options.include) {
        query = applyIncludes(query, options.include);
      }
      const doc = await query.exec();
      return patchDoc(doc);
    },

    findAll: async (options = {}) => {
      const q = convertWhere(options.where);
      let query = Model.find(q);
      if (options.include) {
        query = applyIncludes(query, options.include);
      }
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.order) {
        const sortObj = {};
        for (let orderItem of options.order) {
          const field = orderItem[0] === 'id' ? '_id' : orderItem[0];
          const direction = orderItem[1] && orderItem[1].toUpperCase() === 'DESC' ? -1 : 1;
          sortObj[field] = direction;
        }
        query = query.sort(sortObj);
      }
      const docs = await query.exec();
      return docs.map(patchDoc);
    },

    create: async (data, options = {}) => {
      const doc = new Model(data);
      // Generate ID if missing and is schema with string primary key
      if (!doc._id && (Model.modelName === 'User' || Model.modelName === 'ChallengeAccount')) {
        doc._id = uuidv4();
      } else if (!doc._id) {
        // Verification, ChallengeData, etc. might use userId as _id
        if (data.userId) {
          doc._id = data.userId;
        }
      }
      await doc.save();
      return patchDoc(doc);
    },

    update: async (data, options = {}) => {
      const q = convertWhere(options.where);
      const res = await Model.updateMany(q, { $set: data });
      return [res.modifiedCount];
    }
  };

  return wrapped;
}

const User = wrapModel(RawUser);
const Trade = wrapModel(RawTrade);
const Transaction = wrapModel(RawTransaction);
const Verification = wrapModel(RawVerification);
const ChallengeData = wrapModel(RawChallengeData);
const TradeChallengeData = wrapModel(RawTradeChallengeData);
const ChallengeAccount = wrapModel(RawChallengeAccount);
const ChallengeProgress = wrapModel(RawChallengeProgress);
const ChallengeTrade = wrapModel(RawChallengeTrade);
const ChallengeAttemptHistory = wrapModel(RawChallengeAttemptHistory);

const Op = {
  or: Symbol('or'),
  in: Symbol('in')
};

module.exports = {
  sequelize,
  Op,
  User,
  Trade,
  Transaction,
  Verification,
  ChallengeData,
  TradeChallengeData,
  ChallengeAccount,
  ChallengeProgress,
  ChallengeTrade,
  ChallengeAttemptHistory
};

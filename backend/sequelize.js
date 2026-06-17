const { Sequelize, DataTypes } = require('sequelize');

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/goldtrader';

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false, // Set to console.log to debug database queries in SQL
  dialectOptions: DATABASE_URL.includes('neon.tech') || process.env.NODE_ENV === 'production' ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {}
});

// Define User model
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    set(val) {
      if (val) this.setDataValue('username', val.toLowerCase().trim());
    }
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    set(val) {
      if (val) this.setDataValue('email', val.toLowerCase().trim());
    }
  },
  mobileNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    set(val) {
      if (val) this.setDataValue('mobileNumber', val.trim());
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  rawPassword: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'user',
  },
  balance: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  demoBalance: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 10000.00,
  },
  securityQuestion: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  securityAnswer: {
    type: DataTypes.STRING,
    allowNull: false,
    set(val) {
      if (val) this.setDataValue('securityAnswer', val.toLowerCase().trim());
    }
  }
}, {
  timestamps: true,
});

// Define Trade model
const Trade = sequelize.define('Trade', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  isDemo: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  pair: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['BUY', 'SELL']],
    }
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(12, 4),
    allowNull: false,
  },
  takeProfit: {
    type: DataTypes.DECIMAL(12, 4),
    allowNull: true,
  },
  stopLoss: {
    type: DataTypes.DECIMAL(12, 4),
    allowNull: true,
  },
  profit: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'OPEN',
    validate: {
      isIn: [['OPEN', 'CLOSED']],
    }
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  timestamps: false,
});

// Define Transaction model
const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  isDemo: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['DEPOSIT', 'WITHDRAWAL', 'CHALLENGE_REWARD', 'TRADE_ENTRY']],
    }
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'PENDING',
    validate: {
      isIn: [['PENDING', 'APPROVED', 'REJECTED']],
    }
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  label: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  challengeType: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  timestamps: false,
});

// Define Verification model
const Verification = sequelize.define('Verification', {
  userId: {
    type: DataTypes.UUID,
    primaryKey: true,
  },
  mode: {
    type: DataTypes.STRING,
    validate: {
      isIn: [['BANK', 'UPI']],
    }
  },
  bankAccount: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ifscCode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  upiNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  accountName: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  timestamps: false,
  tableName: 'Verifications',
});

// Define ChallengeData model
const ChallengeData = sequelize.define('ChallengeData', {
  userId: {
    type: DataTypes.UUID,
    primaryKey: true,
  },
  type: {
    type: DataTypes.STRING,
    defaultValue: '30_DAY',
  },
  enrolled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  enrolledAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  tradesToday: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  qualifyingDays: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  lastActiveDate: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  lastCountedDate: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  rewardSubmitted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
}, {
  timestamps: false,
  tableName: 'ChallengeData',
});

// Define TradeChallengeData model
const TradeChallengeData = sequelize.define('TradeChallengeData', {
  userId: {
    type: DataTypes.UUID,
    primaryKey: true,
  },
  enrolled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  enrolledAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  tradesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  winningTrades: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  rewardSubmitted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
}, {
  timestamps: false,
  tableName: 'TradeChallengeData',
});

// Define ChallengeAccount model
const ChallengeAccount = sequelize.define('ChallengeAccount', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  balance: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 1000.00,
  },
  equity: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 1000.00,
  },
  challengeStatus: {
    type: DataTypes.STRING,
    defaultValue: 'ACTIVE', // 'ACTIVE', 'PASSED', 'FAILED'
  },
  currentStage: {
    type: DataTypes.INTEGER,
    defaultValue: 1, // 1, 2, 3
  },
  highestBalance: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 1000.00,
  }
}, {
  timestamps: true,
  tableName: 'ChallengeAccounts',
});

// Define ChallengeProgress model
const ChallengeProgress = sequelize.define('ChallengeProgress', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  accountId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  stage: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  wins: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  losses: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  tradeCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  currentStreak: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  targetReached: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
}, {
  timestamps: false,
  tableName: 'ChallengeProgress',
});

// Define ChallengeTrade model
const ChallengeTrade = sequelize.define('ChallengeTrade', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  accountId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  symbol: {
    type: DataTypes.STRING,
    defaultValue: 'XAUUSD',
  },
  side: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['BUY', 'SELL']],
    }
  },
  lotSize: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.01,
  },
  entryPrice: {
    type: DataTypes.DECIMAL(12, 4),
    allowNull: false,
  },
  tpPrice: {
    type: DataTypes.DECIMAL(12, 4),
    allowNull: false,
  },
  slPrice: {
    type: DataTypes.DECIMAL(12, 4),
    allowNull: false,
  },
  profitLoss: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  result: {
    type: DataTypes.STRING,
    defaultValue: 'PENDING', // 'PENDING', 'WIN', 'LOSS', 'VIOLATION'
  },
  openedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  closedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  }
}, {
  timestamps: false,
  tableName: 'ChallengeTrades',
});

// Establish Model Associations
User.hasMany(Trade, { as: 'tradesList', foreignKey: 'userId', onDelete: 'CASCADE' });
Trade.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Transaction, { as: 'transactionsList', foreignKey: 'userId', onDelete: 'CASCADE' });
Transaction.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(Verification, { as: 'verification', foreignKey: 'userId', onDelete: 'CASCADE' });
Verification.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(ChallengeData, { as: 'challengeData', foreignKey: 'userId', onDelete: 'CASCADE' });
ChallengeData.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(TradeChallengeData, { as: 'tradeChallengeData', foreignKey: 'userId', onDelete: 'CASCADE' });
TradeChallengeData.belongsTo(User, { foreignKey: 'userId' });

// 3-Stage Challenge Associations
User.hasMany(ChallengeAccount, { as: 'challengeAccounts', foreignKey: 'userId', onDelete: 'CASCADE' });
ChallengeAccount.belongsTo(User, { foreignKey: 'userId' });

ChallengeAccount.hasOne(ChallengeProgress, { as: 'progress', foreignKey: 'accountId', onDelete: 'CASCADE' });
ChallengeProgress.belongsTo(ChallengeAccount, { foreignKey: 'accountId' });

ChallengeAccount.hasMany(ChallengeTrade, { as: 'trades', foreignKey: 'accountId', onDelete: 'CASCADE' });
ChallengeTrade.belongsTo(ChallengeAccount, { foreignKey: 'accountId' });

module.exports = {
  sequelize,
  User,
  Trade,
  Transaction,
  Verification,
  ChallengeData,
  TradeChallengeData,
  ChallengeAccount,
  ChallengeProgress,
  ChallengeTrade
};

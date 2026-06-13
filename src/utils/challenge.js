export const CHALLENGE_PRIZES = {
  '30_DAY': 10000,
  '7_DAY': 3100,
  '60_TRADE': 6000
};

export const TRADE_CHALLENGE_TYPE = '60_TRADE';
export const TRADE_CHALLENGE_TARGET = 60;

export const getChallengeTotalDays = (type) => (type === '7_DAY' ? 7 : 30);

export const getRequiredTrades = (type) => (type === '7_DAY' ? 3 : 2);

export const getChallengePrize = (type) => CHALLENGE_PRIZES[type] ?? CHALLENGE_PRIZES['30_DAY'];

export const getChallengeRewardLabel = (type) => {
  if (type === '7_DAY') return '7-Day Challenge Prize';
  if (type === '60_TRADE') return '60-Trade Challenge Prize';
  return '30-Day Challenge Prize';
};

export const isDayBasedChallenge = (type) => type === '7_DAY' || type === '30_DAY';

const getToday = () => new Date().toISOString().split('T')[0];

export const createDefaultChallengeData = (type = '30_DAY') => ({
  enrolled: false,
  type,
  completedDays: 0,
  lastActiveDate: getToday(),
  tradesToday: 0,
  lastCountedDate: null,
  rewardSubmitted: false,
  rewardStatus: null
});

export const normalizeChallengeData = (record) => {
  const raw = record?.challengeData || record?.streakData;
  if (!raw) return createDefaultChallengeData();

  const type = raw.type || '30_DAY';
  const completedDays =
    raw.completedDays !== undefined
      ? raw.completedDays
      : raw.qualifyingDays !== undefined
      ? raw.qualifyingDays
      : Math.max(0, (raw.currentDay || 1) - 1);

  return {
    enrolled: !!raw.enrolled,
    type,
    completedDays,
    lastActiveDate: raw.lastActiveDate || getToday(),
    tradesToday: raw.tradesToday || 0,
    lastCountedDate: raw.lastCountedDate || null,
    rewardSubmitted: raw.rewardSubmitted || false,
    rewardStatus: raw.rewardStatus || null
  };
};

export const creditQualifyingDay = (challengeData) => {
  const requiredTrades = getRequiredTrades(challengeData.type);
  const totalDays = getChallengeTotalDays(challengeData.type);
  const today = getToday();

  if (
    challengeData.tradesToday < requiredTrades ||
    challengeData.completedDays >= totalDays ||
    challengeData.lastCountedDate === today
  ) {
    return challengeData;
  }

  return {
    ...challengeData,
    completedDays: Math.min(challengeData.completedDays + 1, totalDays),
    lastCountedDate: today,
    lastActiveDate: today
  };
};

export const isChallengeFullyComplete = (challengeData) => {
  const totalDays = getChallengeTotalDays(challengeData.type);
  const requiredTrades = getRequiredTrades(challengeData.type);
  return (
    challengeData.completedDays >= totalDays &&
    challengeData.tradesToday >= requiredTrades
  );
};

export const hasChallengeRewardTransaction = (transactions, challengeType) =>
  (transactions || []).some(
    (tx) =>
      tx.type === 'CHALLENGE_REWARD' &&
      tx.challengeType === challengeType &&
      (tx.status === 'PENDING' || tx.status === 'APPROVED')
  );

export const getChallengeRewardTransaction = (transactions, challengeType) =>
  (transactions || []).find(
    (tx) => tx.type === 'CHALLENGE_REWARD' && tx.challengeType === challengeType
  );

export const buildChallengeCompletionUpdates = (record, challengeData) => {
  if (!isChallengeFullyComplete(challengeData) || challengeData.rewardSubmitted) {
    return { challengeData };
  }

  if (hasChallengeRewardTransaction(record?.transactions, challengeData.type)) {
    return {
      challengeData: {
        ...challengeData,
        rewardSubmitted: true,
        rewardStatus:
          getChallengeRewardTransaction(record.transactions, challengeData.type)?.status ||
          challengeData.rewardStatus
      }
    };
  }

  const prize = getChallengePrize(challengeData.type);
  const rewardTx = {
    type: 'CHALLENGE_REWARD',
    amount: prize,
    date: new Date().toISOString(),
    status: 'PENDING',
    challengeType: challengeData.type,
    label: getChallengeRewardLabel(challengeData.type)
  };

  return {
    challengeData: {
      ...challengeData,
      rewardSubmitted: true,
      rewardStatus: 'PENDING'
    },
    transactions: [rewardTx, ...(record?.transactions || [])]
  };
};

export const advanceChallengeOnLogin = (challengeData) => {
  const today = getToday();
  const lastDate = new Date(challengeData.lastActiveDate);
  const currentDate = new Date(today);
  const diffDays = Math.floor(
    Math.abs(currentDate - lastDate) / (1000 * 60 * 60 * 24)
  );

  if (diffDays <= 0) return challengeData;

  const requiredTrades = getRequiredTrades(challengeData.type);
  const totalDays = getChallengeTotalDays(challengeData.type);
  const sessionDate = challengeData.lastActiveDate;
  let updated = { ...challengeData };

  if (
    updated.tradesToday >= requiredTrades &&
    updated.lastCountedDate !== sessionDate &&
    updated.completedDays < totalDays
  ) {
    updated.completedDays = Math.min(updated.completedDays + 1, totalDays);
    updated.lastCountedDate = sessionDate;
  }

  return {
    ...updated,
    lastActiveDate: today,
    tradesToday: 0
  };
};

// --- 60 Trade Challenge (independent of day-based challenges) ---

export const createDefaultTradeChallengeData = () => ({
  enrolled: false,
  successfulTrades: 0,
  losingTrades: 0,
  targetTrades: TRADE_CHALLENGE_TARGET,
  rewardSubmitted: false,
  rewardStatus: null,
  enrolledAt: null
});

export const normalizeTradeChallengeData = (record) => {
  const raw = record?.tradeChallengeData;
  if (!raw) return createDefaultTradeChallengeData();
  const successfulTrades =
    raw.successfulTrades !== undefined
      ? raw.successfulTrades
      : raw.winningTrades !== undefined
      ? raw.winningTrades
      : raw.completedTrades || 0;
  const losingTrades = raw.losingTrades !== undefined 
      ? raw.losingTrades 
      : (raw.tradesCount && raw.winningTrades !== undefined) 
      ? raw.tradesCount - raw.winningTrades 
      : 0;
  return {
    enrolled: !!raw.enrolled,
    successfulTrades,
    losingTrades,
    targetTrades: raw.targetTrades || TRADE_CHALLENGE_TARGET,
    rewardSubmitted: raw.rewardSubmitted || false,
    rewardStatus: raw.rewardStatus || null,
    enrolledAt: raw.enrolledAt || null
  };
};

export const isTradeChallengeComplete = (tradeChallengeData) =>
  tradeChallengeData.enrolled &&
  tradeChallengeData.successfulTrades >= tradeChallengeData.targetTrades;

/** Records a closed trade: only successful (TP) trades count toward the 60 target */
export const recordTradeChallengeClose = (tradeChallengeData, isSuccessful) => {
  if (!tradeChallengeData.enrolled || tradeChallengeData.rewardSubmitted) {
    return tradeChallengeData;
  }

  if (isSuccessful) {
    return {
      ...tradeChallengeData,
      successfulTrades: tradeChallengeData.successfulTrades + 1
    };
  }

  return {
    ...tradeChallengeData,
    losingTrades: tradeChallengeData.losingTrades + 1
  };
};

export const buildTradeChallengeCompletionUpdates = (record, tradeChallengeData) => {
  if (!isTradeChallengeComplete(tradeChallengeData) || tradeChallengeData.rewardSubmitted) {
    return { tradeChallengeData };
  }

  if (hasChallengeRewardTransaction(record?.transactions, TRADE_CHALLENGE_TYPE)) {
    return {
      tradeChallengeData: {
        ...tradeChallengeData,
        rewardSubmitted: true,
        rewardStatus:
          getChallengeRewardTransaction(record.transactions, TRADE_CHALLENGE_TYPE)?.status ||
          tradeChallengeData.rewardStatus
      }
    };
  }

  const prize = CHALLENGE_PRIZES[TRADE_CHALLENGE_TYPE];
  const rewardTx = {
    type: 'CHALLENGE_REWARD',
    amount: prize,
    date: new Date().toISOString(),
    status: 'PENDING',
    challengeType: TRADE_CHALLENGE_TYPE,
    label: getChallengeRewardLabel(TRADE_CHALLENGE_TYPE)
  };

  return {
    tradeChallengeData: {
      ...tradeChallengeData,
      rewardSubmitted: true,
      rewardStatus: 'PENDING'
    },
    transactions: [rewardTx, ...(record?.transactions || [])]
  };
};

export const getTransactionDisplay = (tx) => {
  const isCredit = tx.type === 'DEPOSIT' || tx.type === 'CHALLENGE_REWARD' || tx.type === 'TRADE_PROFIT';
  return {
    label:
      tx.type === 'CHALLENGE_REWARD'
        ? tx.label || 'Challenge Prize'
        : tx.type === 'TRADE_ENTRY'
          ? 'Trade Cost'
          : tx.type === 'TRADE_PROFIT'
            ? 'Trade Profit'
            : tx.type,
    sign: isCredit ? '+' : '-',
    color:
      tx.type === 'CHALLENGE_REWARD' || tx.type === 'TRADE_PROFIT'
        ? 'var(--accent)'
        : tx.type === 'DEPOSIT'
          ? 'var(--buy-color)'
          : 'var(--sell-color)'
  };
};

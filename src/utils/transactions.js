export const getTransactionDisplay = (tx) => {
  const isCredit = tx.type === 'DEPOSIT' || tx.type === 'CHALLENGE_REWARD';
  return {
    label:
      tx.type === 'CHALLENGE_REWARD'
        ? tx.label || 'Challenge Prize'
        : tx.type,
    sign: isCredit ? '+' : '-',
    color:
      tx.type === 'CHALLENGE_REWARD'
        ? 'var(--accent)'
        : tx.type === 'DEPOSIT'
          ? 'var(--buy-color)'
          : 'var(--sell-color)'
  };
};

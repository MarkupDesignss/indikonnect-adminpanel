export const getCoinTransactions = () => [
  {
    date: 'Oct 24, 2023',
    description: 'Wholesale Order #4928 - Q4 Restock',
    orderRef: '#4928',
    amount: '+1,200',
    balance: '25,400',
    type: 'earned',
  },
  {
    date: 'Oct 18, 2023',
    description: 'Reward Redemption - Tier 2 Discount',
    orderRef: 'RED-921',
    amount: '-5,000',
    balance: '24,200',
    type: 'redeemed',
  },
  {
    date: 'Oct 15, 2023',
    description: 'Bonus Coins - Volume Threshold Met',
    orderRef: 'SYS-AUTO',
    amount: '+500',
    balance: '29,200',
    type: 'earned',
  },
  {
    date: 'Oct 02, 2023',
    description: 'Coins Expired - Batch A92',
    orderRef: 'SYS-EXP',
    amount: '-150',
    balance: '28,700',
    type: 'expired',
  },
];

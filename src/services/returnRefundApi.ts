import type { ReturnRequest } from '@/types/returnRefund';

const returnRequests: ReturnRequest[] = [
  {
    id: 'RET-8842',
    distributor: 'Global Tech Distributors LLC',
    date: 'Oct 24, 2023',
    items: 3,
    status: 'Pending',
    submitted: 'Oct 24, 2023 at 14:32 EST',
    order: {
      id: '#ORD-10994-A',
      date: 'Oct 12, 2023',
      center: 'Chicago (ORD-1)',
      account: 'ACCT-4421',
    },
    refund: {
      subtotal: 1450.0,
      restockingFee: 145.0,
      shipping: 'Non-refundable',
      total: 1305.0,
    },
    reason: {
      title: 'Damaged on Arrival',
      description:
        'The outer shipping carton was intact, but three server units had dented casings and rattling internal components.',
    },
    itemDetails: [
      { name: 'Enterprise Rack Server 1U', sku: 'SVR-992-X', qty: 3, unitPrice: 450.0, total: 1350.0 },
      { name: 'Server Rail Kit', sku: 'ACC-RK-01', qty: 2, unitPrice: 50.0, total: 100.0 },
    ],
    evidence: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuALR20Go3A_3OfdMFDgsfASooSebDxNzuXpVneJaLi7qvTBqQeKHDjjsRlpnp88wEZUGuLYFzAqhjR_FbErbNM2V_ZFvx5wEzdANE8PNEzIqZDcAs7MYmQ1tZIp5SDFR0iPSNZ-oYNKjHGaV-ohyWBFOW-jgZxpfjVsKJTi7qGsWoKrK31GhutMHdaEhI6D8zMNbjlPr9P1XAZ_nkvIwhwz-5vXleApyjs8rSlzIjmbhl1-P5FaxXni2g',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBGZtTMwPhWw139-fXbQpMfoejnoA60oCIh0SWPEUnWI_mO97SfrwQ9hEQ5Ypkob8WhfzSNb3-EbZFwdYX5Hl6jt5VozKnJECgOidz8tfL8f0-a561LbVdC-MyubglYcxCFzyuVeqF4Unyc795TiA7Hyy9Ot9uORvAtKT_5uwE7wYxrrQdTgmiELmh0qSIIgoIhRvoulSyM9VpcFMDx9-DFGpHijJV7qCkAh535rsQ-li4FD9dwTtUCVA',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDqVz54Zn0UrzLVf0mo394ANg7Wd9IHcGtMyypsibklO-h6D5VLCyFqjX-xzWqd8aL8Bkl_Np5WQA_4EVrE-_dyO-gdx06Po5O8Eq49TeTe4r65wGigILOpUm-jnJen9mCcVz0oTXMUQlY6tZKStovpGUNY9CyE_A_ff9AAM5f6s_JUUFi7BGG6z8FIGfSTk0lOyLtA0uvsF7P5pKUcS_YNY6jEmOGNYmoSzl0RkIDhFEbc-_g_2QyR3A',
    ],
    notes: [
      {
        author: 'Sarah Jenkins',
        date: 'Oct 24, 2023 - 15:10 EST',
        text: 'Initiated carrier claim #CC-99281 with logistics partner. Waiting on their inspection report before final approval.',
      },
    ],
  },
  { id: 'RET-8841', distributor: 'Northwest Logistics', date: 'Oct 23, 2023', items: 1, status: 'Approved' },
  { id: 'RET-8839', distributor: 'Apex Supply Co.', date: 'Oct 22, 2023', items: 12, status: 'Rejected' },
  { id: 'RET-8838', distributor: 'Summit Electronics Group', date: 'Oct 21, 2023', items: 2, status: 'Pending' },
  { id: 'RET-8835', distributor: 'Delta Wholesale Partners', date: 'Oct 20, 2023', items: 5, status: 'Approved' },
];

export const getReturnRequests = (): Promise<ReturnRequest[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...returnRequests]);
    }, 300);
  });
};

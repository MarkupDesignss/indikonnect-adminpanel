import type {
  Distributor,
  WholesaleCustomer,
} from '@/types/wholesale';

const customers: WholesaleCustomer[] = [
  {
    id: 1,
    name: 'Sarah Jenkins',
    company: 'Eco-Friendly Goods Co.',
    email: 'sarah.j@ecogoods.com',
    phone: '+1 (555) 123-4567',
    status: 'Active',
    since: 'Oct 12, 2022',
    taxId: 'FR1234567890',
    rep: { initials: 'AK', name: 'Alex Kramer' },
    financials: {
      lifetimeValue: '$45,280',
      aov: '$1,886',
      creditLimit: '$15,000',
      availableCredit: '$12,500',
    },
    orders: [
      { id: '#ORD-0922A', date: 'Oct 24, 2023', total: '$2,450.00', status: 'Fulfilled' },
      { id: '#ORD-0815B', date: 'Sep 15, 2023', total: '$1,120.50', status: 'Fulfilled' },
    ],
    initials: 'SJ',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC-8BA5s9euiOrQHhj_Dwc8KmoX2jKNqYxzYoWxPXsB7e78_TDXIHZD34wXPr5DLnizZdNGNfZOh44EJI4Engp6nHZuiP71p-ScmgHxyCzWHGwAosj0S3MINMXZ5IfTjJ29iySzDR6ZJ3K7LCgJqalgg6GccQwtmQONjZGfza59xIv9WYVgNYZ2oiItAJgSVdSXlYZ1CRIt7cEtFl68fdEoyKZd1zsmt1C7csN40Esho77poTvGTRNmXA',
  },
  {
    id: 2,
    name: 'Michael Chen',
    company: 'Urban Lifestyle Supply',
    email: 'michael.c@urbanlife.com',
    phone: '+1 (555) 987-6543',
    status: 'Pending',
    since: 'Jan 5, 2023',
    taxId: 'FR9876543210',
    rep: { initials: 'MC', name: 'Maria Costa' },
    financials: {
      lifetimeValue: '$450',
      aov: '$450',
      creditLimit: '$5,000',
      availableCredit: '$4,500',
    },
    orders: [
      { id: '#ORD-0012C', date: 'Jan 10, 2023', total: '$450.00', status: 'Fulfilled' },
    ],
    initials: 'MC',
    avatar: '',
  },
];

const distributors: Distributor[] = [
  {
    id: 'DST-8842',
    name: 'Nexus Distributions LLC',
    location: 'Seattle, WA',
    rank: 'Diamond',
    walletBalance: '$124,500.00',
    status: 'Verified',
    totalEarnings: '$1.2M',
    teamSize: 342,
    contact: {
      name: 'Sarah Jenkins (CEO)',
      email: 'sarah@nexusdist.com',
      phone: '+1 (206) 555-0198',
    },
    registrationDate: 'Oct 12, 2021',
    taxId: 'XX-XXXX892',
    billingAddress: '400 Broad St, Seattle, WA 98109',
    kycCompleted: true,
  },
  {
    id: 'DST-7719',
    name: 'Apex Global Supply',
    location: 'Chicago, IL',
    rank: 'Silver',
    walletBalance: '$32,150.25',
    status: 'Pending',
    totalEarnings: '$280k',
    teamSize: 87,
    contact: {
      name: 'Michael Chen (COO)',
      email: 'michael@apexglobal.com',
      phone: '+1 (312) 555-0147',
    },
    registrationDate: 'Mar 04, 2022',
    taxId: 'XX-XXXX456',
    billingAddress: '500 Lake Shore Dr, Chicago, IL 60601',
    kycCompleted: false,
  },
  {
    id: 'DST-9931',
    name: 'Meridian Traders',
    location: 'Austin, TX',
    rank: 'Gold',
    walletBalance: '$89,400.00',
    status: 'Verified',
    totalEarnings: '$650k',
    teamSize: 203,
    contact: {
      name: 'Lisa Park (Director)',
      email: 'lisa@meridiantraders.com',
      phone: '+1 (512) 555-0923',
    },
    registrationDate: 'Aug 22, 2022',
    taxId: 'XX-XXXX789',
    billingAddress: '210 Congress Ave, Austin, TX 78701',
    kycCompleted: true,
  },
];

export const getWholesaleCustomers = (): Promise<WholesaleCustomer[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...customers]);
    }, 300);
  });
};

export const getDistributors = (): Promise<Distributor[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...distributors]);
    }, 300);
  });
};

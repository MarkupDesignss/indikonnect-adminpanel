export type CustomerStatus = 'Active' | 'Pending';

export type CustomerFilter = 'All' | CustomerStatus;

export type CustomerTab = 'Details' | 'Addresses' | 'Orders' | 'Wishlist';

export interface CustomerOrder {
  id: string;
  date: string;
  total: string;
  status: string;
}

export interface WholesaleCustomer {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: CustomerStatus;
  since: string;
  taxId: string;
  rep: {
    initials: string;
    name: string;
  };
  financials: {
    lifetimeValue: string;
    aov: string;
    creditLimit: string;
    availableCredit: string;
  };
  orders: CustomerOrder[];
  initials: string;
  avatar: string;
}

export type DistributorStatus = 'Verified' | 'Pending';

export type DistributorRank = 'Diamond' | 'Gold' | 'Silver';

export type DistributorTab = 'Profile Details' | 'Earnings & Wallet' | 'Genealogy';

export interface Distributor {
  id: string;
  name: string;
  location: string;
  rank: DistributorRank;
  walletBalance: string;
  status: DistributorStatus;
  totalEarnings: string;
  teamSize: number;
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  registrationDate: string;
  taxId: string;
  billingAddress: string;
  kycCompleted: boolean;
}

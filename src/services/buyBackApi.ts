import type { BuyBackRequest } from '@/types/buyBack';

const buyBackRequests: BuyBackRequest[] = [
  {
    id: 'BB-9921',
    distributor: 'Apex Distributors',
    status: 'Pending',
    date: 'Oct 12, 2023',
    items: 12,
    product: 'ProSeries Industrial Router AC3000',
    sku: 'RT-IND-3000-X',
    originalPurchase: 'Aug 15, 2023',
    quantity: 12,
    poNumber: 'PO-2023-4412',
    financials: {
      originalPrice: 5400.0,
      restockingFee: 810.0,
      depreciation: 0.0,
      estimatedValue: 4590.0,
      paymentStatus: 'Unprocessed',
    },
    eligibility: {
      withinReturnWindow: true,
      originalPackaging: null,
      unusedCondition: null,
    },
    inspection: null,
  },
  {
    id: 'BB-9918',
    distributor: 'Meridian Wholesale',
    status: 'Eligible',
    date: 'Oct 10, 2023',
    items: 45,
    product: 'Wireless Access Point WAP-600',
    sku: 'WAP-600-X',
    originalPurchase: 'Sep 01, 2023',
    quantity: 45,
    poNumber: 'PO-2023-4210',
    financials: {
      originalPrice: 11250.0,
      restockingFee: 1687.5,
      depreciation: 0.0,
      estimatedValue: 9562.5,
      paymentStatus: 'Unprocessed',
    },
    eligibility: {
      withinReturnWindow: true,
      originalPackaging: true,
      unusedCondition: true,
    },
    inspection: null,
  },
  {
    id: 'BB-9905',
    distributor: 'Nexus Supply Co.',
    status: 'In Inspection',
    date: 'Oct 08, 2023',
    items: 3,
    product: 'Network Switch S24-1000',
    sku: 'SW-24-1000',
    originalPurchase: 'Jul 20, 2023',
    quantity: 3,
    poNumber: 'PO-2023-3982',
    financials: {
      originalPrice: 2400.0,
      restockingFee: 360.0,
      depreciation: 0.0,
      estimatedValue: 2040.0,
      paymentStatus: 'Unprocessed',
    },
    eligibility: {
      withinReturnWindow: true,
      originalPackaging: true,
      unusedCondition: null,
    },
    inspection: null,
  },
  {
    id: 'BB-9899',
    distributor: 'Zenith Retailers',
    status: 'Approved',
    date: 'Oct 05, 2023',
    items: 150,
    product: 'Smart LED Display Panel 55"',
    sku: 'LED-55-PRO',
    originalPurchase: 'Jun 10, 2023',
    quantity: 150,
    poNumber: 'PO-2023-3756',
    financials: {
      originalPrice: 22500.0,
      restockingFee: 3375.0,
      depreciation: 0.0,
      estimatedValue: 19125.0,
      paymentStatus: 'Processed',
    },
    eligibility: {
      withinReturnWindow: true,
      originalPackaging: true,
      unusedCondition: true,
    },
    inspection: {
      report: 'All items inspected and verified. Minor shelf wear but functional.',
    },
  },
  {
    id: 'BB-9892',
    distributor: 'Global Trade Partners',
    status: 'Rejected',
    date: 'Oct 01, 2023',
    items: 1,
    product: 'Industrial Power Supply 24V',
    sku: 'PS-24-10A',
    originalPurchase: 'Aug 05, 2023',
    quantity: 1,
    poNumber: 'PO-2023-4102',
    financials: {
      originalPrice: 350.0,
      restockingFee: 52.5,
      depreciation: 0.0,
      estimatedValue: 297.5,
      paymentStatus: 'Rejected',
    },
    eligibility: {
      withinReturnWindow: false,
      originalPackaging: false,
      unusedCondition: false,
    },
    inspection: null,
  },
];

export const getBuyBackRequests = (): Promise<BuyBackRequest[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...buyBackRequests]);
    }, 300);
  });
};

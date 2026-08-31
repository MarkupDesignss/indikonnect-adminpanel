export type BuyBackStatus = 'Pending' | 'Eligible' | 'In Inspection' | 'Approved' | 'Rejected';

export type BuyBackFilterTab = 'All' | 'Pending' | 'Eligible' | 'Inspection' | 'Approved';

export interface BuyBackRequest {
  id: string;
  distributor: string;
  status: BuyBackStatus;
  date: string;
  items: number;
  product: string;
  sku: string;
  originalPurchase: string;
  quantity: number;
  poNumber: string;
  financials: {
    originalPrice: number;
    restockingFee: number;
    depreciation: number;
    estimatedValue: number;
    paymentStatus: 'Unprocessed' | 'Processed' | 'Rejected';
  };
  eligibility: {
    withinReturnWindow: boolean;
    originalPackaging: boolean | null;
    unusedCondition: boolean | null;
  };
  inspection: {
    report: string;
  } | null;
}

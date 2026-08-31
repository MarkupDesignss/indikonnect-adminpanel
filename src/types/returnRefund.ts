export type ReturnStatus = 'Pending' | 'Approved' | 'Rejected';

export type ReturnFilterTab = 'All' | ReturnStatus;

export interface ReturnItem {
  name: string;
  sku: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface ReturnRequest {
  id: string;
  distributor: string;
  date: string;
  items: number | ReturnItem[];
  itemDetails?: ReturnItem[];
  status: ReturnStatus;
  submitted?: string;
  order?: {
    id: string;
    date: string;
    center: string;
    account: string;
  };
  refund?: {
    subtotal: number;
    restockingFee: number;
    shipping: string;
    total: number;
  };
  reason?: {
    title: string;
    description: string;
  };
  evidence?: string[];
  notes?: {
    author: string;
    date: string;
    text: string;
  }[];
}

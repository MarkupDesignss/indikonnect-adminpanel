// order.types.ts
export interface Order {
  id: string
  customer: string
  total: number
  status: 'Pending' | 'Shipped' | 'Delivered'
}
import client from '../client'

export const getOrders = () => client.get('/orders')
export const updateOrder = (id: string, data: any) => client.put(`/orders/${id}`, data)
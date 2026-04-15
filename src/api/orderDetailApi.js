import { api } from './client'

export async function getMyOrderDetail(id) {
  const { data } = await api.get(`/api/orders/${id}`)
  return data
}

export async function getAdminOrderDetail(id) {
  const { data } = await api.get(`/api/admin/orders/${id}`)
  return data
}

export async function updateMyOrderCustomerInfo(id, payload) {
  const { data } = await api.patch(`/api/orders/${id}/customer-info`, payload)
  return data
}

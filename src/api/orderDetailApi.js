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

/** Admin: cập nhật đơn vị vận chuyển + mã vận đơn (BE chỉ cho phép một số trạng thái). */
export async function patchAdminOrderDelivery(id, payload) {
  const { data } = await api.patch(`/api/admin/orders/${id}/delivery`, payload)
  return data
}

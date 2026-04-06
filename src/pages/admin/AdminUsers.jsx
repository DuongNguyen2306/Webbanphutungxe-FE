import { useEffect, useState } from 'react'
import { api } from '../../api/client'

export function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await api.get('/api/admin/users')
        setUsers(data)
      } catch {
        setUsers([])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return <p className="text-sm text-gray-500">Đang tải khách hàng...</p>
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
        Khách hàng
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        Tài khoản đã đăng ký (không hiển thị mật khẩu).
      </p>
      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">SĐT</th>
                <th className="px-4 py-3">Vai trò</th>
                <th className="px-4 py-3">Ngày tạo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-3 text-gray-900">{u.email || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{u.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-bold text-brand">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {u.createdAt
                      ? new Date(u.createdAt).toLocaleDateString('vi-VN')
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {users.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-500">
          Chưa có user.
        </p>
      ) : null}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { api } from '../../api/client'

const PAGE_SIZE = 10

export function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

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

  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE))
  const pagedUsers = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

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
              {pagedUsers.map((u) => (
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
      {users.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            Trang {page} / {totalPages} · {users.length} khách hàng
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Trước
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      ) : null}
      {users.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-500">
          Chưa có user.
        </p>
      ) : null}
    </div>
  )
}
